'use strict'

import IS from '@neumatter/is'
import NeuRoute from './route.js'
import { NeuTypeError, NeuError } from './modules/error.js'
import NeuPack from 'neupack'
import buildNext from './modules/build-next.js'

/** @typedef {import('./request').default} NeuRequest */
/** @typedef {import('./response').default} NeuResponse */

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
    this.date = new Date()
  }

  /**
   * Add route to map.
   *
   * @param  {string[]} args
   * @returns {NeuRouter}
   * @api private
   */
  #appendRoute (...args) {
    const method = args[0]
    const path = args[1]
    const cbi = args.length - 1
    const callback = args[cbi]
    const middleware = args.length >= 4 ? args.slice(2, cbi) : []
    if (!IS.string(path)) {
      throw new NeuTypeError(path, 'string', { status: 500 })
    }
    args.slice(2).forEach(fn => {
      console.log(fn)
      if (!IS.function(fn)) {
        throw new NeuTypeError(fn, 'function', { status: 500 })
      }
    })
    const existingRoute = this.routeMap.get(path)
    if (existingRoute) {
      existingRoute.setMethod(method, callback, middleware)
    } else {
      const routeArgs =
        args.length >= 4
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
   * @returns {Promise<nextHandler>}
   * @api private
   */
  async #transmit (request, response) {
    const route = await this.#lookup(request.path, request.method)
    await request.dispatch(route.parsedRoute)
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

  route (...args) {
    const path = args.filter(el => IS.string(el))[0]
    const schema = args.filter(el => IS.object(el))[0]
    const middleware = args.filter(el => IS.function(el))
    const options = { routeOnly: true, index: this.routeMap.length }
    if (!IS.string(path)) throw new NeuTypeError(path, 'string', { status: 500 })
    options.path = path
    if (!IS.falseType(schema)) options.schema = schema
    if (!IS.falseType(middleware)) options.middleware = middleware
    const route = new NeuRoute(options)
    this.routeMap.push(route)
    return route
  }

  /**
   *
   * @param  {[path: string, (request:NeuRequest, response:NeuResponse, next:(error:any))]} args
   * @returns {NeuRouter}
   * @api public
   */
  get (...args) {
    this.#appendRoute('GET', ...args)
    return this
  }

  /**
   *
   * @param  {[path: string, (request:NeuRequest, response:NeuResponse, next:(error:any))]} args
   * @returns {NeuRouter}
   * @api public
   */
  post (...args) {
    this.#appendRoute('POST', ...args)
    return this
  }

  /**
   *
   * @param  {[path: string, (request:NeuRequest, response:NeuResponse, next:(error:any))]} args
   * @returns {NeuRouter}
   * @api public
   */
  put (...args) {
    this.#appendRoute('PUT', ...args)
    return this
  }

  /**
   *
   * @param  {[path: string, (request:NeuRequest, response:NeuResponse, next:(error:any))]} args
   * @returns {NeuRouter}
   * @api public
   */
  delete (...args) {
    this.#appendRoute('DELETE', ...args)
    return this
  }

  /**
   *
   * @param  {[path: string, (request:NeuRequest, response:NeuResponse, next:(error:any))]} args
   * @returns {NeuRouter}
   * @api public
   */
  search (...args) {
    this.#appendRoute('SEARCH', ...args)
    return this
  }
}
