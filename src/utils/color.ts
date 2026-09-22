import { plus } from './math.js'
import { trim } from './object.js'

export interface RGBColor {
  r: number
  g: number
  b: number
  a?: number
}

export interface HSVColor {
  h: number
  s: number
  v: number
}

export interface GradientStop {
  type: 'stop'
  attr: Record<string, string | number>
}

export interface LinearGradientAttr {
  x1: number | string
  y1: number | string
  x2: number | string
  y2: number | string
  direction?: string
}

export interface RadialGradientAttr {
  cx: number
  cy: number
  r: number
  fx: number
  fy: number
}

export interface GradientDescriptor {
  type: 'linearGradient' | 'radialGradient'
  attr: LinearGradientAttr | RadialGradientAttr
  children: GradientStop[]
}

const GRADIENT_REGEX = /(linear|radial)\((.*)\)(.*)/i

function generateHash(name: string): number {
  let hash = 0
  let weight = 1
  let maxHash = 0
  const mod = 10
  const maxChar = 6

  for (let i = 0; i < name.length; i++) {
    if (i > maxChar) break
    hash += weight * (name.charCodeAt(i) % mod)
    maxHash += weight * (mod - 1)
    weight *= 0.7
  }

  return maxHash > 0 ? hash / maxHash : hash
}

export function format(obj: RGBColor, type: 'hex' | 'rgb'): string {
  if (type === 'hex') {
    const hex = (n: number) => (n < 16 ? '0' : '') + n.toString(16)
    const base = [hex(obj.r), hex(obj.g), hex(obj.b)]
    // 8자리 hex(#RRGGBBAA, CSS Color 4 - 모든 현대 브라우저 지원)로 알파까지 표현한다.
    // 값이 없거나 완전 불투명(1)이면 예전과 동일하게 6자리로 남긴다.
    if (typeof obj.a !== 'undefined' && obj.a < 1) base.push(hex(Math.round(obj.a * 255)))
    return '#' + base.join('').toUpperCase()
  }

  if (type === 'rgb') {
    return typeof obj.a === 'undefined'
      ? `rgb(${obj.r},${obj.g},${obj.b})`
      : `rgba(${obj.r},${obj.g},${obj.b},${obj.a})`
  }

  return String(obj)
}

/**
 * Parses an `rgb()`/`rgba()`/`#hex` string into an `{r,g,b,a}` object. Anything
 * else (an unrecognized string, or an already-parsed `RGBColor`) passes
 * through unchanged, matching the original - it never throws.
 */
export function rgb(input: string | RGBColor): RGBColor {
  if (typeof input !== 'string') return input
  const str = input

  if (str.indexOf('rgb(') > -1) {
    const [r, g, b] = str
      .replace('rgb(', '')
      .replace(')', '')
      .split(',')
      .map((v) => parseInt(trim(v), 10))

    return { r: r as number, g: g as number, b: b as number, a: 1 }
  }

  if (str.indexOf('rgba(') > -1) {
    const parts = str
      .replace('rgba(', '')
      .replace(')', '')
      .split(',')
    const len = parts.length

    const nums = parts.map((v, i) => (i === len - 1 ? parseFloat(trim(v)) : parseInt(trim(v), 10)))

    return { r: nums[0] as number, g: nums[1] as number, b: nums[2] as number, a: nums[3] as number }
  }

  if (str.indexOf('#') === 0) {
    const hex = str.replace('#', '')
    const arr: number[] = []

    if (hex.length === 3) {
      for (let i = 0; i < hex.length; i++) {
        const char = hex.substr(i, 1)
        arr.push(parseInt(char + char, 16))
      }
    } else {
      for (let i = 0; i < hex.length; i += 2) {
        arr.push(parseInt(hex.substr(i, 2), 16))
      }
    }

    // 8자리(#RRGGBBAA)면 마지막 바이트를 알파(0~255 -> 0~1)로 되돌린다.
    const a = arr.length > 3 ? (arr[3] as number) / 255 : 1
    return { r: arr[0] as number, g: arr[1] as number, b: arr[2] as number, a }
  }

  return str as unknown as RGBColor
}

export interface ColorScale {
  (t: number, type?: 'hex' | 'rgb'): string
  domain(start: string, end: string): ColorScale
  ticks(n: number): string[]
}

export function scale(): ColorScale {
  let startColor: RGBColor
  let endColor: RGBColor

  const func = ((t: number, type: 'hex' | 'rgb' = 'hex') => {
    const obj: RGBColor = {
      r: parseInt(String(startColor.r + (endColor.r - startColor.r) * t), 10),
      g: parseInt(String(startColor.g + (endColor.g - startColor.g) * t), 10),
      b: parseInt(String(startColor.b + (endColor.b - startColor.b) * t), 10)
    }

    return format(obj, type)
  }) as ColorScale

  func.domain = (start, end) => {
    startColor = rgb(start)
    endColor = rgb(end)
    return func
  }

  func.ticks = (n) => {
    const unit = 1 / n
    const colors: string[] = []
    let start = 0

    while (start <= 1) {
      colors.push(func(start, 'hex'))
      start = plus(start, unit)
    }

    return colors
  }

  return func
}

export interface ColorMapFn {
  (colorList: string[], count?: number): string[]
  parula(count?: number): string[]
  jet(count?: number): string[]
  hsv(count?: number): string[]
  hot(count?: number): string[]
  pink(count?: number): string[]
  bone(count?: number): string[]
  copper(count?: number): string[]
}

export const map = ((colorList: string[], count = 5) => {
  let colors: string[] = []
  const s = scale()

  for (let i = 0; i < colorList.length - 1; i++) {
    if (i === 0) {
      colors = s.domain(colorList[i] as string, colorList[i + 1] as string).ticks(count)
    } else {
      const next = s.domain(colorList[i] as string, colorList[i + 1] as string).ticks(count)
      next.shift()
      colors = colors.concat(next)
    }
  }

  return colors
}) as ColorMapFn

map.parula = (count) => map(['#352a87', '#0f5cdd', '#00b5a6', '#ffc337', '#fdff00'], count)
map.jet = (count) => map(['#00008f', '#0020ff', '#00ffff', '#51ff77', '#fdff00', '#ff0000', '#800000'], count)
map.hsv = (count) => map(['#ff0000', '#ffff00', '#00ff00', '#00ffff', '#0000ff', '#ff00ff', '#ff0000'], count)
map.hot = (count) => map(['#0b0000', '#ff0000', '#ffff00', '#ffffff'], count)
map.pink = (count) => map(['#1e0000', '#bd7b7b', '#e7e5b2', '#ffffff'], count)
map.bone = (count) => map(['#000000', '#4a4a68', '#a6c6c6', '#ffffff'], count)
map.copper = (count) => map(['#000000', '#3d2618', '#9d623e', '#ffa167', '#ffc77f'], count)

export function HSVtoRGB(H: number, S: number, V: number): RGBColor {
  const hue = H === 360 ? 0 : H
  const C = S * V
  const X = C * (1 - Math.abs(((hue / 60) % 2) - 1))
  const m = V - C

  let temp: number[]
  if (0 <= hue && hue < 60) temp = [C, X, 0]
  else if (hue < 120) temp = [X, C, 0]
  else if (hue < 180) temp = [0, C, X]
  else if (hue < 240) temp = [0, X, C]
  else if (hue < 300) temp = [X, 0, C]
  else temp = [C, 0, X]

  return {
    r: Math.ceil((temp[0]! + m) * 255),
    g: Math.ceil((temp[1]! + m) * 255),
    b: Math.ceil((temp[2]! + m) * 255)
  }
}

export function RGBtoHSV(R: number, G: number, B: number): HSVColor {
  const R1 = R / 255
  const G1 = G / 255
  const B1 = B / 255

  const maxC = Math.max(R1, G1, B1)
  const minC = Math.min(R1, G1, B1)
  const deltaC = maxC - minC

  let H = 0
  if (deltaC !== 0) {
    if (maxC === R1) H = 60 * (((G1 - B1) / deltaC) % 6)
    else if (maxC === G1) H = 60 * ((B1 - R1) / deltaC + 2)
    else if (maxC === B1) H = 60 * ((R1 - G1) / deltaC + 4)
  }
  if (H < 0) H = 360 + H

  const S = maxC === 0 ? 0 : deltaC / maxC
  const V = maxC

  return { h: H, s: S, v: V }
}

export function lighten(color: string, rate = 0): string {
  const cleaned = color.replace(/[^0-9a-f]/gi, '')
  const rgbParts: string[] = []

  for (let i = 0; i < 6; i += 2) {
    const c = parseInt(cleaned.substr(i, 2), 16)
    const adjusted = Math.round(Math.min(Math.max(0, c + c * rate), 255)).toString(16)
    rgbParts.push(('00' + adjusted).substr(adjusted.length))
  }

  return '#' + rgbParts.join('')
}

export function darken(color: string, rate = 0): string {
  return lighten(color, -rate)
}

export function parseAttr(type: string, str: string): LinearGradientAttr | RadialGradientAttr {
  if (type === 'linear') {
    switch (str) {
      case '':
      case 'left':
        return { x1: 0, y1: 0, x2: 1, y2: 0, direction: str || 'left' }
      case 'right':
        return { x1: 1, y1: 0, x2: 0, y2: 0, direction: str }
      case 'top':
        return { x1: 0, y1: 0, x2: 0, y2: 1, direction: str }
      case 'bottom':
        return { x1: 0, y1: 1, x2: 0, y2: 0, direction: str }
      case 'top left':
        return { x1: 0, y1: 0, x2: 1, y2: 1, direction: str }
      case 'top right':
        return { x1: 1, y1: 0, x2: 0, y2: 1, direction: str }
      case 'bottom left':
        return { x1: 0, y1: 1, x2: 1, y2: 0, direction: str }
      case 'bottom right':
        return { x1: 1, y1: 1, x2: 0, y2: 0, direction: str }
      default: {
        const arr = str.split(',').map((v) => (v.indexOf('%') === -1 ? parseFloat(v) : v))
        return { x1: arr[0] as number, y1: arr[1] as number, x2: arr[2] as number, y2: arr[3] as number }
      }
    }
  }

  const arr = str.split(',').map((v) => (v.indexOf('%') === -1 ? parseFloat(v) : v))
  return { cx: arr[0] as number, cy: arr[1] as number, r: arr[2] as number, fx: arr[3] as number, fy: arr[4] as number }
}

/**
 * The original has a real bug here: the "fill in missing offsets" pass below reads/writes a
 * top-level `stop.offset` that's never the same field as `stop.attr.offset` (the one actually
 * populated during parsing), so an explicit percentage offset on a middle stop is silently
 * ignored (see jui-graph-ts's/jui-chart-vue's independent, hand-traced writeups of the same bug -
 * PORT_STATUS.md has the full cross-reference). This port unifies both into `attr.offset`, which
 * wasn't a deliberate fix (unlike `trim()`/`inverseMatrix3d` above) but is kept since it produces
 * more sensible output and nothing here depends on the original's behavior.
 */
export function parseStop(stop: string): GradientStop[] {
  const stops: GradientStop[] = stop.split(',').reduce<GradientStop[]>((acc, part) => {
    const arr = part.split(' ')

    if (arr.length === 1) acc.push({ type: 'stop', attr: { 'stop-color': arr[0] as string } })
    else if (arr.length === 2) acc.push({ type: 'stop', attr: { offset: arr[0] as string, 'stop-color': arr[1] as string } })
    else if (arr.length === 3)
      acc.push({ type: 'stop', attr: { offset: arr[0] as string, 'stop-color': arr[1] as string, 'stop-opacity': arr[2] as string } })

    return acc
  }, [])

  let start = -1
  let end = -1

  for (let i = 0; i < stops.length; i++) {
    const s = stops[i] as GradientStop

    if (i === 0) {
      if (!('offset' in s.attr)) s.attr.offset = 0
    } else if (i === stops.length - 1) {
      if (!('offset' in s.attr)) s.attr.offset = 1
    }

    if (start === -1 && typeof s.attr.offset === 'undefined') {
      start = i
    } else if (end === -1 && typeof s.attr.offset === 'undefined') {
      end = i

      const count = end - start
      const endOffsetRaw = stops[end]!.attr.offset as string | number
      const startOffsetRaw = stops[start]!.attr.offset as string | number
      const endOffset = typeof endOffsetRaw === 'string' && endOffsetRaw.indexOf('%') > -1 ? parseFloat(endOffsetRaw) / 100 : Number(endOffsetRaw)
      const startOffset =
        typeof startOffsetRaw === 'string' && startOffsetRaw.indexOf('%') > -1 ? parseFloat(startOffsetRaw) / 100 : Number(startOffsetRaw)

      const value = (endOffset - startOffset) / count
      let offset = startOffset + value

      for (let index = start + 1; index < end; index++) {
        stops[index]!.attr.offset = offset
        offset += value
      }

      start = end
      end = -1
    }
  }

  return stops
}

export function parseGradient(color: string): GradientDescriptor | string {
  const matches = color.match(GRADIENT_REGEX)
  if (!matches) return color

  const type = trim(matches[1]) as 'linear' | 'radial'
  const attr = parseAttr(type, trim(matches[2]))
  const stops = parseStop(trim(matches[3]))

  return { type: type === 'linear' ? 'linearGradient' : 'radialGradient', attr, children: stops }
}

export function parse(color: string): GradientDescriptor | string {
  return parseGradient(color)
}

/**
 * Deterministic, warm-palette color hash for a name/string (e.g. legend
 * coloring). With `callback`, returns `callback(vector)` instead of the
 * default RGB mapping - `vector` is the raw 0..1 hash.
 */
export function colorHash(name?: string): RGBColor
export function colorHash<T>(name: string | undefined, callback: (vector: number) => T): T
export function colorHash<T>(name?: string, callback?: (vector: number) => T): RGBColor | T {
  let vector = 0

  if (name) {
    const cleaned = name.replace(/.*`/, '').replace(/\(.*/, '')
    vector = generateHash(cleaned)
  }

  if (typeof callback === 'function') return callback(vector)

  return {
    r: 200 + Math.round(55 * vector),
    g: Math.round(230 * (1 - vector)),
    b: Math.round(55 * (1 - vector))
  }
}
