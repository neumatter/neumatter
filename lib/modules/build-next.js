import { NeuError } from './error.js'

export default function buildNext (stack) {
  console.log(stack)
  /**
   *
   * @param {NeuRequest} request
   * @param {NeuResponse} response
   * @param {function(): void} routeHandler
   */
  return (request, response, routeHandler) => {
    /**
     *
     * @param {number} id
     * @param {Error|any} err
     */
    function nextFunction (id, err) {
      const fn = stack[id++]
      if (!fn) return routeHandler(request, response)
      if (err) {
        throw err
      }
      try {
        return fn(request, response, nextFunction.bind(null, id))
      } catch (err) {
        return request.app.emit('error', new NeuError(err, { status: 404 }), request, response)
      }
    }
    return nextFunction(0)
  }
}
