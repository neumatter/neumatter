import multipart from 'parse-multipart-data'
import ByteView from 'byteview'

function parseJSON (input) {
  return JSON.parse(input, (key, value) => {
    let res

    switch (typeof value) {
      case 'object':
        res = typeof value.type === 'string' && value.type === 'ByteView'
          ? ByteView.from(value.data, 'base64')
          : value
        break
      default:
        res = value
        break
    }

    return res
  })
}

const hasBody = method => ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method.toUpperCase())

export default class BodyParser {
  constructor (fallback) {
    this.default = fallback
  }

  async read (req) {
    let body = ''

    for await (const chunk of req) {
      body += chunk
    }

    return body
  }

  async readAsBuffer (req) {
    const body = []

    for await (const chunk of req) {
      body.push(ByteView.from(chunk))
    }

    return ByteView.concat(body)
  }

  async json (req) {
    const body = await this.read(req)
    return parseJSON(body)
  }

  async raw (req) {
    const body = await this.read(req)
    return body
  }

  async text (req) {
    const body = await this.read(req)
    return String(body)
  }

  async urlencoded (req) {
    const body = await this.read(req)
    const urlSearchParam = new URLSearchParams(String(body))
    return Object.fromEntries(urlSearchParam.entries())
  }

  async multipart (req) {
    const contentType = req.get('Content-Type')
    const data = await this.readAsBuffer(req)
    const boundary = contentType.slice(contentType.indexOf('=') + 1)
    const parts = multipart.parse(data, boundary)
    if (parts.length === 1) return parts[0]
    return parts
  }

  parse (req) {
    if (!hasBody(req.method)) {
      return {}
    }

    const contentType = String(req.get('Content-Type'))

    switch (contentType) {
      case 'application/json':
        return this.json(req)
      case 'application/x-www-form-urlencoded':
        return this.urlencoded(req)
      case 'text/plain':
        return this.text(req)
      default:
        if (contentType.indexOf('multipart/form-data') !== -1) {
          return this.multipart(req)
        } else {
          return this[this.default](req)
        }
    }
  }
}
