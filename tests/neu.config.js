
import nodePath from 'path'
import routerA from './server/routes/router.js'

const ifError = async (err, req, res, next) => {
  console.log('middleware-Error:')
  console.log(err)
  await next(err)
}

const userMiddleware = async (req, res, next) => {
  console.log('1')
  await next()
}
const userMiddleware2 = async (req, res, next) => {
  console.log('2')
  await next()
}
const userMiddleware3 = async (req, res, next) => {
  console.log('3')
  await next()
}
const userMiddleware4 = async (req, res, next) => {
  console.log('4')
  await next()
}
const middlewareRouteLevel = async (req, res, next) => {
  console.log('router level')
  await next()
}

export default {
  env: {
    port: 3004,
    static: nodePath.join(process.cwd(), 'public'),
    context: 'testCTX'
  },
  use: [
    {
      middleware: [
        userMiddleware,
        userMiddleware2,
        userMiddleware3,
        userMiddleware4,
        ifError
      ]
    },
    {
      path: '/home',
      middleware: [
        middlewareRouteLevel
      ],
      router: routerA
    }
  ]
}
