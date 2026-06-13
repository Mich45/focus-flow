import { useEffect } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { restrictToVerticalAxis, restrictToParentElement } from "@dnd-kit/modifiers";
import { ListChecks, ArrowDownToLine } from "lucide-react";
import { format } from "date-fns";
import { useTaskStore } from "../../stores/taskStore";
import { useTimerStore } from "../../stores/timerStore";
import { localDay } from "../../lib/datetime";
import { TaskItem } from "../tasks/TaskItem";
import { TaskInput } from "../tasks/TaskInput";
import { DaySwitcher } from "../tasks/DaySwitcher";

/** Daily to-dos (FR-D). */
export function TasksScreen() {
  const date = useTaskStore((s) => s.date);
  const tasks = useTaskStore((s) => s.tasks);
  const reorder = useTaskStore((s) => s.reorder);
  const carryCandidates = useTaskStore((s) => s.carryCandidates);
  const carryOver = useTaskStore((s) => s.carryOver);
  const refreshCounts = useTaskStore((s) => s.refreshCounts);
  const dataVersion = useTimerStore((s) => s.dataVersion);

  const readOnly = date !== localDay();
  const remaining = tasks.filter((t) => !t.done).length;

  // Keep "actual" pomodoro tallies live as focus sessions complete.
  useEffect(() => {
    void refreshCounts();
  }, [dataVersion, refreshCounts]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));
  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const ids = tasks.map((t) => t.id);
    const from = ids.indexOf(active.id as number);
    const to = ids.indexOf(over.id as number);
    reorder(arrayMove(ids, from, to));
  };

  return (
    <div className="sheet fade-up">
      <div className="sheet-head">
        <div>
          <h1 className="sheet-title">Tasks</h1>
          <div className="sheet-sub">
            {readOnly ? "Viewing history" : remaining === 0 ? "All clear" : `${remaining} to do`}
          </div>
        </div>
        <DaySwitcher />
      </div>

      <div className="sheet-body">
        {!readOnly && (
          <div className="mb-4">
            <TaskInput disabled={readOnly} />
          </div>
        )}

        {carryCandidates.length > 0 && (
          <button
            onClick={() => void carryOver()}
            className="mb-4 flex w-full items-center gap-3 rounded-[10px] p-3.5 text-left"
            style={{ background: "var(--green-tint)", color: "var(--green-primary)" }}
          >
            <ArrowDownToLine size={18} className="flex-shrink-0" />
            <span className="text-[12.5px] leading-snug">
              {carryCandidates.length} unfinished{" "}
              {carryCandidates.length === 1 ? "task" : "tasks"} from{" "}
              {format(new Date(`${carryCandidates[0].task_date}T00:00:00`), "MMM d")}.{" "}
              <span className="font-bold underline">Carry over</span>
            </span>
          </button>
        )}

        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center" style={{ color: "var(--ui-text-3)" }}>
            <ListChecks size={38} strokeWidth={1.6} />
            <div className="text-[13.5px]">{readOnly ? "No tasks on this day" : "No tasks yet — add one above"}</div>
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd} modifiers={[restrictToVerticalAxis, restrictToParentElement]}>
            <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
              <div className="flex flex-col gap-1.5">
                {tasks.map((t) => (
                  <TaskItem key={t.id} task={t} readOnly={readOnly} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  );
}
