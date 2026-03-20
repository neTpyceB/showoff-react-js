import { useEffect, useId, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Button } from './Button.tsx'

type ModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  children: ReactNode
  footer?: ReactNode
}

const focusableSelector =
  '[data-autofocus], button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

export const Modal = ({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
}: ModalProps) => {
  const titleId = useId()
  const descriptionId = useId()
  const dialogRef = useRef<HTMLDivElement>(null)
  const previousFocus = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!open) {
      return
    }

    previousFocus.current = document.activeElement as HTMLElement | null
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onOpenChange(false)
      }
    }

    document.addEventListener('keydown', closeOnEscape)

    const target =
      dialogRef.current?.querySelector<HTMLElement>(focusableSelector) ??
      dialogRef.current
    target?.focus()

    return () => {
      document.body.style.overflow = originalOverflow
      document.removeEventListener('keydown', closeOnEscape)
      previousFocus.current?.focus()
    }
  }, [open, onOpenChange])

  if (!open) {
    return null
  }

  return createPortal(
    <div
      className="modal-scrim"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onOpenChange(false)
        }
      }}
    >
      <div
        ref={dialogRef}
        className="modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        tabIndex={-1}
      >
        <header className="modal-header">
          <div>
            <p className="eyebrow">Modal</p>
            <h2 id={titleId}>{title}</h2>
            <p id={descriptionId} className="hero-text">
              {description}
            </p>
          </div>
          <Button
            variant="ghost"
            aria-label="Close modal"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </header>
        <div className="modal-body">{children}</div>
        {footer ? <footer className="modal-footer">{footer}</footer> : null}
      </div>
    </div>,
    document.body,
  )
}
