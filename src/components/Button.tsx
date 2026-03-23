/* @jsxRuntime automatic */
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { cx } from '../lib/cx.ts'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md'
  busy?: boolean
  leading?: ReactNode
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className,
      variant = 'primary',
      size = 'md',
      busy = false,
      disabled,
      leading,
      ...props
    },
    ref,
  ) => (
    <button
      ref={ref}
      type={props.type ?? 'button'}
      className={cx(
        'button',
        `button-${variant}`,
        `button-${size}`,
        className,
      )}
      disabled={disabled || busy}
      {...props}
    >
      {busy ? <span className="button-spinner" aria-hidden="true" /> : leading}
      <span>{children}</span>
      {busy ? <span className="sr-only">Processing</span> : null}
    </button>
  ),
)

Button.displayName = 'Button'
