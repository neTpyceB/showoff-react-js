import { z } from 'zod'

export const transactionKinds = ['income', 'expense'] as const
export type TransactionKind = (typeof transactionKinds)[number]

export const categories = [
  { id: 'salary', label: 'Salary', kind: 'income', color: '#2563eb' },
  { id: 'freelance', label: 'Freelance', kind: 'income', color: '#0f766e' },
  { id: 'investments', label: 'Investments', kind: 'income', color: '#7c3aed' },
  { id: 'housing', label: 'Housing', kind: 'expense', color: '#c2410c' },
  { id: 'food', label: 'Food', kind: 'expense', color: '#ea580c' },
  { id: 'transport', label: 'Transport', kind: 'expense', color: '#0891b2' },
  { id: 'health', label: 'Health', kind: 'expense', color: '#dc2626' },
  { id: 'utilities', label: 'Utilities', kind: 'expense', color: '#9333ea' },
  { id: 'leisure', label: 'Leisure', kind: 'expense', color: '#db2777' },
] as const

export type Category = (typeof categories)[number]
export type CategoryId = Category['id']

export const categoryById = Object.fromEntries(
  categories.map((category) => [category.id, category]),
) as Record<CategoryId, Category>

const transactionSchemaBase = z.object({
  id: z.string().min(1),
  title: z.string().min(2),
  amount: z.number().positive(),
  kind: z.enum(transactionKinds),
  categoryId: z.string().min(1),
  date: z.iso.date(),
  note: z.string().max(160).default(''),
})

export const transactionSchema = transactionSchemaBase.superRefine(
  (transaction, context) => {
    const category = categories.find((item) => item.id === transaction.categoryId)

    if (!category || category.kind !== transaction.kind) {
      context.addIssue({
        code: 'custom',
        message: 'Category must match the transaction kind.',
        path: ['categoryId'],
      })
    }
  },
)

export type Transaction = z.infer<typeof transactionSchema>

export const filterPeriodValues = ['all', 'month', '30d'] as const
export type FilterPeriod = (typeof filterPeriodValues)[number]

export const filtersSchema = z.object({
  query: z.string().default(''),
  kind: z.enum(['all', ...transactionKinds]).default('all'),
  categoryId: z.string().default('all'),
  period: z.enum(filterPeriodValues).default('all'),
})

export type Filters = z.infer<typeof filtersSchema>

export const defaultFilters: Filters = {
  query: '',
  kind: 'all',
  categoryId: 'all',
  period: 'all',
}

export const financeStateSchema = z.object({
  transactions: z.array(transactionSchema),
  filters: filtersSchema,
  nextId: z.number().int().positive(),
})

export type FinanceState = z.infer<typeof financeStateSchema>

const seedTransactions: Transaction[] = [
  {
    id: 'txn-1',
    title: 'March salary',
    amount: 5400,
    kind: 'income',
    categoryId: 'salary',
    date: '2026-03-01',
    note: 'Monthly base compensation.',
  },
  {
    id: 'txn-2',
    title: 'Rent payment',
    amount: 1680,
    kind: 'expense',
    categoryId: 'housing',
    date: '2026-03-03',
    note: 'Primary residence.',
  },
  {
    id: 'txn-3',
    title: 'Client workshop',
    amount: 1800,
    kind: 'income',
    categoryId: 'freelance',
    date: '2026-02-20',
    note: 'Two-day design sprint facilitation.',
  },
  {
    id: 'txn-4',
    title: 'Groceries',
    amount: 210,
    kind: 'expense',
    categoryId: 'food',
    date: '2026-03-08',
    note: 'Weekly household restock.',
  },
  {
    id: 'txn-5',
    title: 'Brokerage dividend',
    amount: 320,
    kind: 'income',
    categoryId: 'investments',
    date: '2026-01-18',
    note: 'Quarterly dividend distribution.',
  },
  {
    id: 'txn-6',
    title: 'Metro pass',
    amount: 94,
    kind: 'expense',
    categoryId: 'transport',
    date: '2026-02-02',
    note: 'Commuter transit renewal.',
  },
  {
    id: 'txn-7',
    title: 'Electricity bill',
    amount: 132,
    kind: 'expense',
    categoryId: 'utilities',
    date: '2026-01-25',
    note: 'Monthly provider invoice.',
  },
  {
    id: 'txn-8',
    title: 'Team dinner',
    amount: 148,
    kind: 'expense',
    categoryId: 'leisure',
    date: '2026-02-28',
    note: 'Project milestone celebration.',
  },
  {
    id: 'txn-9',
    title: 'Dental check-up',
    amount: 86,
    kind: 'expense',
    categoryId: 'health',
    date: '2026-03-12',
    note: 'Routine preventive appointment.',
  },
]

export const createInitialState = (): FinanceState => ({
  transactions: seedTransactions,
  filters: defaultFilters,
  nextId: seedTransactions.length + 1,
})

export const storageKey = 'showoff.finance-tracker.v1'
