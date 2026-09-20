/** Parses/manipulates dot-delimited tree indexes such as `"1.0.3"`. */
export class KeyParser {
  isIndexDepth(index: unknown): boolean {
    return typeof index === 'string' && index.indexOf('.') !== -1
  }

  getIndexList(index: string | number): number[] {
    return String(index)
      .split('.')
      .map((part) => parseInt(part, 10))
  }

  changeIndex(index: string, targetIndex: string, rootIndex: string): string {
    const rootIndexLen = this.getIndexList(rootIndex).length
    const indexList = this.getIndexList(index)
    const targetIndexList = this.getIndexList(targetIndex)

    for (let i = 0; i < rootIndexLen; i++) {
      indexList.shift()
    }

    return targetIndexList.concat(indexList).join('.')
  }

  getNextIndex(index: string): string {
    const indexList = this.getIndexList(index)
    const no = (indexList.pop() as number) + 1

    indexList.push(no)
    return indexList.join('.')
  }

  getParentIndex(index: string): string | null {
    if (!this.isIndexDepth(index)) return null

    return index.substring(0, index.lastIndexOf('.'))
  }
}
