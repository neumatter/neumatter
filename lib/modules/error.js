'use strict'

export class NeuError extends Error {
  /**
   *
   * @param {string?} message
   */
  constructor (message, options) {
    super(message)
    this.name = this.constructor.name
    Error.captureStackTrace(this, this.constructor)
    this.status = options?.status || null
  }
}

export class NeuTypeError extends NeuError {
  constructor (element, expected, options) {
    const got = typeof element
    if (options?.status) {
      super(`Invalid typeof: ${element} Expected: ${expected} / Got: ${got}`, { status: options.status })
    } else {
      super(`Invalid typeof: ${element} Expected: ${expected} / Got: ${got}`)
    }
    this.data = {
      element,
      expected,
      got
    }
  }
}
