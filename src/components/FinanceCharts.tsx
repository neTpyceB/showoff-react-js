import { formatCurrency } from '../finance/selectors.ts'

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

type FinanceChartsProps = {
  expenseBreakdown: BreakdownItem[]
  monthlyTrend: TrendPoint[]
}

const donutSegments = (items: BreakdownItem[]) => {
  let offset = 0

  return items.map((item) => {
    const dash = item.share * 282.6
    const segment = {
      ...item,
      dash,
      offset,
    }
    offset += dash
    return segment
  })
}

export const FinanceCharts = ({
  expenseBreakdown,
  monthlyTrend,
}: FinanceChartsProps) => {
  const hasBreakdown = expenseBreakdown.length > 0
  const maxValue = Math.max(
    1,
    ...monthlyTrend.flatMap((point) => [point.income, point.expenses]),
  )

  return (
    <div className="charts-grid">
      <section className="card-shell" aria-labelledby="spend-breakdown-heading">
        <div className="section-heading compact">
          <div>
            <p className="eyebrow">Chart</p>
            <h2 id="spend-breakdown-heading">Expense breakdown</h2>
          </div>
        </div>
        {hasBreakdown ? (
          <div className="chart-stack">
            <svg
              className="donut-chart"
              viewBox="0 0 120 120"
              role="img"
              aria-label="Expense breakdown by category"
            >
              <circle cx="60" cy="60" r="45" fill="none" stroke="#e8edf5" strokeWidth="12" />
              {donutSegments(expenseBreakdown).map((item) => (
                <circle
                  key={item.categoryId}
                  cx="60"
                  cy="60"
                  r="45"
                  fill="none"
                  stroke={item.color}
                  strokeWidth="12"
                  strokeDasharray={`${item.dash} 282.6`}
                  strokeDashoffset={-item.offset}
                  transform="rotate(-90 60 60)"
                />
              ))}
            </svg>
            <ul className="legend-list" aria-label="Expense breakdown legend">
              {expenseBreakdown.map((item) => (
                <li key={item.categoryId}>
                  <span className="legend-label">
                    <span
                      className="legend-dot"
                      style={{ backgroundColor: item.color }}
                      aria-hidden="true"
                    />
                    {item.label}
                  </span>
                  <span>{formatCurrency(item.amount)}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="empty-state">No expense data matches the current filters.</p>
        )}
      </section>

      <section className="card-shell" aria-labelledby="trend-heading">
        <div className="section-heading compact">
          <div>
            <p className="eyebrow">Chart</p>
            <h2 id="trend-heading">Six-month trend</h2>
          </div>
        </div>
        <div className="bar-chart" role="img" aria-label="Income and expenses over the last six months">
          {monthlyTrend.map((point) => (
            <div key={point.label} className="bar-column">
              <div className="bar-track">
                <span
                  className="bar income"
                  style={{ height: `${(point.income / maxValue) * 100}%` }}
                />
                <span
                  className="bar expense"
                  style={{ height: `${(point.expenses / maxValue) * 100}%` }}
                />
              </div>
              <strong>{point.label}</strong>
              <span>{formatCurrency(point.net)}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
