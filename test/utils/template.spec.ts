import { template } from '../../src/utils/template.js'

const settings = {
  evaluate: /<!([\s\S]+?)!>/g,
  interpolate: /<!=([\s\S]+?)!>/g,
  escape: /<!-([\s\S]+?)!>/g
}

describe('utils/template', () => {
  test('interpolates values', () => {
    const result = template('Hello <!=name!>!', { name: 'JUI' }, settings)
    expect(result).toBe('Hello JUI!')
  })

  test('evaluates control-flow blocks and exposes the `_` helper', () => {
    const result = template(
      "<! _.each(items, function(item) { !><!=item!>,<! }); !>",
      { items: ['a', 'b', 'c'] },
      settings
    )
    expect(result).toBe('a,b,c,')
  })

  test('compiles to a reusable function when no data is given', () => {
    const compiled = template('<!=x!>', undefined, settings)
    expect(typeof compiled).toBe('function')
    expect((compiled as (d: unknown) => string)({ x: 1 })).toBe('1')
    expect((compiled as (d: unknown) => string)({ x: 2 })).toBe('2')
  })
})
