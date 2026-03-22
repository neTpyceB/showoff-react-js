import {
  DndContext,
  PointerSensor,
  closestCorners,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { useState, type KeyboardEvent, type ReactNode } from 'react'
import { useParams } from 'react-router-dom'
import { boardStatuses, type BoardStatus, type Task } from '../kanban/model.ts'
import {
  getAssignee,
  groupTasks,
  useBoardQuery,
  useCreateTaskMutation,
  useMoveTaskMutation,
  useSessionQuery,
} from '../kanban/hooks.ts'
import { getAdjacentStatus } from '../kanban/board.ts'
import { canManageTasks, isViewer } from '../kanban/permissions.ts'
import { Button } from './Button.tsx'
import { TaskComposer, type TaskComposerValues } from './TaskComposer.tsx'
import { useToast } from './ToastProvider.tsx'

const columnLabels: Record<BoardStatus, string> = {
  backlog: 'Backlog',
  todo: 'Todo',
  'in-progress': 'In Progress',
  done: 'Done',
}

const TaskCard = ({
  task,
  assigneeName,
  disabled,
  keyboardTargetStatus,
  onKeyDown,
  canMoveLeft,
  canMoveRight,
  onMoveLeft,
  onMoveRight,
  moveBusy,
}: {
  task: Task
  assigneeName: string
  disabled: boolean
  keyboardTargetStatus: BoardStatus | null
  onKeyDown: (event: KeyboardEvent<HTMLElement>) => void
  canMoveLeft: boolean
  canMoveRight: boolean
  onMoveLeft: () => void
  onMoveRight: () => void
  moveBusy: boolean
}) => {
  const { listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `task:${task.id}`,
    data: {
      type: 'task',
      taskId: task.id,
      status: task.status,
    },
    disabled,
  })
  const isKeyboardActive = keyboardTargetStatus !== null

  return (
    <article
      ref={setNodeRef}
      className="task-card"
      data-dragging={isDragging}
      data-keyboard-active={isKeyboardActive}
      style={{
        transform: CSS.Transform.toString(transform),
      }}
      {...listeners}
      onKeyDown={onKeyDown}
      tabIndex={0}
      aria-label={`${task.title} assigned to ${assigneeName}`}
      aria-describedby={isKeyboardActive ? `task-move-${task.id}` : undefined}
    >
      <div className="task-meta">
        <span className="pill">{task.priority}</span>
        <span>{assigneeName}</span>
      </div>
      <strong>{task.title}</strong>
      <p>{task.description}</p>
      {!disabled ? (
        <div className="task-actions">
          <button
            type="button"
            className="task-action"
            disabled={!canMoveLeft || moveBusy}
            onPointerDown={(event) => event.stopPropagation()}
            onClick={onMoveLeft}
          >
            Move left
          </button>
          <button
            type="button"
            className="task-action"
            disabled={!canMoveRight || moveBusy}
            onPointerDown={(event) => event.stopPropagation()}
            onClick={onMoveRight}
          >
            Move right
          </button>
        </div>
      ) : null}
      {isKeyboardActive ? (
        <span id={`task-move-${task.id}`} className="sr-only">
          Move target {columnLabels[keyboardTargetStatus]}. Press space to confirm or escape
          to cancel.
        </span>
      ) : null}
    </article>
  )
}

const BoardColumn = ({
  status,
  tasks,
  children,
}: {
  status: BoardStatus
  tasks: Task[]
  children: ReactNode
}) => {
  const { setNodeRef } = useDroppable({
    id: `column:${status}`,
    data: {
      type: 'column',
      status,
    },
  })

  return (
    <section className="board-column">
      <header className="column-header">
        <h3>{columnLabels[status]}</h3>
        <span className="pill">{tasks.length}</span>
      </header>
      <div
        ref={setNodeRef}
        className="column-body"
        aria-label={`${columnLabels[status]} dropzone`}
      >
        {children}
      </div>
    </section>
  )
}

export const BoardPage = () => {
  const { spaceId = '' } = useParams()
  const { pushToast } = useToast()
  const sessionQuery = useSessionQuery()
  const boardQuery = useBoardQuery(spaceId, sessionQuery.data?.id)
  const createTaskMutation = useCreateTaskMutation(spaceId, sessionQuery.data?.id ?? '')
  const moveTaskMutation = useMoveTaskMutation(spaceId, sessionQuery.data?.id ?? '')
  const [keyboardDrag, setKeyboardDrag] = useState<{
    taskId: string
    targetStatus: BoardStatus
  } | null>(null)
  const [keyboardAnnouncement, setKeyboardAnnouncement] = useState('')
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  if (!sessionQuery.data) {
    return null
  }

  if (boardQuery.isPending) {
    return (
      <section className="error-card">
        <h2>Loading board</h2>
      </section>
    )
  }

  if (boardQuery.isError) {
    return (
      <section className="error-card">
        <h2>Board access error</h2>
        <p>{boardQuery.error.message}</p>
        <Button onClick={() => boardQuery.refetch()}>Retry sync</Button>
      </section>
    )
  }

  if (!boardQuery.data) {
    return null
  }

  const { role, space, users, tasks } = boardQuery.data
  const columns = groupTasks(tasks)
  const canWrite = canManageTasks(role)

  const announceKeyboardState = (message: string) => {
    setKeyboardAnnouncement('')
    window.requestAnimationFrame(() => {
      setKeyboardAnnouncement(message)
    })
  }

  const commitTaskMove = async (
    task: Task,
    targetStatus: BoardStatus,
    targetIndex: number,
    announcement?: string,
  ) => {
    try {
      await moveTaskMutation.mutateAsync({
        taskId: task.id,
        targetStatus,
        targetIndex,
      })
      pushToast({
        title: 'Task moved',
        description: `${task.title} moved to ${columnLabels[targetStatus]}.`,
      })
      if (announcement) {
        announceKeyboardState(announcement)
      }
      return true
    } catch (error) {
      pushToast({
        title: 'Move failed',
        description:
          error instanceof Error ? error.message : 'Task movement did not complete.',
      })
      if (announcement) {
        announceKeyboardState(`${task.title} movement failed.`)
      }
      return false
    }
  }

  const resolveTarget = (event: DragEndEvent) => {
    const overId = String(event.over?.id ?? '')

    if (overId.startsWith('column:')) {
      const targetStatus = overId.replace('column:', '') as BoardStatus
      return {
        targetStatus,
        targetIndex: columns[targetStatus].length,
      }
    }

    throw new Error('Unsupported drop target.')
  }

  const onCreateTask = async (values: TaskComposerValues) => {
    try {
      await createTaskMutation.mutateAsync(values)
      pushToast({
        title: 'Task created',
        description: `${values.title} was added to ${space.name}.`,
        tone: 'success',
      })
    } catch (error) {
      pushToast({
        title: 'Create failed',
        description:
          error instanceof Error ? error.message : 'Task creation did not complete.',
      })
    }
  }

  const onDragEnd = async (event: DragEndEvent) => {
    const activeTaskId = String(event.active.id).replace('task:', '')

    if (!event.over || !canWrite) {
      return
    }

    const { targetStatus, targetIndex } = resolveTarget(event)
    const movingTask = tasks.find((task) => task.id === activeTaskId)

    if (!movingTask) {
      return
    }

    const currentIndex = columns[movingTask.status].findIndex(
      (task) => task.id === movingTask.id,
    )

    if (movingTask.status === targetStatus && currentIndex === targetIndex) {
      return
    }

    try {
      await commitTaskMove(movingTask, targetStatus, targetIndex)
    } catch {
      return
    }
  }

  const onTaskKeyDown = (task: Task) => async (event: KeyboardEvent<HTMLElement>) => {
    if (!canWrite) {
      return
    }

    if (event.key === 'Escape' && keyboardDrag?.taskId === task.id) {
      event.preventDefault()
      setKeyboardDrag(null)
      announceKeyboardState(`${task.title} movement cancelled.`)
      return
    }

    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault()

      if (!keyboardDrag || keyboardDrag.taskId !== task.id) {
        setKeyboardDrag({
          taskId: task.id,
          targetStatus: task.status,
        })
        announceKeyboardState(
          `${task.title} selected. Use left and right arrow keys to choose a column.`,
        )
        return
      }

      if (keyboardDrag.targetStatus === task.status) {
        setKeyboardDrag(null)
        announceKeyboardState(`${task.title} movement cancelled.`)
        return
      }

      try {
        const didMove = await commitTaskMove(
          task,
          keyboardDrag.targetStatus,
          columns[keyboardDrag.targetStatus].length,
          `${task.title} moved to ${columnLabels[keyboardDrag.targetStatus]}.`,
        )
        setKeyboardDrag(null)
        if (!didMove) {
          return
        }
      } catch {
        setKeyboardDrag(null)
      }

      return
    }

    if (keyboardDrag?.taskId !== task.id) {
      return
    }

    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') {
      return
    }

    event.preventDefault()
    const nextStatus = getAdjacentStatus(
      keyboardDrag.targetStatus,
      event.key === 'ArrowLeft' ? 'left' : 'right',
    )

    if (!nextStatus) {
      announceKeyboardState(`No additional column is available for ${task.title}.`)
      return
    }

    setKeyboardDrag({
      taskId: task.id,
      targetStatus: nextStatus,
    })
    announceKeyboardState(
      `${task.title} target column ${columnLabels[nextStatus]}. Press space to confirm.`,
    )
  }

  return (
    <section className="board-shell">
      <header className="board-hero">
        <div>
          <p className="eyebrow">Team space</p>
          <h1>{space.name}</h1>
          <p className="hero-text">{space.description}</p>
        </div>
        <div className="hero-actions">
          <span className="role-pill" data-role={role}>
            {role}
          </span>
          {isViewer(role) ? (
            <p className="form-note">Viewer access: board changes are blocked by permissions.</p>
          ) : null}
        </div>
      </header>

      <div className="workspace-grid kanban-layout">
        <TaskComposer users={users} disabled={!canWrite} onSubmit={onCreateTask} />

        <DndContext
          collisionDetection={closestCorners}
          sensors={sensors}
          onDragEnd={onDragEnd}
        >
          <div className="board-grid" aria-label="Kanban board">
            {boardStatuses.map((status) => (
              <BoardColumn key={status} status={status} tasks={columns[status]}>
                {columns[status].map((task) => {
                  const assignee = getAssignee(users, task.assigneeId)

                  if (!assignee) {
                    throw new Error('Board data references an unknown assignee.')
                  }

                  return (
                    <TaskCard
                      key={task.id}
                      task={task}
                      assigneeName={assignee.name}
                      disabled={!canWrite}
                      keyboardTargetStatus={
                        keyboardDrag?.taskId === task.id ? keyboardDrag.targetStatus : null
                      }
                      onKeyDown={onTaskKeyDown(task)}
                      canMoveLeft={Boolean(getAdjacentStatus(task.status, 'left'))}
                      canMoveRight={Boolean(getAdjacentStatus(task.status, 'right'))}
                      onMoveLeft={() => {
                        const targetStatus = getAdjacentStatus(task.status, 'left')

                        if (!targetStatus) {
                          return
                        }

                        void commitTaskMove(task, targetStatus, columns[targetStatus].length)
                      }}
                      onMoveRight={() => {
                        const targetStatus = getAdjacentStatus(task.status, 'right')

                        if (!targetStatus) {
                          return
                        }

                        void commitTaskMove(task, targetStatus, columns[targetStatus].length)
                      }}
                      moveBusy={moveTaskMutation.isPending}
                    />
                  )
                })}
              </BoardColumn>
            ))}
          </div>
        </DndContext>
        <p className="sr-only" aria-live="polite">
          {keyboardAnnouncement}
        </p>
      </div>
    </section>
  )
}
