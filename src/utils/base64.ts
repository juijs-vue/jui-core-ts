const KEY_STR = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/='

function utf8Encode(str: string): string {
  const normalized = str.replace(/\r\n/g, '\n')
  let output = ''

  for (let n = 0; n < normalized.length; n++) {
    const c = normalized.charCodeAt(n)

    if (c < 128) {
      output += String.fromCharCode(c)
    } else if (c > 127 && c < 2048) {
      output += String.fromCharCode((c >> 6) | 192)
      output += String.fromCharCode((c & 63) | 128)
    } else {
      output += String.fromCharCode((c >> 12) | 224)
      output += String.fromCharCode(((c >> 6) & 63) | 128)
      output += String.fromCharCode((c & 63) | 128)
    }
  }

  return output
}

function utf8Decode(utfText: string): string {
  let str = ''
  let i = 0

  while (i < utfText.length) {
    const c = utfText.charCodeAt(i)

    if (c < 128) {
      str += String.fromCharCode(c)
      i++
    } else if (c > 191 && c < 224) {
      const c2 = utfText.charCodeAt(i + 1)
      str += String.fromCharCode(((c & 31) << 6) | (c2 & 63))
      i += 2
    } else {
      const c2 = utfText.charCodeAt(i + 1)
      const c3 = utfText.charCodeAt(i + 2)
      str += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63))
      i += 3
    }
  }

  return str
}

/** Base64 encode/decode utility (kept for parity with the legacy `util.base64` module). */
export const Base64 = {
  encode(input: string): string {
    let output = ''
    let i = 0
    const utf8 = utf8Encode(input)

    while (i < utf8.length) {
      const chr1 = utf8.charCodeAt(i++)
      const chr2 = utf8.charCodeAt(i++)
      const chr3 = utf8.charCodeAt(i++)

      const enc1 = chr1 >> 2
      let enc2 = ((chr1 & 3) << 4) | (chr2 >> 4)
      let enc3 = ((chr2 & 15) << 2) | (chr3 >> 6)
      let enc4 = chr3 & 63

      if (isNaN(chr2)) {
        enc3 = enc4 = 64
      } else if (isNaN(chr3)) {
        enc4 = 64
      }

      output += KEY_STR.charAt(enc1) + KEY_STR.charAt(enc2) + KEY_STR.charAt(enc3) + KEY_STR.charAt(enc4)
    }

    return output
  },

  decode(input: string): string {
    let output = ''
    let i = 0
    const cleaned = input.replace(/[^A-Za-z0-9+/=]/g, '')

    while (i < cleaned.length) {
      const enc1 = KEY_STR.indexOf(cleaned.charAt(i++))
      const enc2 = KEY_STR.indexOf(cleaned.charAt(i++))
      const enc3 = KEY_STR.indexOf(cleaned.charAt(i++))
      const enc4 = KEY_STR.indexOf(cleaned.charAt(i++))

      const chr1 = (enc1 << 2) | (enc2 >> 4)
      const chr2 = ((enc2 & 15) << 4) | (enc3 >> 2)
      const chr3 = ((enc3 & 3) << 6) | enc4

      output += String.fromCharCode(chr1)
      if (enc3 !== 64) output += String.fromCharCode(chr2)
      if (enc4 !== 64) output += String.fromCharCode(chr3)
    }

    return utf8Decode(output)
  }
}

/** `util.base`-level aliases for `Base64.encode`/`Base64.decode`. */
export function btoa(input: string): string {
  return Base64.encode(input)
}

export function atob(input: string): string {
  return Base64.decode(input)
}
