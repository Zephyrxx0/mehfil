# Self-hosted fonts

These files are served from this site, so the build and the running app never contact Google.

| Family                    | File(s)                                             | Used for                           |
| ------------------------- | --------------------------------------------------- | ---------------------------------- |
| Fraunces (variable)       | `fraunces-latin-wght-normal.woff2`                  | Headings (`font-serif`)            |
| Plus Jakarta Sans         | `plus-jakarta-sans-latin-wght-normal.woff2`         | Body text (`font-sans`)            |
| Noto Serif Devanagari     | `noto-serif-devanagari-devanagari-{400,700}-normal` | Hindi wordmark (`font-devanagari`) |
| Ewert (in `../Ewert.ttf`) | n/a                                                 | Hero wordmark                      |

Fraunces, Plus Jakarta Sans and Noto Serif Devanagari are licensed under the
[SIL Open Font License 1.1](https://openfontlicense.org), which permits redistribution with this notice:

- Copyright 2020 The Fraunces Project Authors (https://github.com/undercasetype/Fraunces)
- Copyright 2020 The Plus Jakarta Sans Project Authors (https://github.com/tokotype/PlusJakartaSans)
- Copyright 2022 The Noto Project Authors (https://github.com/notofonts/devanagari)

## Updating

The files come from the [Fontsource](https://fontsource.org) packages `@fontsource-variable/fraunces`,
`@fontsource-variable/plus-jakarta-sans` and `@fontsource/noto-serif-devanagari` (all 5.3.0). To refresh them,
install a package temporarily, copy the `latin-wght-normal` (or `devanagari-{400,700}-normal`) `.woff2` file here,
then remove the package again.

The Devanagari face holds only the Devanagari script. Latin text never uses it, so no unicode-range split is needed.
