'use strict'

class NeuMiddleware {
  constructor (options) {
    const prefix = options.prefix || ''
    this[options.prefix || ''] = {
      [options.path === 'ALL' ? options.path : prefix + options.path]: [
        options.fn
      ]
    }
  }

  add (opts) {
    const prefix = opts.prefix || ''
    const path = opts.path === 'ALL' ? opts.path : opts.prefix + opts.path
    this[prefix] ||= {}
    this[prefix][path] ||= []
    this[prefix][path].push(opts.fn)
  }

  addMany (opts) {
    const prefix = opts.prefix || ''
    const path = opts.path === 'ALL' ? opts.path : opts.prefix + opts.path
    this[prefix] ||= {}
    this[prefix][path] ||= []
    this[prefix][path].push(...opts.fn)
  }

  static from (...args) {
    const { length } = args
    let index = -1
    const middleware = new NeuMiddleware({
      prefix: 'ALL',
      fn: args[0],
      path: 'ALL'
    })

    while (++index < length) {
      if (index === 0) continue
      middleware.add({
        prefix: 'ALL',
        fn: args[index],
        path: 'ALL'
      })
    }
    return middleware
  }
}

export default NeuMiddleware
