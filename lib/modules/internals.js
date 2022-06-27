/** @typedef {(req:NeuRequest, res:NeuResponse, next:(error:any) => void|any) => void|any} NeuMiddlewareFn */
/** @typedef {(err:Error, req:NeuRequest, res:NeuResponse, next:(error:any) => void|any) => void|any} NeuMiddlewareErr */

/** @type {NeuMiddlewareFn} */
const appCheck = async (req, res, next) => {
  try {
    return await next()
  } catch (err) {
    console.log('caught err')
    await next(err)
  }
}

/** @type {NeuMiddlewareErr} */
const appError = (err, req, res, next) => {
  const s = err.status || 500
  res.status(s)
  const ip = req.ip || null
  console.log('req.ip', ip)
  res.json(err.stack)
}

const matchPath = (routes, path) => {
  let matchedRoute = false
  let ind = 0
  routes.forEach((route, i) => {
    if (route.path === path) {
      ind = i
      matchedRoute = true
    }
  })
  if (matchedRoute) {
    return {
      route: routes[ind],
      match: true
    }
  } else {
    return {
      match: false
    }
  }
}

export { appCheck, appError, matchPath }
