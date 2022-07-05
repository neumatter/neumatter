
![plot](https://github.com/Clyng57/neumatter/raw/main/public/neumatter-logo-blackBG-01.svg)
![plot](https://img.shields.io/npm/v/neumatter?style=for-the-badge&labelColor=black)
![plot](https://img.shields.io/npm/dt/neumatter?style=for-the-badge&labelColor=black)
<br />
[![JavaScript Style Guide](https://cdn.rawgit.com/standard/standard/master/badge.svg)](https://github.com/standard/standard)

A light-weight and quick http server framework. ES6 async/await and ECMAScript modules.


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
    - [ (method) `request.header` ](#request-header)
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

<a name="neumatter"></a>
## Neumatter/App

