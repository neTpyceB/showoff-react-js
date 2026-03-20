# Engineering Rules

- Favor controlled/uncontrolled APIs for reusable interactive components.
- Keep CSS token-based and colocated at the application level until scale requires extraction.
- Default to semantic HTML before adding ARIA.
- Use provider patterns only for truly cross-cutting concerns such as toasts.
- Keep the test pyramid balanced: cheap unit checks first, browser assertions for real workflows.
