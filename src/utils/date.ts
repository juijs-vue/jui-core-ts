const MMMM = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const MMM = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const DDDD = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const DDD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function pad(value: number, len = 2): string {
  let s = String(value)
  while (s.length < len) s = '0' + s
  return s
}

/**
 * `date` formatting with a `yyyy-MM-dd HH:mm:ss` style token language.
 * Tokens: y/yy/yyyy, M/MM/MMM/MMMM, d/dd/ddd/dddd, H/HH, h/hh, m/mm, s/ss,
 * f/ff/fff, T/TT (AM/PM), t/tt, K (timezone). Escape with `\`.
 */
export function dateFormat(date: Date, formatStr: string, utc = false): string {
  let format = formatStr

  const y = utc ? date.getUTCFullYear() : date.getFullYear()
  format = format.replace(/(^|[^\\])yyyy+/g, '$1' + y)
  format = format.replace(/(^|[^\\])yy/g, '$1' + String(y).substr(2, 2))
  format = format.replace(/(^|[^\\])y/g, '$1' + y)

  const M = (utc ? date.getUTCMonth() : date.getMonth()) + 1
  format = format.replace(/(^|[^\\])MMMM+/g, '$1\x00')
  format = format.replace(/(^|[^\\])MMM/g, '$1\x01')
  format = format.replace(/(^|[^\\])MM/g, '$1' + pad(M))
  format = format.replace(/(^|[^\\])M/g, '$1' + M)

  const d = utc ? date.getUTCDate() : date.getDate()
  format = format.replace(/(^|[^\\])dddd+/g, '$1\x02')
  format = format.replace(/(^|[^\\])ddd/g, '$1\x03')
  format = format.replace(/(^|[^\\])dd/g, '$1' + pad(d))
  format = format.replace(/(^|[^\\])d/g, '$1' + d)

  const H = utc ? date.getUTCHours() : date.getHours()
  format = format.replace(/(^|[^\\])HH+/g, '$1' + pad(H))
  format = format.replace(/(^|[^\\])H/g, '$1' + H)

  const h = H > 12 ? H - 12 : H === 0 ? 12 : H
  format = format.replace(/(^|[^\\])hh+/g, '$1' + pad(h))
  format = format.replace(/(^|[^\\])h/g, '$1' + h)

  const m = utc ? date.getUTCMinutes() : date.getMinutes()
  format = format.replace(/(^|[^\\])mm+/g, '$1' + pad(m))
  format = format.replace(/(^|[^\\])m/g, '$1' + m)

  const s = utc ? date.getUTCSeconds() : date.getSeconds()
  format = format.replace(/(^|[^\\])ss+/g, '$1' + pad(s))
  format = format.replace(/(^|[^\\])s/g, '$1' + s)

  let f = utc ? date.getUTCMilliseconds() : date.getMilliseconds()
  format = format.replace(/(^|[^\\])fff+/g, '$1' + pad(f, 3))
  f = Math.round(f / 10)
  format = format.replace(/(^|[^\\])ff/g, '$1' + pad(f))
  f = Math.round(f / 10)
  format = format.replace(/(^|[^\\])f/g, '$1' + f)

  const T = H < 12 ? 'AM' : 'PM'
  format = format.replace(/(^|[^\\])TT+/g, '$1' + T)
  format = format.replace(/(^|[^\\])T/g, '$1' + T.charAt(0))

  const t = T.toLowerCase()
  format = format.replace(/(^|[^\\])tt+/g, '$1' + t)
  format = format.replace(/(^|[^\\])t/g, '$1' + t.charAt(0))

  let tz = -date.getTimezoneOffset()
  let K = utc || !tz ? 'Z' : tz > 0 ? '+' : '-'
  if (!utc) {
    tz = Math.abs(tz)
    K += pad(Math.floor(tz / 60)) + ':' + pad(tz % 60)
  }
  format = format.replace(/(^|[^\\])K/g, '$1' + K)

  const day = (utc ? date.getUTCDay() : date.getDay()) + 1
  format = format.replace(/\x02/g, DDDD[day] as string)
  format = format.replace(/\x03/g, DDD[day] as string)
  format = format.replace(/\x00/g, MMMM[M - 1] as string)
  format = format.replace(/\x01/g, MMM[M - 1] as string)

  format = format.replace(/\\(.)/g, '$1')

  return format
}

/** `["<prefix>", timestamp, random(0-99)].join("-")` */
export function createId(key = 'id'): string {
  return [key, Date.now(), Math.round(Math.random() * 100) % 100].join('-')
}
