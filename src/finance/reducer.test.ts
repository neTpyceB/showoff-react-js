import { describe, expect, it } from 'vitest'
import { createInitialState } from './model.ts'
import { financeReducer } from './reducer.ts'

describe('financeReducer', () => {
  it('adds and deletes transactions deterministically', () => {
    const initialState = createInitialState()
    const addedState = financeReducer(initialState, {
      type: 'addTransaction',
      payload: {
        title: 'Gym plan',
        amount: 65,
        kind: 'expense',
        categoryId: 'health',
        date: '2026-03-15',
        note: 'Quarterly membership.',
      },
    })

    expect(addedState.transactions[0]).toMatchObject({
      id: `txn-${initialState.nextId}`,
      title: 'Gym plan',
    })

    const deletedState = financeReducer(addedState, {
      type: 'deleteTransaction',
      payload: { id: `txn-${initialState.nextId}` },
    })

    expect(
      deletedState.transactions.find(
        (transaction) => transaction.id === `txn-${initialState.nextId}`,
      ),
    ).toBeUndefined()
  })

  it('resets incompatible category filters when kind changes', () => {
    const initialState = createInitialState()
    const nextState = financeReducer(initialState, {
      type: 'setFilters',
      payload: { categoryId: 'health', kind: 'income' },
    })

    expect(nextState.filters).toMatchObject({
      kind: 'income',
      categoryId: 'all',
    })
  })
})
