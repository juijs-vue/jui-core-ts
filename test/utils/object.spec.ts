import { extend, clone, deepClone, chunk, inArray, trim, startsWith, endsWith } from '../../src/utils/object.js'

describe('utils/object', () => {
  test('extend overwrites by default, merges nested objects recursively', () => {
    const result = extend({ a: 1, nested: { x: 1, y: 2 } }, { a: 2, nested: { y: 3, z: 4 } })
    expect(result).toEqual({ a: 2, nested: { x: 1, y: 3, z: 4 } })
  })

  test('extend with skip=true keeps existing keys', () => {
    const result = extend({ a: 1 }, { a: 2, b: 3 }, true)
    expect(result).toEqual({ a: 1, b: 3 })
  })

  test('clone copies nested plain objects but not by reference', () => {
    const original = { nested: { x: 1 } }
    const copy = clone(original)
    copy.nested.x = 2
    expect(original.nested.x).toBe(1)
  })

  test('deepClone recurses through arrays and objects', () => {
    const original = { list: [{ x: 1 }, { x: 2 }] }
    const copy = deepClone(original)
    copy.list[0]!.x = 99
    expect(original.list[0]!.x).toBe(1)
  })

  test('chunk splits an array into fixed-size groups', () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]])
  })

  test('inArray returns -1 for missing values without throwing', () => {
    expect(inArray(2, [1, 2, 3])).toBe(1)
    expect(inArray(9, [1, 2, 3])).toBe(-1)
    expect(inArray(undefined, [1, 2, 3])).toBe(-1)
  })

  test('trim/startsWith/endsWith', () => {
    expect(trim('  hi  ')).toBe('hi')
    expect(startsWith('hello', 'he')).toBe(true)
    expect(endsWith('hello', 'lo')).toBe(true)
  })
})
