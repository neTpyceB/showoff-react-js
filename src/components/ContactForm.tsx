import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button } from './Button.tsx'

const formSchema = z.object({
  name: z.string().min(2, 'Enter at least 2 characters.'),
  email: z.email('Enter a valid email address.'),
  company: z.string().min(2, 'Enter a company name.'),
  plan: z.enum(['Starter', 'Growth', 'Enterprise']),
  message: z.string().min(12, 'Share a bit more context.'),
})

export type DemoFormValues = z.infer<typeof formSchema>

type ContactFormProps = {
  onSubmit: (values: DemoFormValues) => void
}

export const ContactForm = ({ onSubmit }: ContactFormProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<DemoFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      company: '',
      plan: 'Growth',
      message: '',
    },
  })

  return (
    <form
      className="form"
      onSubmit={handleSubmit(async (values) => {
        onSubmit(values)
        reset()
      })}
    >
      <div className="field-grid">
        <div className="field">
          <label htmlFor="name">Name</label>
          <input id="name" autoComplete="name" {...register('name')} />
          {errors.name ? <p className="field-error">{errors.name.message}</p> : null}
        </div>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" autoComplete="email" {...register('email')} />
          {errors.email ? <p className="field-error">{errors.email.message}</p> : null}
        </div>
      </div>
      <div className="field-grid">
        <div className="field">
          <label htmlFor="company">Company</label>
          <input id="company" autoComplete="organization" {...register('company')} />
          {errors.company ? (
            <p className="field-error">{errors.company.message}</p>
          ) : null}
        </div>
        <div className="field">
          <label htmlFor="plan">Plan</label>
          <select id="plan" {...register('plan')}>
            <option value="Starter">Starter</option>
            <option value="Growth">Growth</option>
            <option value="Enterprise">Enterprise</option>
          </select>
        </div>
      </div>
      <div className="field">
        <label htmlFor="message">Project brief</label>
        <textarea
          id="message"
          placeholder="Describe the workflow, team, and the UI quality bar."
          {...register('message')}
        />
        {errors.message ? (
          <p className="field-error">{errors.message.message}</p>
        ) : null}
      </div>
      <div className="form-actions">
        <p className="form-note">Validation is schema-driven and ready for API integration.</p>
        <Button type="submit" busy={isSubmitting}>
          Send request
        </Button>
      </div>
    </form>
  )
}
