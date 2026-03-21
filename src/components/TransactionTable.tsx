import { categories, type Transaction } from '../finance/model.ts'
import { formatCurrency } from '../finance/selectors.ts'
import { Button } from './Button.tsx'

type TransactionTableProps = {
  transactions: Transaction[]
  onDelete: (id: string) => void
}

const categoryLookup = Object.fromEntries(
  categories.map((category) => [category.id, category]),
)

export const TransactionTable = ({
  transactions,
  onDelete,
}: TransactionTableProps) => (
  <section className="card-shell table-shell" aria-labelledby="transactions-heading">
    <div className="section-heading compact">
      <div>
        <p className="eyebrow">Ledger</p>
        <h2 id="transactions-heading">Transactions</h2>
      </div>
      <span className="pill">{transactions.length} visible</span>
    </div>

    {transactions.length === 0 ? (
      <p className="empty-state">
        No transactions match the current filters. Try clearing or broadening them.
      </p>
    ) : (
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th scope="col">Title</th>
              <th scope="col">Category</th>
              <th scope="col">Date</th>
              <th scope="col">Amount</th>
              <th scope="col" className="actions-column">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((transaction) => {
              const category = categoryLookup[transaction.categoryId]

              return (
                <tr key={transaction.id}>
                  <td>
                    <div className="table-primary">
                      <strong>{transaction.title}</strong>
                      {transaction.note ? <span>{transaction.note}</span> : null}
                    </div>
                  </td>
                  <td>
                    <span className="category-pill" style={{ borderColor: category.color }}>
                      {category.label}
                    </span>
                  </td>
                  <td>{transaction.date}</td>
                  <td
                    className={transaction.kind === 'income' ? 'amount-positive' : 'amount-negative'}
                  >
                    {transaction.kind === 'income' ? '+' : '-'}
                    {formatCurrency(transaction.amount)}
                  </td>
                  <td className="actions-column">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onDelete(transaction.id)}
                      aria-label={`Delete ${transaction.title}`}
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    )}
  </section>
)
