import { useState } from 'react'
import { Button } from './components/Button.tsx'
import { ContactForm, type DemoFormValues } from './components/ContactForm.tsx'
import { Dropdown } from './components/Dropdown.tsx'
import { Modal } from './components/Modal.tsx'
import { Tabs } from './components/Tabs.tsx'
import { useToast } from './components/ToastProvider.tsx'

type Activity = {
  id: string
  title: string
  detail: string
  time: string
}

const tabItems = [
  {
    value: 'tokens',
    label: 'Design tokens',
    body: 'Semantic color and spacing tokens keep the components cohesive while staying easy to theme.',
  },
  {
    value: 'patterns',
    label: 'Composition',
    body: 'Compound APIs for tabs and provider-driven toasts demonstrate scalable React patterns with low ceremony.',
  },
  {
    value: 'accessibility',
    label: 'Accessibility',
    body: 'Focus management, ARIA semantics, keyboard navigation, and browser-level validation are built into the baseline.',
  },
]

const initialActivity: Activity[] = [
  {
    id: 'boot',
    title: 'Playground ready',
    detail: 'Interactive controls, event logging, and test hooks are available.',
    time: 'Now',
  },
]

const timeLabel = () =>
  new Intl.DateTimeFormat('en', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date())

function App() {
  const { pushToast } = useToast()
  const [isModalOpen, setModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState(tabItems[0].value)
  const [activity, setActivity] = useState(initialActivity)

  const recordActivity = (title: string, detail: string) => {
    setActivity((current) => [
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        title,
        detail,
        time: timeLabel(),
      },
      ...current,
    ].slice(0, 7))
  }

  const notify = (title: string, description: string) => {
    pushToast({ title, description })
    recordActivity(title, description)
  }

  const handleFormSubmit = (values: DemoFormValues) => {
    notify(
      'Form submitted',
      `${values.name} requested the ${values.plan} workflow for ${values.company}.`,
    )
  }

  return (
    <main className="app-shell">
      <section className="hero-panel panel">
        <div className="hero-copy">
          <p className="eyebrow">React.js showcase</p>
          <h1>Component Playground</h1>
          <p className="hero-text">
            A production-style demo surface for reusable UI patterns, interaction
            design, and accessibility-first behavior.
          </p>
        </div>
        <div className="hero-actions">
          <Button onClick={() => setModalOpen(true)}>Open modal</Button>
          <Button
            variant="secondary"
            onClick={() =>
              notify(
                'Toast fired',
                'Provider-backed notifications are rendered in a live region.',
              )
            }
          >
            Show toast
          </Button>
          <Button
            variant="ghost"
            onClick={() =>
              notify(
                'Event captured',
                'State transitions are mirrored into the activity feed.',
              )
            }
          >
            Log event
          </Button>
        </div>
      </section>

      <section className="content-grid">
        <article className="panel panel-dropdown">
          <div className="section-heading">
            <p className="eyebrow">Buttons</p>
            <h2>Variants, sizes, and busy states</h2>
          </div>
          <div className="button-demo" aria-label="Button demo">
            <Button onClick={() => notify('Primary click', 'Primary action dispatched.')}>
              Primary action
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => notify('Secondary click', 'Secondary action dispatched.')}
            >
              Secondary
            </Button>
            <Button
              variant="ghost"
              onClick={() => notify('Ghost click', 'Ghost action dispatched.')}
            >
              Ghost
            </Button>
            <Button busy aria-label="Busy button">
              Saving
            </Button>
          </div>
        </article>

        <article className="panel">
          <div className="section-heading">
            <p className="eyebrow">Tabs</p>
            <h2>Controlled composition</h2>
          </div>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <Tabs.List aria-label="UI kit sections">
              {tabItems.map((item) => (
                <Tabs.Trigger key={item.value} value={item.value}>
                  {item.label}
                </Tabs.Trigger>
              ))}
            </Tabs.List>
            {tabItems.map((item) => (
              <Tabs.Panel key={item.value} value={item.value}>
                <p>{item.body}</p>
              </Tabs.Panel>
            ))}
          </Tabs>
        </article>

        <article className="panel">
          <div className="section-heading">
            <p className="eyebrow">Dropdown + Toasts</p>
            <h2>Event-driven interactions</h2>
          </div>
          <div className="action-row">
            <Dropdown
              label="Quick actions"
              items={[
                {
                  id: 'duplicate',
                  label: 'Duplicate pattern',
                  description: 'Capture a reusable composition event.',
                  onSelect: () =>
                    notify(
                      'Pattern duplicated',
                      'The selected UI pattern was copied into the working set.',
                    ),
                },
                {
                  id: 'publish',
                  label: 'Publish preview',
                  description: 'Signal a release-style workflow.',
                  onSelect: () =>
                    notify(
                      'Preview published',
                      'A deploy-like action can be composed behind the menu.',
                    ),
                },
              ]}
            />
            <Button
              variant="secondary"
              onClick={() =>
                notify(
                  'Manual notification',
                  'Toasts can be triggered from any feature surface through context.',
                )
              }
            >
              Queue toast
            </Button>
          </div>
        </article>

        <article className="panel panel-form">
          <div className="section-heading">
            <p className="eyebrow">Form</p>
            <h2>Validation and submit flow</h2>
          </div>
          <ContactForm onSubmit={handleFormSubmit} />
        </article>

        <section className="panel activity-panel" aria-labelledby="activity-heading">
          <div className="section-heading">
            <p className="eyebrow">Activity</p>
            <h2 id="activity-heading">State and event feed</h2>
          </div>
          <ol className="activity-list" aria-label="Activity feed">
            {activity.map((entry) => (
              <li key={entry.id} className="activity-item">
                <div className="activity-meta">
                  <strong>{entry.title}</strong>
                  <span>{entry.time}</span>
                </div>
                <p>{entry.detail}</p>
              </li>
            ))}
          </ol>
        </section>
      </section>

      <Modal
        open={isModalOpen}
        onOpenChange={setModalOpen}
        title="Ship-ready modal"
        description="The dialog traps focus, closes on escape, and restores the trigger context."
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button
              data-autofocus
              onClick={() => {
                setModalOpen(false)
                notify('Modal confirmed', 'Dialog actions can trigger downstream flows.')
              }}
            >
              Confirm
            </Button>
          </>
        }
      >
        <p>
          This modal intentionally stays lightweight while covering the behaviors
          teams expect in production: focus management, escape dismissal, overlay
          dismissal, and composable actions.
        </p>
      </Modal>
    </main>
  )
}

export default App
