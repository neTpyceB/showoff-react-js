import { useEffect, useReducer } from 'react'
import type { ZodType } from 'zod'

type UsePersistentReducerProps<TState, TAction> = {
  reducer: (state: TState, action: TAction) => TState
  initialState: TState
  storageKey: string
  schema: ZodType<TState>
}

export const usePersistentReducer = <TState, TAction>({
  reducer,
  initialState,
  storageKey,
  schema,
}: UsePersistentReducerProps<TState, TAction>) => {
  const [state, dispatch] = useReducer(reducer, initialState, (seed) => {
    if (typeof window === 'undefined') {
      return seed
    }

    const rawValue = window.localStorage.getItem(storageKey)

    if (!rawValue) {
      return seed
    }

    try {
      const parsedValue = JSON.parse(rawValue)
      const result = schema.safeParse(parsedValue)
      return result.success ? result.data : seed
    } catch {
      return seed
    }
  })

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(state))
  }, [state, storageKey])

  return [state, dispatch] as const
}
