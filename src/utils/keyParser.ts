/** Parses/manipulates dot-delimited tree indexes such as `"1.0.3"`. */
export class KeyParser {
  /** True if `index` is a string containing at least one `.` (i.e. depth &gt; 1, such as `"1.0"`). A non-string, or a single-segment string like `"1"`, is `false`. */
  isIndexDepth(index: unknown): boolean {
    return typeof index === 'string' && index.indexOf('.') !== -1
  }

  /** Splits a dot-delimited index into its numeric segments, e.g. `"1.0.3"` -> `[1, 0, 3]`. */
  getIndexList(index: string | number): number[] {
    return String(index)
      .split('.')
      .map((part) => parseInt(part, 10))
  }

  /**
   * Re-roots `index` under `targetIndex`: drops as many leading segments from `index` as
   * `rootIndex` has (i.e. the part of `index` "below" `rootIndex`), then prepends `targetIndex`'s
   * segments in front of what remains. Used to compute a node's new index after moving its
   * ancestor subtree from `rootIndex` to `targetIndex`.
   */
  changeIndex(index: string, targetIndex: string, rootIndex: string): string {
    const rootIndexLen = this.getIndexList(rootIndex).length
    const indexList = this.getIndexList(index)
    const targetIndexList = this.getIndexList(targetIndex)

    for (let i = 0; i < rootIndexLen; i++) {
      indexList.shift()
    }

    return targetIndexList.concat(indexList).join('.')
  }

  /** Returns the "next sibling" index: increments the last segment by 1, e.g. `"1.2"` -> `"1.3"`. */
  getNextIndex(index: string): string {
    const indexList = this.getIndexList(index)
    const no = (indexList.pop() as number) + 1

    indexList.push(no)
    return indexList.join('.')
  }

  /** Returns `index` with its last segment dropped (e.g. `"1.2.3"` -> `"1.2"`), or `null` if `index` has no `.` (no parent). */
  getParentIndex(index: string): string | null {
    if (!this.isIndexDepth(index)) return null

    return index.substring(0, index.lastIndexOf('.'))
  }
}
