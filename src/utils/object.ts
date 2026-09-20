import { typeCheck } from './typeCheck.js'

type AnyRecord = Record<string, any>

function isRecursive(value: unknown): value is AnyRecord {
  return typeCheck('object', value)
}

/**
 * Recursively merges `add` into `origin`.
 * When `skip` is true, existing keys on `origin` are left untouched.
 */
export function extend<T extends AnyRecord, U extends AnyRecord>(origin: T, add: U, skip = false): T & U {
  const target: AnyRecord = typeCheck(['object', 'function'], origin) ? origin : {}
  if (!typeCheck(['object', 'function'], add)) return target as T & U

  for (const key in add) {
    if (skip) {
      if (isRecursive(target[key])) {
        extend(target[key], add[key], skip)
      } else if (typeCheck('undefined', target[key])) {
        target[key] = add[key]
      }
    } else {
      if (isRecursive(target[key])) {
        extend(target[key], add[key], skip)
      } else {
        target[key] = add[key]
      }
    }
  }

  return target as T & U
}

/** Converts a `"12px"` style string to a plain number. Passes numbers through unchanged. */
export function pxToInt(px: string | number): number {
  if (typeCheck('string', px) && (px as string).indexOf('px') !== -1) {
    return parseInt((px as string).split('px').join(''), 10)
  }

  return px as number
}

/** Shallow-ish clone: nested plain objects are cloned recursively, everything else is copied by reference. */
export function clone<T>(obj: T): T {
  const result: AnyRecord = typeCheck('array', obj) ? [] : {}

  for (const i in obj) {
    const value = (obj as AnyRecord)[i]
    result[i] = typeCheck('object', value) ? clone(value) : value
  }

  return result as T
}

/**
 * Deep clone. `emit` is a set of key names whose values should be copied by
 * reference instead of being cloned (e.g. large immutable payloads).
 */
export function deepClone<T>(obj: T, emit: Record<string, boolean> = {}): T {
  if (typeCheck('array', obj)) {
    const arr = obj as unknown as unknown[]
    const value = new Array(arr.length)

    for (let i = 0; i < arr.length; i++) {
      value[i] = deepClone(arr[i], emit)
    }

    return value as unknown as T
  }

  if (typeCheck('date', obj)) {
    return obj
  }

  if (typeCheck('object', obj)) {
    const value: AnyRecord = {}

    for (const key in obj) {
      value[key] = emit[key] ? (obj as AnyRecord)[key] : deepClone((obj as AnyRecord)[key], emit)
    }

    return value as T
  }

  return obj
}

/** Splits `arr` into chunks of (at most) `len` items. */
export function chunk<T>(arr: T[], len: number): T[][] {
  const chunks: T[][] = []

  for (let i = 0; i < arr.length; i += len) {
    chunks.push(arr.slice(i, i + len))
  }

  return chunks
}

/** Index-of helper that never throws on non-array `list` (returns -1 instead). */
export function inArray<T>(target: T, list: T[]): number {
  if (typeCheck(['undefined', 'null'], target) || !typeCheck('array', list)) return -1

  for (let i = 0; i < list.length; i++) {
    if (list[i] === target) return i
  }

  return -1
}

export function startsWith(str: string, searchString: string, position = 0): boolean {
  return str.lastIndexOf(searchString, position) === position
}

export function endsWith(str: string, searchString: string, position?: number): boolean {
  const pos = position === undefined || position > str.length ? str.length : position
  const start = pos - searchString.length
  const lastIndex = str.indexOf(searchString, start)

  return lastIndex !== -1 && lastIndex === start
}

/**
 * The legacy implementation used an old jQuery-derived trim regex
 * (`/^[\x20\t\r\n\f]+|((?:^|[^\\])(?:\\.)*)[\x20\t\r\n\f]+$/g`) that, combined
 * with the `g` flag, could eat characters out of the middle of the string
 * (e.g. `trim("  hi  ")` -> `"h"`). Replaced with a plain leading/trailing
 * whitespace strip.
 */
export function trim(text: unknown): string {
  return text == null ? '' : (text + '').replace(/^[\x20\t\r\n\f]+|[\x20\t\r\n\f]+$/g, '')
}

/** Builds a `{ [value]: index[] }` map from `data[keyField]`. */
export function makeIndex<T extends AnyRecord>(data: T[], keyField: keyof T): Record<string, number[]> {
  const list: Record<string, number[]> = {}

  data.forEach((row, i) => {
    const value = String(row[keyField])

    if (!list[value]) list[value] = []
    list[value].push(i)
  })

  return list
}
