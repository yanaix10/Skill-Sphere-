import React, { useState, useEffect } from "react";
import {
  CheckSquare,
  Plus,
  Trash2,
  Check,
  Circle,
  Clock,
  AlertCircle,
  Flag,
  Search,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface TodoItem {
  id: string;
  text: string;
  done: boolean;
  priority: "high" | "medium" | "low";
  category?: string;
  dueDate?: string;
  createdAt: number;
}

const DEFAULT_TODOS: TodoItem[] = [
  {
    id: "todo-1",
    text: "Solve 2 Graph Theory & Shortest Path problems on LeetCode",
    done: false,
    priority: "high",
    category: "Coding",
    dueDate: new Date(Date.now() + 86400000 * 1).toISOString().slice(0, 10),
    createdAt: Date.now() - 3600000 * 5,
  },
  {
    id: "todo-2",
    text: "Review socket reconnection handling in SkillSphere backend",
    done: true,
    priority: "medium",
    category: "Development",
    createdAt: Date.now() - 3600000 * 12,
  },
  {
    id: "todo-3",
    text: "Submit Distributed Caching assignment on Google Classroom",
    done: false,
    priority: "high",
    category: "Academics",
    dueDate: new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10),
    createdAt: Date.now() - 3600000 * 20,
  },
  {
    id: "todo-4",
    text: "Update LinkedIn portfolio with dynamic wallpaper engine showcase",
    done: false,
    priority: "low",
    category: "Career",
    createdAt: Date.now() - 3600000 * 30,
  },
];

const PRIORITY_BADGES = {
  high:   { bg: "bg-red-500/15 text-red-500 border-red-500/30", label: "High" },
  medium: { bg: "bg-amber-500/15 text-amber-500 border-amber-500/30", label: "Medium" },
  low:    { bg: "bg-blue-500/15 text-blue-500 border-blue-500/30", label: "Low" },
};

export const DashboardTodos: React.FC = () => {
  const [todos, setTodos] = useState<TodoItem[]>(DEFAULT_TODOS);
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");
  const [search, setSearch] = useState("");

  // New todo input
  const [text, setText] = useState("");
  const [priority, setPriority] = useState<TodoItem["priority"]>("medium");
  const [category, setCategory] = useState("General");
  const [dueDate, setDueDate] = useState("");

  useEffect(() => {
    try {
      const stored = localStorage.getItem("skillsphere_home_todos");
      if (stored) {
        setTodos(JSON.parse(stored));
      }
    } catch (e) {}
  }, []);

  const saveTodos = (data: TodoItem[]) => {
    setTodos(data);
    try {
      localStorage.setItem("skillsphere_home_todos", JSON.stringify(data));
    } catch (e) {}
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    const newItem: TodoItem = {
      id: `todo-${Date.now()}`,
      text: text.trim(),
      done: false,
      priority,
      category: category.trim() || "General",
      dueDate: dueDate || undefined,
      createdAt: Date.now(),
    };

    saveTodos([newItem, ...todos]);
    setText("");
    setDueDate("");
  };

  const handleToggle = (id: string) => {
    const updated = todos.map((t) => (t.id === id ? { ...t, done: !t.done } : t));
    saveTodos(updated);
  };

  const handleDelete = (id: string) => {
    saveTodos(todos.filter((t) => t.id !== id));
  };

  const handleClearCompleted = () => {
    saveTodos(todos.filter((t) => !t.done));
  };

  const completedCount = todos.filter((t) => t.done).length;
  const progressPct = todos.length ? Math.round((completedCount / todos.length) * 100) : 0;

  const filteredTodos = todos.filter((t) => {
    if (filter === "active" && t.done) return false;
    if (filter === "completed" && !t.done) return false;
    if (search && !t.text.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto text-foreground">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-border gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2.5">
            <CheckSquare className="w-6 h-6 text-primary" />
            To-Do Tasks & Goal Tracker
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Organize daily tasks, algorithm practice goals, and academic milestones
          </p>
        </div>

        {completedCount > 0 && (
          <button
            onClick={handleClearCompleted}
            className="px-3.5 py-1.5 rounded-xl bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground text-xs font-semibold transition-colors cursor-pointer border border-border self-start sm:self-auto"
          >
            Clear Completed ({completedCount})
          </button>
        )}
      </div>

      {/* Progress Bar Card */}
      <div className="p-4 rounded-2xl bg-card border border-border shadow-xs space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold">
          <span className="text-foreground">Task Completion Progress</span>
          <span className="font-mono text-primary font-bold">
            {completedCount} / {todos.length} Completed ({progressPct}%)
          </span>
        </div>
        <div className="w-full h-2.5 rounded-full bg-secondary overflow-hidden">
          <div
            style={{ width: `${progressPct}%` }}
            className="h-full bg-primary transition-all duration-300 rounded-full"
          />
        </div>
      </div>

      {/* Add Task Input Form */}
      <form onSubmit={handleAdd} className="p-4 rounded-2xl bg-card border border-border shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            required
            placeholder="Add a new task (e.g. Master Tree Inversions on SkillSphere)..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="flex-1 px-3.5 py-2.5 bg-background border border-border rounded-xl text-xs sm:text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 hover:bg-primary/90 transition-all shadow-xs cursor-pointer border-none"
          >
            <Plus className="w-4 h-4" />
            <span>Add Task</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground text-[11px] font-semibold">Priority:</span>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as any)}
              className="px-2.5 py-1 bg-background border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="high">High Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="low">Low Priority</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground text-[11px] font-semibold">Category:</span>
            <input
              type="text"
              placeholder="Coding, School, Career..."
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-32 px-2.5 py-1 bg-background border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
            </input>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground text-[11px] font-semibold">Due Date:</span>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="px-2.5 py-1 bg-background border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>
      </form>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilter("all")}
            className={cn(
              "px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border",
              filter === "all"
                ? "bg-foreground text-background border-foreground font-bold shadow-xs"
                : "bg-card text-muted-foreground hover:text-foreground border-border"
            )}
          >
            All ({todos.length})
          </button>
          <button
            onClick={() => setFilter("active")}
            className={cn(
              "px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border",
              filter === "active"
                ? "bg-foreground text-background border-foreground font-bold shadow-xs"
                : "bg-card text-muted-foreground hover:text-foreground border-border"
            )}
          >
            Active ({todos.length - completedCount})
          </button>
          <button
            onClick={() => setFilter("completed")}
            className={cn(
              "px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border",
              filter === "completed"
                ? "bg-foreground text-background border-foreground font-bold shadow-xs"
                : "bg-card text-muted-foreground hover:text-foreground border-border"
            )}
          >
            Completed ({completedCount})
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-background border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {/* Tasks List */}
      <div className="space-y-2.5">
        {filteredTodos.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-card border border-border text-muted-foreground">
            <CheckCircle2 className="w-10 h-10 mx-auto text-muted-foreground/40 mb-2" />
            <p className="text-sm font-semibold">No tasks found</p>
            <p className="text-xs mt-1">Add your daily tasks and learning milestones above</p>
          </div>
        ) : (
          filteredTodos.map((todo) => {
            const badge = PRIORITY_BADGES[todo.priority] || PRIORITY_BADGES.medium;

            return (
              <div
                key={todo.id}
                className={cn(
                  "p-3.5 rounded-2xl bg-card border transition-all flex items-center justify-between gap-3 shadow-xs group",
                  todo.done ? "border-border/60 opacity-60 bg-secondary/20" : "border-border hover:border-primary/50"
                )}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    onClick={() => handleToggle(todo.id)}
                    className={cn(
                      "w-5 h-5 rounded-md border flex items-center justify-center transition-colors cursor-pointer shrink-0",
                      todo.done
                        ? "bg-primary border-primary text-primary-foreground"
                        : "border-border hover:border-primary bg-background"
                    )}
                  >
                    {todo.done && <Check className="w-3.5 h-3.5" />}
                  </button>

                  <div className="min-w-0">
                    <p
                      className={cn(
                        "text-xs sm:text-sm font-medium text-foreground truncate",
                        todo.done && "line-through text-muted-foreground"
                      )}
                    >
                      {todo.text}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                      <span className={cn("px-1.5 py-0.5 rounded-md font-bold uppercase border text-[9px]", badge.bg)}>
                        {badge.label}
                      </span>
                      {todo.category && (
                        <span className="px-1.5 py-0.5 rounded-md bg-secondary text-foreground font-mono">
                          {todo.category}
                        </span>
                      )}
                      {todo.dueDate && (
                        <span className="flex items-center gap-1 font-mono text-muted-foreground">
                          <Clock className="w-3 h-3 text-amber-500" />
                          Due: {todo.dueDate}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleDelete(todo.id)}
                  className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100 cursor-pointer border-none bg-transparent"
                  title="Delete task"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default DashboardTodos;
