import { Base64 } from './base64.js'
import { inArray } from './object.js'
import { startsWith, endsWith } from './object.js'

export interface CsvOptions {
  fields: string[]
  rows: Array<Record<string, unknown>>
  names?: string[] | null
  types?: Array<'string' | 'integer' | 'float' | undefined> | null
  count?: number
}

function csvCell(value: unknown): string | number {
  return isNaN(value as number) ? '"' + String(value) + '"' : (value as number)
}

/** Converts `dataList` (an array of flat records) to CSV text using `keys` as columns. */
export function dataToCsv(keys: string[], dataList: Array<Record<string, unknown>>, dataSize?: number): string {
  const len = dataSize ?? dataList.length
  let csv = ''

  for (let i = -1; i < len; i++) {
    const row: Array<string | number> = []

    for (const key of keys) {
      if (!key) continue
      row.push(i === -1 ? '"' + key + '"' : csvCell(dataList[i]?.[key]))
    }

    csv += row.join(',') + '\n'
  }

  return csv
}

/** Richer variant of {@link dataToCsv} supporting column renaming and per-column typing. */
export function dataToCsv2(options: CsvOptions): string {
  const opts: Required<Omit<CsvOptions, 'names' | 'types'>> & Pick<CsvOptions, 'names' | 'types'> = {
    fields: options.fields,
    rows: options.rows,
    names: options.names ?? null,
    types: options.types ?? null,
    count: options.count ?? options.rows.length
  }

  let csv = ''

  for (let i = -1; i < opts.count; i++) {
    const row: Array<string | number> = []

    for (let j = 0; j < opts.fields.length; j++) {
      const field = opts.fields[j]
      if (!field) continue

      if (i === -1) {
        row.push('"' + (opts.names?.[j] || field) + '"')
        continue
      }

      const value = opts.rows[i]?.[field]

      if (opts.types) {
        const type = opts.types[j]
        if (type === 'string') row.push('"' + String(value) + '"')
        else if (type === 'integer') row.push(parseInt(String(value), 10))
        else if (type === 'float') row.push(parseFloat(String(value)))
        else row.push(value as string | number)
      } else {
        row.push(csvCell(value))
      }
    }

    csv += row.join(',') + '\n'
  }

  return csv
}

/** Parses CSV text (as produced by {@link dataToCsv}) back into records. `csvNumber` lists keys to parse as floats. */
export function csvToData(keys: string[], csv: string, csvNumber: string[] = []): Array<Record<string, unknown>> {
  const dataList: Array<Record<string, unknown>> = []
  const rows = csv.split('\n')

  for (let i = 1; i < rows.length; i++) {
    const line = rows[i]
    if (!line) continue

    // NOTE: does not handle commas embedded inside quoted values, matching the legacy parser.
    const cells = line.split(',')
    const data: Record<string, unknown> = {}

    for (let j = 0; j < keys.length; j++) {
      const key = keys[j] as string
      let cell = cells[j] as string

      if (startsWith(cell, '"') && endsWith(cell, '"')) {
        cell = cell.split('"').join('')
      }

      data[key] = inArray(key, csvNumber) !== -1 ? parseFloat(cell) : cell
    }

    dataList.push(data)
  }

  return dataList
}

export function getCsvFields(fields: string[], csvFields?: string[] | null): string[] {
  const list = Array.isArray(csvFields) ? csvFields.slice() : fields

  return list.map((f) => (isNaN(Number(f)) ? f : (fields[Number(f)] as string)))
}

export function fileToCsv(file: File, callback: (content: string) => void): void {
  const reader = new FileReader()

  reader.onload = (event) => {
    callback((event.target?.result as string) ?? '')
  }

  reader.readAsText(file)
}

export function csvToBase64(csv: string): string {
  return 'data:application/octet-stream;base64,' + Base64.encode(csv)
}

export function svgToBase64(xml: string): string {
  return 'data:image/svg+xml;base64,' + Base64.encode(xml)
}
