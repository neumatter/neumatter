
# neujs

A light-weight and quick http server framework. Makes use of ES6 async/await and module syntax.


## Features:

- Can use file-based routing.
- Can add replacer to auto routing.
- Async/Await.
- Centralized error handling.

<br />

# Table of Contents
1. [ Install ](#install) <br />
2. [ Getting Started ](#examples) <br />

<br />

<a name="install"></a>
## Install

```console
npm i neujs 
```

<br />

<a name="examples"></a>
## Usage


### Standard:

```js
const Xrouter = require('x-route-builder')

// create the route builder passing in (app)
const xRouter = new XrouteBuilder({
  app: app,
})

// build the routes
xRouter.build()
```


### Options:

```js
const Xrouter = require('x-route-builder')

// create the route builder passing in (app & options)
const xRouter = new XrouteBuilder({
  // app
  app: app,
  // directory path to start reading and building routes in
  dirpath: path.join(__dirname, 'routes'),
  // base path to start routes from
  basepath: '/basepath',
  // files to ignore
  ignore: [
    'ignoreFile1.js', 'ignoreFile2.js'
    ],
  // files to change / keep index of new route names the same as files
  change: {
    file: [
      'file1.js', 'file2.js'
    ],
    new: [
      'newFile1Path', 'newFile2Path'
    ],
  }
})

// build the routes
xRouter.build()
```

