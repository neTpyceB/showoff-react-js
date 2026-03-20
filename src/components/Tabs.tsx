import {
  Children,
  cloneElement,
  createContext,
  isValidElement,
  useContext,
  useId,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type ReactNode,
} from 'react'
import { useControllableState } from '../hooks/useControllableState.ts'

type TabsContextValue = {
  value: string
  setValue: (value: string) => void
  baseId: string
}

const TabsContext = createContext<TabsContextValue | null>(null)

const useTabsContext = () => {
  const context = useContext(TabsContext)

  if (!context) {
    throw new Error('Tabs components must be used within Tabs.')
  }

  return context
}

type TabsRootProps = {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  children: ReactNode
}

type TriggerProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  value: string
}

type PanelProps = HTMLAttributes<HTMLDivElement> & {
  value: string
}

const TabsRoot = ({
  value,
  defaultValue,
  onValueChange,
  children,
}: TabsRootProps) => {
  const baseId = useId()
  const [currentValue, setCurrentValue] = useControllableState({
    value,
    defaultValue: defaultValue ?? '',
    onChange: onValueChange,
  })

  return (
    <TabsContext.Provider
      value={{ value: currentValue, setValue: setCurrentValue, baseId }}
    >
      <div className="tabs">{children}</div>
    </TabsContext.Provider>
  )
}

const TabsList = ({
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) => {
  const { setValue } = useTabsContext()

  return (
    <div className="tabs-list" role="tablist" {...props}>
      {Children.map(children, (child) => {
        if (!isValidElement<TriggerProps>(child)) {
          return child
        }

        return cloneElement(child, {
          onKeyDown: (event) => {
            child.props.onKeyDown?.(event)

            const triggers = Array.from(
              event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>(
                '[role="tab"]',
              ) ?? [],
            )
            const currentIndex = triggers.indexOf(event.currentTarget)

            const moveFocus = (nextIndex: number) => {
              const trigger = triggers[(nextIndex + triggers.length) % triggers.length]
              trigger?.focus()
              trigger?.click()
            }

            if (event.key === 'ArrowRight') {
              event.preventDefault()
              moveFocus(currentIndex + 1)
            }

            if (event.key === 'ArrowLeft') {
              event.preventDefault()
              moveFocus(currentIndex - 1)
            }

            if (event.key === 'Home') {
              event.preventDefault()
              moveFocus(0)
            }

            if (event.key === 'End') {
              event.preventDefault()
              moveFocus(triggers.length - 1)
            }
          },
          onClick: () => setValue(child.props.value),
        })
      })}
    </div>
  )
}

const TabsTrigger = ({
  children,
  value,
  ...props
}: TriggerProps) => {
  const context = useTabsContext()
  const selected = context.value === value

  return (
    <button
      type="button"
      role="tab"
      className="tab-trigger"
      data-state={selected ? 'active' : 'inactive'}
      aria-selected={selected}
      aria-controls={`${context.baseId}-${value}-panel`}
      id={`${context.baseId}-${value}-tab`}
      tabIndex={selected ? 0 : -1}
      {...props}
    >
      {children}
    </button>
  )
}

const TabsPanel = ({ children, value, ...props }: PanelProps) => {
  const context = useTabsContext()
  const selected = context.value === value

  return (
    <div
      role="tabpanel"
      className="tab-panel"
      hidden={!selected}
      id={`${context.baseId}-${value}-panel`}
      aria-labelledby={`${context.baseId}-${value}-tab`}
      {...props}
    >
      {selected ? children : null}
    </div>
  )
}

export const Tabs = Object.assign(TabsRoot, {
  List: TabsList,
  Trigger: TabsTrigger,
  Panel: TabsPanel,
})
