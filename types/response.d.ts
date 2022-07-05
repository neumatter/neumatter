
import { ServerResponse, OutgoingHttpHeaders } from 'http'
import NeuRequest from './request'

declare class Cache {
  constructor ()

  data: object

  get (key: string): Function|null

  set (key: string, value: Function): Cache

  remove (key: string): Cache

  edit (key: string, value: Function): Cache
}

declare class JoinX {
  constructor (options: {
    layouts?: string,
    views: string,
    defaultData?: object
  })

  dirname: string
  layoutsDir: string
  default: any
  cache: Cache

  split (template: string): Array<any>
  parse (template: string): Array<any>
  compile (template: string, data: object): Function
  parseBlocks (template: string, dir: string): Promise<string>
  parseLayout (template: string): Promise<string>
  render (file: string, options: object): Promise<string>
}


/**
 *
 * Created internally by the Server.
 * @extends ServerResponse
 */
declare class NeuResponse extends ServerResponse {
  constructor (req: NeuRequest)

  hasType: boolean
  locals: object
  viewer: JoinX

  get sent (): boolean
  get isHead (): boolean
  get hasContentLength (): boolean

  get (input: any): object
  set (input: any, value?: any): NeuResponse
  status (code: number): NeuResponse
  redirect (address: string): void
  send (message: any): void
  json (message: any): void
  html (message: any): void
  download (filePath: string, options?: object): any
  file (filePath: string, options: object): void
  render (file: string, options?: object): Promise<void>
}

export default NeuResponse
