
declare class NeuMiddleware {
  constructor(options: { prefix?: string, path: string, fn: Function })

  add(opts: { prefix?: string, path: string, fn: Function }): void
  addMany(opts: { prefix?: string, path: string, fn: Function[] }): void
}

export default NeuMiddleware
