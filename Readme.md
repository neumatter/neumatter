
![plot](https://github.com/Clyng57/neumatter/raw/main/public/neumatter-logo-blackBG-01.svg)
![plot](https://img.shields.io/npm/v/neumatter?style=for-the-badge&labelColor=black)
![plot](https://img.shields.io/npm/dt/neumatter?style=for-the-badge&labelColor=black)
<br />
[![JavaScript Style Guide](https://cdn.rawgit.com/standard/standard/master/badge.svg)](https://github.com/standard/standard)

A quick http server framework. ES6 async/await and ECMAScript modules.


## Features:

- ECMAScript modules.
- Latest javascript features.
- Support for global fetch.
- Built in support for using dot env files.
- Built in configurable headers.
- Built in logger.
- Support for file-based routing.
- Can add replacer to file-based routing.
- Async/Await.
- Centralized error handling.

<br />

## Table of Contents
- [ Installation ](#install)
- [ Getting Started ](#getting-started)
    - [ Configuration File ](#configuration-file)
    - [ Constructor ](#constructor)
- [ Middleware ](#middleware)
- [ Neumatter/App ](#neumatter)
    - [ (method) `neumatter.use` ](#use)
    - [ (method) `neumatter.useMany` ](#use-many)
    - [ (method) `neumatter.listen` ](#listen)
    - [ (method) `neumatter.listener` ](#listener)
    - [ (method) `neumatter.init` ](#init)
    - [ (method) `neumatter['METHOD']` ](#app-method)
    - [ (method) `Neumatter.load` ](#load)
    - [ (prop) `Neumatter.Logger` ](#logger)
    - [ (prop) `Neumatter.Router` ](#app-router)
    - [ (getter) `Neumatter.serverOptions` ](#server-options)
- [ NeuRouter ](#neurouter)
    - [ `constructor` ](#router-constructor)
    - [ (method) `router.route` ](#router-route)
    - [ (method) `router.transmitter` ](#router-transmitter)
    - [ (method) `router['METHOD']` ](#router-method)
- [ NeuRoute ](#neuroute)
    - [ `constructor` ](#route-constructor)
    - [ (method) `route['METHOD']` ](#route-method)
- [ NeuRequest ](#neurequest)
    - [ (method) `request.get` ](#request-get)
    - [ (method) `request.emitErr` ](#request-emitErr)
    - [ (method) `request.isValidEmail` ](#request-isValidEmail)
    - [ (getter) `request.protocol` ](#request-protocol)
    - [ (getter) `request.isSecure` ](#request-isSecure)
    - [ (getter) `request.host` ](#request-host)
    - [ (getter) `request.hostname` ](#request-hostname)
    - [ (getter) `request.port` ](#request-port)
    - [ (getter) `request.path` ](#request-path)
    - [ (getter) `request.query` ](#request-query)
    - [ (getter) `request.href` ](#request-href)
    - [ (getter) `request.ip` ](#request-ip)
    - [ (getter) `request.URL` ](#request-URL)
    - [ (getter) `request.searchParams` ](#request-searchParams)
    - [ (prop) `request.params` ](#request-params)
    - [ (prop) `request.app` ](#request-app)
- [ NeuResponse ](#neuresponse)
    - [ (method) `response.get` ](#response-get)
    - [ (method) `response.set` ](#response-set)
    - [ (method) `response.status` ](#response-status)
    - [ (method) `response.redirect` ](#response-redirect)
    - [ (method) `response.send` ](#response-send)
    - [ (method) `response.json` ](#response-json)
    - [ (method) `response.html` ](#response-html)
    - [ (method) `response.download` ](#response-download)
    - [ (method) `response.file` ](#response-file)
    - [ (method) `response.render` ](#response-render)
    - [ (getter) `response.sent` ](#response-sent)
    - [ (getter) `response.isHead` ](#response-isHead)
    - [ (getter) `response.hasContentLength` ](#response-hasContentLength)
    - [ (prop) `response.hasType` ](#response-hasType)
    - [ (prop) `response.locals` ](#response-locals)
    - [ (prop) `response.viewer` ](#response-viewer)

<br />

<a name="install"></a>
## Install

```console
npm i neumatter --save
```

<br />

<a name="getting-started"></a>
## Getting Started

There are two options, using a configuration file or by using the constructor.


<a name="configuration-file"></a>
### Configuration File: `neumatter.config.json` in root folder.

`"env"` is the options object, that will be passed to the constructor.
`"routes"` required. path to routes/pages directory.
`"middleware"` optional. path to middleware directory.

```json
{
  "env": {
    "port": 8080,
    "static": "./public",
    "viewer": {
      "views": "./views",
      "blocks": "./views/blocks",
      "layouts": "./views/layouts"
    }
  },
  "middleware": "./server/middleware",
  "routes": "./server/routes"
}
```
```js
import Neumatter from 'neumatter'

// loads the configuration and returns Promise<Neumatter>
const app = await Neumatter.load()

app.listen()
```


<a name="constructor"></a>
### Constructor:


### Options:

- parseMethod: `string` Method that will be used to parse `NeuRequest.body`.
- errorMiddleware: `function` Error Handler.
- proxy: `boolean` Trust proxy.
- env: `string` Often set as 'development' or 'production'.
- port: `number` Port that the application will use.
- host: `string` Hostname.
- static: `string` Path to static folder that will be scoped to '/'.
- context: `object` User defined object, that adds context to application.
- configureHeaders: `object`
- views: `string` Path to view folder.
- viewer: `object`
- viewer.views: `string` Path to views folder.
- viewer.layouts: `string` Path to layouts folder.
- viewer.defaultData: `object` User defined object, that adds data by default to a rebdered view.
- logger: `object`
- logger.name: `string` Name of the logger.
- logger.dir: `string` Path to folder to hold logs.
- logger.cacheSize: `number` Max size of logs to cache before writing to logs.
- logger.virtual: `boolean` If logger is virtual only.
- logger.json: `boolean` If logger should use json.


```js
import Neumatter from 'neumatter'

const app = new Neumatter()

app.get('/', (req, res) => {
  res.send('Hello World')
})

app.listen()
```


### Adding Routers & Middleware:

```js
import Neumatter from 'neumatter'
import productRouter from './routes/products.js'
import productMiddlewareFn from './middleware.js'
import middlewareFn from './middleware.js'

const app = new Neumatter()

await app.use({
  middleware: [middlewareFn]
})

await app.use({
  path: '/products',
  middleware: [productMiddlewareFn],
  router: productRouter
})

app.listen()
```

<br />

<a name="middleware"></a>
## Middleware


### `MiddlewareFn: (request, response, next)`

- `request`: `NeuRequest`
- `response`: `NeuResponse`
- `next`: `NextFunction`

```js
const middlewareFn = (req, res, next) => {
  // do something
  next() // call NextFunction
}
```


### `ResponseFn: (request, response, next?)`

- `request`: `NeuRequest`
- `response`: `NeuResponse`
- `next`: `NextFunction`

```js
const responseFn = (req, res) => {
  // do something
  res.json({ data: 'Hello World!' }) // send response
}
```

<br />

<a name="neumatter"></a>
## Neumatter/App


<a name="use"></a>
### `neumatter.use(data: { path?, middleware, router? })`

- `data.path`: `string|null`
- `data.middleware`: `Array<MiddlewareFn>`
- `data.router`: `NeuRouter`

```js
import Neumatter from 'neumatter'
import productRouter from './routes/products.js'

const app = new Neumatter()

const middlewareFn = (req, res, next) => {
  // do something
  next() // call NextFunction
}

await app.use({
  middleware: [middlewareFn]
})

await app.use({
  path: '/products',
  middleware: [middlewareFn],
  router: productRouter
})
```


<a name="use-many"></a>
### `neumatter.useMany(prop: [data: { path?, middleware, router? }])`

- `prop`: `Array<data>`
- `data.path`: `string|null`
- `data.middleware`: `Array<MiddlewareFn>`
- `data.router`: `NeuRouter`

```js
import Neumatter from 'neumatter'
import productRouter from './routes/products.js'

const app = new Neumatter()

const middlewareFn = (req, res, next) => {
  // do something
  next() // call NextFunction
}

await app.useMany([
  {
    middleware: [middlewareFn]
  },
  {
    path: '/products',
    middleware: [middlewareFn],
    router: productRouter
  }
])
```


<a name="listen"></a>
### `neumatter.listen(options?: { port?, host? })`

- `options.port`: `number` Port that the server will run on.
- `options.host`: `string` Set the servers host. Defaults to localhost.


<a name="listener"></a>
### `neumatter.listener()`

The function that will be called on server requests. Creating a server and using the function manually will skip the `neumatter.init` function.

```js
import Neumatter from 'neumatter'
import http from 'http'

const app = new Neumatter()

const server = http.createServer(Neumatter.serverOptions, app.listener())
```


<a name="init"></a>
### `neumatter.init(serverFn)`

- `serverFn`: `typeof http.createServer`

```js
import Neumatter from 'neumatter'
import http from 'http'

const app = new Neumatter()

const server = app.init(http.createServer)
```


<a name="app-method"></a>
### `neumatter['METHOD'](path, middlewareFn|responseFn)`

- `path`: `string` Path for url lookup.
- `middlewareFn|responseFn`: `MiddlewareFn|Array<MiddlewareFn>|ResponseFn`
- `METHODS`:
    - `get`
    - `post`
    - `put`
    - `patch`
    - `trace`
    - `options`
    - `connect`
    - `delete`

```js
import Neumatter from 'neumatter'
import http from 'http'

const app = new Neumatter()

app.get('/', (req, res) => {
  res.json({ data: 'Hello World!' })
})

app.post('/page',
  (req, res, next) => {
    if (!req.body.name) res.redirect('/')
    next()
  },
  (req, res) => {
    // do something
    res.send('success')
  }
)
```


<a name="load"></a>
### `Neumatter.load()`

The function to load the configuration file and return the application.

```js
import Neumatter from 'neumatter'

const app = await Neumatter.load()

app.listen()
```


<a name="logger"></a>
### `Neumatter.Logger`

The class that can be used to create a new Logger instance.

```js
import Neumatter from 'neumatter'

const logger = new Neumatter.Logger({ virtual: true })
```


<a name="app-router"></a>
### `Neumatter.Router`

The class that can be used to create a new Router instance.

```js
import Neumatter from 'neumatter'

const router = new Neumatter.Router()
```
