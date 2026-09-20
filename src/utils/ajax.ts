import { typeCheck } from './typeCheck.js'

export interface AjaxOptions {
  url: string
  type?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  data?: Record<string, unknown> | null
  async?: boolean
  success: (xhr: XMLHttpRequest) => void
  fail?: (xhr: XMLHttpRequest) => void
}

/** Serializes a flat object to a `key=value&...` query string (functions are invoked for their value). */
export function param(data: Record<string, unknown>): string {
  const parts: string[] = []

  for (const key in data) {
    const raw = data[key]
    const value = typeCheck('function', raw) ? (raw as () => unknown)() : raw == null ? '' : raw
    parts.push(encodeURIComponent(key) + '=' + encodeURIComponent(String(value)))
  }

  return parts.join('&').replace(/%20/g, '+')
}

/** Thin XHR wrapper kept for parity with the legacy `util.base` `ajax` helper. */
export function ajax(opts: AjaxOptions): void {
  const options: Required<Pick<AjaxOptions, 'url' | 'type' | 'async' | 'success'>> & AjaxOptions = {
    type: 'GET',
    data: null,
    async: true,
    ...opts
  }

  const xhr = new XMLHttpRequest()
  const paramStr = options.data ? param(options.data) : ''

  xhr.open(options.type, options.url, options.async)

  const onComplete = () => {
    if (xhr.readyState === 4 && xhr.status === 200) {
      options.success(xhr)
    } else if (options.fail) {
      options.fail(xhr)
    }
  }

  if (options.async) {
    xhr.onreadystatechange = onComplete
  }

  xhr.send(paramStr)

  if (!options.async) {
    onComplete()
  }
}
