# 9. Curated Style Swatches for Vibe Intake

The Vibe Intake onboarding phase utilizes a closed library of 24 curated, copyright-cleared Style Swatches rather than requiring custom user photo uploads for initial Style DNA extraction.

## Context

Handling arbitrary user image uploads introduces security overhead (metadata stripping, virus scanning, SSRF/injection risks), image storage costs, privacy concerns (uploading photos of family members or children), and upload latency on mobile networks. In a constrained 7-day build, failure in the photo upload pipeline threatens the primary onboarding journey.

## Decision

1. **Curated Library**: The application provides a curated gallery of 24 aesthetic visual swatches spanning diverse regional and modern celebration styles, palettes, and decor densities.
2. **Deterministic Extraction**: The organizer selects 6 to 8 swatches, enters their Protected Moment, and completes three forced-choice pairs.
3. **P2 Deferral**: Custom photo uploads to Supabase Storage and generative AI moodboard generation are designated as non-blocking P2 enhancements, tackled only after the core budget and timeline engines pass end-to-end evaluation.

## Consequences

- Guarantees instant onboarding with zero upload latency or failed multipart uploads.
- Eliminates privacy and data-use compliance risks regarding user-uploaded photos.
- Provides a stable, reproducible fixture set for Style Analyst evaluation.
