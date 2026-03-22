import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { kanbanApi, type BoardData } from './api.ts'
import { boardStatuses, type BoardStatus, type User } from './model.ts'
import { moveTaskCollection } from './board.ts'

export const queryKeys = {
  session: ['session'] as const,
  users: ['users'] as const,
  spaces: (userId: string) => ['spaces', userId] as const,
  board: (spaceId: string, userId: string) => ['board', spaceId, userId] as const,
}

export const useSessionQuery = () =>
  useQuery({
    queryKey: queryKeys.session,
    queryFn: () => kanbanApi.getSession(),
    staleTime: 30_000,
  })

export const useUsersQuery = () =>
  useQuery({
    queryKey: queryKeys.users,
    queryFn: () => kanbanApi.listUsers(),
    staleTime: Infinity,
  })

export const useSpacesQuery = (userId: string | undefined) =>
  useQuery({
    queryKey: userId ? queryKeys.spaces(userId) : ['spaces', 'anonymous'],
    queryFn: () => kanbanApi.getSpaces(userId!),
    enabled: Boolean(userId),
    staleTime: 30_000,
  })

export const useBoardQuery = (spaceId: string | undefined, userId: string | undefined) =>
  useQuery({
    queryKey:
      spaceId && userId ? queryKeys.board(spaceId, userId) : ['board', 'anonymous'],
    queryFn: () => kanbanApi.getBoard(spaceId!, userId!),
    enabled: Boolean(spaceId && userId),
  })

export const useLoginMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (userId: string) => kanbanApi.login(userId),
    onSuccess: async (user) => {
      queryClient.setQueryData(queryKeys.session, user)
      await queryClient.invalidateQueries({ queryKey: queryKeys.spaces(user.id) })
    },
  })
}

export const useLogoutMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => kanbanApi.logout(),
    onSuccess: async () => {
      queryClient.clear()
      await queryClient.invalidateQueries({ queryKey: queryKeys.session })
    },
  })
}

export const useCreateTaskMutation = (spaceId: string, userId: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: {
      title: string
      description: string
      assigneeId: string
      priority: 'low' | 'medium' | 'high'
      status: BoardStatus
    }) => kanbanApi.createTask(spaceId, userId, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.board(spaceId, userId) })
      await queryClient.invalidateQueries({ queryKey: queryKeys.spaces(userId) })
    },
  })
}

export const useMoveTaskMutation = (spaceId: string, userId: string) => {
  const queryClient = useQueryClient()
  const boardKey = queryKeys.board(spaceId, userId)

  return useMutation({
    mutationFn: (input: {
      taskId: string
      targetStatus: BoardStatus
      targetIndex: number
    }) => kanbanApi.moveTask(spaceId, userId, input),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: boardKey })
      const previousBoard = queryClient.getQueryData<BoardData>(boardKey)

      if (previousBoard) {
        queryClient.setQueryData<BoardData>(boardKey, {
          ...previousBoard,
          tasks: moveTaskCollection(
            previousBoard.tasks,
            input.taskId,
            input.targetStatus,
            input.targetIndex,
          ),
        })
      }

      return { previousBoard }
    },
    onError: (_error, _variables, context) => {
      if (context?.previousBoard) {
        queryClient.setQueryData(boardKey, context.previousBoard)
      }
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: boardKey })
      await queryClient.invalidateQueries({ queryKey: queryKeys.spaces(userId) })
    },
  })
}

export const groupTasks = (tasks: BoardData['tasks']) =>
  Object.fromEntries(
    boardStatuses.map((status) => [status, tasks.filter((task) => task.status === status)]),
  ) as Record<BoardStatus, BoardData['tasks']>

export const getAssignee = (users: User[], assigneeId: string) =>
  users.find((user) => user.id === assigneeId)
