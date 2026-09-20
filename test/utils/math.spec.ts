import { plus, minus, multi, div, nice, round, radian, degree } from '../../src/utils/math.js'

describe('utils/math', () => {
  test('fixed-point arithmetic avoids float drift', () => {
    expect(plus(0.1, 0.2)).toBe(0.3)
    expect(minus(0.3, 0.1)).toBe(0.2)
    expect(multi(1.1, 2)).toBe(2.2)
    expect(div(1, 3)).toBeCloseTo(0.333, 3)
  })

  test('round respects the given precision', () => {
    expect(round(1.2345, 2)).toBe(1.23)
  })

  test('radian/degree round-trip', () => {
    expect(degree(radian(180))).toBeCloseTo(180)
  })

  test('nice computes axis-friendly min/max/spacing', () => {
    const result = nice(0, 97, 5, true)
    expect(result).toEqual({ min: 0, max: 80, range: 100, spacing: 20 })
  })
})
