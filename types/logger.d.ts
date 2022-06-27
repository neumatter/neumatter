
export declare interface LoggerOptions {
  name?: string
  dir?: string
  cacheSize?: number
  json?: boolean
  virtual?: boolean
}

export declare class Logger {
  constructor (options: LoggerOptions)

  name: string
  path: string
  json: boolean
  virtual: boolean
  cacheSize: number
  cache: Array<any>
  colors: {
    cyan: string,
    magenta: string,
    orange: string,
    purple: string,
    red: string,
    green: string,
    yellow: string,
    reset: string
  }

  toJSON (): Array<string>

  get fileData (): string

  log (level: string, message: string): this

  close (): this

  info (message: any): this

  debug (message: any): this

  trace (message: any): this

  warn (message: any): this

  error (message: any): this

  fatal (message: any): this
}
