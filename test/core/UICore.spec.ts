import { UICore, type UIOptions } from '../../src/core/UICore.js'

describe('core/UICore', () => {
  test('on/emit invokes matching handlers with the given args (case-insensitive type)', () => {
    class Widget extends UICore {}
    const widget = new Widget()
    const seen: number[] = []

    widget.on('Change', (value) => seen.push(value as number))
    widget.emit('change', 1)
    widget.emit('change', [2])

    expect(seen).toEqual([1, 2])
  })

  test('off removes handlers by type or callback reference', () => {
    class Widget extends UICore {}
    const widget = new Widget()
    const calls: string[] = []
    const onA = () => calls.push('a')
    const onB = () => calls.push('b')

    widget.on('x', onA)
    widget.on('x', onB)
    widget.off(onA)
    widget.emit('x')

    expect(calls).toEqual(['b'])
  })

  test('addValid rejects calls whose arguments do not match the declared types', () => {
    class Widget extends UICore {
      setValue(value: number): number {
        return value
      }
    }
    const widget = new Widget()
    widget.addValid('setValue', ['number'])

    expect(widget.setValue(1)).toBe(1)
    expect(() => widget.setValue('nope' as unknown as number)).toThrow(/JUI_CRITICAL_ERR/)
  })

  test('callBefore skips the original call when the hook returns false', () => {
    class Widget extends UICore {
      ran = false
      run(): void {
        this.ran = true
      }
    }
    const widget = new Widget()
    let hookCalled = false

    widget.callBefore('run', () => {
      hookCalled = true
      return false
    })
    widget.run()

    expect(hookCalled).toBe(true)
    expect(widget.ran).toBe(false)
  })

  test('callAfter runs the hook once the original call returns (unless it returned false)', () => {
    class Widget extends UICore {
      run(): boolean {
        return true
      }
    }
    const widget = new Widget()
    let hookCalled = false

    widget.callAfter('run', () => {
      hookCalled = true
    })
    widget.run()

    expect(hookCalled).toBe(true)
  })

  test('setOption merges an object or sets a single key', () => {
    class Widget extends UICore<UIOptions & { a: number; b: number }> {
      static override setup() {
        return { a: 0, b: 0 }
      }
    }
    const widget = new Widget()

    widget.setOption('a', 10)
    widget.setOption({ b: 20 })

    expect(widget.options).toEqual({ a: 10, b: 20, event: {} })
  })

  describe('constructor option merging', () => {
    interface BoxOptions extends UIOptions {
      color: string
    }

    class Box extends UICore<BoxOptions> {
      static override setup(): Partial<BoxOptions> {
        return { color: 'red' }
      }
    }

    test('falls back to defaults declared via static setup()', () => {
      const box = new Box()
      expect(box.options.color).toBe('red')
    })

    test('user-supplied options override defaults', () => {
      const box = new Box({ color: 'blue' })
      expect(box.options.color).toBe('blue')
    })

    test('merges defaults across the whole ancestor chain, subclass wins on conflicts', () => {
      interface SquareOptions extends BoxOptions {
        size: number
      }

      class Square extends Box {
        static override setup(): Partial<SquareOptions> {
          return { size: 10 }
        }
      }

      const square = new Square({}) as unknown as UICore<SquareOptions>
      expect(square.options).toEqual({ color: 'red', size: 10, event: {} })
    })

    test('throws on an option key no ancestor declared', () => {
      expect(() => new Box({ nope: true } as never)).toThrow(/JUI_CRITICAL_ERR/)
    })

    test('options.event registers handlers that emit() triggers', () => {
      const seen: unknown[] = []
      const box = new Box({ event: { ping: (v: unknown) => seen.push(v) } } as never)

      box.emit('ping', 'pong')

      expect(seen).toEqual(['pong'])
    })
  })
})
