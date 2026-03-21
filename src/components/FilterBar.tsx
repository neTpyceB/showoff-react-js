import { categories, type Filters } from '../finance/model.ts'
import { Button } from './Button.tsx'

type FilterBarProps = {
  filters: Filters
  onChange: (nextFilters: Partial<Filters>) => void
  onReset: () => void
}

export const FilterBar = ({ filters, onChange, onReset }: FilterBarProps) => {
  const categoryOptions = categories.filter((category) => {
    if (filters.kind === 'all') {
      return true
    }

    return category.kind === filters.kind
  })

  return (
    <section className="card-shell">
      <div className="section-heading compact">
        <div>
          <p className="eyebrow">Filters</p>
          <h2>Refine the ledger</h2>
        </div>
      </div>
      <div className="field">
        <label htmlFor="query">Search</label>
        <input
          id="query"
          value={filters.query}
          placeholder="Search titles or notes"
          onChange={(event) => onChange({ query: event.target.value })}
        />
      </div>
      <div className="field-grid">
        <div className="field">
          <label htmlFor="filter-kind">Type</label>
          <select
            id="filter-kind"
            value={filters.kind}
            onChange={(event) =>
              onChange({
                kind: event.target.value as Filters['kind'],
              })
            }
          >
            <option value="all">All</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="filter-period">Period</label>
          <select
            id="filter-period"
            value={filters.period}
            onChange={(event) =>
              onChange({
                period: event.target.value as Filters['period'],
              })
            }
          >
            <option value="all">All time</option>
            <option value="month">This month</option>
            <option value="30d">Last 30 days</option>
          </select>
        </div>
      </div>
      <div className="field">
        <label htmlFor="filter-category">Filter category</label>
        <select
          id="filter-category"
          value={filters.categoryId}
          onChange={(event) => onChange({ categoryId: event.target.value })}
        >
          <option value="all">All categories</option>
          {categoryOptions.map((category) => (
            <option key={category.id} value={category.id}>
              {category.label}
            </option>
          ))}
        </select>
      </div>
      <div className="toolbar-row">
        <Button variant="ghost" onClick={onReset}>
          Clear filters
        </Button>
      </div>
    </section>
  )
}
