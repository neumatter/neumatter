'use strict'

import { IncomingMessage } from 'http'
import IS from '@neumatter/is'
import parser from './modules/parser.js'
import NeuJSON from './modules/json.js'
import { NeuError } from './modules/error.js'
import isValidEmail from './modules/is-valid-email.js'
import { URLSearchParams } from 'url'

/**
 *
 * @extends {IncomingMessage}
 */
export default class NeuRequest extends IncomingMessage {
  #URL

  /**
   *
   * @param {import('net').Socket} socket
   */
  constructor (socket) {
    super(socket)
    this.body = {}
    this.params = {}
    this.app = {}
    this.searchParams = new URLSearchParams()
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
    const path = this.URL.pathname
    return path.length > 1 ? path.replace(/\/+$/, '') : path
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
    if (this.#URL !== undefined) {
      return this.#URL
    }

    this.#URL = new URL(this.href)
    return this.#URL
  }

  /**
   *
   * @param {boolean} hasParams
   * @param {RegExp} regexp
   * @returns {Promise<NeuRequest>}
   * @api private
   */
  async #setParams (hasParams, regexp) {
    if (hasParams && regexp.test(this.url)) {
      try {
        const jsonObj = JSON.stringify(this.url.match(regexp).groups)
        this.params = JSON.parse(jsonObj)
        return this
      } catch (err) {
        throw new NeuError(err)
      }
    } else {
      this.params = {}
      return this
    }
  }

  /**
   *
   * @param {boolean} hasParams
   * @param {RegExp} regexp
   * @api private
   */
  async dispatch (hasParams, regexp) {
    const parseBody = async () => {
      this.body = await parser(this, this.app.parseMethod)
    }
    let indexOfSearch = this.url.indexOf('?')
    if (indexOfSearch !== -1) {
      this.searchParams = new URLSearchParams(this.url.slice(++indexOfSearch))
    }
    await Promise.all([this.#setParams(hasParams, regexp), parseBody()])
  }

  /**
   *
   * @param  {...any} rest
   */
  emitErr = (...rest) => {
    return this.app.emit('error', ...rest)
  }

  async isValidEmail (email, message = 'default', subject = 'NA') {
    try {
      return await isValidEmail({
        email,
        subject,
        message
      })
    } catch (err) {
      throw new NeuError(err)
    }
  }
}
