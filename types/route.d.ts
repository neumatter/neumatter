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
  parsedRoute: {
    regexp: RegExp,
    params: boolean
  }
  pathRegExp: RegExp
  methods: object
  stack: Array<any>
  schema: object

  get (routeHandler: (request: NeuRequest, response: NeuResponse, next: () => any) => any): NeuRoute
  post (routeHandler: (request: NeuRequest, response: NeuResponse, next: () => any) => any): NeuRoute
  put (routeHandler: (request: NeuRequest, response: NeuResponse, next: () => any) => any): NeuRoute
  delete (routeHandler: (request: NeuRequest, response: NeuResponse, next: () => any) => any): NeuRoute

  #append (...args): void

  setPrefix (pre: string): NeuRoute
  setMethod (method: string, callback: Function, mw:Array<Function>): NeuRoute
  addToStack (table: Array<any>): Promise<NeuRoute>
  mergeStacks (): NeuRoute
}

export default NeuRoute
