'use strict'

import { ServerResponse } from 'http'
import { open, stat } from 'fs/promises'
import IS from '@neumatter/is'
import NeuPack from 'neupack'
import MIME from './modules/mime.js'
import NeuJSON from './modules/json.js'
import Header, { HEADERS } from './modules/headers.js'
import { pipeline } from 'stream/promises'
import { NeuError, NeuTypeError } from './modules/error.js'
import { toBuiltinType } from './modules/utilities.js'
import ETag from './modules/etag.js'

/**
 *
 * Created internally by the Server.
 * @extends ServerResponse
 */
export default class NeuResponse extends ServerResponse {
  constructor (req) {
    super(req)
    this.hasType = false
    this.locals = {
      currentUrl: this.req.URL.pathname.replace(/\/$/, ''),
      isActiveBase: (link) => {
        const testThis = req.originalUrl.match(/^\/[^/]*/)[0] || ''
        const testedLink = link.match(/^\/[^/]*/)[0] || 'none'
        return testedLink === testThis ? 'active' : ''
      },
      isActive: (link) => {
        return this.locals.currentUrl === link ? 'active' : ''
      }
    }
    this.viewer = null
    this.router = ''
  }

  get sent () {
    return this.headersSent
  }

  get isHead () {
    return this.req.method === 'HEAD'
  }

  get hasContentLength () {
    return this.hasHeader('content-length')
  }

  get (input) {
    const type = toBuiltinType(input)

    const map = {
      array: () => {
        const result = {}
        NeuPack.each(input, key => {
          result[key] = this.getHeader(key)
        })
        return result
      },
      string: () => this.getHeader(input),
      undefined: () => this.getHeaders()
    }

    try {
      return map[type]()
    } catch (err) {
      throw new NeuError('NeuResponse.get: Could not recognize type of input. Accepts: [undefined, Array<strings>, string]')
    }
  }

  set (input, value) {
    if (this.sent) return this
    const type = toBuiltinType(input)

    const map = {
      object: () => {
        const keys = Object.keys(input)
        NeuPack.each(keys, key => {
          const keyVal = input[key]
          if (keyVal) {
            this.setHeader(key, keyVal)
          }
        })
        return this
      },
      array: () => {
        NeuPack.each(input, header => {
          if (!IS.object(header)) throw new NeuTypeError(header, 'object')
          this.set(header)
        })
        return this
      },
      string: () => {
        this.setHeader(input, value)
        return this
      }
    }

    try {
      return map[type]()
    } catch (err) {
      throw new NeuError('NeuResponse.set: Could not recognize type of input. Accepts: [object, array, string]')
    }
  }

  /**
   *
   * @param {number} code
   * @returns {NeuResponse}
   */
  status (code) {
    if (IS.undefined(code)) return this.statusCode
    this.statusCode = code
    return this
  }

  redirect (address) {
    this.set('Location', address)
    this.status(302)
    this.end()
  }

  send (message) {
    const testType = this.get(MIME.CONTENT_TYPE)
    if (!testType) this.set(MIME.CONTENT_TYPE, MIME.HEADERS.JSON)
    if (!this.statusCode) this.status(200)
    if (!this.hasContentLength) {
      const chunk = !Buffer.isBuffer(message)
        ? Buffer.from(message)
        : message
      this.set(HEADERS.CONTENT_LENGTH, chunk.length)
      const etag = ETag.from(chunk, { weak: true })
      if (etag) this.set('ETag', etag)
    }
    if (this.isHead) return this.end()
    this.end(message)
  }

  json (message) {
    NeuJSON.stringify(message)
      .then(body => {
        this.set(MIME.CONTENT_TYPE, MIME.HEADERS.JSON)
        this.hasType = true
        this.send(body)
      })
      .catch(err => {
        throw new NeuError(err)
      })
  }

  html (message) {
    this.setHeader(MIME.CONTENT_TYPE, MIME.HEADERS.HTML)
    this.hasType = true
    this.send(message)
  }

  download (filePath, options = { headers: null }) {
    return this
      .set(...Header.disposition(filePath).args)
      .file(filePath, options)
  }

  file (filePath, options) {
    if (this.sent) return this.end()
    if (this.isHead) return this.end()
    const opts = options || { headers: null }
    const { headers } = opts
    open(filePath)
      .then(async fd => {
        const fileStream = fd.createReadStream()
        const stats = await stat(filePath)
        this
          .set(...new MIME(filePath).args)
          .set(HEADERS.CONTENT_LENGTH, stats.size)
        if (IS.object(headers)) {
          const keys = Object.keys(headers)
          NeuPack.each(keys, key => {
            this.setHeader(key, headers[key])
          })
        }
        await pipeline(fileStream, this)
      })
      .catch(err => {
        console.error(new NeuError(err, { status: 404 }))
      })
  }

  async render (file, options) {
    if (!this.viewer) throw new Error('No viewEngine specified.')
    const type = toBuiltinType(file)
    let data = {}

    switch (type) {
      case 'string':
        data = options
          ? { locals: this.locals, ...options }
          : { locals: this.locals }
        break
      case 'object':
        options = file
        data = { locals: this.locals, ...options }
        file = this.router
        break
      case 'undefined':
        data = { locals: this.locals }
        file = this.router
        break
    }

    try {
      const renderedView = await this.viewer.render(file, data)
      this.html(renderedView)
    } catch (err) {
      throw new NeuError(err, { status: 404 })
    }
  }
}
