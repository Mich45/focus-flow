import { useState, type FormEvent } from "react";
import { Plus } from "lucide-react";
import { useTaskStore } from "../../stores/taskStore";

/** Quick-add input — type and press Enter or click Add (FR-D1). */
export function TaskInput({ disabled }: { disabled?: boolean }) {
  const [value, setValue] = useState("");
  const add = useTaskStore((s) => s.add);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!value.trim()) return;
    void add(value);
    setValue("");
  };

  return (
    <form onSubmit={submit} className="flex items-center gap-2">
      <div className="relative flex-1">
        <input
          className="tin !pl-11"
          placeholder={disabled ? "Switch to Today to add tasks" : "Add a task…"}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={disabled}
          aria-label="New task"
        />
        <Plus size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "var(--ui-text-3)" }} />
      </div>
      <button
        type="submit"
        disabled={disabled || !value.trim()}
        className="btn btn-pri !py-[11px] disabled:opacity-40"
      >
        <Plus size={16} /> Add
      </button>
    </form>
  );
}
