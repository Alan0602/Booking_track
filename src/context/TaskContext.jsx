// src/context/TaskContext.jsx
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { useAuth } from "./AuthContext";
import { useNotifications } from "./NotificationContext";

const TASK_KEY = "crm-compass-tasks-v3";
const HISTORY_KEY = "crm-compass-history-v1";

const TaskContext = createContext(undefined);

const safeGet = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};
const safeSet = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
};

export const TaskProvider = ({ children }) => {
  const [tasks, setTasks] = useState([]);
  const [history, setHistory] = useState([]);
  const { user } = useAuth();
  const { addNotification } = useNotifications();

  const isFirstMount = useRef(true);
  const completingRef = useRef(new Set());

  useEffect(() => {
    setTasks(safeGet(TASK_KEY, []));
    setHistory(safeGet(HISTORY_KEY, []));
    isFirstMount.current = false;
  }, []);

  useEffect(() => {
    if (isFirstMount.current) return;
    safeSet(TASK_KEY, tasks);
  }, [tasks]);

  useEffect(() => {
    if (isFirstMount.current) return;
    safeSet(HISTORY_KEY, history.slice(0, 100));
  }, [history]);

  useEffect(() => {
    if (!user) return;
    setTasks(prev =>
      prev.map(t => {
        if (t.createdBy) return t;
        return {
          ...t,
          createdBy: user.id || "unknown",
          createdByName: user.name || "Admin",
          createdByAvatar: user.avatar || "AU",
          createdByColor: user.color || "from-cyan-400 to-blue-600",
        };
      })
    );
  }, [user]);

  const log = useCallback((action, task, details = "") => {
    const entry = {
      id: Date.now(),
      action,
      taskId: task.id,
      taskTitle: task.title,
      timestamp: new Date().toISOString(),
      details,
    };
    setHistory(prev => [entry, ...prev].slice(0, 100));
  }, []);

  const addTask = useCallback((newTask) => {
    setTasks(prev => [newTask, ...prev]);
    log("created", newTask);
    addNotification(`Task created: "${newTask.title}"`, "success");
  }, [log, addNotification]);

  const toggleTask = useCallback((id) => {
    if (completingRef.current.has(id)) return;
    completingRef.current.add(id);

    setTasks(prev => {
      const task = prev.find(t => t.id === id);
      if (!task) {
        completingRef.current.delete(id);
        return prev;
      }

      const updated = { ...task, completed: !task.completed };
      const wasCompleted = task.completed;

      log(wasCompleted ? "reopened" : "completed", updated);

      if (!wasCompleted) {
        addNotification(`Task completed: "${task.title}"`, "success");
      }

      setTimeout(() => completingRef.current.delete(id), 100);
      return prev.map(t => (t.id === id ? updated : t));
    });
  }, [log, addNotification]);

  const updateTask = useCallback((id, updates) => {
    setTasks(prev => {
      const old = prev.find(t => t.id === id);
      if (!old) return prev;
      const changed = Object.keys(updates).filter(k => old[k] !== updates[k]);
      if (!changed.length) return prev;

      const updated = { ...old, ...updates };
      log("updated", updated, changed.join(", "));
      addNotification(`Task updated: "${updated.title}"`, "info");
      return prev.map(t => (t.id === id ? updated : t));
    });
  }, [log, addNotification]);

  // DELETE + NOTIFICATION (LIKE YOU SAID — NO DUPLICATES)
  const deleteTask = useCallback((id) => {
    setTasks(prev => {
      const task = prev.find(t => t.id === id);
      if (task) {
        log("deleted", task);
        addNotification(`Task deleted: "${task.title}"`, "info");
      }
      return prev.filter(t => t.id !== id);
    });
  }, [log, addNotification]);

  const clearCompleted = useCallback(() => {
    setTasks(prev => {
      const completed = prev.filter(t => t.completed);
      if (completed.length > 0) {
        completed.forEach(t => log("cleared", t));
        addNotification(`Cleared ${completed.length} completed task(s)`, "info");
      }
      return prev.filter(t => !t.completed);
    });
  }, [log, addNotification]);

  return (
    <TaskContext.Provider value={{
      tasks,
      history,
      addTask,
      toggleTask,
      updateTask,
      deleteTask,
      clearCompleted,
    }}>
      {children}
    </TaskContext.Provider>
  );
};

export const useTaskContext = () => {
  const ctx = useContext(TaskContext);
  if (!ctx) throw new Error("useTaskContext must be used within TaskProvider");
  return ctx;
};