import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'
import { categories, categoryById, type TransactionKind } from '../finance/model.ts'
import { Button } from './Button.tsx'

const transactionFormSchema = z
  .object({
    title: z.string().min(2, 'Enter at least 2 characters.'),
    amount: z.number().positive('Amount must be greater than zero.'),
    kind: z.enum(['income', 'expense']),
    categoryId: z.string().min(1, 'Select a category.'),
    date: z.iso.date(),
    note: z.string().max(160, 'Keep the note under 160 characters.').default(''),
  })
  .superRefine((values, context) => {
    const category = categoryById[values.categoryId as keyof typeof categoryById]

    if (!category || category.kind !== values.kind) {
      context.addIssue({
        code: 'custom',
        message: 'Category must match the selected transaction kind.',
        path: ['categoryId'],
      })
    }
  })

export type TransactionFormValues = z.infer<typeof transactionFormSchema>
type TransactionFormInput = z.input<typeof transactionFormSchema>

type TransactionFormProps = {
  onSubmit: (values: TransactionFormValues) => void
}

export const TransactionForm = ({ onSubmit }: TransactionFormProps) => {
  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    resetField,
    setValue,
  } = useForm<TransactionFormInput, undefined, TransactionFormValues>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: {
      title: '',
      amount: 0,
      kind: 'expense',
      categoryId: 'food',
      date: '2026-03-20',
      note: '',
    },
  })

  const kind = useWatch({ control, name: 'kind' })
  const categoryOptions = categories.filter((category) => category.kind === kind)
  const defaultCategoryForKind = (value: TransactionKind) =>
    categories.find((category) => category.kind === value)?.id ?? 'food'

  return (
    <form
      className="form card-shell"
      onSubmit={handleSubmit(async (values) => {
        onSubmit({
          ...values,
          note: values.note.trim(),
        })
        resetField('title')
        resetField('amount', { defaultValue: 0 })
        resetField('note')
      })}
    >
      <div className="section-heading compact">
        <div>
          <p className="eyebrow">New transaction</p>
          <h2>Capture money movement</h2>
        </div>
      </div>

      <div className="field">
        <label htmlFor="title">Title</label>
        <input id="title" placeholder="Client retainer, groceries, rent..." {...register('title')} />
        {errors.title ? <p className="field-error">{errors.title.message}</p> : null}
      </div>

      <div className="field-grid">
        <div className="field">
          <label htmlFor="amount">Amount</label>
          <input
            id="amount"
            inputMode="decimal"
            {...register('amount', { valueAsNumber: true })}
          />
          {errors.amount ? <p className="field-error">{errors.amount.message}</p> : null}
        </div>
        <div className="field">
          <label htmlFor="date">Date</label>
          <input id="date" type="date" {...register('date')} />
          {errors.date ? <p className="field-error">{errors.date.message}</p> : null}
        </div>
      </div>

      <div className="field-grid">
        <div className="field">
          <label htmlFor="kind">Kind</label>
          <select
            id="kind"
            {...register('kind', {
              onChange: (event) => {
                setValue('categoryId', defaultCategoryForKind(event.target.value as TransactionKind))
              },
            })}
          >
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="categoryId">Transaction category</label>
          <select id="categoryId" {...register('categoryId')}>
            {categoryOptions.map((category) => (
              <option key={category.id} value={category.id}>
                {category.label}
              </option>
            ))}
          </select>
          {errors.categoryId ? (
            <p className="field-error">{errors.categoryId.message}</p>
          ) : null}
        </div>
      </div>

      <div className="field">
        <label htmlFor="note">Note</label>
        <textarea
          id="note"
          placeholder="Optional context for future review."
          {...register('note')}
        />
        {errors.note ? <p className="field-error">{errors.note.message}</p> : null}
      </div>

      <div className="form-actions">
        <p className="form-note">Form validation is schema-backed and reducer-safe.</p>
        <Button type="submit" busy={isSubmitting}>
          Save transaction
        </Button>
      </div>
    </form>
  )
}
