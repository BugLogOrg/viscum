"use client";

import { useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export type ReorderLine = { id: string; text: string };

export function linesFromTexts(texts: string[]): ReorderLine[] {
  return texts.map((text) => ({
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `line-${Math.random().toString(36).slice(2)}`,
    text,
  }));
}

export function textsFromLines(lines: ReorderLine[]): string[] {
  return lines.map((l) => l.text);
}

function GripIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden
    >
      <circle cx="5" cy="4" r="1.25" />
      <circle cx="11" cy="4" r="1.25" />
      <circle cx="5" cy="8" r="1.25" />
      <circle cx="11" cy="8" r="1.25" />
      <circle cx="5" cy="12" r="1.25" />
      <circle cx="11" cy="12" r="1.25" />
    </svg>
  );
}

function SortableRow({
  line,
  index,
  canDelete,
  inputClassName,
  onTextChange,
  onRemove,
}: {
  line: ReorderLine;
  index: number;
  canDelete: boolean;
  inputClassName: string;
  onTextChange: (id: string, value: string) => void;
  onRemove: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: line.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 2 : undefined,
    opacity: isDragging ? 0.92 : undefined,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-1.5 sm:gap-2 ${isDragging ? "rounded-md bg-viscum-leaf-soft/40" : ""}`}
    >
      <button
        type="button"
        className="flex h-9 w-7 shrink-0 cursor-grab touch-none items-center justify-center rounded-md text-viscum-muted hover:bg-viscum-paper-2 hover:text-viscum-ink active:cursor-grabbing"
        aria-label={`${index + 1}行目を並べ替え`}
        title="ドラッグして並べ替え"
        {...attributes}
        {...listeners}
      >
        <GripIcon className="h-4 w-4" />
      </button>
      <span className="w-5 shrink-0 text-center text-[12px] leading-none text-viscum-muted">
        {index + 1}.
      </span>
      <input
        type="text"
        value={line.text}
        onChange={(e) => onTextChange(line.id, e.target.value)}
        className={`min-w-0 flex-1 rounded-md border border-viscum-line bg-white/80 px-3 py-2 text-viscum-ink focus:border-viscum-brand focus:outline-none ${inputClassName}`}
      />
      <button
        type="button"
        onClick={() => onRemove(line.id)}
        disabled={!canDelete}
        className="shrink-0 self-center rounded-md border border-viscum-line px-2 py-1.5 text-[12px] leading-none text-viscum-muted hover:border-viscum-berry hover:text-viscum-berry disabled:opacity-40"
        aria-label={`${index + 1}行目を削除`}
      >
        削除
      </button>
    </li>
  );
}

type Props = {
  items: ReorderLine[];
  onChange: (next: ReorderLine[]) => void;
  max: number;
  addLabel: string;
  /** 追加時の初期テキスト */
  newItemText?: string;
  inputClassName?: string;
  emptyError?: string | null;
};

/** 編集可能な行リスト＋ドラッグ並べ替え（聞くこと／募集の目安） */
export function EditableReorderList({
  items,
  onChange,
  max,
  addLabel,
  newItemText = "",
  inputClassName = "text-[13px]",
  emptyError = null,
}: Props) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 180, tolerance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((l) => l.id === active.id);
    const newIndex = items.findIndex((l) => l.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    onChange(arrayMove(items, oldIndex, newIndex));
  }

  function setText(id: string, value: string) {
    onChange(items.map((l) => (l.id === id ? { ...l, text: value } : l)));
  }

  function remove(id: string) {
    if (items.length <= 1) return;
    onChange(items.filter((l) => l.id !== id));
  }

  function add() {
    if (items.length >= max) return;
    onChange([
      ...items,
      ...linesFromTexts([newItemText]),
    ]);
  }

  const filled = items.map((l) => l.text.trim()).filter(Boolean).length;

  return (
    <div>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={(e) => setActiveId(String(e.active.id))}
        onDragCancel={() => setActiveId(null)}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={items.map((l) => l.id)}
          strategy={verticalListSortingStrategy}
        >
          <ul className="mt-2 space-y-2">
            {items.map((line, i) => (
              <SortableRow
                key={line.id}
                line={line}
                index={i}
                canDelete={items.length > 1}
                inputClassName={inputClassName}
                onTextChange={setText}
                onRemove={remove}
              />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
      {items.length < max && (
        <button
          type="button"
          onClick={add}
          className="mt-2 text-[13px] font-medium text-viscum-brand underline"
        >
          {addLabel}
        </button>
      )}
      {emptyError && filled === 0 ? (
        <p className="mt-2 text-[12px] text-viscum-berry-deep">{emptyError}</p>
      ) : null}
      {activeId ? (
        <p className="sr-only" aria-live="polite">
          並べ替え中
        </p>
      ) : null}
    </div>
  );
}
