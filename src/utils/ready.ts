/** Runs `callback` once the DOM is interactive, or immediately if it already is. */
export function ready(callback: () => void): void {
  if (document.readyState !== 'loading') {
    callback()
    return
  }

  document.addEventListener('DOMContentLoaded', () => callback(), { once: true })
}
