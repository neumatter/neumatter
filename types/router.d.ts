
import NeuPack from 'neupack'
import NeuRoute from './route'
import NeuRequest from './request'
import NeuResponse from './response'

declare interface NextFunction {
  (err?: Error|any): void
}

declare interface HandleRoute {
  (request: NeuRequest, response: NeuResponse, next?: NextFunction): void
}

declare interface HandleErrorRoute {
  (err: Error|any, request: NeuRequest, response: NeuResponse, next?: NextFunction): void
}

declare class NeuRouter {
  constructor (options?: { isMain?: boolean, parseMethod?: string, prefix?: string })
  isMain: boolean
  routeMap: NeuPack
  parseMethod: string
  prefix: string
  date: Date

  #buildNextFn (stack: NeuRoute['stack']): (request: NeuRequest, response: NeuResponse, routeHandler: (err?: any) => any ) => any

  #appendRoute (
    method: string,
    path: string,
    mw: HandleErrorRoute|HandleRoute|Array<HandleRoute>|Array<HandleErrorRoute>
  ): NeuRouter

  #lookup (path: NeuRequest['path'], method: NeuRequest['method']): Promise<NeuRoute>

  #transmit (request: NeuRequest, response: NeuResponse): Promise<HandleRoute>

  transmitter (request: NeuRequest, response: NeuResponse): (request: NeuRequest, response: NeuResponse) => Promise<HandleRoute>

  route (path: string): NeuRoute

  get (path: string, ...routeHandler: Array<HandleRoute>): NeuRouter
  post (path: string, ...routeHandler: Array<HandleRoute>): NeuRouter
  put (path: string, ...routeHandler: Array<HandleRoute>): NeuRouter
  patch (path: string, ...routeHandler: Array<HandleRoute>): NeuRouter
  trace (path: string, ...routeHandler: Array<HandleRoute>): NeuRouter
  options (path: string, ...routeHandler: Array<HandleRoute>): NeuRouter
  connect (path: string, ...routeHandler: Array<HandleRoute>): NeuRouter
  delete (path: string, ...routeHandler: Array<HandleRoute>): NeuRouter
}

export default NeuRouter
