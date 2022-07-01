
import NeuPack from 'neupack'
import NeuRoute from './route'
import NeuRequest from './request'
import NeuResponse from './response'

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
    mw: ((err: any, request: NeuRequest, response: NeuResponse, routeHandler: (err?: any) => any ) => any)|
      ((request: NeuRequest, response: NeuResponse, routeHandler: (err?: any) => any ) => any)|
      (Array<(request: NeuRequest, response: NeuResponse, routeHandler: (err?: any) => any ) => any>)|
      (Array<(err: any, request: NeuRequest, response: NeuResponse, routeHandler: (err?: any) => any ) => any>)
  ): NeuRouter

  #lookup (path: NeuRequest['path'], method: NeuRequest['method']): Promise<NeuRoute>

  #transmit (request: NeuRequest, response: NeuResponse): Promise<(request: NeuRequest, response: NeuResponse, routeHandler: () => any ) => any>

  transmitter (request: NeuRequest, response: NeuResponse): (request: NeuRequest, response: NeuResponse) => Promise<(request: NeuRequest, response: NeuResponse, routeHandler: () => any ) => any>

  route (path: string, routeHandler: Array<(request: NeuRequest, response: NeuResponse, next: (err?: Error) => any) => any>|((request: NeuRequest, response: NeuResponse, next: (err?: Error) => any) => any)): NeuRoute

  get (path: string, routeHandler: Array<(request: NeuRequest, response: NeuResponse, next: (err?: Error) => any) => any>|((request: NeuRequest, response: NeuResponse, next: (err?: Error) => any) => any)): NeuRouter
  post (path: string, routeHandler: Array<(request: NeuRequest, response: NeuResponse, next: (err?: Error) => any) => any>|((request: NeuRequest, response: NeuResponse, next: (err?: Error) => any) => any)): NeuRouter
  put (path: string, routeHandler: Array<(request: NeuRequest, response: NeuResponse, next: (err?: Error) => any) => any>|((request: NeuRequest, response: NeuResponse, next: (err?: Error) => any) => any)): NeuRouter
  patch (path: string, routeHandler: Array<(request: NeuRequest, response: NeuResponse, next: (err?: Error) => any) => any>|((request: NeuRequest, response: NeuResponse, next: (err?: Error) => any) => any)): NeuRouter
  trace (path: string, routeHandler: Array<(request: NeuRequest, response: NeuResponse, next: (err?: Error) => any) => any>|((request: NeuRequest, response: NeuResponse, next: (err?: Error) => any) => any)): NeuRouter
  options (path: string, routeHandler: Array<(request: NeuRequest, response: NeuResponse, next: (err?: Error) => any) => any>|((request: NeuRequest, response: NeuResponse, next: (err?: Error) => any) => any)): NeuRouter
  connect (path: string, routeHandler: Array<(request: NeuRequest, response: NeuResponse, next: (err?: Error) => any) => any>|((request: NeuRequest, response: NeuResponse, next: (err?: Error) => any) => any)): NeuRouter
  delete (path: string, routeHandler: Array<(request: NeuRequest, response: NeuResponse, next: (err?: Error) => any) => any>|((request: NeuRequest, response: NeuResponse, next: (err?: Error) => any) => any)): NeuRouter
}

export default NeuRouter
