import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { boardStatuses, priorityValues, type User } from '../kanban/model.ts'
import { Button } from './Button.tsx'

const taskComposerSchema = z.object({
  title: z.string().min(3, 'Enter at least 3 characters.'),
  description: z.string().min(10, 'Enter at least 10 characters.'),
  assigneeId: z.string().min(1, 'Select an assignee.'),
  priority: z.enum(priorityValues),
  status: z.enum(boardStatuses),
})

export type TaskComposerValues = z.infer<typeof taskComposerSchema>

type TaskComposerProps = {
  users: User[]
  disabled: boolean
  onSubmit: (values: TaskComposerValues) => Promise<void>
}

export const TaskComposer = ({
  users,
  disabled,
  onSubmit,
}: TaskComposerProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<TaskComposerValues>({
    resolver: zodResolver(taskComposerSchema),
    defaultValues: {
      title: '',
      description: '',
      assigneeId: users[0]?.id ?? '',
      priority: 'medium',
      status: 'todo',
    },
  })

  return (
    <form
      className="composer-card"
      onSubmit={handleSubmit(async (values) => {
        await onSubmit(values)
        reset({
          title: '',
          description: '',
          assigneeId: users[0]?.id ?? '',
          priority: 'medium',
          status: 'todo',
        })
      })}
    >
      <div className="section-heading compact">
        <div>
          <p className="eyebrow">Task composer</p>
          <h2>Create a new task</h2>
        </div>
      </div>

      <div className="field">
        <label htmlFor="title">Task title</label>
        <input id="title" {...register('title')} disabled={disabled} />
        {errors.title ? <p className="field-error">{errors.title.message}</p> : null}
      </div>

      <div className="field">
        <label htmlFor="description">Task description</label>
        <textarea id="description" {...register('description')} disabled={disabled} />
        {errors.description ? (
          <p className="field-error">{errors.description.message}</p>
        ) : null}
      </div>

      <div className="field-grid">
        <div className="field">
          <label htmlFor="assigneeId">Assignee</label>
          <select id="assigneeId" {...register('assigneeId')} disabled={disabled}>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="priority">Priority</label>
          <select id="priority" {...register('priority')} disabled={disabled}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
      </div>

      <div className="field">
        <label htmlFor="status">Initial column</label>
        <select id="status" {...register('status')} disabled={disabled}>
          <option value="backlog">Backlog</option>
          <option value="todo">Todo</option>
          <option value="in-progress">In progress</option>
          <option value="done">Done</option>
        </select>
      </div>

      <div className="form-actions">
        <p className="form-note">
          {disabled
            ? 'Viewer role: task creation is locked.'
            : 'Tasks are synced through the cached API layer.'}
        </p>
        <Button type="submit" busy={isSubmitting} disabled={disabled}>
          Create task
        </Button>
      </div>
    </form>
  )
}
