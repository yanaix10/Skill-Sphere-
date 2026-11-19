import React, { useState } from "react";
import { Check, Plus, Trash2, CheckSquare, Settings2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import GlassWorkspace, { useGlass } from "./GlassWorkspace";

export interface SimpleTodo {
  id: string;
  text: string;
  done: boolean;
  createdAt: number;
}

const DashboardTodosContent: React.FC = () => {
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
  const { settingsOpen, setSettingsOpen } = useGlass();

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
    <div className="space-y-6 w-full max-w-4xl mx-auto text-foreground">
      {/* ─── 1. Header Bar (Glass Styled) ─── */}
      <div className="gw-glass p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-card/60 backdrop-blur-md border border-white/20 dark:border-white/10 flex items-center justify-center text-primary shadow-xs">
            <CheckSquare className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-[20px] font-semibold tracking-tight text-foreground m-0">
              To-do tasks
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Organize your daily sprint, assignments, and development goals.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <span className="text-[12px] font-mono tabular-nums font-semibold px-3 py-1.5 rounded-xl bg-card/50 backdrop-blur-sm text-foreground border border-white/15 dark:border-white/10 shadow-xs">
            {completedCount} / {todos.length} done
          </span>

          <button
            type="button"
            onClick={() => setSettingsOpen(!settingsOpen)}
            className="px-3 py-1.5 rounded-xl border border-border/70 text-foreground hover:bg-muted/40 text-[12px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer bg-card/50 shadow-xs"
            title="Tune glass blur, opacity & edge highlights"
          >
            <Settings2 className="w-3.5 h-3.5 text-muted-foreground" />
            <span>Adjust glass</span>
          </button>

          {completedCount > 0 && (
            <button
              type="button"
              onClick={handleClearCompleted}
              className="text-[12px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer border-none bg-transparent px-2"
            >
              Clear completed
            </button>
          )}
        </div>
      </div>

      {/* ─── 2. Progress Bar ─── */}
      {todos.length > 0 && (
        <div className="w-full h-2 rounded-full bg-card/40 backdrop-blur-sm border border-white/10 dark:border-white/5 overflow-hidden shadow-xs">
          <div
            style={{ width: `${progressPct}%` }}
            className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
          />
        </div>
      )}

      {/* ─── 3. Main Tasks Card (Glass Styled) ─── */}
      <div className="gw-glass p-5 sm:p-7 rounded-2xl shadow-xs space-y-5">
        {/* Input Bar */}
        <form onSubmit={handleAdd} className="flex gap-2.5">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Add a new task..."
            className="flex-1 px-4 py-2.5 rounded-xl bg-card/40 backdrop-blur-md border border-white/20 dark:border-white/10 text-[13px] text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary/40 font-medium shadow-xs"
          />
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-[13px] font-semibold flex items-center gap-1.5 hover:opacity-95 transition-all shadow-xs cursor-pointer border-none shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add task</span>
          </button>
        </form>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-card/40 backdrop-blur-md border border-white/15 dark:border-white/10 w-fit shadow-xs">
          {(["all", "active", "completed"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setFilter(tab)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all cursor-pointer border-none capitalize",
                filter === tab
                  ? "bg-card/90 text-foreground font-semibold shadow-xs"
                  : "text-muted-foreground hover:text-foreground bg-transparent"
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Task List */}
        <div className="space-y-2 pt-1">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-[13px] text-muted-foreground">
              No tasks found. Type a task above and press Add!
            </div>
          ) : (
            filtered.map((todo) => (
              <div
                key={todo.id}
                onClick={() => handleToggle(todo.id)}
                className={cn(
                  "p-3.5 sm:p-4 rounded-xl bg-card/30 hover:bg-card/50 backdrop-blur-sm border border-white/15 dark:border-white/10 transition-all flex items-center justify-between gap-3 shadow-xs group cursor-pointer",
                  todo.done && "opacity-60"
                )}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    className={cn(
                      "w-5 h-5 rounded-lg border flex items-center justify-center transition-all shrink-0 shadow-xs",
                      todo.done
                        ? "bg-primary border-primary text-primary-foreground"
                        : "border-border/80 bg-card/60"
                    )}
                  >
                    {todo.done && <Check className="w-3.5 h-3.5 stroke-[3]" />}
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
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(todo.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all cursor-pointer border-none bg-transparent"
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

export const DashboardTodos: React.FC = () => {
  return (
    <GlassWorkspace brand="SkillSphere" useHostTheme={true}>
      <DashboardTodosContent />
    </GlassWorkspace>
  );
};

export default DashboardTodos;
