
import nodePath from 'path'

export default class MIME {
  static CONTENT_TYPE = 'Content-Type'
  static CONTENT_TYPE_OPTIONS = 'X-Content-Type-Options'
  static OPTIONS = {
    NOSNIFF: 'nosniff'
  }

  static HEADERS = {
    JSON: 'application/json; charset=UTF-8',
    TXT: 'text/plain; charset=UTF-8',
    JS: 'text/javascript; charset=UTF-8',
    HTML: 'text/html; charset=UTF-8',
    XHTML: 'text/xhtml',
    CSS: 'text/css; charset=UTF-8',
    PNG: 'image/png',
    JPG: 'image/jpeg',
    OCTET_STREAM: 'application/octet-stream',
    MULTIPART_FORM: 'multipart/form-data',
    ZIP: 'application/zip',
    PDF: 'application/pdf',
    PKCS8: 'application/pkcs8',
    MPEG: 'audio/mpeg',
    SVG: 'image/svg+xml',
    CSV: 'text/csv',
    MP4: 'video/mp4',
    WEBP: 'image/webp',
    WEBM: 'video/webm',
    WOFF2: 'font/woff2',
    APNG: 'image/apng',
    AVIF: 'image/avif',
    GIF: 'image/gif'
  }

  static typify (path) {
    const extUpperCase = ext => {
      return nodePath
        .extname(ext)
        .replace('.', '')
        .toUpperCase()
    }
    const formatJPG = input => (input === 'JPEG' ? 'JPG' : input)
    const ext = formatJPG(extUpperCase(path))
    if (!MIME.HEADERS[ext]) {
      const withoutExt = path.replace(`.${ext}`, '')
      const secondExt = formatJPG(extUpperCase(withoutExt))
      return MIME.HEADERS[secondExt] || null
    } else {
      return MIME.HEADERS[ext]
    }
  }

  static typeFromPath (path) {
    return new MIME(path).header
  }

  constructor (path) {
    this.type = MIME.typify(path)
  }

  get args () {
    return [MIME.CONTENT_TYPE, this.type]
  }
}
