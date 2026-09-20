export interface Point2D {
  x: number
  y: number
}

export interface Size2D {
  width: number
  height: number
}

export interface Range {
  min: number
  max: number
  range: number
  spacing: number
}

export interface FixedOp {
  (value: number): number
  plus(a: number, b: number): number
  minus(a: number, b: number): number
  multi(a: number, b: number): number
  div(a: number, b: number): number
  remain(a: number, b: number): number
}

function matrix(a: number[][], b: number[]): number[] {
  return a.map((row) => row.reduce((sum, v, j) => sum + v * (b[j] as number), 0))
}

function deepMatrix(a: number[][], b: number[][]): number[][] {
  const columns: number[][] = b[0]!.map((_, colIndex) => b.map((row) => row[colIndex] as number))

  return columns.map((column) => matrix(a, column))
}

function matrix3d(a: number[][], b: Float32Array): Float32Array {
  const m = new Float32Array(4)

  for (let i = 0; i < 4; i++) {
    const row = a[i] as number[]
    m[i] = row[0]! * b[0]! + row[1]! * b[1]! + row[2]! * b[2]! + row[3]! * b[3]!
  }

  return m
}

function deepMatrix3d(a: number[][], b: Float32Array[]): Float32Array[] {
  const columns: Float32Array[] = [0, 1, 2, 3].map(
    (col) => new Float32Array([b[0]![col]!, b[1]![col]!, b[2]![col]!, b[3]![col]!])
  )

  return columns.map((column) => matrix3d(a, column))
}

/**
 * 4x4 matrix inverse. The legacy implementation had an out-of-bounds write
 * (`te[3][4]`, a Float32Array(4) has indices 0-3) that silently corrupted
 * nothing but also never wrote `te[3][3]`; fixed here.
 */
function inverseMatrix3d(me: number[][]): Float32Array[] {
  const te: Float32Array[] = [new Float32Array(4), new Float32Array(4), new Float32Array(4), new Float32Array(4)]

  const n11 = me[0]![0]!, n12 = me[0]![1]!, n13 = me[0]![2]!, n14 = me[0]![3]!
  const n21 = me[1]![0]!, n22 = me[1]![1]!, n23 = me[1]![2]!, n24 = me[1]![3]!
  const n31 = me[2]![0]!, n32 = me[2]![1]!, n33 = me[2]![2]!, n34 = me[2]![3]!
  const n41 = me[3]![0]!, n42 = me[3]![1]!, n43 = me[3]![2]!, n44 = me[3]![3]!

  te[0]![0] = n23 * n34 * n42 - n24 * n33 * n42 + n24 * n32 * n43 - n22 * n34 * n43 - n23 * n32 * n44 + n22 * n33 * n44
  te[0]![1] = n14 * n33 * n42 - n13 * n34 * n42 - n14 * n32 * n43 + n12 * n34 * n43 + n13 * n32 * n44 - n12 * n33 * n44
  te[0]![2] = n13 * n24 * n42 - n14 * n23 * n42 + n14 * n22 * n43 - n12 * n24 * n43 - n13 * n22 * n44 + n12 * n23 * n44
  te[0]![3] = n14 * n23 * n32 - n13 * n24 * n32 - n14 * n22 * n33 + n12 * n24 * n33 + n13 * n22 * n34 - n12 * n23 * n34
  te[1]![0] = n24 * n33 * n41 - n23 * n34 * n41 - n24 * n31 * n43 + n21 * n34 * n43 + n23 * n31 * n44 - n21 * n33 * n44
  te[1]![1] = n13 * n34 * n41 - n14 * n33 * n41 + n14 * n31 * n43 - n11 * n34 * n43 - n13 * n31 * n44 + n11 * n33 * n44
  te[1]![2] = n14 * n23 * n41 - n13 * n24 * n41 - n14 * n21 * n43 + n11 * n24 * n43 + n13 * n21 * n44 - n11 * n23 * n44
  te[1]![3] = n13 * n24 * n31 - n14 * n23 * n31 + n14 * n21 * n33 - n11 * n24 * n33 - n13 * n21 * n34 + n11 * n23 * n34
  te[2]![0] = n22 * n34 * n41 - n24 * n32 * n41 + n24 * n31 * n42 - n21 * n34 * n42 - n22 * n31 * n44 + n21 * n32 * n44
  te[2]![1] = n14 * n32 * n41 - n12 * n34 * n41 - n14 * n31 * n42 + n11 * n34 * n42 + n12 * n31 * n44 - n11 * n32 * n44
  te[2]![2] = n12 * n24 * n41 - n14 * n22 * n41 + n14 * n21 * n42 - n11 * n24 * n42 - n12 * n21 * n44 + n11 * n22 * n44
  te[2]![3] = n14 * n22 * n31 - n12 * n24 * n31 - n14 * n21 * n32 + n11 * n24 * n32 + n12 * n21 * n34 - n11 * n22 * n34
  te[3]![0] = n23 * n32 * n41 - n22 * n33 * n41 - n23 * n31 * n42 + n21 * n33 * n42 + n22 * n31 * n43 - n21 * n32 * n43
  te[3]![1] = n12 * n33 * n41 - n13 * n32 * n41 + n13 * n31 * n42 - n11 * n33 * n42 - n12 * n31 * n43 + n11 * n32 * n43
  te[3]![2] = n13 * n22 * n41 - n12 * n23 * n41 - n13 * n21 * n42 + n11 * n23 * n42 + n12 * n21 * n43 - n11 * n22 * n43
  te[3]![3] = n12 * n23 * n31 - n13 * n22 * n31 + n13 * n21 * n32 - n11 * n23 * n32 - n12 * n21 * n33 + n11 * n22 * n33

  const det = 1 / (n11 * te[0]![0]! + n21 * te[0]![1]! + n31 * te[0]![2]! + n41 * te[0]![3]!)

  if (det === 0 || !isFinite(det)) {
    return [
      new Float32Array([1, 0, 0, 0]),
      new Float32Array([0, 1, 0, 0]),
      new Float32Array([0, 0, 1, 0]),
      new Float32Array([0, 0, 0, 1])
    ]
  }

  for (const row of te) {
    for (let i = 0; i < 4; i++) row[i] = row[i]! * det
  }

  return te
}

export function getFixed(a: number | string, b: number | string): number {
  const aLen = (String(a).split('.')[1] ?? '').length
  const bLen = (String(b).split('.')[1] ?? '').length

  return aLen > bLen ? aLen : bLen
}

/** Builds a rounding-safe arithmetic helper fixed to the precision of `fixed`. */
export function fixed(precision: number | string): FixedOp {
  const fixedNumber = getFixed(precision, 0)
  const pow = Math.pow(10, fixedNumber)

  const func = ((value: number) => Math.round(value * pow) / pow) as FixedOp

  func.plus = (a, b) => Math.round(a * pow + b * pow) / pow
  func.minus = (a, b) => Math.round(a * pow - b * pow) / pow
  func.multi = (a, b) => Math.round(a * pow * (b * pow)) / (pow * pow)
  func.div = (a, b) => {
    const result = (a * pow) / (b * pow)
    const pow2 = Math.pow(10, getFixed(result, 0))
    return Math.round(result * pow2) / pow2
  }
  func.remain = (a, b) => Math.round((a * pow) % (b * pow)) / pow

  return func
}

export function round(num: number, digits: number): number {
  const fixedNumber = Math.pow(10, digits)
  return Math.round(num * fixedNumber) / fixedNumber
}

export function plus(a: number, b: number): number {
  const pow = Math.pow(10, getFixed(a, b))
  return Math.round(a * pow + b * pow) / pow
}

export function minus(a: number, b: number): number {
  const pow = Math.pow(10, getFixed(a, b))
  return Math.round(a * pow - b * pow) / pow
}

export function multi(a: number, b: number): number {
  const pow = Math.pow(10, getFixed(a, b))
  return Math.round(a * pow * (b * pow)) / (pow * pow)
}

export function div(a: number, b: number): number {
  const pow = Math.pow(10, getFixed(a, b))
  const result = (a * pow) / (b * pow)
  const pow2 = Math.pow(10, getFixed(result, 0))
  return Math.round(result * pow2) / pow2
}

export function remain(a: number, b: number): number {
  const pow = Math.pow(10, getFixed(a, b))
  return Math.round((a * pow) % (b * pow)) / pow
}

export function radian(degree: number): number {
  return (degree * Math.PI) / 180
}

export function degree(rad: number): number {
  return (rad * 180) / Math.PI
}

export function angle(x1: number, y1: number, x2: number, y2: number): number {
  return Math.atan2(y2 - y1, x2 - x1)
}

export function rotate(x: number, y: number, rad: number): Point2D {
  return {
    x: x * Math.cos(rad) - y * Math.sin(rad),
    y: x * Math.sin(rad) + y * Math.cos(rad)
  }
}

export function resize(maxWidth: number, maxHeight: number, objectWidth: number, objectHeight: number): Size2D {
  const ratio = objectHeight / objectWidth
  let width = objectWidth
  let height = objectHeight

  if (objectWidth >= maxWidth && ratio <= 1) {
    width = maxWidth
    height = maxHeight * ratio
  } else if (objectHeight >= maxHeight) {
    height = maxHeight
    width = maxWidth / ratio
  }

  return { width, height }
}

export function interpolateNumber(a: number, b: number): (t: number) => number {
  const dist = b - a
  return (t: number) => a + dist * t
}

export function interpolateRound(a: number, b: number): (t: number) => number {
  const dist = b - a
  return (t: number) => Math.round(a + dist * t)
}

/** Computes a "nice" min/max/spacing for an axis with `ticks` gridlines. */
export function nice(min: number, max: number, ticks: number, isNice = false): Range {
  const lo = min > max ? max : min
  const hi = min > max ? min : max

  function niceNum(rangeValue: number, doRound: boolean): number {
    const exponent = Math.floor(Math.log(rangeValue) / Math.LN10)
    const fraction = rangeValue / Math.pow(10, exponent)
    let niceFraction: number

    if (doRound) {
      if (fraction < 1.5) niceFraction = 1
      else if (fraction < 3) niceFraction = 2
      else if (fraction < 7) niceFraction = 5
      else niceFraction = 10
    } else {
      if (fraction <= 1) niceFraction = 1
      else if (fraction <= 2) niceFraction = 2
      else if (fraction <= 5) niceFraction = 5
      else niceFraction = 10
    }

    return niceFraction * Math.pow(10, exponent)
  }

  const range = isNice ? niceNum(hi - lo, false) : hi - lo
  const spacing = isNice ? niceNum(range / ticks, true) : range / ticks
  const niceMin = isNice ? Math.floor(lo / spacing) * spacing : lo
  const niceMax = isNice ? Math.floor(hi / spacing) * spacing : hi

  return { min: niceMin, max: niceMax, range, spacing }
}

// Re-exported under the original names (`matrix`/`matrix3d`/`inverseMatrix3d`) for a 1:1
// mapping to `util/math.js`; the same names are used above for the single-matrix helpers
// this dispatches to, which is legal here (distinct module-local bindings) the same way the
// original's `self.matrix = function(a, b) {...}` object property didn't collide with its
// same-named top-level closure helper.
function matrixDispatch(a: number[][], b: number[] | number[][]): number[] | number[][] {
  if (Array.isArray(b[0])) {
    return deepMatrix(a, b as number[][])
  }

  return matrix(a, b as number[])
}

function matrix3dDispatch(a: number[][], b: Float32Array | Float32Array[]): Float32Array | Float32Array[] {
  if (Array.isArray(b) && (b[0] instanceof Array || b[0] instanceof Float32Array)) {
    return deepMatrix3d(a, b as Float32Array[])
  }

  return matrix3d(a, b as Float32Array)
}

function inverseMatrix3dDispatch(a: number[][]): Float32Array[] {
  return inverseMatrix3d(a)
}

export { matrixDispatch as matrix, matrix3dDispatch as matrix3d, inverseMatrix3dDispatch as inverseMatrix3d }

export function scaleValue(value: number, minValue: number, maxValue: number, minScale: number, maxScale: number): number {
  const normalizedMin = minValue === maxValue ? 0 : minValue
  const range = maxScale - minScale
  const per = (value - normalizedMin) / (maxValue - normalizedMin)

  return range * per + minScale
}
