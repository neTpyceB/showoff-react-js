import { describe, expect, it } from 'vitest'
import { createInitialState } from './model.ts'
import {
  filterTransactions,
  selectExpenseBreakdown,
  selectInsights,
  selectSummary,
} from './selectors.ts'

describe('finance selectors', () => {
  it('derives summary totals for the visible dataset', () => {
    const transactions = createInitialState().transactions
    const summary = selectSummary(transactions)

    expect(summary.income).toBe(7520)
    expect(summary.expenses).toBe(2350)
    expect(summary.balance).toBe(5170)
  })

  it('filters by query and period', () => {
    const transactions = createInitialState().transactions
    const filtered = filterTransactions(transactions, {
      query: 'rent',
      kind: 'expense',
      categoryId: 'all',
      period: 'month',
    })

    expect(filtered).toHaveLength(1)
    expect(filtered[0]?.title).toBe('Rent payment')
  })

  it('creates category breakdown and insights', () => {
    const state = createInitialState()
    const insights = selectInsights(state, 'dental')
    const breakdown = selectExpenseBreakdown(state.transactions)

    expect(insights.visibleTransactions).toHaveLength(1)
    expect(insights.visibleTransactions[0]?.categoryId).toBe('health')
    expect(breakdown[0]?.label).toBe('Housing')
  })
})
