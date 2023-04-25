'use strict'

import { readFile } from 'fs/promises'
import { existsSync, readdirSync, Stats, statSync, createReadStream } from 'fs'
import MIME from './mime.js'
import { NeuError } from './error.js'
import { Stream } from 'stream'
import * as nodePath from 'path'
import { cwd } from 'process'
// import ETag from './etag.js'

export default async function serveStatic (request, response) {
  try {
    const filePath = request.app.staticMap[request.path]
    if (!existsSync(filePath)) {
      throw new NeuError(`NOT FOUND: ${request.path}`, { status: 404 })
    } else {
      if (response.sent) return response.end()
      if (response.isHead) return response.end()
      response.status(200)
      const data = await readFile(filePath)
      const type = new MIME(filePath).args
      if (type[1]) response.set(...type)
      response.send(data)
    }
  } catch (err) {
    console.error(new Error(err).stack)
    request.app.emit('error', new NeuError(err, { status: 404 }), request, response)
  }
}

const UP_PATH_REGEXP = /(?:^|[\\/])\.\.(?:[\\/]|$)/
const STATUS_CODES = {
  100: 'Continue',
  101: 'Switching Protocols',
  102: 'Processing',
  103: 'Early Hints',
  200: 'OK',
  201: 'Created',
  202: 'Accepted',
  203: 'Non-Authoritative Information',
  204: 'No Content',
  205: 'Reset Content',
  206: 'Partial Content',
  207: 'Multi-Status',
  208: 'Already Reported',
  226: 'IM Used',
  300: 'Multiple Choices',
  301: 'Moved Permanently',
  302: 'Found',
  303: 'See Other',
  304: 'Not Modified',
  305: 'Use Proxy',
  307: 'Temporary Redirect',
  308: 'Permanent Redirect',
  400: 'Bad Request',
  401: 'Unauthorized',
  402: 'Payment Required',
  403: 'Forbidden',
  404: 'Not Found',
  405: 'Method Not Allowed',
  406: 'Not Acceptable',
  407: 'Proxy Authentication Required',
  408: 'Request Timeout',
  409: 'Conflict',
  410: 'Gone',
  411: 'Length Required',
  412: 'Precondition Failed',
  413: 'Payload Too Large',
  414: 'URI Too Long',
  415: 'Unsupported Media Type',
  416: 'Range Not Satisfiable',
  417: 'Expectation Failed',
  418: "I'm a Teapot",
  421: 'Misdirected Request',
  422: 'Unprocessable Entity',
  423: 'Locked',
  424: 'Failed Dependency',
  425: 'Too Early',
  426: 'Upgrade Required',
  428: 'Precondition Required',
  429: 'Too Many Requests',
  431: 'Request Header Fields Too Large',
  451: 'Unavailable For Legal Reasons',
  500: 'Internal Server Error',
  501: 'Not Implemented',
  502: 'Bad Gateway',
  503: 'Service Unavailable',
  504: 'Gateway Timeout',
  505: 'HTTP Version Not Supported',
  506: 'Variant Also Negotiates',
  507: 'Insufficient Storage',
  508: 'Loop Detected',
  509: 'Bandwidth Limit Exceeded',
  510: 'Not Extended',
  511: 'Network Authentication Required'
}

function getStaticFiles (path, root) {
  path = nodePath.resolve(cwd(), path)
  if (!root) {
    root = path.slice(path.lastIndexOf(nodePath.sep) + 1)
  }
  const maybeFiles = readdirSync(path)
  const { length } = maybeFiles
  let index = -1
  let response = {}

  while (++index < length) {
    const filePath = nodePath.join(path, maybeFiles[index])
    if (statSync(filePath).isDirectory()) {
      const subfiles = getStaticFiles(filePath, root)
      response = { ...response, ...subfiles }
    } else {
      const parts = filePath.split(nodePath.sep)
      if (includesDotFile(parts)) {
        continue
      }
      let file = parts.slice(parts.indexOf(root) + 1).join('/')
      if (file[0] !== '/') file = '/' + file
      if (file) response[file] = filePath
    }
  }

  return response
}

const CACHE_CONTROL_NO_CACHE_REGEXP = /(?:^|,)\s*?no-cache\s*?(?:,|$)/

class SendStream extends Stream {
  #acceptRanges = true
  #cacheControl = true
  #etag = true
  #dotFiles = false
  #lastModified = true
  #maxAge = 0
  #json = false
  /** @type {import('../response').default} */
  res

  /**
   *
   * @param {import('../request').default} req
   * @param {string} root
   * @param {*} options
   */
  constructor (req, path, options = {}) {
    super()
    this.options = options

    this.path = path
    this.req = req
  }

  get isConditionalGET () {
    return this.req.headers['if-match'] ||
      this.req.headers['if-unmodified-since'] ||
      this.req.headers['if-none-match'] ||
      this.req.headers['if-modified-since']
  }

  get isCachable () {
    const statusCode = this.res.statusCode
    return (statusCode >= 200 && statusCode < 300) ||
      statusCode === 304
  }

  get isFresh () {
    return fresh(this.req.headers, {
      etag: this.res.getHeader('ETag'),
      'last-modified': this.res.get('Last-Modified')
    })
  }

  notModified () {
    this.res.removeHeader('Content-Encoding')
    this.res.removeHeader('Content-Language')
    this.res.removeHeader('Content-Length')
    this.res.removeHeader('Content-Range')
    this.res.removeHeader('Content-Type')
    this.res.statusCode = 304
    this.res.end()
  }

  isPreconditionFailure () {
    // if-match
    const match = this.req.headers['if-match']
    if (match) {
      const etag = this.res.getHeader('ETag')
      return !etag || (match !== '*' && parseTokenList(match).every(function (match) {
        return match !== etag && match !== 'W/' + etag && 'W/' + match !== etag
      }))
    }

    // if-unmodified-since
    const unmodifiedSince = parseHttpDate(this.req.headers['if-unmodified-since'])
    if (!isNaN(unmodifiedSince)) {
      const lastModified = parseHttpDate(this.res.getHeader('Last-Modified'))
      return isNaN(lastModified) || lastModified > unmodifiedSince
    }

    return false
  }

  error (status, err) {
    // emit if listeners instead of responding
    if (this.listenerCount('error') > 0) {
      return this.emit('error', status, err)
    }

    const msg = STATUS_CODES[status] || String(status)
    const doc = createHtmlDocument('Error', escapeHtml(msg))

    // clear existing headers
    clearHeaders(this.res)

    // add error headers
    if (err && err.headers) {
      this.res.set(err.headers)
    }

    // send basic response
    this.res.statusCode = status
    this.res.setHeader('Content-Type', 'text/html; charset=UTF-8')
    this.res.setHeader('Content-Length', Buffer.byteLength(doc))
    this.res.setHeader('Content-Security-Policy', "default-src 'none'")
    this.res.setHeader('X-Content-Type-Options', 'nosniff')
    this.res.end(doc)
  }

  pipe (res) {
    this.res = res
    // malicious path
    if (UP_PATH_REGEXP.test(this.path)) {
      this.error(403)
      return res
    }

    this.send(this.path, this.options.stats)
  }

  send (path, stats) {
    let len = stats.size
    const opts = {}
    let offset = this.options.start || 0

    if (this.res.headersSent) {
      this.error(500, new Error('Can\'t set headers after they are sent.'))
    }
    this.setHeader(path, stats)

    const type = new MIME(path).args
    if (type[1]) this.res.set(...type)

    if (this.isConditionalGET) {
      if (this.isPreconditionFailure()) {
        this.error(412)
        return
      }

      if (this.isCachable && this.isFresh()) {
        this.notModified()
        return
      }
    }

    len = Math.max(0, len - offset)
    if (this.options.end !== undefined) {
      const bytes = this.options.end - offset + 1
      if (len > bytes) len = bytes
    }

    // clone options
    for (const prop in this.options) {
      opts[prop] = this.options[prop]
    }

    // set read options
    opts.start = offset
    opts.end = Math.max(offset, offset + len - 1)

    // content-length
    this.res.set('Content-Length', len)

    // HEAD support
    if (this.req.method === 'HEAD') {
      this.res.end()
      return
    }

    this.stream(path, opts)
  }

  stream (path, options) {
    const stream = createReadStream(path, options)
    this.emit('stream', stream)
    stream.pipe(this.res)

    // cleanup
    function cleanup () {
      destroy(stream)
    }

    // response finished, cleanup
    this.res.on('finish', cleanup)

    // error handling
    stream.on('error', function onerror (err) {
      // clean up stream early
      cleanup()

      // error
      this.onStatError(err)
    })
  }

  onStatError (error) {
    switch (error.code) {
      case 'ENAMETOOLONG':
      case 'ENOENT':
      case 'ENOTDIR':
        this.error(404, error)
        break
      default:
        this.error(500, error)
        break
    }
  }

  /**
   *
   * @param {string} path
   * @param {Stats} stats
   */
  setHeader (path, stats) {
    this.emit('headers', this.res, path, stats)

    if (!this.res.get('Cache-Control')) {
      this.res.set('Cache-Control', 'public, max-age=31536000;')
    }

    if (!this.res.get('Last-Modified')) {
      this.res.set('Last-Modified', stats.mtime.toUTCString())
    }

    if (!this.res.get('ETag')) {
      const mtime = stats.mtime.getTime().toString(16)
      const size = stats.size.toString(16)
      this.res.set('ETag', `W/"${size}-${mtime}"`)
    }
  }
}

function destroy (stream) {
  stream.destroy()

  if (typeof stream.close === 'function') {
    function onOpen () {
      if (typeof this.fd === 'number') {
        // actually close down the fd
        this.close()
      }
    }
    // node.js core bug work-around
    stream.on('open', onOpen)
  }
}

export class StaticFileServer {
  #root

  constructor (root) {
    this.#root = nodePath.resolve(cwd(), root)
  }

  canSend (req) {
    const path = getPath(req)
    const ext = extension(path)

    if (!ext.length) {
      return null
    }

    const filePath = nodePath.join(
      this.#root,
      path.split('/').join(nodePath.sep)
    )

    if (!existsSync(filePath)) {
      return null
    }

    if (includesDotFile(filePath.split(nodePath.sep))) {
      return null
    }

    const stats = statSync(filePath)
    if (stats.isDirectory()) {
      return null
    }

    return [filePath, stats]
  }

  /**
   *
   * @param {import('../request').default} req
   * @param {import('../response').default} res
   * @param {(err: Error | undefined) => void} next
   */
  stream ([filePath, stats]) {
    return (req, res) => {
      const stream = new SendStream(req, filePath, { stats })
      stream.pipe(res)
    }
  }
}

function extension (path) {
  const ext = nodePath.extname(path)
  return ext.length < 2 ? '' : ext.slice(1)
}

function includesDotFile (parts) {
  let index = parts.length
  let includesDotFile = false

  while (--index >= 0) {
    if (parts[index].length > 1 && parts[index][0] === '.') {
      includesDotFile = true
      break
    }
  }

  return includesDotFile
}

/**
 *
 * @param {import('../response').default} res
 */
function clearHeaders (res) {
  const headerNames = res.getHeaderNames()
  let index = headerNames.length

  while (--index >= 0) {
    res.removeHeader(headerNames[index])
  }
}

function createHtmlDocument (title, body) {
  return (
    '<!DOCTYPE html>\n' +
    '<html lang="en">\n' +
    '<head>\n' +
    '  <meta charset="utf-8">\n' +
    '  <style>\n' +
    '    body { font-family:\'-apple-system-font\', system-ui, BlinkMacSystemFont, sans-serif; }\n' +
    '  </style>\n' +
    '  <title>' + title + '</title>\n' +
    '</head>\n' +
    '<body>\n' +
    '  <pre>' + body + '</pre>\n' +
    '</body>\n' +
    '</html>\n'
  )
}

function replaceHTML (str) {
  let res

  switch (str) {
    case '&':
      res = '&amp;'
      break
    case '<':
      res = '&lt;'
      break
    case '>':
      res = '&gt;'
      break
    case '\'':
      res = '&#39;'
      break
    case '"':
      res = '&quot;'
      break
    default:
      res = `&#${str.charCodeAt(0)};`
      break
  }

  return res
}

const HTML_ESCAPE_REGEXP = /["'&<>]/g

function escapeHtml (string) {
  return String(string).replace(HTML_ESCAPE_REGEXP, replaceHTML)
}

function getPath (req) {
  return req.url.length > 1 ? req.url.replace(/\/$/, '').replace(/\/\//g, '/') : req.url
}

/**
 * Check freshness of the response using request and response headers.
 *
 * @param {Object} reqHeaders
 * @param {Object} resHeaders
 * @return {Boolean}
 * @public
 */

function fresh (reqHeaders, resHeaders) {
  // fields
  const modifiedSince = reqHeaders['if-modified-since']
  const noneMatch = reqHeaders['if-none-match']

  // unconditional request
  if (!modifiedSince && !noneMatch) {
    return false
  }

  // Always return stale when Cache-Control: no-cache
  // to support end-to-end reload requests
  // https://tools.ietf.org/html/rfc2616#section-14.9.4
  const cacheControl = reqHeaders['cache-control']
  if (cacheControl && CACHE_CONTROL_NO_CACHE_REGEXP.test(cacheControl)) {
    return false
  }

  // if-none-match
  if (noneMatch && noneMatch !== '*') {
    const etag = resHeaders.etag

    if (!etag) {
      return false
    }

    let etagStale = true
    const matches = parseTokenList(noneMatch)
    for (let i = 0; i < matches.length; i++) {
      const match = matches[i]
      if (match === etag || match === 'W/' + etag || 'W/' + match === etag) {
        etagStale = false
        break
      }
    }

    if (etagStale) {
      return false
    }
  }

  // if-modified-since
  if (modifiedSince) {
    const lastModified = resHeaders['last-modified']
    const modifiedStale =
      !lastModified ||
      !(parseHttpDate(lastModified) <= parseHttpDate(modifiedSince))

    if (modifiedStale) {
      return false
    }
  }

  return true
}

function parseHttpDate (date) {
  const timestamp = date && Date.parse(date)

  // istanbul ignore next: guard against date.js Date.parse patching
  return typeof timestamp === 'number'
    ? timestamp
    : NaN
}

function parseTokenList (str) {
  let end = 0
  const list = []
  let start = 0
  let index = -1
  const { length } = str

  while (++index < length) {
    switch (str.charCodeAt(index)) {
      case 0x20: /*   */
        if (start === end) {
          start = end = index + 1
        }
        break
      case 0x2c: /* , */
        list.push(str.substring(start, end))
        start = end = index + 1
        break
      default:
        end = index + 1
        break
    }
  }

  // final token
  list.push(str.substring(start, end))

  return list
}
