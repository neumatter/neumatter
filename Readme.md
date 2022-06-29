
# neumatter
![plot](https://img.shields.io/npm/v/neumatter?style=for-the-badge)
![plot](https://img.shields.io/npm/dt/neumatter?style=for-the-badge)
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

<br />

<a name="install"></a>
## Install

```console
npm i neumatter --save
```

<br />

<a name="getting-started"></a>
## Getting Started


<a name="configuration-file"></a>
### Configuration File:

```json
{
  "env": {
    "port": 3004,
    "static": "./public",
    "context": "testCTX",
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


<a name="constructor"></a>
### Constructor:


### Options:

- parseMethod: `string` Method that will be used to parse `NeuRequest.body`.
- errorMiddleware: `function` Error Handler.
- proxy: `boolean`
- env: `string`
- port: `number`
- host: `string`
- static: `string`
- views: `string`
- context: `object`
- configureHeaders: `object`
- viewer: `object`
- logger: { name, virtual }


```js
import NeuJS from 'neujs'

const app = new NeuJS()

app.get('/', (req, res) => {
  res.send('Hello World')
})

app
  .listen({})
```


### Adding Routers & Middleware:

```js
import NeuJS from 'neujs'
import productRouter from './routes/products.js'
import productMiddlewareFn from './middleware.js'
import middlewareFn from './middleware.js'

const app = new NeuJS()

await app.use({
  middleware: middlewareFn
})

await app.use({
  path: '/products',
  middleware: productMiddlewareFn,
  router: productRouter
})

app
  .listen({})
```

