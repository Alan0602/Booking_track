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
import supabase from "../utils/supabase";

const TaskContext = createContext(undefined);

export const TaskProvider = ({ children }) => {
  const [tasks, setTasks] = useState([]);
  const [history, setHistory] = useState([]);
  const { user } = useAuth();
  const { addNotification } = useNotifications();

  const completingRef = useRef(new Set());

  const loadTasks = useCallback(async () => {
    if (!user?.id) return;
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      console.error("[Task] loadTasks error", error);
      return;
    }
    setTasks(
      (data || []).map((row) => ({
        id: row.id,
        title: row.title,
        dueDate: row.due_date || "",
        priority: row.priority || "medium",
        assigneeId: row.assignee_id || "",
        assigneeName: row.assignee_name || "",
        assigneeAvatar: row.assignee_avatar || "",
        assigneeColor: row.assignee_color || "",
        createdBy: row.created_by || user.id,
        createdByName: row.created_by_name || user.name || "Admin",
        createdByAvatar: row.created_by_avatar || user.avatar || "AU",
        createdByColor: row.created_by_color || user.color || "from-cyan-400 to-blue-600",
        completed: !!row.completed,
        createdAt: row.created_at,
      }))
    );
  }, [user]);

  const loadHistory = useCallback(async () => {
    if (!user?.id) return;
    const { data, error } = await supabase
      .from("task_history")
      .select("*")
      .order("timestamp", { ascending: false })
      .limit(100);
    if (error) {
      console.error("[Task] loadHistory error", error);
      return;
    }
    setHistory(
      (data || []).map((row) => ({
        id: row.id,
        action: row.action,
        taskId: row.task_id,
        taskTitle: row.task_title,
        timestamp: row.timestamp,
        details: row.details || "",
      }))
    );
  }, [user]);

  useEffect(() => {
    loadTasks();
    loadHistory();
  }, [loadTasks, loadHistory]);

  const logRemote = useCallback(
    async (action, task, details = "") => {
      if (!user?.id) return;
      const entry = {
        id: crypto.randomUUID(),
        user_id: user.id,
        task_id: task.id,
        task_title: task.title,
        action,
        details,
      };
      const { error } = await supabase.from("task_history").insert(entry);
      if (error) console.error("[Task] history insert error", error);
      setHistory((prev) => [
        {
          id: entry.id,
          action,
          taskId: task.id,
          taskTitle: task.title,
          timestamp: new Date().toISOString(),
          details,
        },
        ...prev,
      ].slice(0, 100));
    },
    [user]
  );

  const addTask = useCallback(
    async (newTask) => {
      if (!user?.id) return;
      const id = newTask.id || crypto.randomUUID();
      const row = {
        id: id,
        user_id: user.id,
        title: newTask.title,
        due_date: newTask.dueDate || null,
        priority: newTask.priority || "medium",
        assignee_id: newTask.assigneeId || null,
        assignee_name: newTask.assigneeName || null,
        assignee_avatar: newTask.assigneeAvatar || null,
        assignee_color: newTask.assigneeColor || null,
        created_by: newTask.createdBy || user.id,
        created_by_name: newTask.createdByName || user.name || "Admin",
        created_by_avatar: newTask.createdByAvatar || user.avatar || "AU",
        created_by_color: newTask.createdByColor || user.color || "from-cyan-400 to-blue-600",
        completed: !!newTask.completed,
      };
      const { error } = await supabase.from("tasks").insert(row);
      if (error) {
        console.error("[Task] addTask error", error);
        addNotification("Failed to create task", "error");
        return;
      }
      setTasks((prev) => [
        {
          id: id,
          title: row.title,
          dueDate: row.due_date || "",
          priority: row.priority,
          assigneeId: row.assignee_id || "",
          assigneeName: row.assignee_name || "",
          assigneeAvatar: row.assignee_avatar || "",
          assigneeColor: row.assignee_color || "",
          createdBy: row.created_by,
          createdByName: row.created_by_name,
          createdByAvatar: row.created_by_avatar,
          createdByColor: row.created_by_color,
          completed: !!row.completed,
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ]);
      await logRemote("created", { id, title: row.title });
      addNotification(`Task created: "${row.title}"`, "success");
    },
    [user, addNotification, logRemote]
  );

  const toggleTask = useCallback(
    async (id) => {
      if (completingRef.current.has(id)) return;
      completingRef.current.add(id);

      const task = tasks.find((t) => t.id === id);
      if (!task) {
        completingRef.current.delete(id);
        return;
      }
      const nextCompleted = !task.completed;
      const { error } = await supabase
        .from("tasks")
        .update({ completed: nextCompleted })
        .eq("id", id);
      if (error) {
        console.error("[Task] toggleTask error", error);
        completingRef.current.delete(id);
        return;
      }
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, completed: nextCompleted } : t)));
      const action = nextCompleted ? "completed" : "reopened";
      await logRemote(action, { id, title: task.title });
      if (nextCompleted) addNotification(`Task completed: "${task.title}"`, "success");
      setTimeout(() => completingRef.current.delete(id), 100);
    },
    [tasks, user, addNotification, logRemote]
  );

  const updateTask = useCallback(
    async (id, updates) => {
      const old = tasks.find((t) => t.id === id);
      if (!old) return;
      const changed = Object.keys(updates).filter((k) => old[k] !== updates[k]);
      if (!changed.length) return;

      const payload = {
        title: updates.title ?? old.title,
        // Ensure empty strings become null; avoid mixing ?? and || without parentheses
        due_date: (updates.dueDate ?? old.dueDate) || null,
        priority: updates.priority ?? old.priority,
        assignee_id: (updates.assigneeId ?? old.assigneeId) || null,
        assignee_name: (updates.assigneeName ?? old.assigneeName) || null,
        assignee_avatar: (updates.assigneeAvatar ?? old.assigneeAvatar) || null,
        assignee_color: (updates.assigneeColor ?? old.assigneeColor) || null,
      };
      const { error } = await supabase
        .from("tasks")
        .update(payload)
        .eq("id", id);
      if (error) {
        console.error("[Task] updateTask error", error);
        addNotification("Failed to update task", "error");
        return;
      }
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
      await logRemote("updated", { id, title: payload.title }, changed.join(", "));
      addNotification(`Task updated: "${payload.title}"`, "info");
    },
    [tasks, user, addNotification, logRemote]
  );

  const deleteTask = useCallback(
    async (id) => {
      const task = tasks.find((t) => t.id === id);
      const { error } = await supabase
        .from("tasks")
        .delete()
        .eq("id", id);
      if (error) {
        console.error("[Task] deleteTask error", error);
        addNotification("Failed to delete task", "error");
        return;
      }
      setTasks((prev) => prev.filter((t) => t.id !== id));
      if (task) await logRemote("deleted", { id, title: task.title });
      addNotification(task ? `Task deleted: "${task.title}"` : "Task deleted", "info");
    },
    [tasks, user, addNotification, logRemote]
  );

  const clearCompleted = useCallback(
    async () => {
      const completed = tasks.filter((t) => t.completed);
      if (!completed.length) return;
      const { error } = await supabase
        .from("tasks")
        .delete()
        .eq("completed", true);
      if (error) {
        console.error("[Task] clearCompleted error", error);
        addNotification("Failed to clear completed tasks", "error");
        return;
      }
      setTasks((prev) => prev.filter((t) => !t.completed));
      for (const t of completed) {
        await logRemote("cleared", { id: t.id, title: t.title });
      }
      addNotification(`Cleared ${completed.length} completed task(s)`, "info");
    },
    [tasks, user, addNotification, logRemote]
  );

  return (
    <TaskContext.Provider
      value={{ tasks, history, addTask, toggleTask, updateTask, deleteTask, clearCompleted }}
    >
      {children}
    </TaskContext.Provider>
  );
};

export const useTaskContext = () => {
  const ctx = useContext(TaskContext);
  if (!ctx) throw new Error("useTaskContext must be used within TaskProvider");
  return ctx;
};