import NeuRequest from './request'
import NeuResponse from './response'


declare interface NextFunction {
  (err?: Error|any): void
}

declare interface HandleRoute {
  (request: NeuRequest, response: NeuResponse, next?: NextFunction): void
}

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

  get (...routeHandler: Array<HandleRoute>): NeuRoute
  post (...routeHandler: Array<HandleRoute>): NeuRoute
  put (...routeHandler: Array<HandleRoute>): NeuRoute
  patch (...routeHandler: Array<HandleRoute>): NeuRoute
  trace (...routeHandler: Array<HandleRoute>): NeuRoute
  options (...routeHandler: Array<HandleRoute>): NeuRoute
  connect (...routeHandler: Array<HandleRoute>): NeuRoute
  delete (...routeHandler: Array<HandleRoute>): NeuRoute

  #append (...args): void

  setPrefix (pre: string): NeuRoute
  setMethod (method: string, callback: Function, mw:Array<Function>): NeuRoute
  addToStack (table: Array<any>): Promise<NeuRoute>
  mergeStacks (): NeuRoute
}

export default NeuRoute
