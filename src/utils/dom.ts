export interface Offset {
  top: number
  left: number
}

export function find(selector: string): NodeListOf<Element>
export function find(root: ParentNode, selector: string): NodeListOf<Element>
export function find(a: string | ParentNode, b?: string): NodeListOf<Element> | [] {
  if (typeof a === 'string') return document.querySelectorAll(a)
  if (b) return a.querySelectorAll(b)
  return []
}

export function each(
  selectorOrElements: string | Element[] | NodeListOf<Element>,
  callback: (this: Element, index: number, el: Element) => void
): void {
  const elements = typeof selectorOrElements === 'string' ? document.querySelectorAll(selectorOrElements) : selectorOrElements

  Array.prototype.forEach.call(elements, (el: Element, i: number) => {
    callback.call(el, i, el)
  })
}

export function attr(selector: string, attributes: Record<string, string>): void
export function attr(selector: string, key: string): string | null | undefined
export function attr(selector: string, keyOrAttributes: string | Record<string, string>): string | null | undefined | void {
  const elements = document.querySelectorAll(selector)

  if (typeof keyOrAttributes === 'object') {
    elements.forEach((el) => {
      for (const key in keyOrAttributes) {
        el.setAttribute(key, keyOrAttributes[key] as string)
      }
    })
    return
  }

  return elements.length > 0 ? elements[0]!.getAttribute(keyOrAttributes) : undefined
}

export function remove(selectorOrElements: string | Element[] | NodeListOf<Element>): void {
  each(selectorOrElements, function () {
    this.parentNode?.removeChild(this)
  })
}

export function offset(elem: Element | null | undefined): Offset | undefined {
  const doc = elem?.ownerDocument
  if (!doc) return undefined

  const docElem = doc.documentElement
  const win = doc.defaultView
  const box = elem.getBoundingClientRect()

  return {
    top: box.top + (win?.pageYOffset ?? docElem.scrollTop) - (docElem.clientTop || 0),
    left: box.left + (win?.pageXOffset ?? docElem.scrollLeft) - (docElem.clientLeft || 0)
  }
}

/** Debounces `callback` behind the window `resize` event. */
export function resize(callback: () => void, ms: number): void {
  let timer = 0

  window.addEventListener('resize', () => {
    clearTimeout(timer)
    timer = window.setTimeout(callback, ms)
  })
}

/** Measures the browser's scrollbar width (in px) via a throwaway scrollable element. */
export function scrollWidth(): number {
  const inner = document.createElement('p')
  inner.style.width = '100%'
  inner.style.height = '200px'

  const outer = document.createElement('div')
  outer.style.position = 'absolute'
  outer.style.top = '0px'
  outer.style.left = '0px'
  outer.style.visibility = 'hidden'
  outer.style.width = '200px'
  outer.style.height = '150px'
  outer.style.overflow = 'hidden'
  outer.appendChild(inner)

  document.body.appendChild(outer)
  const w1 = inner.offsetWidth
  outer.style.overflow = 'scroll'
  let w2 = inner.offsetWidth
  if (w1 === w2) w2 = outer.clientWidth
  document.body.removeChild(outer)

  return w1 - w2
}
