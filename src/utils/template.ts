export interface TemplateSettings {
  evaluate?: RegExp
  interpolate?: RegExp
  escape?: RegExp
  variable?: string
}

export interface CompiledTemplate {
  (data?: unknown): string
  source: string
}

// U+2028/U+2029 (LINE/PARAGRAPH SEPARATOR) are valid JS whitespace that some
// template pipelines mishandle, so they're escaped like \r\n\t below. Built via
// fromCharCode (not a literal \u escape) so tooling can't silently turn the
// escape sequence into the raw character.
const LINE_SEPARATOR = String.fromCharCode(0x2028)
const PARAGRAPH_SEPARATOR = String.fromCharCode(0x2029)

const ESCAPES: Record<string, string> = {
  '\\': '\\',
  "'": "'",
  r: '\r',
  n: '\n',
  t: '\t',
  u2028: LINE_SEPARATOR,
  u2029: PARAGRAPH_SEPARATOR
}

for (const key of Object.keys(ESCAPES)) {
  ESCAPES[ESCAPES[key] as string] = key
}

const ESCAPER = new RegExp('\\\\|\'|\\r|\\n|\\t|' + LINE_SEPARATOR + '|' + PARAGRAPH_SEPARATOR, 'g')
const UNESCAPER = /\\(\\|'|r|n|t|u2028|u2029)/g
const NO_MATCH = /.^/

function unescapeCode(code: string): string {
  return code.replace(UNESCAPER, (_match, escape) => ESCAPES[escape] as string)
}

/**
 * Minimal helper object exposed as `_` inside compiled template bodies
 * (e.g. `<! _.each(items, function(item) { !>...<!- }); !>`), matching the
 * legacy template engine's API surface.
 */
const templateHelpers = {
  each(obj: unknown, iterator: (value: unknown, key: unknown, obj: unknown) => void, context?: unknown): void {
    if (obj == null) return

    if (Array.isArray(obj) || typeof (obj as { length?: number }).length === 'number') {
      const list = obj as ArrayLike<unknown>
      for (let i = 0; i < list.length; i++) {
        iterator.call(context, list[i], i, obj)
      }
    } else {
      for (const key in obj as Record<string, unknown>) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          iterator.call(context, (obj as Record<string, unknown>)[key], key, obj)
        }
      }
    }
  },
  has(obj: unknown, key: PropertyKey): boolean {
    return Object.prototype.hasOwnProperty.call(obj, key)
  },
  defaults<T extends object>(obj: T, ...sources: Array<Partial<T>>): T {
    for (const source of sources) {
      for (const prop in source) {
        if ((obj as Record<string, unknown>)[prop] == null) {
          ;(obj as Record<string, unknown>)[prop] = source[prop]
        }
      }
    }
    return obj
  }
}

/**
 * Underscore-style micro template compiler. Delimiters default to
 * `<! ... !>` / `<!= ... !>` / `<!- ... !>` (see `settings`), matching the
 * legacy `util.template` module's convention. The compiled body also has
 * access to `print(...)`, matching the original.
 *
 * Compiles with `new Function`, so it must never be fed untrusted template
 * strings.
 */
export function template(text: string, data?: unknown, settings: TemplateSettings = {}): string | CompiledTemplate {
  let source =
    "__p+='" +
    text
      .replace(ESCAPER, (match) => '\\' + (ESCAPES[match] as string))
      .replace(settings.escape || NO_MATCH, (_match, code: string) => "'+\nescape(" + unescapeCode(code) + ")+\n'")
      .replace(settings.interpolate || NO_MATCH, (_match, code: string) => "'+\n(" + unescapeCode(code) + ")+\n'")
      .replace(settings.evaluate || NO_MATCH, (_match, code: string) => "';\n" + unescapeCode(code) + "\n;__p+='") +
    "';\n"

  if (!settings.variable) {
    source = 'with(obj||{}){\n' + source + '}\n'
  }

  source = "var __p='';var print=function(){__p+=Array.prototype.join.call(arguments,'')};\n" + source + 'return __p;\n'

  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  const render = new Function(settings.variable || 'obj', '_', source) as (obj: unknown, helpers: typeof templateHelpers) => string

  if (data) return render(data, templateHelpers)

  const compiled = ((templateData?: unknown) => render(templateData, templateHelpers)) as CompiledTemplate
  compiled.source = 'function(' + (settings.variable || 'obj') + '){\n' + source + '}'

  return compiled
}
