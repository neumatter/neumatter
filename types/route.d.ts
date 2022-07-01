import NeuRequest from './request'
import NeuResponse from './response'

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
  paramObj: {
    regexp: RegExp,
    params: boolean
  }
  pathRegExp: RegExp
  methods: object
  stack: Array<any>

  get (routeHandler: Array<(request: NeuRequest, response: NeuResponse, next: (err?: Error) => any) => any>|((request: NeuRequest, response: NeuResponse, next: (err?: Error) => any) => any)): NeuRoute
  post (routeHandler: Array<(request: NeuRequest, response: NeuResponse, next: (err?: Error) => any) => any>|((request: NeuRequest, response: NeuResponse, next: (err?: Error) => any) => any)): NeuRoute
  put (routeHandler: Array<(request: NeuRequest, response: NeuResponse, next: (err?: Error) => any) => any>|((request: NeuRequest, response: NeuResponse, next: (err?: Error) => any) => any)): NeuRoute
  patch (routeHandler: Array<(request: NeuRequest, response: NeuResponse, next: (err?: Error) => any) => any>|((request: NeuRequest, response: NeuResponse, next: (err?: Error) => any) => any)): NeuRoute
  trace (routeHandler: Array<(request: NeuRequest, response: NeuResponse, next: (err?: Error) => any) => any>|((request: NeuRequest, response: NeuResponse, next: (err?: Error) => any) => any)): NeuRoute
  options (routeHandler: Array<(request: NeuRequest, response: NeuResponse, next: (err?: Error) => any) => any>|((request: NeuRequest, response: NeuResponse, next: (err?: Error) => any) => any)): NeuRoute
  connect (routeHandler: Array<(request: NeuRequest, response: NeuResponse, next: (err?: Error) => any) => any>|((request: NeuRequest, response: NeuResponse, next: (err?: Error) => any) => any)): NeuRoute
  delete (routeHandler: Array<(request: NeuRequest, response: NeuResponse, next: (err?: Error) => any) => any>|((request: NeuRequest, response: NeuResponse, next: (err?: Error) => any) => any)): NeuRoute

  #append (...args): void

  setPrefix (pre: string): NeuRoute
  setMethod (method: string, callback: Function, mw:Array<Function>): NeuRoute
  addToStack (table: Array<any>): Promise<NeuRoute>
  mergeStacks (): NeuRoute
}

export default NeuRoute
