/**
 * Builds a 5-way-interleaved loop callback over `[0, total)`: each call to
 * the returned function walks the range in 5 parallel "lanes" (so early
 * iterations of every lane run before later ones), calling
 * `callback(index, laneNumber)` with `this` bound to `context`.
 */
export function loop(total: number, context?: unknown): (callback: (index: number, lane: number) => void) => void {
  const start = 0
  const end = total
  const unit = Math.ceil(total / 5)

  return (callback: (index: number, lane: number) => void) => {
    let first = start
    let second = unit * 1
    let third = unit * 2
    let fourth = unit * 3
    let fifth = unit * 4
    const firstMax = second
    const secondMax = third
    const thirdMax = fourth
    const fourthMax = fifth
    const fifthMax = end

    while (first < firstMax && first < end) {
      callback.call(context, first, 1)
      first++

      if (second < secondMax && second < end) {
        callback.call(context, second, 2)
        second++
      }
      if (third < thirdMax && third < end) {
        callback.call(context, third, 3)
        third++
      }
      if (fourth < fourthMax && fourth < end) {
        callback.call(context, fourth, 4)
        fourth++
      }
      if (fifth < fifthMax && fifth < end) {
        callback.call(context, fifth, 5)
        fifth++
      }
    }
  }
}

/** Same interleaving as {@link loop}, but walks `data` directly: `callback(item, index, lane)`. */
export function loopArray<T>(data: T[], context?: unknown): (callback: (item: T, index: number, lane: number) => void) => void {
  const total = data.length
  const start = 0
  const end = total
  const unit = Math.ceil(total / 5)

  return (callback: (item: T, index: number, lane: number) => void) => {
    let first = start
    let second = unit * 1
    let third = unit * 2
    let fourth = unit * 3
    let fifth = unit * 4
    const firstMax = second
    const secondMax = third
    const thirdMax = fourth
    const fourthMax = fifth
    const fifthMax = end

    while (first < firstMax && first < end) {
      callback.call(context, data[first] as T, first, 1)
      first++

      if (second < secondMax && second < end) {
        callback.call(context, data[second] as T, second, 2)
        second++
      }
      if (third < thirdMax && third < end) {
        callback.call(context, data[third] as T, third, 3)
        third++
      }
      if (fourth < fourthMax && fourth < end) {
        callback.call(context, data[fourth] as T, fourth, 4)
        fourth++
      }
      if (fifth < fifthMax && fifth < end) {
        callback.call(context, data[fifth] as T, fifth, 5)
        fifth++
      }
    }
  }
}

/**
 * Builds an async countdown loop (1ms between steps) so a large `total`
 * doesn't block the UI thread: `callback(i)` runs once per step, counting
 * down from `total`, then `lastCallback()` runs once at the end.
 */
export function timeLoop(total: number, context?: unknown): (callback: (i: number) => void, lastCallback: () => void) => void {
  return (callback: (i: number) => void, lastCallback: () => void) => {
    function step(i: number): void {
      if (i < 1) return

      if (i === 1) {
        callback.call(context, i)
        lastCallback.call(context)
      } else {
        setTimeout(() => {
          let next = i
          if (next > -1) {
            callback.call(context, next)
            next--
          }
          if (next > -1) step(next)
        }, 1)
      }
    }

    step(total)
  }
}
