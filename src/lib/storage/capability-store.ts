/**
 * Keeps the organizer's edit key and the family share token in this browser (ADR-0010).
 *
 * The database stores only hashes, so it cannot show either token again. The creator's browser
 * is therefore where "copy the edit link" and "copy the family link" get their values.
 * A second device receives the edit key through the edit link and keeps it here after the
 * server confirms it.
 */

const EDIT_KEY_PREFIX = 'mehfil_editkey_'
const SHARE_TOKEN_PREFIX = 'mehfil_sharekey_'

function storage(): Storage | null {
  return typeof window !== 'undefined' && window.localStorage ? window.localStorage : null
}

export const capabilityStore = {
  getEditKey: (planId: string): string | undefined =>
    storage()?.getItem(EDIT_KEY_PREFIX + planId) ?? undefined,

  setEditKey: (planId: string, key: string): void => {
    storage()?.setItem(EDIT_KEY_PREFIX + planId, key)
  },

  clearEditKey: (planId: string): void => {
    storage()?.removeItem(EDIT_KEY_PREFIX + planId)
  },

  getShareToken: (planId: string): string | undefined =>
    storage()?.getItem(SHARE_TOKEN_PREFIX + planId) ?? undefined,

  setShareToken: (planId: string, token: string): void => {
    storage()?.setItem(SHARE_TOKEN_PREFIX + planId, token)
  },
}
