import { rgb, format, HSVtoRGB, RGBtoHSV, colorHash } from '../../src/utils/color.js'

describe('utils/color', () => {
  test('parses hex colors', () => {
    expect(rgb('#FF0000')).toEqual({ r: 255, g: 0, b: 0, a: 1 })
  })

  test('parses rgb()/rgba() strings', () => {
    expect(rgb('rgb(255, 0, 0)')).toEqual({ r: 255, g: 0, b: 0, a: 1 })
    expect(rgb('rgba(1, 2, 3, 0.5)')).toEqual({ r: 1, g: 2, b: 3, a: 0.5 })
  })

  test('rgb() passes through an already-parsed color instead of throwing', () => {
    const parsed = { r: 1, g: 2, b: 3 }
    expect(rgb(parsed)).toBe(parsed)
  })

  test('colorHash is deterministic and supports a custom callback', () => {
    expect(colorHash('same')).toEqual(colorHash('same'))
    expect(colorHash('a', (vector) => vector)).toBeGreaterThanOrEqual(0)
  })

  test('formats back to hex/rgb', () => {
    expect(format({ r: 255, g: 255, b: 255 }, 'hex')).toBe('#FFFFFF')
    expect(format({ r: 1, g: 2, b: 3, a: 0.5 }, 'rgb')).toBe('rgba(1,2,3,0.5)')
  })

  test('round-trips HSV<->RGB for pure red', () => {
    const hsv = RGBtoHSV(255, 0, 0)
    expect(hsv).toEqual({ h: 0, s: 1, v: 1 })
    expect(HSVtoRGB(hsv.h, hsv.s, hsv.v)).toEqual({ r: 255, g: 0, b: 0 })
  })
})
