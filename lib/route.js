'use strict'

import utils from '@neumatter/utils'
import NeuPack from 'neupack'
import IS from '@neumatter/is'

export default class NeuRoute {
  constructor (options) {
    if (options.middleware) {
      if (IS.array(options.middleware)) {
        NeuPack.each(options.middleware, async mw => {
          if (typeof mw !== 'function') throw new TypeError('middleware must be a function.')
        })
      } else if (typeof options.middleware !== 'function') {
        throw new TypeError('middleware must be a function.')
      }
    }
    this.prefix = options && options.prefix ? options.prefix : ''
    this.path = this.prefix + options.path
    this.unprefixed = options.path
    const { params, regexp } = utils.parseRoute(this.prefix + options.path)
    this.hasParams = params
    this.pathRegExp = regexp
    const method = !options.routeOnly ? options.method.toUpperCase() : null
    this.methods = {}
    if (options.routeOnly && options.middleware) {
      this.methods.ALL = {
        mw: options.middleware
      }
    }
    if (method) {
      this.methods[method] = {
        fn: options.callback,
        mw: options.middleware && Array.isArray(options.middleware)
          ? options.middleware
          : options.middleware
            ? [options.middleware]
            : [],
        stack: []
      }
    }
    this.stack = []
  }

  /**
   *
   * @param  {Array<(request: NeuRequest, response: NeuResponse, next: (err?: Error) => any) => any>} rest
   * @returns {NeuRoute}
   * @api public
   */
  get (...rest) {
    this.#append('GET', ...rest)
    return this
  }

  /**
   *
   * @param  {Array<(request: NeuRequest, response: NeuResponse, next: (err?: Error) => any) => any>} rest
   * @returns {NeuRoute}
   * @api public
   */
  post (...rest) {
    this.#append('POST', ...rest)
    return this
  }

  /**
   *
   * @param  {Array<(request: NeuRequest, response: NeuResponse, next: (err?: Error) => any) => any>} rest
   * @returns {NeuRoute}
   * @api public
   */
  put (...rest) {
    this.#append('PUT', ...rest)
    return this
  }

  /**
   *
   * @param  {Array<(request: NeuRequest, response: NeuResponse, next: (err?: Error) => any) => any>} rest
   * @returns {NeuRoute}
   * @api public
   */
  patch (...rest) {
    this.#append('PATCH', ...rest)
    return this
  }

  /**
   *
   * @param  {Array<(request: NeuRequest, response: NeuResponse, next: (err?: Error) => any) => any>} rest
   * @returns {NeuRoute}
   * @api public
   */
  trace (...rest) {
    this.#append('TRACE', ...rest)
    return this
  }

  /**
   *
   * @param  {Array<(request: NeuRequest, response: NeuResponse, next: (err?: Error) => any) => any>} rest
   * @returns {NeuRoute}
   * @api public
   */
  options (...rest) {
    this.#append('OPTIONS', ...rest)
    return this
  }

  /**
   *
   * @param  {Array<(request: NeuRequest, response: NeuResponse, next: (err?: Error) => any) => any>} rest
   * @returns {NeuRoute}
   * @api public
   */
  connect (...rest) {
    this.#append('CONNECT', ...rest)
    return this
  }

  /**
   *
   * @param  {Array<(request: NeuRequest, response: NeuResponse, next: (err?: Error) => any) => any>} rest
   * @returns {NeuRoute}
   * @api public
   */
  delete (...rest) {
    this.#append('DELETE', ...rest)
    return this
  }

  /**
   *
   * @param  {...any} args
   * @api private
   */
  #append (...args) {
    const method = args[0]
    const hi = args.length - 1
    const handler = args[hi]
    const middleware = args.length >= 3 ? args.filter((el, i) => IS.function(el) && i !== hi) : null
    this.setMethod(method, handler, middleware)
  }

  /**
   *
   * @param {string} pre
   * @returns {NeuRoute}
   * @api private
   */
  setPrefix (pre) {
    const newPath = pre + this.path
    this.prefix = pre
    this.path = newPath
    const { params, regexp } = utils.parseRoute(newPath)
    this.hasParams = params
    this.pathRegExp = regexp
    return this
  }

  /**
   *
   * Used to update methods internally.
   *
   * @param {string} method
   * @param {Function} callback
   * @param {Function[]} mw
   * @returns {NeuRoute}
   * @api private
   */
  setMethod (method, callback, mw) {
    method = method.toUpperCase()
    if (!this.methods[method]) {
      this.methods[method] = {}
    }
    if (!this.methods[method].mw) {
      this.methods[method].mw = []
    }
    this.methods[method].fn = callback
    if (mw && mw.length >= 2) {
      this.methods[method].mw.push(...mw)
    } else if (mw) {
      this.methods[method].mw.push(mw)
    }
    return this
  }

  /**
   *
   * @param {Array<(request: NeuRequest, response: NeuResponse, next: (err?: Error) => any) => any>} table
   * @returns {Promise<NeuRoute>}
   * @api private
   */
  async addToStack (table) {
    let id = this.stack.length || 0
    if (!table) return
    await NeuPack.all(table, async item => {
      this.stack[id++] = item
    })
    return this
  }

  /**
   *
   * @returns {NeuRoute}
   * @api private
   */
  mergeStacks () {
    const keys = Object.keys(this.methods)
    if (keys.length) {
      const { length } = keys
      let i = -1
      while (++i < length) {
        this.methods[keys[i]].stack = []
        if (this.stack.length) this.methods[keys[i]].stack.push(...this.stack)
        if (this.methods.ALL?.length) this.methods[keys[i]].stack.push(...this.methods.ALL)
        if (this.methods[keys[i]].mw.length) this.methods[keys[i]].stack.push(...this.methods[keys[i]].mw)
      }
    }
    return this
  }
}
