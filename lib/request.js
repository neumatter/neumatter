'use strict'

import { IncomingMessage } from 'http'
import utils from '@neumatter/utils'
import IS from '@neumatter/is'
import parser from './modules/parser.js'
import NeuJSON from './modules/json.js'
import { NeuError } from './modules/error.js'
import isValidEmail from './modules/is-valid-email.js'

/**
 *
 * @extends {IncomingMessage}
 */
export default class NeuRequest extends IncomingMessage {
  #app = {}
  /**
   *
   * @param {import('net').Socket} socket
   */
  constructor (socket) {
    super(socket)
    this.body = {}
    this.routePath = ''
    this.params = {}
  }

  header (name) {
    name = name ? name.toLowerCase() : null
    const test = {
      referrer: this.headers.referrer,
      referer: this.headers.referer
    }
    return test[name] || this.headers[name] || null
  }

  get protocol () {
    const protocol = this.header('X-Forwarded-Proto') || this.socket.encrypted
      ? 'https'
      : 'http'
    return (
      (IS.string(protocol) && !/\s*,\s*/.test(protocol) && protocol) ||
      (Array.isArray(protocol) && protocol[0]) ||
      (protocol.split(/\s*,\s*/)[0])
    )
  }

  get isSecure () {
    return this.protocol === 'https'
  }

  get host () {
    let host = this.header('X-Forwarded-Host')
    if (!host) {
      host = this.header('host')
      console.log(host)
    } else if (host.indexOf(',') !== -1) {
      host = host.substring(0, host.indexOf(',')).trimRight()
    }
    return host
  }

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

  get port () {
    return this.app.port || this.socket.localPort
  }

  get path () {
    return utils.parsePath(this.url)
  }

  get query () {
    const result = {}
    for (const [key, value] of this.URL.searchParams.entries()) {
      result[key] = value
    }
    return result
  }

  get href () {
    return `${this.protocol}://${this.host}${this.url}`
  }

  get ip () {
    return this.socket.remoteAddress
  }

  get parseMethod () {
    return this.parseMethod
  }

  set parseMethod (method) {
    this.parseMethod = method
  }

  get URL () {
    return new URL(this.href)
  }

  get searchParams () {
    return this.URL.searchParams
  }

  async #setParams (paramsObj) {
    const { regexp } = paramsObj
    if (paramsObj.params && regexp.test(this.url)) {
      try {
        const jsonObj = await NeuJSON.stringify(this.url.match(regexp).groups)
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

  async dispatch (parsedRoute) {
    const parseBody = async () => {
      this.body = await parser[this.app.parseMethod](this)
    }
    await Promise.all([this.#setParams(parsedRoute), parseBody()])
  }

  set app (input) {
    this.#app = input
  }

  get app () {
    return this.#app
  }

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
