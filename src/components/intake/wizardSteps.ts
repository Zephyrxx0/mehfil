export type WizardStep = 1 | 2 | 3 | 4 | 5

export const WIZARD_STEPS: readonly WizardStep[] = [1, 2, 3, 4, 5]

export const STEP_TITLES: Record<WizardStep, string> = {
  1: 'The occasion',
  2: 'Guests and budget',
  3: 'Details that matter',
  4: 'The look and feel',
  5: 'What must not be compromised',
}

/** Short names shown under the progress bars on wide screens. */
export const STEP_SHORT: Record<WizardStep, string> = {
  1: 'Occasion',
  2: 'Scale',
  3: 'Details',
  4: 'Look & feel',
  5: 'Priorities',
}
