
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
    this.referrer = options.referrer
      ? ['Referrer-Policy', options.referrer]
      : ['Referrer-Policy', DEFAULT_HEADERS.REFERRER_POLICY]
    this.securityPolicy = options.securityPolicy
      ? ['Content-Security-Policy', options.securityPolicy]
      : ['Content-Security-Policy', DEFAULT_HEADERS.SECURITY_POLICY]
    this.meta = {
      strictTransportSecurity: options.strictTransportSecurity !== false,
      xContentTypeOptions: options.xContentTypeOptions !== false,
      vary: options.vary !== false
    }
    this.strictTransportSecurity = ['Strict-Transport-Security', DEFAULT_HEADERS.STRICT_TRANSPORT]
    this.xContentTypeOptions = ['X-Content-Type-Options', 'nosniff']
    this.vary = options.vary ? ['Vary', options.vary] : ['Vary', DEFAULT_HEADERS.VARY]
    this.xPoweredBy = options.xPoweredBy === false ? null : ['X-Powered-By', 'Neumatter']
    this.set = this.set.bind(this)
  }

  set (req, res, next) {
    res
      .set(...this.referrer)
      .set(...this.securityPolicy)
    for (const header of this.headers) {
      if (Array.isArray(header)) {
        res.set(...header)
      } else if (typeof header === 'object') {
        res.set(...header)
      }
    }
    if (this.meta.strictTransportSecurity) res.set(...this.strictTransportSecurity)
    // if (this.meta.xContentTypeOptions) res.set(...this.xContentTypeOptions)
    if (this.meta.vary) res.set(...this.vary)
    if (this.xPoweredBy) res.set(...this.xPoweredBy)
    next()
  }
}
