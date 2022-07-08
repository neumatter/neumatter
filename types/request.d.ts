import { IncomingMessage } from 'http'
import { Socket } from 'net'
import Neumatter from './index'

declare class NeuRequest extends IncomingMessage {
  body: object
  params: object
  app: Neumatter

  constructor (socket: Socket)

  get (name: string|undefined): any

  get protocol (): string
  get isSecure (): boolean
  get host (): string
  get hostname (): string
  get port (): number|undefined
  get path (): string
  get query (): object
  get href (): string
  get ip (): string|undefined
  get URL (): URL
  get searchParams (): URL['searchParams']

  #setParams (hasParams: boolean, regexp: RegExp): Promise<NeuRequest>

  dispatch (hasParams: boolean, regexp: RegExp): Promise<void>

  emitErr (...rest: any): any

  isValidEmail(email: any, message?: string, subject?: string): Promise<{ valid: boolean; reason: string; }>
}

export default NeuRequest
