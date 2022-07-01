import { IncomingMessage } from 'http'
import { Socket } from 'net'
import NeuJS from './index'

declare class NeuRequest extends IncomingMessage {
  constructor (socket: Socket)

  #app: NeuJS
  body: object
  routePath: string
  params: object
  header: (name: string) => string|null

  get protocol (): string
  get isSecure (): boolean
  get host (): string
  get hostname (): string
  get port (): number
  get path (): string

  get query (): object

  get href (): string

  get ip (): Socket['remoteAddress']

  get parseMethod (): string

  set parseMethod (method)

  get URL (): URL
  get searchParams (): URL['searchParams']

  #setParams (paramsObj: { params: boolean, regexp: RegExp }): Promise<this>

  dispatch (paramObj: { params: boolean, regexp: RegExp }): Promise<void>

  set app (input: NeuJS)

  get app (): NeuJS

  emitErr: (...rest: Array<any>) => any
  isValidEmail: (email: string, message: string, subject: string) => Promise<object>
}

export default NeuRequest
