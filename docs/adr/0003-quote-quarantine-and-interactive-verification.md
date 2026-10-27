# 3. Quote Quarantine and Interactive Tier Verification

Vendor quotes (WhatsApp messages, PDF excerpts, emails) are parsed by a tool-less, prompt-quarantined Quote Analyst model into structured tiers and omission flags. Untrusted text is never allowed to directly mutate plan amounts or pass into other agents without human verification.

## Context
Vendor communications in celebration planning are unstructured, often omit statutory costs (e.g., GST, cleaning fees, power backup), and may contain adversarial prompts or confusing multi-tiered packages. Blindly executing arithmetic from unverified text destroys budget integrity and introduces prompt injection vulnerabilities.

## Decision
1. **Zero-Authority Model**: The Quote Analyst receives only raw text and category schemas; it has no database write access and cannot invoke tools.
2. **Evidence Rule**: Every parsed monetary figure must match an exact verbatim source phrase within the quote. Unanchored numbers are discarded.
3. **Interactive Tier Gate**: If multiple packages or tiers exist, the organizer reviews an interactive Quote Check card, selects the intended package, confirms flagged omissions, and reviews the plan-wide re-balance preview before committing.

## Consequences
- Protects the system against prompt injection through vendor quotes.
- Ensures organizers make informed decisions regarding hidden vendor fees before locking in contracts.
- Requires an interactive Quote Check component in the client interface.

