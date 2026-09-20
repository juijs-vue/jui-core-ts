/** True on touch-capable devices; used to remap mouse events to their touch equivalents. */
export const isTouch: boolean =
  typeof navigator !== 'undefined' && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
