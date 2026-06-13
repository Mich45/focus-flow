import { useState, useRef, useEffect } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Check, Target, Minus, Plus, Trash2 } from "lucide-react";
import { useTaskStore, type Task } from "../../stores/taskStore";

/** A single task row: drag, complete, edit-in-place, active, pomodoro count (FR-D1–D3). */
export function TaskItem({ task, readOnly }: { task: Task; readOnly: boolean }) {
  const { toggleDone, editTitle, setEst, remove, setActive } = useTaskStore();
  const activeTaskId = useTaskStore((s) => s.activeTaskId);
  const isActive = activeTaskId === task.id;

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    disabled: readOnly,
  });

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(task.title);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const commit = () => {
    setEditing(false);
    if (draft.trim() && draft !== task.title) editTitle(task.id, draft);
    else setDraft(task.title);
  };

  const est = task.estPomodoros;

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.6 : 1,
      }}
      className="card group flex items-center gap-2 p-[9px_12px]"
      data-active={isActive}
    >
      {!readOnly && (
        <button {...attributes} {...listeners} className="cursor-grab opacity-30 transition group-hover:opacity-100 active:cursor-grabbing" style={{ color: "var(--ui-text-3)" }} aria-label="Drag to reorder" title="Drag to reorder">
          <GripVertical size={16} />
        </button>
      )}

      {/* complete checkbox */}
      <button
        onClick={() => !readOnly && toggleDone(task.id)}
        disabled={readOnly}
        className="flex h-[19px] w-[19px] flex-shrink-0 items-center justify-center rounded-[6px] transition-colors"
        style={{
          border: task.done ? "none" : "1.6px solid var(--ui-border-2)",
          background: task.done ? "var(--accent)" : "transparent",
          color: "#fff",
        }}
        aria-label={task.done ? "Mark task incomplete" : "Mark task complete"}
        title={task.done ? "Mark incomplete" : "Mark complete"}
      >
        {task.done && <Check size={13} strokeWidth={3} />}
      </button>

      {/* title (edit-in-place) */}
      {editing ? (
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") {
              setDraft(task.title);
              setEditing(false);
            }
          }}
          className="tin flex-1 !py-1 !px-2 !text-[14px]"
          aria-label="Edit task title"
        />
      ) : (
        <button
          className="flex-1 truncate text-left text-[14px]"
          style={{ color: task.done ? "var(--ui-text-3)" : "var(--ui-text)", textDecoration: task.done ? "line-through" : "none" }}
          onClick={() => !readOnly && setEditing(true)}
          disabled={readOnly}
          title={readOnly ? task.title : "Click to edit"}
          aria-label={`Edit “${task.title}”`}
        >
          {task.title}
          {task.carriedFrom && (
            <span className="ml-2 rounded px-1.5 py-0.5 text-[10px] font-semibold" style={{ background: "var(--ui-sunken)", color: "var(--ui-text-3)" }}>
              carried over
            </span>
          )}
        </button>
      )}

      {/* pomodoro estimate / actual (FR-D2): 🍅 done / planned */}
      <div className="flex items-center gap-1 text-[12px] tabular-nums" style={{ color: "var(--ui-text-2)" }}>
        {est != null ? (
          <>
            {!readOnly && (
              <button onClick={() => setEst(task.id, Math.max(0, est - 1) || null)} className="opacity-0 group-hover:opacity-100" style={{ color: "var(--ui-text-3)" }} aria-label="Decrease focus estimate" title="One fewer focus session">
                <Minus size={13} />
              </button>
            )}
            <span title={`${task.actual} of ${est} focus sessions done`} aria-label={`${task.actual} of ${est} focus sessions done`}>
              🍅 {task.actual}/{est}
            </span>
            {!readOnly && (
              <button onClick={() => setEst(task.id, Math.min(20, est + 1))} className="opacity-0 group-hover:opacity-100" style={{ color: "var(--ui-text-3)" }} aria-label="Increase focus estimate" title="One more focus session">
                <Plus size={13} />
              </button>
            )}
          </>
        ) : (
          !readOnly && (
            <button
              onClick={() => setEst(task.id, 1)}
              className="flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium opacity-60 transition group-hover:opacity-100"
              style={{ background: "var(--ui-sunken)", color: "var(--ui-text-2)" }}
              aria-label="Set focus estimate"
              title="Estimate how many focus sessions this needs"
            >
              🍅 Estimate
            </button>
          )
        )}
      </div>

      {/* active task: completed focus sessions are attributed to it */}
      {!readOnly && (
        <button
          onClick={() => setActive(task.id)}
          className="flex h-7 items-center gap-1 rounded-full px-2 text-[11px] font-semibold transition"
          style={{
            background: isActive ? "var(--accent)" : "var(--ui-sunken)",
            color: isActive ? "#fff" : "var(--ui-text-3)",
          }}
          title={
            isActive
              ? "Active task — focus sessions count toward it (click to clear)"
              : "Set as active task — focus sessions will count toward it"
          }
          aria-label={isActive ? "Active task (click to clear)" : "Set as active task"}
          aria-pressed={isActive}
        >
          <Target size={14} />
          {isActive && <span>Active</span>}
        </button>
      )}

      {/* delete */}
      {!readOnly && (
        <button onClick={() => remove(task.id)} className="opacity-0 transition group-hover:opacity-100" style={{ color: "var(--ui-text-3)" }} aria-label="Delete task" title="Delete task">
          <Trash2 size={15} />
        </button>
      )}
    </div>
  );
}
