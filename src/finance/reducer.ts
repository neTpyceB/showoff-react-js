import {
  categories,
  categoryById,
  createInitialState,
  defaultFilters,
  type Filters,
  type FinanceState,
  type Transaction,
} from './model.ts'

export type TransactionInput = Omit<Transaction, 'id'>

export type FinanceAction =
  | { type: 'addTransaction'; payload: TransactionInput }
  | { type: 'deleteTransaction'; payload: { id: string } }
  | { type: 'setFilters'; payload: Partial<Filters> }
  | { type: 'resetFilters' }
  | { type: 'resetDemo' }

const normalizeFilters = (
  currentFilters: Filters,
  nextFilters: Partial<Filters>,
): Filters => {
  const merged = { ...currentFilters, ...nextFilters }

  if (merged.kind !== 'all' && merged.categoryId !== 'all') {
    const category = categoryById[merged.categoryId as keyof typeof categoryById]

    if (!category || category.kind !== merged.kind) {
      merged.categoryId = 'all'
    }
  }

  if (
    merged.kind === 'all' &&
    merged.categoryId !== 'all' &&
    !categories.some((category) => category.id === merged.categoryId)
  ) {
    merged.categoryId = 'all'
  }

  return merged
}

export const financeReducer = (
  state: FinanceState,
  action: FinanceAction,
): FinanceState => {
  switch (action.type) {
    case 'addTransaction':
      return {
        ...state,
        nextId: state.nextId + 1,
        transactions: [
          {
            id: `txn-${state.nextId}`,
            ...action.payload,
          },
          ...state.transactions,
        ],
      }

    case 'deleteTransaction':
      return {
        ...state,
        transactions: state.transactions.filter(
          (transaction) => transaction.id !== action.payload.id,
        ),
      }

    case 'setFilters':
      return {
        ...state,
        filters: normalizeFilters(state.filters, action.payload),
      }

    case 'resetFilters':
      return {
        ...state,
        filters: defaultFilters,
      }

    case 'resetDemo':
      return createInitialState()
  }
}
