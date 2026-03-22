import { boardStatuses, type BoardStatus, type Task } from './model.ts'

export const getAdjacentStatus = (
  status: BoardStatus,
  direction: 'left' | 'right',
) => {
  const currentIndex = boardStatuses.indexOf(status)

  if (currentIndex === -1) {
    throw new Error('Task references an unsupported board status.')
  }

  const targetIndex = currentIndex + (direction === 'left' ? -1 : 1)
  return boardStatuses[targetIndex] ?? null
}

export const moveTaskCollection = (
  tasks: Task[],
  taskId: string,
  targetStatus: BoardStatus,
  targetIndex: number,
) => {
  const columns = Object.fromEntries(
    boardStatuses.map((status) => [
      status,
      tasks.filter((task) => task.status === status),
    ]),
  ) as Record<BoardStatus, Task[]>

  const movingTask = tasks.find((task) => task.id === taskId)

  if (!movingTask) {
    throw new Error('Task was not found for movement.')
  }

  const sourceItems = columns[movingTask.status].filter((task) => task.id !== taskId)
  const targetItems =
    movingTask.status === targetStatus ? sourceItems : [...columns[targetStatus]]

  const insertIndex = Math.min(targetIndex, targetItems.length)
  const updatedTask = {
    ...movingTask,
    status: targetStatus,
    updatedAt: '2026-03-22T09:00:00.000Z',
  }

  targetItems.splice(insertIndex, 0, updatedTask)
  columns[movingTask.status] = movingTask.status === targetStatus ? targetItems : sourceItems
  columns[targetStatus] = targetItems

  return boardStatuses.flatMap((status) => columns[status])
}
