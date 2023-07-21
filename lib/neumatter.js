'use strict'

import './modules/fetch.g.js'
import http from 'http'
import nodePath from 'path'
import IS from '@neumatter/is'
import NeuPack from 'neupack'
import Record from '@neumatter/record'
import { EventEmitter, captureRejectionSymbol } from 'events'
import NeuMiddleware from './modules/middleware.js'
import NeuResponse from './response.js'
import NeuRequest from './request.js'
import NeuRouter from './router.js'
import { NeuError, NeuTypeError } from './modules/error.js'
import { appCheck, appError } from './modules/internals.js'
import JX from './modules/jx.js'
import * as u from './modules/utilities.js'
import Env from './modules/env.js'
import Logger from './modules/logger.js'
import { ConfigureHeaders } from './modules/headers.js'
import buildNext from './modules/build-next.js'
import { StaticFileServer } from './modules/serve-static.js'
import BodyParser from './modules/parser.js'

/** @typedef {import('./route').default} NeuRoute */
/** @typedef {Array<(request: NeuRequest, response: NeuResponse, next: (err?: Error) => any) => any>|((request: NeuRequest, response: NeuResponse, next: (err?: Error) => any) => any)} RouteHandler */

/**
 *
 * @type {import('../types/index').Neumatter}
 */
export default class Neumatter extends EventEmitter {
  static get serverOptions () {
    return {
      IncomingMessage: NeuRequest,
      ServerResponse: NeuResponse
    }
  }

  static Logger = Logger
  static Router = NeuRouter

  /**
   *
   * @param {import('../types/index').NeumatterOptions} [options]
   */
  constructor (options = {}) {
    super({ captureRejections: true })
    this.router = new NeuRouter({ isMain: true })
    this.context = options.context || {}
    if (options.static) {
      this.serveStatic = new StaticFileServer(options.static)
    }
    this.middlewareTable = NeuMiddleware.from(
      appCheck,
      new ConfigureHeaders(options.configureHeaders || {}).set
    )
    this.errorTable = []
    this.errorMiddleware = options.errorMiddleware || appError
    this.port = options.port || 8080
    this.host = options.host || 'localhost'
    this.proxy = options.proxy || false
    this.env = options.env || process.env.NODE_ENV || 'development'
    this.static = options.static || ''
    this.viewer = options.viewer ? new JX(options.viewer) : null
    this.bodyParser = new BodyParser(options.parseMethod ?? 'urlencoded')
    this.logger = new Logger(options.logger
      ? options.logger
      : { name: 'Neumatter-App', virtual: true }
    )
  }

  [captureRejectionSymbol] (err, event, ...args) {
    const out = [
      'rejection happened for: ', event, ' with ', err, ...args
    ]
    this.logger.error(out.join(''))
    process.exit(1)
  }

  /**
   *
   * @param  {[path: string, RouteHandler]} args
   * @returns {Neumatter}
   */
  get (...args) {
    this.router.get(...args)
    return this
  }

  /**
   *
   * @param  {[path: string, RouteHandler]} args
   * @returns {Neumatter}
   */
  post (...args) {
    this.router.post(...args)
    return this
  }

  /**
   *
   * @param  {[path: string, RouteHandler]} args
   * @returns {Neumatter}
   */
  put (...args) {
    this.router.put(...args)
    return this
  }

  /**
   *
   * @param  {[path: string, RouteHandler]} args
   * @returns {Neumatter}
   */
  patch (...args) {
    this.router.patch(...args)
    return this
  }

  /**
   *
   * @param  {[path: string, RouteHandler]} args
   * @returns {Neumatter}
   */
  trace (...args) {
    this.router.trace(...args)
    return this
  }

  /**
   *
   * @param  {[path: string, RouteHandler]} args
   * @returns {Neumatter}
   */
  options (...args) {
    this.router.options(...args)
    return this
  }

  /**
   *
   * @param  {[path: string, RouteHandler]} args
   * @returns {Neumatter}
   */
  connect (...args) {
    this.router.connect(...args)
    return this
  }

  /**
   *
   * @param  {[path: string, RouteHandler]} args
   * @returns {Neumatter}
   */
  delete (...args) {
    this.router.delete(...args)
    return this
  }

  /**
   *
   * @param {any} err
   * @param {NeuRequest} request
   * @param {*} response
   * @returns
   * @api private
   */
  #errorListener (err, request, response) {
    if (request && response) {
      const nextError = (IDE, err) => {
        this.logger.info(this.errorTable)
        let errFn = this.errorTable[IDE++]
        if (!errFn) errFn = this.errorMiddleware
        return Promise.resolve(
          errFn(err, request, response, nextError.bind(null, IDE))
        )
      }
      return nextError(0, err)
    } else if (err instanceof NeuTypeError || err instanceof NeuError) {
      this.logger.error(err.stack)
      process.exit(1)
    } else {
      const errorSend = err.stack || err.message || err
      this.logger.error(errorSend)
      process.exit(1)
    }
  }

  /**
   *
   * @param {{ path: string|null, middleware: Array<any>, router: NeuRouter }}
   * @returns {Promise<Neumatter>}
   * @api public
   */
  async use ({ path = null, middleware = [], router = null }) {
    if (middleware.length && !path && !router) {
      await NeuPack.all(middleware, async mw => {
        if (typeof mw !== 'function') {
          const err = new NeuTypeError(mw, 'function', { status: 500 })
          this.emit('error', err)
        }
      })
      await NeuPack.all(middleware, async fn => {
        if (fn.length === 4) {
          this.errorTable.push(fn)
        } else {
          this.middlewareTable.ALL.ALL.push(fn)
        }
      })
    } else {
      if (middleware.length) {
        await NeuPack.all(middleware, async mid => {
          this.middlewareTable.add({
            prefix: path === '/' ? '' : path,
            fn: mid,
            path: 'ALL'
          })
        })
      }
      router.prefix = path
      await router.routeMap.all(async (/** @type {NeuRoute} */ route) => {
        if (path !== '/') route.setPrefix(path)
        const allM = this.middlewareTable.ALL.ALL
        const prefixAllM =
          this.middlewareTable[route.prefix] &&
          this.middlewareTable[route.prefix].ALL
            ? this.middlewareTable[route.prefix].ALL
            : false
        await route.addToStack(allM)
        await route.addToStack(prefixAllM)
        route.mergeStacks()
        if (route.path !== '/') {
          route.path = route.path.replace(/\/$/, '')
        }
        this.router.routeMap.set(route.path, route)
      })
      return this
    }
  }

  /**
   *
   * @param  {any[]} args
   * @returns {Promise<Neumatter>}
   * @api public
   */
  async useMany (args) {
    await NeuPack.all(args, async el => {
      await this.use(el)
    })
    return this
  }

  /**
   *
   * @param {NeuRequest} request
   * @param {NeuResponse} response
   * @api private
   */
  async #transmit (request, response) {
    const canSend = this.serveStatic !== undefined && this.serveStatic.canSend(request)
    if (canSend) { // if (this.staticMap[request.path] || this.staticMap[request.url]) {
      const stack = this.middlewareTable.ALL.ALL || []
      const nextFunction = buildNext(stack)
      return nextFunction(request, response, this.serveStatic.stream(canSend))
    } else {
      request.body = await this.bodyParser.parse(request)
      return this.router.transmitter(request, response)
    }
  }

  /**
   *
   * @param {NeuRequest} request
   * @param {NeuResponse} response
   * @api private
   */
  async #transmitter (request, response) {
    try {
      return await this.#transmit(request, response)
    } catch (err) {
      this.emit('error', err, request, response)
    }
  }

  /**
   *
   * @returns {(request, response) => Promise<any>}
   * @api public
   */
  listener () {
    const errorListener = (err, request, response) => {
      return this.#errorListener(err, request, response)
    }

    if (!this.listenerCount('error')) this.on('error', errorListener)

    const transmitter = (request, response) => {
      request.app = this
      response.viewer = this.viewer
      request.method = request.method.toUpperCase()
      return this.#transmitter(request, response)
    }

    return transmitter
  }

  /**
   *
   * @param {http.createServer} serverFn
   * @returns {http.Server}
   * @api public
   */
  init (serverFn) {
    const server = serverFn(Neumatter.serverOptions, this.listener())

    server.on('error', (error) => {
      if (error.syscall !== 'listen') {
        throw error
      }
      const sendErr = (mess, err) => {
        if (err) throw err
        this.logger.error('ERROR: Port' + mess)
        process.exit(1)
      }
      return (
        (error.code === 'EACCES' && sendErr(' requires elevated privileges')) ||
        (error.code === 'EADDRINUSE' && sendErr(' is already in use')) ||
        sendErr('default', error)
      )
    })
    return server
  }

  /**
   *
   * @param {object} options
   * @param {number} [options.port]
   * @param {string} [options.host]
   * @returns {Neumatter}
   * @api public
   */
  listen (options = {}) {
    const server = this.init(http.createServer)
    this.port = options.port || this.port
    this.host = options.host || this.host
    server.listen(this.port, this.host, () => {
      this.logger.info(`Server listening on: ${this.port}`)
    })

    return this
  }

  /**
   *
   * @param {{ path: string, paramsOnly?: boolean }} arg_0 path to folder
   * @param {(req: NeuRequest, res: NeuResponse, next: (err: Error | undefined) => void) => void} handler
   * @returns {Promise<NeuRouter>}
   */
  static async folderToRouter ({ path, paramsOnly = false }, handler) {
    const autoRecord = await Record.build({
      path: nodePath.resolve(path),
      basepath: '/',
      middleware: true
    })

    const router = new NeuRouter()

    await autoRecord.files.all(async spec => {
      if (paramsOnly === true) {
        let isParam = false
        const route = spec.toRoutePath().replace(/\[([^\[\]]*)\]/, (el) => {
          isParam = true
          return `:${el.slice(1, el.indexOf(']'))}`
        })

        if (isParam) {
          router.get(route, handler)
        }
      } else {
        const route = spec.toRoutePath().replace(/\[([^\[\]]*)\]/, (el) => {
          return `:${el.slice(1, el.indexOf(']'))}`
        })
        router.get(route, handler)
      }
    })

    return router
  }

  /**
   *
   * @returns {Promise<Neumatter>}
   * @api public
   */
  static async load () {
    // find and set process.env variables if present
    Env.set()
    // Find configuration file
    const root = await Record.readdir({
      path: process.cwd(),
      allow: ['.json']
    })
    const neuSpec = root.files.find({ fullname: 'neumatter.config.json' })[0] || root.files.find({ fullname: 'neumatter.config.js' })[0]
    if (!neuSpec) throw new NeuError('No config file found.')
    // get configuration options
    const config = neuSpec.ext === 'json' ? await u.readJSON(neuSpec.path) : await neuSpec.import('default')
    const appOptions = config.env || config.app
    // init new Application
    const application = appOptions ? new Neumatter(appOptions) : new Neumatter()
    application.logger.info(root)
    application.logger.info(neuSpec)

    // middleware directory
    if (config.middleware) {
      const mwRecord = await Record.readdir({
        path: nodePath.join(root.cwd, config.middleware)
      })
      await mwRecord.files.all(async mwSpec => {
        if (mwSpec.name === 'index') {
          const mw = await mwSpec.import('default')
          await application.use({ middleware: mw })
        } else {
          const mw = await mwSpec.import('default')
          await application.use({
            middleware: IS.array(mw) ? mw : [mw]
          })
        }
      })
    }

    // build record for converting roots into Routers
    const autoRecord = await Record.build({
      path: config.routes
        ? nodePath.join(root.cwd, config.routes)
        : nodePath.join(root.cwd, './server/routes'),
      basepath: '/',
      middleware: true
    })

    const set = new Set()
    const routers = await autoRecord.files.all(async spec => {
      const routePath = spec.toRoutePath()

      if (set.has(routePath)) {
        return null
      } else {
        set.add(routePath)
      }

      const router = await spec.import('default')
      const result = {
        path: routePath.replace(/\[([^\[\]]*)\]/g, (el) => {
          return `:${el.slice(1, el.indexOf(']'))}`
        }),
        router,
        middleware: []
      }
      if (autoRecord.middleware.length) {
        await NeuPack.all(autoRecord.middleware, async middleware => {
          const testMw = new RegExp(middleware.path.replace('/_middleware.js', ''))
          if (testMw.test(spec.path)) {
            const mw = await middleware.import('default')
            result.middleware.push(mw)
          }
        })
      }
      return result
    })

    await application.useMany(routers.filter(r => r))
    return application
  }

  /**
   *
   * @getter
   * @returns {string}
   */
  static get name () {
    return 'Neumatter'
  }

  /**
   *
   * @getter
   * @returns {string}
   */
  static get version () {
    return 'v1.0.0-beta.7'
  }
}
