// src/pages/Task.jsx
import { useState, useRef, useCallback, useEffect, useMemo, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Calendar, User, CheckCircle, Clock, Sparkles, Edit3, Save, X,
  AlertCircle, Search, Trash2, History, ChevronRight
} from "lucide-react";

import { useNotifications } from "../context/NotificationContext";
import DashboardLayout from "../components/DashboardLayout";
import { useTaskContext } from "../context/TaskContext";
import { useAuth } from "../context/AuthContext";

const TEAM = [
  { id: "u1", name: "AntonyJoseph", avatar: "A", color: "from-rose-400 to-pink-500" },
  { id: "u2", name: "HariKrishnan", avatar: "H", color: "from-emerald-400 to-teal-500" },
  { id: "u3", name: "AkshayKumar", avatar: "A", color: "from-indigo-400 to-purple-500" },
];

const PRIORITY_CONFIG = {
  high: { label: "High", color: "from-red-500 to-rose-600", icon: AlertCircle },
  medium: { label: "Medium", color: "from-amber-500 to-orange-600", icon: Clock },
  low: { label: "Low", color: "from-emerald-500 to-teal-600", icon: CheckCircle },
};

const Task = () => {
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [priority, setPriority] = useState("medium");
  const [editingId, setEditingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showHistory, setShowHistory] = useState(false);

  const editRefs = useRef({});
  const lastAlertRef = useRef({}); // { taskId: { today: timestamp, tomorrow: timestamp } }

  const { addNotification } = useNotifications();
  const { tasks, history, addTask, toggleTask, updateTask, deleteTask, clearCompleted } = useTaskContext();
  const { user } = useAuth();

  // RE-ALERT EVERY 2 HOURS IF NOT COMPLETED
  const checkDueDates = useCallback(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const TWO_HOURS = 2 * 60 * 60 * 1000; // 2 hours in ms

    tasks.forEach(task => {
      if (task.completed || !task.dueDate) return;

      const due = new Date(task.dueDate);
      const dueDateOnly = new Date(due.getFullYear(), due.getMonth(), due.getDate());
      const isToday = dueDateOnly.getTime() === today.getTime();
      const isTomorrow = dueDateOnly.getTime() === tomorrow.getTime();

      if (!isToday && !isTomorrow) return;

      const key = isToday ? "today" : "tomorrow";
      const last = lastAlertRef.current[task.id]?.[key] || 0;
      const timeSinceLast = now.getTime() - last;

      // Send alert if: never sent OR >2 hours since last
      if (timeSinceLast === 0 || timeSinceLast > TWO_HOURS) {
        addNotification(`Due ${isToday ? "today" : "tomorrow"}: "${task.title}"`, isToday ? "warning" : "info");

        // Update last alert time
        if (!lastAlertRef.current[task.id]) lastAlertRef.current[task.id] = {};
        lastAlertRef.current[task.id][key] = now.getTime();
      }
    });
  }, [tasks, addNotification]);

  useEffect(() => {
    checkDueDates();
    const id = setInterval(checkDueDates, 30_000); // Check every 30 seconds
    return () => clearInterval(id);
  }, [checkDueDates]);

  // ADD TASK
  const handleAdd = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    const member = TEAM.find(m => m.id === assigneeId) || null;

    const newTask = {
      id: crypto.randomUUID(),
      title: title.trim(),
      dueDate,
      priority,
      assigneeId: member?.id || "",
      assigneeName: member?.name || "",
      assigneeAvatar: member?.avatar || "",
      assigneeColor: member?.color || "",
      createdBy: user?.id || "unknown",
      createdByName: user?.name || "Admin",
      createdByAvatar: user?.avatar || "C",
      createdByColor: user?.color || "from-cyan-400 to-blue-600",
      completed: false,
      createdAt: new Date().toISOString(),
    };

    addTask(newTask);
    setTitle(""); setDueDate(""); setAssigneeId(""); setPriority("medium");
  };

  const startEdit = (id) => { editRefs.current[id] = {}; setEditingId(id); };
  const cancelEdit = () => { if (editingId) delete editRefs.current[editingId]; setEditingId(null); };

  const saveEdit = (id) => {
    const refs = editRefs.current[id];
    if (!refs) return;
    const oldTask = tasks.find(t => t.id === id);
    const member = TEAM.find(m => m.id === refs.assignee?.value) || null;
    const updates = {
      title: refs.title?.value.trim() || oldTask.title,
      dueDate: refs.due?.value || oldTask.dueDate,
      assigneeId: member?.id || "",
      assigneeName: member?.name || "",
      assigneeAvatar: member?.avatar || "",
      assigneeColor: member?.color || "",
      priority: refs.priority?.value || oldTask.priority,
    };
    updateTask(id, updates);
    delete editRefs.current[id];
    setEditingId(null);
  };

  const handleDelete = (id) => {
    if (window.confirm("Delete this task permanently?")) {
      deleteTask(id);
    }
  };

  const filteredTasks = useMemo(() => {
    return tasks
      .filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase()))
      .sort((a, b) => {
        const order = { high: 0, medium: 1, low: 2 };
        return order[a.priority] - order[b.priority];
      });
  }, [tasks, searchQuery]);

  const pending = filteredTasks.filter(t => !t.completed);
  const done = filteredTasks.filter(t => t.completed);

  const TaskCard = memo(({ task, index }) => {
    const isEditing = editingId === task.id;
    const { icon: PriorityIcon, color, label } = PRIORITY_CONFIG[task.priority];

    useEffect(() => {
      if (isEditing && editRefs.current[task.id]?.title) {
        editRefs.current[task.id].title.focus();
      }
    }, [isEditing, task.id]);

    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ delay: index * 0.05 }}
        className="group"
      >
        <div
          className={`relative rounded-3xl p-6 transition-all duration-300 ${
            task.completed
              ? "bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200/50"
              : "bg-white/90 backdrop-blur-2xl border border-white/40 shadow-xl hover:shadow-2xl hover:-translate-y-1"
          }`}
        >
          {/* Edit/Delete Buttons */}
          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 z-10">
            {isEditing ? (
              <div className="flex gap-1 bg-white/80 backdrop-blur-xl rounded-2xl p-1 shadow-lg">
                <button onClick={() => saveEdit(task.id)} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl">
                  <Save size={16} />
                </button>
                <button onClick={cancelEdit} className="p-2 text-gray-600 hover:bg-gray-100 rounded-xl">
                  <X size={16} />
                </button>
              </div>
            ) : (
              <>
                <button
                  onClick={() => startEdit(task.id)}
                  className="p-2.5 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-xl shadow-lg"
                >
                  <Edit3 size={16} />
                </button>
                <button
                  onClick={() => handleDelete(task.id)}
                  className="p-2.5 bg-red-500 text-white rounded-xl shadow-lg"
                >
                  <Trash2 size={16} />
                </button>
              </>
            )}
          </div>

          {/* Checkbox */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => toggleTask(task.id)}
            className={`absolute top-6 left-6 w-7 h-7 rounded-full flex items-center justify-center ${
              task.completed
                ? "bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md"
                : "border-2 border-gray-300 hover:border-emerald-500"
            }`}
          >
            {task.completed && <CheckCircle size={16} />}
          </motion.button>

          <div className="pl-14 pr-12">
            {isEditing ? (
              <div className="grid gap-2 text-sm">
                <input
                  ref={el => (editRefs.current[task.id] = { ...editRefs.current[task.id], title: el })}
                  defaultValue={task.title}
                  className="px-3 py-2 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 font-medium"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    ref={el => (editRefs.current[task.id] = { ...editRefs.current[task.id], due: el })}
                    type="date"
                    defaultValue={task.dueDate}
                    className="px-3 py-2 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  />
                  <select
                    ref={el => (editRefs.current[task.id] = { ...editRefs.current[task.id], assignee: el })}
                    defaultValue={task.assigneeId}
                    className="px-3 py-2 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  >
                    <option value="">Unassigned</option>
                    {TEAM.map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                  <select
                    ref={el => (editRefs.current[task.id] = { ...editRefs.current[task.id], priority: el })}
                    defaultValue={task.priority}
                    className="col-span-2 px-3 py-2 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  >
                    {Object.entries(PRIORITY_CONFIG).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-1.5 mb-2 text-xs font-medium text-gray-600">
                  <User size={14} className="text-cyan-500" />
                  <span>Assigned by:</span>
                  <span className="flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-full text-blue-700">
                    <div
                      className={`w-5 h-5 rounded-full bg-gradient-to-br ${task.createdByColor} flex items-center justify-center text-white text-xs font-bold`}
                    >
                      {task.createdByAvatar}
                    </div>
                    {task.createdByName}
                  </span>
                </div>

                <h3 className={`font-bold text-lg mb-2 ${task.completed ? "line-through text-gray-500" : "text-gray-900"}`}>
                  {task.title}
                </h3>

                <div className="flex flex-wrap gap-2 text-xs">
                  {task.dueDate && (
                    <span className="flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-full text-indigo-700 font-medium">
                      <Calendar size={12} />
                      {new Date(task.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </span>
                  )}
                  {task.assigneeName && (
                    <span className="flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-pink-50 to-rose-50 rounded-full text-rose-700 font-medium">
                      <div
                        className={`w-5 h-5 rounded-full bg-gradient-to-br ${task.assigneeColor} flex items-center justify-center text-white text-xs font-bold`}
                      >
                        {task.assigneeAvatar}
                      </div>
                      {task.assigneeName}
                    </span>
                  )}
                  <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-white font-medium bg-gradient-to-r ${color}`}>
                    <PriorityIcon size={12} /> {label}
                  </span>
                  {task.completed && (
                    <span className="flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-full text-xs font-medium">
                      <CheckCircle size={12} /> Done
                    </span>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </motion.div>
    );
  });

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl shadow-2xl">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                    Task Compass
                  </h1>
                  <p className="text-gray-600">Navigate your team's success</p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowHistory(!showHistory)}
                className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg text-gray-700 font-medium"
              >
                <History size={18} />
                History
                <ChevronRight size={16} className={`transition-transform ${showHistory ? "rotate-90" : ""}`} />
              </motion.button>
            </div>
          </motion.div>

          {/* Search */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-8">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search tasks..."
                className="w-full pl-12 pr-6 py-4 bg-white/80 backdrop-blur-xl rounded-3xl focus:outline-none focus:ring-4 focus:ring-indigo-200 transition-all text-lg font-medium"
              />
            </div>
          </motion.div>

          {/* Task Lists */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Pending */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800">Pending</h2>
                  <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-bold">{pending.length}</span>
                </div>
              </div>
              <AnimatePresence>
                {pending.length === 0 ? (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16 text-gray-500 bg-white/50 backdrop-blur-xl rounded-3xl">
                    All clear!
                  </motion.p>
                ) : (
                  <div className="space-y-4">
                    {pending.map((t, i) => (
                      <TaskCard key={t.id} task={t} index={i} />
                    ))}
                  </div>
                )}
              </AnimatePresence>
            </div>

            {/* Completed */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl">
                    <CheckCircle className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800">Completed</h2>
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-bold">{done.length}</span>
                </div>
                {done.length > 0 && (
                  <button
                    onClick={clearCompleted}
                    className="flex items-center gap-1 px-3 py-1.5 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600 transition"
                  >
                    <Trash2 size={14} /> Clear All
                  </button>
                )}
              </div>
              <AnimatePresence>
                {done.length === 0 ? (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16 text-gray-500 bg-white/50 backdrop-blur-xl rounded-3xl">
                    No victories yet
                  </motion.p>
                ) : (
                  <div className="space-y-4">
                    {done.map((t, i) => (
                      <TaskCard key={t.id} task={t} index={i} />
                    ))}
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* History */}
          <AnimatePresence>
            {showHistory && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-12 bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/40 overflow-hidden"
              >
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <History className="w-6 h-6 text-indigo-600" /> Task History
                  </h3>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {history.length === 0 ? (
                    <p className="text-center py-8 text-gray-500">No history yet</p>
                  ) : (
                    <div className="divide-y divide-gray-200">
                      {history.map(entry => (
                        <div key={entry.id} className="p-4 hover:bg-gray-50 transition">
                          <div className="flex items-start justify-between text-sm">
                            <div>
                              <span className="font-medium text-gray-900">
                                {entry.action === "created" && "Created"}
                                {entry.action === "completed" && "Completed"}
                                {entry.action === "reopened" && "Reopened"}
                                {entry.action === "updated" && "Updated"}
                                {entry.action === "deleted" && "Deleted"}
                                {entry.action === "cleared" && "Cleared"} task
                                <span className="font-bold text-indigo-600"> "{entry.taskTitle}"</span>
                              </span>
                              {entry.details && <span className="text-gray-600"> ({entry.details})</span>}
                            </div>
                            <span className="text-xs text-gray-500">
                              {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Add Task Form */}
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-white via-white to-transparent lg:relative lg:mt-12"
          >
            <div className="max-w-4xl mx-auto">
              <form onSubmit={handleAdd} className="bg-white/90 backdrop-blur-2xl rounded-3xl shadow-2xl p-6 border border-white/50">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <input
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="New task..."
                    required
                    className="col-span-1 md:col-span-2 px-5 py-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-200 font-medium"
                  />
                  <input
                    type="date"
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                    className="px-5 py-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-200"
                  />
                  <select
                    value={assigneeId}
                    onChange={e => setAssigneeId(e.target.value)}
                    className="px-5 py-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-200 appearance-none"
                  >
                    <option value="">Unassigned</option>
                    {TEAM.map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                  <select
                    value={priority}
                    onChange={e => setPriority(e.target.value)}
                    className="px-5 py-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-200"
                  >
                    {Object.entries(PRIORITY_CONFIG).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    className="col-span-1 md:col-span-4 mt-2 py-3 bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-600 text-white font-bold rounded-2xl shadow-xl hover:shadow-2xl transition-all flex items-center justify-center gap-2"
                  >
                    <Plus className="w-5 h-5" /> Launch Task
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Task;