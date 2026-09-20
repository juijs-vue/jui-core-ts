export type TypeName =
  | 'string'
  | 'integer'
  | 'float'
  | 'number'
  | 'boolean'
  | 'undefined'
  | 'null'
  | 'array'
  | 'date'
  | 'function'
  | 'object'

function checkOne(type: TypeName, value: unknown): boolean {
  switch (type) {
    case 'string':
      return typeof value === 'string'
    case 'integer':
      return typeof value === 'number' && value % 1 === 0
    case 'float':
      return typeof value === 'number' && value % 1 !== 0
    case 'number':
      return typeof value === 'number'
    case 'boolean':
      return typeof value === 'boolean'
    case 'undefined':
      return typeof value === 'undefined'
    case 'null':
      return value === null
    case 'array':
      return Array.isArray(value)
    case 'date':
      return value instanceof Date
    case 'function':
      return typeof value === 'function'
    case 'object':
      return (
        typeof value === 'object' &&
        value !== null &&
        !Array.isArray(value) &&
        !(value instanceof Date) &&
        !(value instanceof RegExp)
      )
    default:
      return false
  }
}

/**
 * Checks that `value` matches one of the given type name(s).
 */
export function typeCheck(t: TypeName | TypeName[], v: unknown): boolean {
  if (Array.isArray(t)) {
    return t.some((type) => checkOne(type, v))
  }

  return checkOne(t, v)
}
