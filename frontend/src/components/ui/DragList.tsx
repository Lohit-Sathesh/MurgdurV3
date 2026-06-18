'use client'
import {
  DndContext, closestCenter, PointerSensor,
  useSensor, useSensors, DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext, verticalListSortingStrategy,
  useSortable, arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'

// ── Sortable item wrapper ──────────────────────────────────────────────────────

export function SortableItem({
  id, children, disabled,
}: {
  id: string
  children: (handle: React.ReactNode) => React.ReactNode
  disabled?: boolean
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id, disabled })

  const style: React.CSSProperties = {
    transform:  CSS.Transform.toString(transform),
    transition,
    opacity:    isDragging ? 0.5 : 1,
    zIndex:     isDragging ? 10 : undefined,
  }

  const handle = (
    <button
      {...attributes}
      {...listeners}
      className="text-luxury-muted hover:text-luxury-white cursor-grab active:cursor-grabbing p-1 shrink-0"
      aria-label="Drag to reorder"
      type="button"
    >
      <GripVertical className="w-4 h-4" />
    </button>
  )

  return (
    <div ref={setNodeRef} style={style}>
      {children(handle)}
    </div>
  )
}

// ── DragList wrapper ───────────────────────────────────────────────────────────

interface Props<T extends { id: string }> {
  items:     T[]
  onReorder: (items: T[]) => void
  children:  (item: T, handle: React.ReactNode, index: number) => React.ReactNode
  disabled?: boolean
}

export function DragList<T extends { id: string }>({ items, onReorder, children, disabled }: Props<T>) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIdx = items.findIndex(i => i.id === active.id)
    const newIdx = items.findIndex(i => i.id === over.id)
    onReorder(arrayMove(items, oldIdx, newIdx))
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
        {items.map((item, idx) => (
          <SortableItem key={item.id} id={item.id} disabled={disabled}>
            {handle => children(item, handle, idx)}
          </SortableItem>
        ))}
      </SortableContext>
    </DndContext>
  )
}
