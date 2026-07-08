import { OverlayToaster, Position } from '@blueprintjs/core'
import type { AgentResult } from './types'

// A single shared toaster instance, lazily created on first use (Blueprint
// mounts it into a portal on the document body).
const toasterPromise = OverlayToaster.createAsync({ position: Position.TOP, maxToasts: 4 })

/** Show a toast notification that mirrors an AgentResult's success/fail status. */
export async function showResultToast(result: AgentResult) {
  const toaster = await toasterPromise

  const message = result.error ? `${result.summary}: ${result.error}` : result.summary

  toaster.show({
    message,
    intent: result.status === 'success' ? 'success' : result.status === 'error' ? 'danger' : 'primary',
    icon: result.status === 'success' ? 'tick-circle' : result.status === 'error' ? 'error' : 'info-sign',
    timeout: result.status === 'error' ? 6000 : 3500,
    onDismiss: () => null,
  })
}
