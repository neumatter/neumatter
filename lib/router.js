'use strict'

import IS from '@neumatter/is'
import NeuRoute from './route.js'
import { NeuTypeError, NeuError } from './modules/error.js'
import NeuPack from 'neupack'
import buildNext from './modules/build-next.js'

/** @typedef {import('./request').default} NeuRequest */
/** @typedef {import('./response').default} NeuResponse */
/** @typedef {Array<(request: NeuRequest, response: NeuResponse, next: (err?: Error) => any) => any>|((request: NeuRequest, response: NeuResponse, next: (err?: Error) => any) => any)} RouteHandler */
/** @typedef {(request: NeuRequest, response: NeuResponse, next: (err?: Error) => any) => any} NextHandler */

export default class NeuRouter {
  /**
   *
   * @param {object} [options]
   * @param {boolean} [options.isMain]
   * @param {string} [options.parseMethod]
   * @param {string} [options.prefix]
   */
  constructor (options) {
    options = options || {}
    this.isMain = options.isMain || false
    this.routeMap = new NeuPack({ id: 'path' })
    this.prefix = options.prefix || ''
  }

  /**
   * Add route to map.
   *
   * @param  {string} method
   * @param  {string} path
   * @returns {NeuRouter}
   * @api private
   */
  #appendRoute (method, path, ...rest) {
    const cbi = rest.length - 1
    const callback = rest[cbi]
    const middleware = rest.length >= 2 ? rest.slice(2, cbi) : []
    if (!IS.string(path)) {
      throw new NeuTypeError(path, 'string', { status: 500 })
    }
    rest.forEach(fn => {
      if (!IS.function(fn)) {
        throw new NeuTypeError(fn, 'function', { status: 500 })
      }
    })
    const existingRoute = this.routeMap.get(path)
    if (existingRoute) {
      existingRoute.setMethod(method, callback, middleware)
    } else {
      const routeArgs = rest.length >= 4
        ? {
            path: path,
            method: method,
            callback: callback,
            middleware: middleware
          }
        : {
            path: path,
            method: method,
            callback: callback
          }
      const route = new NeuRoute(routeArgs)
      console.log('\n\nNew route:')
      console.log(route)
      this.routeMap.push(route)
    }
    return this
  }

  /**
   *
   * @param {NeuRequest['path']} path
   * @param {NeuRequest['method']} method
   * @returns {Promise<NeuRoute>}
   * @api private
   */
  async #lookup (path, method) {
    console.log('this.routeMap')
    console.log(this.routeMap)
    const getResult = this.routeMap.get(path)
    if (getResult && getResult.methods[method]) {
      console.log('routeMap got route')
      return getResult
    } else {
      try {
        return await this.routeMap.any(route => {
          return new Promise((resolve, reject) => {
            console.log(route.pathRegExp + '\n')
            if (route.pathRegExp.test(path) && route.methods[method]) {
              resolve(route)
            } else {
              reject(new NeuError(`NOT FOUND: ${path}`, { status: 404 }))
            }
          })
        })
      } catch (err) {
        throw new NeuError(`NOT FOUND: ${path}: \n ${err}`, { status: 404 })
      }
    }
  }

  /**
   *
   * @param {NeuRequest} request
   * @param {NeuResponse} response
   * @returns {Promise<NextHandler>}
   * @api private
   */
  async #transmit (request, response) {
    const route = await this.#lookup(request.path, request.method)
    await request.dispatch(route.hasParams, route.pathRegExp)
    const nextHandler = buildNext(route.methods[request.method].stack)
    return nextHandler(request, response, route.methods[request.method].fn)
  }

  /**
   *
   * @param {NeuRequest} request
   * @param {NeuResponse} response
   * @returns {Promise<void>}
   * @api public
   */
  transmitter (request, response) {
    return this.#transmit(request, response)
  }

  /**
   *
   * @param  {string} path
   * @param {RouteHandler} middleware
   * @returns {NeuRoute}
   */
  route (path, ...middleware) {
    const options = { routeOnly: true, index: this.routeMap.length }
    if (!IS.string(path)) throw new NeuTypeError(path, 'string', { status: 500 })
    options.path = path
    if (!IS.falseType(middleware)) options.middleware = middleware
    const route = new NeuRoute(options)
    this.routeMap.push(route)
    return route
  }

  /**
   *
   * @param  {[path: string, RouteHandler]} args
   * @returns {NeuRouter}
   * @api public
   */
  get (...args) {
    this.#appendRoute('GET', ...args)
    return this
  }

  /**
   *
   * @param  {[path: string, RouteHandler]} args
   * @returns {NeuRouter}
   * @api public
   */
  post (...args) {
    this.#appendRoute('POST', ...args)
    return this
  }

  /**
   *
   * @param  {[path: string, RouteHandler]} args
   * @returns {NeuRouter}
   * @api public
   */
  put (...args) {
    this.#appendRoute('PUT', ...args)
    return this
  }

  /**
   *
   * @param  {[path: string, RouteHandler]} rest
   * @returns {NeuRouter}
   * @api public
   */
  patch (...rest) {
    this.#appendRoute('PATCH', ...rest)
    return this
  }

  /**
   *
   * @param  {[path: string, RouteHandler]} rest
   * @returns {NeuRouter}
   * @api public
   */
  trace (...rest) {
    this.#appendRoute('TRACE', ...rest)
    return this
  }

  /**
   *
   * @param  {[path: string, RouteHandler]} rest
   * @returns {NeuRouter}
   * @api public
   */
  options (...rest) {
    this.#appendRoute('OPTIONS', ...rest)
    return this
  }

  /**
   *
   * @param  {[path: string, RouteHandler]} rest
   * @returns {NeuRouter}
   * @api public
   */
  connect (...rest) {
    this.#appendRoute('CONNECT', ...rest)
    return this
  }

  /**
   *
   * @param  {[path: string, RouteHandler]} args
   * @returns {NeuRouter}
   * @api public
   */
  delete (...args) {
    this.#appendRoute('DELETE', ...args)
    return this
  }
}
