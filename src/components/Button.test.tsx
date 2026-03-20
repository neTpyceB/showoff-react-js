import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Button } from './Button.tsx'

describe('Button', () => {
  it('renders a busy state accessibly', () => {
    render(<Button busy>Saving</Button>)

    expect(screen.getByRole('button', { name: /savingprocessing/i })).toBeDisabled()
  })
})
