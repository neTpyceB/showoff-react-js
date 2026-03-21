# Engineering Rules

- Keep reducer logic pure and deterministic.
- Put all cross-component derived finance calculations in selectors, not component bodies.
- Validate both user input and hydrated storage payloads with schemas.
- Prefer browser-native controls for dates, selects, and tables before layering extra abstractions.
- Keep charts lightweight unless the product scope clearly justifies a third-party dependency.
