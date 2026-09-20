import { typeCheck, template } from '../utils/index.js'
import type { TypeName } from '../utils/typeCheck.js'
import type { CompiledTemplate } from '../utils/template.js'

export type EventCallback = (...args: unknown[]) => unknown

export interface UIEventRecord {
  type: string
  callback: EventCallback
  unique?: boolean
}

export interface UIOptions {
  event?: Record<string, EventCallback>
  [key: string]: unknown
}

export interface CallDelayOptions {
  delay?: number
  before?: (...args: unknown[]) => void
  after?: (...args: unknown[]) => void
}

interface UICoreStatic {
  setup?: () => UIOptions
}

/**
 * Framework/DOM-agnostic base class for a JUI "component core": custom
 * events (emit/on/off) and default-option merging, with nothing tying it to
 * jQuery or a specific rendering layer. Where the legacy `core`/`event`
 * modules also owned DOM-selector instantiation (`UICore.build`, matching
 * `jui.defineUI(...)` against `document.querySelectorAll`) and a global
 * instance registry (`UIManager`), that responsibility now belongs to
 * whatever framework renders the component - e.g. a Vue composable does
 * `const core = new TableCore(options)` and binds `core.emit`/`core.on` to
 * its own reactive state and template refs.
 *
 * `addValid`/`callBefore`/`callAfter`/`callDelay` intentionally patch the
 * shared class prototype (`Object.getPrototypeOf(this)`), matching the
 * legacy behavior where these were meant to be called once, typically from
 * a subclass's constructor - every instance of that subclass is affected.
 */
export class UICore<TOptions extends UIOptions = UIOptions> {
  options: TOptions
  tpl: Record<string, CompiledTemplate> = {}
  event: UIEventRecord[] = []

  static setup(): UIOptions {
    return { event: {} }
  }

  constructor(options: Partial<TOptions> = {}) {
    this.options = UICore.mergeOptions(this.constructor as unknown as UICoreStatic, options)

    for (const key in this.options.event) {
      this.on(key, this.options.event[key] as EventCallback)
    }
  }

  /**
   * Merges default options declared via every ancestor's static `setup()`
   * (root class first) with the user-supplied `options`, throwing on any
   * option key no ancestor declared (unless listed in `exceptOptions`).
   */
  static mergeOptions<O extends UIOptions>(Ctor: UICoreStatic, options: Partial<O>, exceptOptions: string[] = []): O {
    const defaults: UIOptions = {}
    const chain: UICoreStatic[] = []

    let cursor: UICoreStatic | null = Ctor
    while (cursor) {
      chain.unshift(cursor)
      cursor = Object.getPrototypeOf(cursor) as UICoreStatic | null
    }

    for (const klass of chain) {
      if (Object.prototype.hasOwnProperty.call(klass, 'setup') && typeCheck('function', klass.setup)) {
        const opts = klass.setup!()
        for (const key in opts) {
          if (typeCheck('undefined', defaults[key])) defaults[key] = opts[key]
        }
      }
    }

    const defaultKeys = Object.keys(defaults)
    for (const key of Object.keys(options)) {
      if (!defaultKeys.includes(key) && !exceptOptions.includes(key)) {
        throw new Error(`JUI_CRITICAL_ERR: '${key}' is not an option`)
      }
    }

    const merged: UIOptions = { ...options }
    for (const key in defaults) {
      if (typeCheck('undefined', merged[key])) merged[key] = defaults[key]
    }

    return merged as O
  }

  emit(type: string, args?: unknown): unknown {
    if (!typeCheck('string', type)) return undefined
    let result: unknown

    for (const e of this.event) {
      if (e.type === type.toLowerCase()) {
        const argList = typeCheck('array', args) ? (args as unknown[]) : [args]
        result = e.callback.apply(this, argList)
      }
    }

    return result
  }

  on(type: string, callback: EventCallback): void {
    if (!typeCheck('string', type) || !typeCheck('function', callback)) return
    this.event.push({ type: type.toLowerCase(), callback, unique: false })
  }

  off(typeOrCallback: string | EventCallback): void {
    this.event = this.event.filter((e) => {
      if (typeCheck('function', typeOrCallback)) return e.callback !== typeOrCallback
      if (typeCheck('string', typeOrCallback)) return e.type !== (typeOrCallback as string).toLowerCase()
      return true
    })
  }

  /** Wraps `this[name]` (on the shared prototype) with argument type-checking. */
  addValid(name: string, params: TypeName[]): void {
    const proto = Object.getPrototypeOf(this) as Record<string, unknown>
    const original = proto[name] as (...args: unknown[]) => unknown

    proto[name] = function (this: unknown, ...args: unknown[]) {
      args.forEach((arg, i) => {
        const type = params[i]
        if (type && !typeCheck(type, arg)) {
          throw new Error(`JUI_CRITICAL_ERR: the ${i}th parameter is not a ${type} (${name})`)
        }
      })

      return original.apply(this, args)
    }
  }

  /** Wraps `this[name]` so `callback` runs first; skips the original call if `callback` returns `false`. */
  callBefore(name: string, callback: (...args: unknown[]) => unknown): void {
    const proto = Object.getPrototypeOf(this) as Record<string, unknown>
    const original = proto[name] as (...args: unknown[]) => unknown

    proto[name] = function (this: unknown, ...args: unknown[]) {
      if (!typeCheck('function', callback)) return original.apply(this, args)
      if (callback.apply(this, args) !== false) return original.apply(this, args)
      return undefined
    }
  }

  /** Wraps `this[name]` so `callback` runs after; skipped if the original call returned `false`. */
  callAfter(name: string, callback: (...args: unknown[]) => unknown): void {
    const proto = Object.getPrototypeOf(this) as Record<string, unknown>
    const original = proto[name] as (...args: unknown[]) => unknown

    proto[name] = function (this: unknown, ...args: unknown[]) {
      const result = original.apply(this, args)

      if (typeCheck('function', callback) && result !== false) {
        callback.apply(this, args)
      }

      return result
    }
  }

  /** Wraps `this[name]` (void methods only) with optional `before`/`delay`/`after` hooks. */
  callDelay(name: string, callObj: CallDelayOptions): void {
    const proto = Object.getPrototypeOf(this) as Record<string, unknown>
    const original = proto[name] as (...args: unknown[]) => unknown
    const delay = !isNaN(callObj.delay as number) ? (callObj.delay as number) : 0

    const runOriginal = (self: unknown, args: unknown[]) => {
      const result = original.apply(self, args)
      if (typeCheck('function', callObj.after) && result !== false) {
        callObj.after!.apply(self, args)
      }
    }

    proto[name] = function (this: unknown, ...args: unknown[]) {
      if (typeCheck('function', callObj.before)) {
        callObj.before!.apply(this, args)
      }

      if (delay > 0) {
        setTimeout(() => runOriginal(this, args), delay)
      } else {
        runOriginal(this, args)
      }
    }
  }

  setTpl(name: string, html: string): void {
    const compiled = template(html)
    this.tpl[name] = typeof compiled === 'function' ? compiled : (() => compiled) as CompiledTemplate
  }

  setOption(key: string | Partial<TOptions>, value?: unknown): void {
    if (typeCheck('object', key)) {
      Object.assign(this.options, key)
    } else {
      ;(this.options as Record<string, unknown>)[key as string] = value
    }
  }

  destroy(): void {
    this.event = []
  }
}
