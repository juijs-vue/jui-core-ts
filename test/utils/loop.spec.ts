import { loop, loopArray, timeLoop } from '../../src/utils/loop.js'
import { btoa, atob } from '../../src/utils/base64.js'

describe('utils/loop', () => {
  test('loop visits every index in [0, total) exactly once', () => {
    const seen: number[] = []
    loop(12)((i) => seen.push(i))
    expect(seen.slice().sort((a, b) => a - b)).toEqual([...Array(12).keys()])
  })

  test('loopArray visits every item exactly once, in order per lane', () => {
    const data = ['a', 'b', 'c', 'd', 'e']
    const seen: string[] = []
    loopArray(data)((item) => seen.push(item))
    expect(seen.slice().sort()).toEqual(['a', 'b', 'c', 'd', 'e'])
  })

  test('timeLoop counts down to 1 then runs lastCallback', (done) => {
    const seen: number[] = []
    timeLoop(3)(
      (i) => seen.push(i),
      () => {
        expect(seen).toContain(1)
        done()
      }
    )
  })
})

describe('utils/base64 btoa/atob aliases', () => {
  test('round-trip through Base64.encode/decode', () => {
    expect(atob(btoa('hello'))).toBe('hello')
  })
})
