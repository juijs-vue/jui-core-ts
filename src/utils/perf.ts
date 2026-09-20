/** Runs `callback` synchronously and logs its wall-clock time via `console.warn`. */
export function runtime(name: string, callback: () => void): void {
  const start = Date.now()
  callback()
  const end = Date.now()

  console.warn(`${name} : ${end - start}ms`)
}
