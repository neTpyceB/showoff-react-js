import {
  categoryById,
  type FilterPeriod,
  type Filters,
  type FinanceState,
  type Transaction,
} from './model.ts'

type Summary = {
  balance: number
  income: number
  expenses: number
  savingsRate: number
}

type BreakdownItem = {
  categoryId: string
  label: string
  amount: number
  color: string
  share: number
}

type TrendPoint = {
  label: string
  income: number
  expenses: number
  net: number
}

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export const formatCurrency = (value: number) => currencyFormatter.format(value)

const isWithinPeriod = (date: string, period: FilterPeriod) => {
  if (period === 'all') {
    return true
  }

  const transactionDate = new Date(`${date}T00:00:00`)
  const today = new Date('2026-03-20T12:00:00')

  if (period === 'month') {
    return (
      transactionDate.getFullYear() === today.getFullYear() &&
      transactionDate.getMonth() === today.getMonth()
    )
  }

  const threshold = new Date(today)
  threshold.setDate(today.getDate() - 30)
  return transactionDate >= threshold
}

export const filterTransactions = (
  transactions: Transaction[],
  filters: Filters,
) => {
  const query = filters.query.trim().toLowerCase()

  return transactions.filter((transaction) => {
    const matchesQuery =
      query.length === 0 ||
      `${transaction.title} ${transaction.note}`.toLowerCase().includes(query)
    const matchesKind =
      filters.kind === 'all' || transaction.kind === filters.kind
    const matchesCategory =
      filters.categoryId === 'all' || transaction.categoryId === filters.categoryId
    const matchesPeriod = isWithinPeriod(transaction.date, filters.period)

    return matchesQuery && matchesKind && matchesCategory && matchesPeriod
  })
}

export const selectSummary = (transactions: Transaction[]): Summary => {
  const income = transactions
    .filter((transaction) => transaction.kind === 'income')
    .reduce((sum, transaction) => sum + transaction.amount, 0)
  const expenses = transactions
    .filter((transaction) => transaction.kind === 'expense')
    .reduce((sum, transaction) => sum + transaction.amount, 0)
  const balance = income - expenses
  const savingsRate = income === 0 ? 0 : Math.max(0, balance / income) * 100

  return { balance, income, expenses, savingsRate }
}

export const selectExpenseBreakdown = (
  transactions: Transaction[],
): BreakdownItem[] => {
  const expenseTransactions = transactions.filter(
    (transaction) => transaction.kind === 'expense',
  )
  const total = expenseTransactions.reduce(
    (sum, transaction) => sum + transaction.amount,
    0,
  )

  const groups = expenseTransactions.reduce<Record<string, number>>(
    (memo, transaction) => {
      memo[transaction.categoryId] = (memo[transaction.categoryId] ?? 0) + transaction.amount
      return memo
    },
    {},
  )

  return Object.entries(groups)
    .map(([categoryId, amount]) => ({
      categoryId,
      label: categoryById[categoryId as keyof typeof categoryById].label,
      amount,
      color: categoryById[categoryId as keyof typeof categoryById].color,
      share: total === 0 ? 0 : amount / total,
    }))
    .sort((left, right) => right.amount - left.amount)
}

export const selectMonthlyTrend = (transactions: Transaction[]): TrendPoint[] => {
  const anchor = new Date('2026-03-01T12:00:00')

  return Array.from({ length: 6 }, (_, index) => {
    const current = new Date(anchor)
    current.setMonth(anchor.getMonth() - (5 - index))

    const monthTransactions = transactions.filter((transaction) => {
      const date = new Date(`${transaction.date}T00:00:00`)
      return (
        date.getFullYear() === current.getFullYear() &&
        date.getMonth() === current.getMonth()
      )
    })

    const income = monthTransactions
      .filter((transaction) => transaction.kind === 'income')
      .reduce((sum, transaction) => sum + transaction.amount, 0)
    const expenses = monthTransactions
      .filter((transaction) => transaction.kind === 'expense')
      .reduce((sum, transaction) => sum + transaction.amount, 0)

    return {
      label: current.toLocaleString('en-US', { month: 'short' }),
      income,
      expenses,
      net: income - expenses,
    }
  })
}

export const selectInsights = (
  state: FinanceState,
  deferredQuery = state.filters.query,
) => {
  const visibleTransactions = filterTransactions(state.transactions, {
    ...state.filters,
    query: deferredQuery,
  })

  return {
    visibleTransactions,
    summary: selectSummary(visibleTransactions),
    expenseBreakdown: selectExpenseBreakdown(visibleTransactions),
    monthlyTrend: selectMonthlyTrend(visibleTransactions),
  }
}
