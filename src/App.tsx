import { startTransition, useDeferredValue } from 'react'
import { FilterBar } from './components/FilterBar.tsx'
import { FinanceCharts } from './components/FinanceCharts.tsx'
import { SummaryCards } from './components/SummaryCards.tsx'
import { TransactionForm, type TransactionFormValues } from './components/TransactionForm.tsx'
import { TransactionTable } from './components/TransactionTable.tsx'
import { Button } from './components/Button.tsx'
import { useToast } from './components/ToastProvider.tsx'
import { createInitialState, financeStateSchema, storageKey } from './finance/model.ts'
import { financeReducer } from './finance/reducer.ts'
import { formatCurrency, selectInsights } from './finance/selectors.ts'
import { usePersistentReducer } from './hooks/usePersistentReducer.ts'

function App() {
  const { pushToast } = useToast()
  const [state, dispatch] = usePersistentReducer({
    reducer: financeReducer,
    initialState: createInitialState(),
    storageKey,
    schema: financeStateSchema,
  })
  const deferredQuery = useDeferredValue(state.filters.query)
  const { visibleTransactions, summary, expenseBreakdown, monthlyTrend } =
    selectInsights(state, deferredQuery)

  const handleSubmit = (values: TransactionFormValues) => {
    startTransition(() => {
      dispatch({ type: 'addTransaction', payload: values })
    })

    pushToast({
      title: 'Transaction saved',
      description: `${values.title} was added to the ledger.`,
      tone: values.kind === 'income' ? 'success' : 'neutral',
    })
  }

  return (
    <main className="app-shell finance-shell">
      <section className="hero-card">
        <div className="hero-copy">
          <p className="eyebrow">Financial operations</p>
          <h1>Personal Finance Tracker</h1>
          <p className="hero-text">
            Reducer-driven transaction tracking with local persistence, derived
            analytics, schema validation, filters, and browser-tested workflows.
          </p>
        </div>
        <div className="hero-actions">
          <div className="hero-balance">
            <span>Current balance</span>
            <strong>{formatCurrency(summary.balance)}</strong>
          </div>
          <Button
            variant="secondary"
            onClick={() => {
              startTransition(() => {
                dispatch({ type: 'resetDemo' })
              })
              pushToast({
                title: 'Demo data restored',
                description: 'The dashboard has been reset to the seeded portfolio.',
              })
            }}
          >
            Restore demo data
          </Button>
        </div>
      </section>

      <SummaryCards summary={summary} />

      <section className="workspace-grid">
        <TransactionForm onSubmit={handleSubmit} />

        <div className="side-stack">
          <FilterBar
            filters={state.filters}
            onChange={(nextFilters) => {
              startTransition(() => {
                dispatch({ type: 'setFilters', payload: nextFilters })
              })
            }}
            onReset={() => {
              startTransition(() => {
                dispatch({ type: 'resetFilters' })
              })
            }}
          />
          <FinanceCharts
            expenseBreakdown={expenseBreakdown}
            monthlyTrend={monthlyTrend}
          />
        </div>
      </section>

      <TransactionTable
        transactions={visibleTransactions}
        onDelete={(id) => {
          const transaction = state.transactions.find((item) => item.id === id)

          startTransition(() => {
            dispatch({ type: 'deleteTransaction', payload: { id } })
          })

          if (transaction) {
            pushToast({
              title: 'Transaction removed',
              description: `${transaction.title} was removed from the ledger.`,
            })
          }
        }}
      />
    </main>
  )
}

export default App
