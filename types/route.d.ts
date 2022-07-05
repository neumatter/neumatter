import NeuRequest from './request'
import NeuResponse from './response'


declare interface NextFunction {
  (err?: Error|any): void
}

declare interface HandleRoute {
  (request: NeuRequest, response: NeuResponse, next?: NextFunction): void
}

declare type RouteHandler = Array<HandleRoute>|HandleRoute

declare class NeuRoute {
  constructor (options: {
    middleware: Array<Function>,
    path: string,
    prefix?: string,
    method?: string,
    routeOnly?: boolean,
    schema?: object
  })

  prefix: string
  path: string
  unprefixed: string
  hasParams: boolean
  pathRegExp: RegExp
  methods: object
  stack: Array<any>

  get (routeHandler: RouteHandler): NeuRoute
  post (routeHandler: RouteHandler): NeuRoute
  put (routeHandler: RouteHandler): NeuRoute
  patch (routeHandler: RouteHandler): NeuRoute
  trace (routeHandler: RouteHandler): NeuRoute
  options (routeHandler: RouteHandler): NeuRoute
  connect (routeHandler: RouteHandler): NeuRoute
  delete (routeHandler: RouteHandler): NeuRoute

  #append (...args): void

  setPrefix (pre: string): NeuRoute
  setMethod (method: string, callback: Function, mw:Array<Function>): NeuRoute
  addToStack (table: Array<any>): Promise<NeuRoute>
  mergeStacks (): NeuRoute
}

export default NeuRoute
