
import { ServerResponse, OutgoingHttpHeaders } from 'http'
import NeuRequest from './request'

declare class NeuResponse extends ServerResponse {
  constructor (req: NeuRequest)

  get sent (): boolean

  get isHead (): boolean

  get hasContentLength (): boolean

  get (input: string | Array<string>): string | OutgoingHttpHeaders | string[]

  set (input: string|Array<object>|object, value?: string): NeuResponse
  status (code: number): NeuResponse

  redirect (redAddress: string, redStatus: number): void|NeuResponse

  send (message: any): void|NeuResponse

  json (message: any): void

  html (message: any): void

  file (filePath: string, options?: object): void|NeuResponse

  serve (options: {
    type: string,
    body: any,
    status?: number,
    headers?: object
  }): void|NeuResponse
}

export default NeuResponse
