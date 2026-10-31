# 8. Closed Registry with Entity ID Binding for Generative UI

AI models are strictly prohibited from generating raw HTML, client scripts, or monetary and temporal figures. Generative UI operates over a Closed Registry where components receive only verified entity IDs and resolve figures from client engine state.

## Context

Generative UI engines often attempt to write arbitrary JSX, HTML, or raw strings containing financial numbers and deadlines. This introduces critical security risks (XSS, script injection) and arithmetic hallucinations, where a chatbot outputs a different budget total than the actual engine state.

## Decision

1. **Closed Registry**: Models may only choose from a strictly allowlisted set of React components (`VendorChecklist`, `IdeaGrid`, `QuoteReport`, `ScenarioComparison`).
2. **Entity ID Binding**: The Zod props schema for these components forbids numeric amount or date props. Components accept only entity IDs (`lineId`, `quoteId`, `ideaId`) and pull authoritative values directly from the local plan context.
3. **Structured Layout Selection**: The model selects from predefined `Layout Variant` enums and supplies editorial rationale. If the model response fails schema validation, the UI instantly falls back to standard static registry views.

## Consequences

- Total immunity against prompt-injected UI or malformed markup rendering.
- Complete mathematical synchronization: numbers displayed on screen are physically guaranteed to originate from the engine.
- Prevents UI layout jitter during live streaming.
