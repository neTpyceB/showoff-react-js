import { formatCurrency } from '../finance/selectors.ts'

type SummaryCardsProps = {
  summary: {
    balance: number
    income: number
    expenses: number
    savingsRate: number
  }
}

export const SummaryCards = ({ summary }: SummaryCardsProps) => {
  const cards = [
    {
      label: 'Net balance',
      value: formatCurrency(summary.balance),
      tone: summary.balance >= 0 ? 'positive' : 'negative',
    },
    {
      label: 'Income',
      value: formatCurrency(summary.income),
      tone: 'positive',
    },
    {
      label: 'Expenses',
      value: formatCurrency(summary.expenses),
      tone: 'negative',
    },
    {
      label: 'Savings rate',
      value: `${Math.round(summary.savingsRate)}%`,
      tone: 'neutral',
    },
  ] as const

  return (
    <section className="summary-grid" aria-label="Summary cards">
      {cards.map((card) => (
        <article key={card.label} className="summary-card card-shell" data-tone={card.tone}>
          <span>{card.label}</span>
          <strong>{card.value}</strong>
        </article>
      ))}
    </section>
  )
}
