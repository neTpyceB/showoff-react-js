import { useState } from 'react'

type UseControllableStateProps<T> = {
  value?: T
  defaultValue: T
  onChange?: (value: T) => void
}

export const useControllableState = <T>({
  value,
  defaultValue,
  onChange,
}: UseControllableStateProps<T>) => {
  const [internalValue, setInternalValue] = useState(defaultValue)
  const currentValue = value ?? internalValue

  const setValue = (nextValue: T) => {
    if (value === undefined) {
      setInternalValue(nextValue)
    }

    onChange?.(nextValue)
  }

  return [currentValue, setValue] as const
}
