
# x-route-builder

A light-weight utility for creating file based routing in frameworks like express.


## Features:

- File-based routing.
- Can ignore files.
- Can alter the file's route that is created.
- Dynamic routes (`req.params`) - File:`[id].js` - Will be altered to `/:id`.
- Dynamic middleware - Place `_middleware.js` file in routes directory. The middleware will be applied to all routes inside the directory but will not be applied to routes above the directory.
- Fully customizable.
- Will log the output if in development env.

<br />

# Table of Contents
1. [ Install ](#install) <br />
2. [ Usage ](#examples) <br />

<br />

<a name="install"></a>
## Install

```console
npm i x-route-builder 
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

