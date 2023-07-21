'use strict'

import { IncomingMessage } from 'http'
import IS from '@neumatter/is'
import { URLSearchParams } from 'url'
import CookieJar, { RequestCookies } from '@neumatter/cookie-jar'

/**
 *
 * @extends {IncomingMessage}
 */
export default class NeuRequest extends IncomingMessage {
  #URL
  #searchParams

  /**
   *
   * @param {import('net').Socket} socket
   */
  constructor (socket) {
    super(socket)
    this.body = {}
    this.params = {}
    this.app = {}

    // this.cookies = new CookieJar(this.headers ?? this.headers.cookie)
  }

  get (name) {
    if (typeof name === 'undefined') return this.headers
    name = name.toLowerCase()
    const test = {
      referrer: this.headers.referrer,
      referer: this.headers.referer
    }
    return test[name] || this.headers[name] || null
  }

  get searchParams () {
    if (this.#searchParams !== undefined) {
      return this.#searchParams
    }

    let indexOfSearch = this.url.indexOf('?')

    if (indexOfSearch !== -1) {
      this.#searchParams = new URLSearchParams(this.url.slice(++indexOfSearch))
    } else {
      this.#searchParams = new URLSearchParams()
    }

    return this.#searchParams
  }

  get cookies () {
    return new RequestCookies(this)
  }

  get protocol () {
    const protocol = this.get('X-Forwarded-Proto') || this.socket.encrypted
      ? 'https'
      : 'http'
    return (
      (IS.string(protocol) && !/\s*,\s*/.test(protocol) && protocol) ||
      (Array.isArray(protocol) && protocol[0]) ||
      (protocol.split(/\s*,\s*/)[0])
    )
  }

  /**
   *
   * @getter
   * @returns {boolean}
   * @api public
   */
  get isSecure () {
    return this.protocol === 'https'
  }

  /**
   *
   * @getter
   * @returns {string}
   * @api public
   */
  get host () {
    let host = this.get('X-Forwarded-Host')
    let indexOfComma
    if (!host) {
      host = this.get('host')
    } else if ((indexOfComma = host.indexOf(',')) !== -1) {
      host = host.substring(0, indexOfComma).trim()
    }
    return host
  }

  /**
   *
   * @getter
   * @returns {string}
   * @api public
   */
  get hostname () {
    const host = this.host
    const offset = host[0] === '['
      ? host.indexOf(']') + 1
      : 0
    const index = host.indexOf(':', offset)
    return index !== -1
      ? host.substring(0, index)
      : host
  }

  /**
   *
   * @getter
   * @returns {number|undefined}
   * @api public
   */
  get port () {
    return this.app.port || this.socket.localPort
  }

  /**
   *
   * @getter
   * @returns {string}
   * @api public
   */
  get path () {
    return this.url.length > 1 ? this.url.replace(/\/$/, '').replace(/\/\//g, '/').replace(/\?[^/]+$/, '') : this.url
  }

  /**
   *
   * @getter
   * @returns {object}
   * @api public
   */
  get query () {
    const result = {}
    for (const [key, value] of this.URL.searchParams.entries()) {
      result[key] = value
    }
    return result
  }

  /**
   *
   * @getter
   * @returns {string}
   * @api public
   */
  get href () {
    return `${this.protocol}://${this.host}${this.url}`
  }

  /**
   *
   * @getter
   * @returns {string|undefined}
   * @api public
   */
  get ip () {
    return this.get('x-forwarded-for') || this.socket.remoteAddress
  }

  /**
   *
   * @getter
   * @returns {URL}
   * @api public
   */
  get URL () {
    let url = this.#URL

    if (url === undefined) {
      url = new URL(this.href)
      this.#URL = url
    }

    return url
  }

  /**
   *
   * @param  {...any} rest
   */
  emitErr = (...rest) => {
    return this.app.emit('error', ...rest)
  }
}
