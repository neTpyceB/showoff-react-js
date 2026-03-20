import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

type DropdownItem = {
  id: string
  label: string
  description: string
  onSelect: () => void
}

type DropdownProps = {
  label: string
  items: DropdownItem[]
}

export const Dropdown = ({ label, items }: DropdownProps) => {
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const [menuPosition, setMenuPosition] = useState({
    top: 0,
    left: 0,
    width: 280,
  })
  const menuId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) {
      return
    }

    const syncPosition = () => {
      const rect = triggerRef.current?.getBoundingClientRect()

      if (!rect) {
        return
      }

      setMenuPosition({
        top: rect.bottom + 10,
        left: rect.left,
        width: Math.max(rect.width, 280),
      })
    }

    syncPosition()

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node

      if (
        !rootRef.current?.contains(target) &&
        !menuRef.current?.contains(target)
      ) {
        setOpen(false)
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    window.addEventListener('resize', syncPosition)
    window.addEventListener('scroll', syncPosition, true)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
      window.removeEventListener('resize', syncPosition)
      window.removeEventListener('scroll', syncPosition, true)
    }
  }, [open])

  useEffect(() => {
    if (!open) {
      return
    }

    rootRef.current
      ?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]')
      ?.item(activeIndex)
      ?.focus()
  }, [activeIndex, open])

  return (
    <div className="dropdown" ref={rootRef}>
      <button
        ref={triggerRef}
        type="button"
        className="dropdown-trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((current) => !current)}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown') {
            event.preventDefault()
            setOpen(true)
            setActiveIndex(0)
          }
        }}
      >
        {label}
      </button>
      {open
        ? createPortal(
            <div
              ref={menuRef}
              id={menuId}
              className="dropdown-menu"
              role="menu"
              aria-label={label}
              style={{
                top: `${menuPosition.top}px`,
                left: `${menuPosition.left}px`,
                width: `${menuPosition.width}px`,
              }}
            >
              {items.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  role="menuitem"
                  className="dropdown-item"
                  data-active={index === activeIndex}
                  onFocus={() => setActiveIndex(index)}
                  onClick={() => {
                    item.onSelect()
                    setOpen(false)
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'ArrowDown') {
                      event.preventDefault()
                      setActiveIndex((index + 1) % items.length)
                    }

                    if (event.key === 'ArrowUp') {
                      event.preventDefault()
                      setActiveIndex((index + items.length - 1) % items.length)
                    }
                  }}
                >
                  <span className="dropdown-item-label">{item.label}</span>
                  <span className="dropdown-item-description">{item.description}</span>
                </button>
              ))}
            </div>,
            document.body,
          )
        : null}
    </div>
  )
}
