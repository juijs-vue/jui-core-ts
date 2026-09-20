import { typeCheck } from '../../src/utils/typeCheck.js'

describe('utils/typeCheck', () => {
  test('distinguishes integer vs float vs number', () => {
    expect(typeCheck('integer', 3)).toBe(true)
    expect(typeCheck('integer', 3.5)).toBe(false)
    expect(typeCheck('float', 3.5)).toBe(true)
    expect(typeCheck('number', 3.5)).toBe(true)
  })

  test('treats arrays/dates/null as distinct from plain object', () => {
    expect(typeCheck('object', {})).toBe(true)
    expect(typeCheck('object', [])).toBe(false)
    expect(typeCheck('object', new Date())).toBe(false)
    expect(typeCheck('object', null)).toBe(false)
    expect(typeCheck('array', [])).toBe(true)
    expect(typeCheck('date', new Date())).toBe(true)
    expect(typeCheck('null', null)).toBe(true)
  })

  test('accepts a list of candidate types', () => {
    expect(typeCheck(['string', 'null'], null)).toBe(true)
    expect(typeCheck(['string', 'null'], 42)).toBe(false)
  })
})
