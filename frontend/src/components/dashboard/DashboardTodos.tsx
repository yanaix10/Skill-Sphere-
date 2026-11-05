import React, { useState, useEffect } from "react";
import { Check, Plus, Trash2, CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SimpleTodo {
  id: string;
  text: string;
  done: boolean;
  createdAt: number;
}

const DEFAULT_TODOS: SimpleTodo[] = [
  { id: "1", text: "Scaffold the project structure & socket gateway", done: true, createdAt: Date.now() - 3600000 * 5 },
  { id: "2", text: "Build the algorithmic challenge component registry", done: true, createdAt: Date.now() - 3600000 * 4 },
  { id: "3", text: "Complete Google Classroom assignment 4 on Dynamic Programming", done: false, createdAt: Date.now() - 3600000 * 3 },
  { id: "4", text: "Attend CS Final Project sprint sync at 10:30 AM", done: false, createdAt: Date.now() - 3600000 * 2 },
  { id: "5", text: "Practice Tree Traversals and Binary Search on SkillSphere", done: false, createdAt: Date.now() - 3600000 * 1 },
];

export const DashboardTodos: React.FC = () => {
  const [todos, setTodos] = useState<SimpleTodo[]>(() => {
    try {
      const stored = localStorage.getItem("skillsphere_home_todos");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });

  const [input, setInput] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");

  const saveTodos = (updated: SimpleTodo[]) => {
    setTodos(updated);
    try {
      localStorage.setItem("skillsphere_home_todos", JSON.stringify(updated));
    } catch {}
  };

  const handleToggle = (id: string) => {
    const updated = todos.map((t) => (t.id === id ? { ...t, done: !t.done } : t));
    saveTodos(updated);
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const newItem: SimpleTodo = {
      id: `todo-${Date.now()}`,
      text: input.trim(),
      done: false,
      createdAt: Date.now(),
    };

    saveTodos([newItem, ...todos]);
    setInput("");
  };

  const handleDelete = (id: string) => {
    saveTodos(todos.filter((t) => t.id !== id));
  };

  const handleClearCompleted = () => {
    saveTodos(todos.filter((t) => !t.done));
  };

  const completedCount = todos.filter((t) => t.done).length;
  const progressPct = todos.length ? Math.round((completedCount / todos.length) * 100) : 0;

  const filtered = todos.filter((t) => {
    if (filter === "active") return !t.done;
    if (filter === "completed") return t.done;
    return true;
  });

  return (
    <div className="space-y-4 max-w-2xl mx-auto text-foreground">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-border">
        <h2 className="text-[18px] font-semibold tracking-tight text-foreground m-0">To-do tasks</h2>

        <div className="flex items-center gap-2">
          <span className="text-[12px] font-mono tabular-nums font-semibold px-2 py-0.5 rounded-md bg-surface-muted text-foreground border border-border">
            {completedCount} / {todos.length} done
          </span>
          {completedCount > 0 && (
            <button
              onClick={handleClearCompleted}
              className="text-[12px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer border-none bg-transparent"
            >
              Clear completed
            </button>
          )}
        </div>
      </div>

      {/* Progress Line */}
      {todos.length > 0 && (
        <div className="w-full h-1 rounded-full bg-surface-muted overflow-hidden">
          <div
            style={{ width: `${progressPct}%` }}
            className="h-full bg-primary rounded-full transition-all duration-300"
          />
        </div>
      )}

      {/* Widget Card */}
      <div className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-xs space-y-4">
        {/* Simple Input Bar */}
        <form onSubmit={handleAdd} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Add a task..."
            className="flex-1 px-3 py-1.5 rounded-md bg-background border border-border text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <button
            type="submit"
            className="px-3.5 py-1.5 rounded-md bg-primary text-primary-foreground text-[13px] font-medium flex items-center gap-1.5 hover:opacity-95 transition-all cursor-pointer border-none"
          >
            <Plus className="w-4 h-4" />
            <span>Add</span>
          </button>
        </form>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5">
          {(["all", "active", "completed"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={cn(
                "px-2.5 py-1 rounded-md text-[12px] font-medium transition-all cursor-pointer border capitalize",
                filter === tab
                  ? "bg-surface-muted border-border text-foreground font-semibold shadow-2xs"
                  : "bg-surface text-muted-foreground hover:text-foreground border-border/60"
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Task List */}
        <div className="space-y-1.5 pt-1">
          {filtered.length === 0 ? (
            <div className="text-center py-8 text-[12px] text-muted-foreground">
              No tasks yet. Type a task above and press Add!
            </div>
          ) : (
            filtered.map((todo) => (
              <div
                key={todo.id}
                onClick={() => handleToggle(todo.id)}
                className={cn(
                  "flex items-center justify-between p-3 rounded-xl border border-transparent hover:border-border hover:bg-secondary/40 transition-all cursor-pointer group",
                  todo.done ? "opacity-50" : ""
                )}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={cn(
                      "w-4 h-4 rounded-md border flex items-center justify-center transition-colors shrink-0",
                      todo.done ? "bg-primary border-primary text-primary-foreground" : "border-border bg-background"
                    )}
                  >
                    {todo.done && <Check className="w-3 h-3 stroke-[2.5]" />}
                  </div>
                  <span
                    className={cn(
                      "text-[13px] font-medium text-foreground truncate",
                      todo.done && "line-through text-muted-foreground"
                    )}
                  >
                    {todo.text}
                  </span>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(todo.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-muted-foreground hover:text-destructive transition-all cursor-pointer border-none bg-transparent"
                  title="Delete task"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardTodos;
