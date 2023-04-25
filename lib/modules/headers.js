
export const HEADERS = {
  CONTENT_LENGTH: 'Content-Length',
  Date: new Date(),
  ETag: 'ETag',
  CONTENT_DISPOSITION: 'Content-Disposition',
  CONTENT_SECURITY_POLICY: 'Content-Security-Policy',
  DISPOSITION: {
    INLINE: 'inline',
    attachment: (filePath) => {
      const fileName = filePath.substring(filePath.lastIndexOf('/') + 1)
      return `attachment; filename="${fileName}"`
    }
  }
}

export default class Header {
  constructor (header, value) {
    this.header = header
    this.value = value
  }

  get args () {
    return [this.header, this.value]
  }

  static securityPolicy (policy = null) {
    return policy
      ? new Header('Content-Security-Policy', policy)
      : new Header(
        'Content-Security-Policy',
        'default-src \'self\';base-uri \'self\';block-all-mixed-content;font-src \'self\' https: data:;frame-ancestors \'self\';img-src \'self\' data:;object-src \'none\';script-src \'self\';script-src-attr \'none\';style-src \'self\' https: \'unsafe-inline\''
      )
  }

  static referrer (policy = null) {
    return policy
      ? new Header('Referrer-Policy', policy)
      : new Header(
        'Referrer-Policy',
        'strict-origin-when-cross-origin'
      )
  }

  static disposition (filePath) {
    const fileName = filePath.substring(
      filePath.lastIndexOf('/') + 1
    )
    return new Header(
      'Content-Disposition',
      `attachment; filename="${fileName}"`
    )
  }
}

const DEFAULT_HEADERS = {
  REFERRER_POLICY: 'strict-origin-when-cross-origin',
  SECURITY_POLICY: 'default-src \'self\';base-uri \'self\';block-all-mixed-content;font-src \'self\' https: data:;frame-ancestors \'self\';img-src \'self\' data:;object-src \'none\';script-src \'self\';script-src-attr \'none\';style-src \'self\' https: \'unsafe-inline\'',
  STRICT_TRANSPORT: 'max-age=15552000; includeSubDomains',
  VARY: 'Accept-Encoding'
}

export class ConfigureHeaders {
  constructor (options = {}) {
    this.headers = options.headers && Array.isArray(options.headers) ? options.headers : []
    this.batch = []

    if (typeof options.referrer !== 'undefined') {
      if (typeof options.referrer === 'string') {
        this.batch.push({ 'Referrer-Policy': options.referrer })
      } else if (options.referrer === true) {
        this.batch.push({ 'Referrer-Policy': DEFAULT_HEADERS.REFERRER_POLICY })
      }
    }

    if (typeof options.securityPolicy !== 'undefined') {
      if (typeof options.securityPolicy === 'string') {
        this.batch.push({ 'Content-Security-Policy': options.securityPolicy })
      } else if (options.securityPolicy === true) {
        this.batch.push({ 'Content-Security-Policy': DEFAULT_HEADERS.SECURITY_POLICY })
      }
    }

    if (typeof options.strictTransportSecurity !== 'undefined') {
      if (typeof options.strictTransportSecurity === 'string') {
        this.batch.push({ 'Strict-Transport-Security': options.strictTransportSecurity })
      } else if (options.strictTransportSecurity === true) {
        this.batch.push({ 'Strict-Transport-Security': DEFAULT_HEADERS.STRICT_TRANSPORT })
      }
    }

    if (typeof options.xContentTypeOptions !== 'undefined') {
      if (typeof options.xContentTypeOptions === 'string') {
        this.batch.push({ 'X-Content-Type-Options': options.xContentTypeOptions })
      } else if (options.xContentTypeOptions === true) {
        this.batch.push({ 'X-Content-Type-Options': 'nosniff' })
      }
    }

    if (typeof options.vary !== 'undefined') {
      if (typeof options.vary === 'string') {
        this.batch.push({ Vary: options.vary })
      } else if (options.vary === true) {
        this.batch.push({ Vary: DEFAULT_HEADERS.VARY })
      }
    }

    if (typeof options.xPoweredBy === 'boolean') {
      if (options.xPoweredBy !== false) {
        this.batch.push({ 'X-Powered-By': 'Neumatter' })
      }
    } else {
      this.batch.push({ 'X-Powered-By': 'Neumatter' })
    }

    this.set = this.set.bind(this)
  }

  set (req, res, next) {
    if (this.batch.length) {
      res.set(...this.batch)
    }

    let index = this.headers.length

    while (--index >= 0) {
      if (typeof this.headers[index] === 'object') {
        Array.isArray(this.headers[index])
          ? res.set(...this.headers[index])
          : res.set(this.headers[index])
      }
    }

    next()
  }
}
