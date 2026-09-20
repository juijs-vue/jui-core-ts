export type CompareFn<T> = (a: T, b: T) => boolean

/** In-place (or cloned) quicksort driven by a user-supplied comparator. */
export class QuickSort<T> {
  private array: T[]
  private compareFunc: CompareFn<T> | null = null

  constructor(array: T[], isClone = false) {
    this.array = isClone ? array.slice(0) : array
  }

  setCompare(func: CompareFn<T>): void {
    this.compareFunc = func
  }

  run(left?: number, right?: number): T[] {
    const l = typeof left === 'number' ? left : 0
    const r = typeof right === 'number' ? right : this.array.length - 1

    if (l < r) {
      const pivot = l + Math.ceil((r - l) * 0.5)
      const newPivot = this.partition(pivot, l, r)

      this.run(l, newPivot - 1)
      this.run(newPivot + 1, r)
    }

    return this.array
  }

  private swap(a: number, b: number): void {
    const temp = this.array[a]
    this.array[a] = this.array[b] as T
    this.array[b] = temp as T
  }

  private partition(pivot: number, left: number, right: number): number {
    if (!this.compareFunc) {
      throw new Error('JUI_CRITICAL_ERR: setCompare() must be called before run()')
    }

    const compareFunc = this.compareFunc
    let storeIndex = left
    const pivotValue = this.array[pivot] as T
    this.swap(pivot, right)

    for (let v = left; v < right; v++) {
      const a = this.array[v] as T

      if (compareFunc(a, pivotValue) || (!compareFunc(pivotValue, a) && v % 2 === 1)) {
        this.swap(v, storeIndex)
        storeIndex++
      }
    }

    this.swap(right, storeIndex)

    return storeIndex
  }
}
