import fs from 'fs'
import nodePath from 'path'
import Logger from './logger.js'
import ByteView from 'byteview'
import { fileURLToPath } from 'url'

const LINE_REGEXP = /(^#?\w+)\s*?=\s*?(['"`])?([^\s'"`][^\n\r]*)$/
const LITERAL_REGEXP = /\$\{(\w+)\}/

const envLogger = new Logger({ name: 'EnvLogger', virtual: true })

const parseDefaultOptions = (options) => {
  return {
    encoding: options.encoding ?? 'utf8',
    override: options.override ?? false,
    name: options.name ?? '.env',
    log: options.log ?? false
  }
}

function readFileSync (path) {
  const data = fs.readFileSync(path, { encoding: 'utf8' })
  return data.replace(/\r\n?/mg, '\n')
}

class EnvEntry {
  constructor (key, value, type) {
    this.key = key
    this.value = value

    if (type === undefined) {
      switch (typeof value) {
        case 'string':
          type = 'string'
          break
        case 'number':
          type = 'number'
          break
        case 'boolean':
          type = 'boolean'
          break
        default:
          throw new TypeError('recieved invalid typeof value')
      }
    }

    this.type = type
  }

  toString () {
    let response = ''

    switch (this.type) {
      case 'string':
        response += `${this.key} = '${this.value}'`
        break
      case 'number':
        response += `${this.key} = ${this.value}`
        break
      case 'boolean':
        response += `${this.key} = ${this.value}`
        break
      case 'comment':
        response += `# ${this.value}`
        break
      default:
        break
    }

    return response
  }
}

let commentCounter = 0

export default class Env {
  static set (options = {}) {
    const filePath = Env.resolvePath(options.path)

    if (filePath) {
      let data = readFileSync(filePath)

      if (options.encoding !== undefined && options.encoding !== 'utf8') {
        data = ByteView.from(data, options.encoding).toString()
      }

      const map = Env.parse(data)
      const env = new Env(map, options)
      env.writeToProcess()
    } else {
      envLogger.info('no dotenv file found')
      envLogger.close()
    }
  }

  static resolvePath (fileOrDirectoryPath) {
    const pathOne = nodePath.resolve(fileOrDirectoryPath ?? process.cwd())

    if (fs.existsSync(pathOne)) {
      const stat = fs.statSync(pathOne)
      if (stat.isDirectory()) {
        const files = fs.readdirSync(pathOne)
        let index = -1
        const { length } = files
        let bestMatch = null

        while (++index < length) {
          const file = files[index]
          if (
            file === '.env' && (
              bestMatch === null ||
              (bestMatch === '.env.production' && process.env.NODE_ENV !== 'production') ||
              (bestMatch === '.env.dev' && process.env.NODE_ENV !== 'development') ||
              (bestMatch === '.env.development' && process.env.NODE_ENV !== 'development')
            )
          ) {
            bestMatch = '.env'
          } else if (
            file === '.env.production' && (
              bestMatch === null ||
              process.env.NODE_ENV === 'production'
            )
          ) {
            bestMatch = '.env.production'
          } else if (
            file === '.env.dev' && (
              bestMatch === null ||
              process.env.NODE_ENV === 'development'
            )
          ) {
            bestMatch = '.env.development'
          } else if (
            file === '.env.development' && (
              bestMatch === null ||
              process.env.NODE_ENV === 'development'
            )
          ) {
            bestMatch = '.env.development'
          }
        }

        if (bestMatch === null) {
          throw new RangeError('failed to resolve filePath')
        }

        return nodePath.resolve(pathOne, bestMatch)
      }

      return pathOne
    } else {
      return null
    }
  }

  static from (pathOrData, options = {}) {
    const {
      encoding,
      override,
      log
    } = parseDefaultOptions(options)

    switch (typeof pathOrData) {
      case 'string': {
        const path = nodePath.resolve(process.cwd(), pathOrData)
        if (fs.existsSync(path)) {
          let data = readFileSync(pathOrData)

          if (encoding !== 'utf8') {
            data = ByteView.from(data, encoding).toString()
          }

          const map = Env.parse(data)
          const env = new Env(map, { encoding, override, log })
          return env
        } else {
          const map = Env.parse(pathOrData)
          const env = new Env(map, { encoding, override, log })
          return env
        }
      }

      case 'object': {
        if (pathOrData instanceof URL) {
          const path = fileURLToPath(pathOrData)
          let data = readFileSync(path)

          if (encoding !== 'utf8') {
            data = ByteView.from(data, encoding).toString()
          }

          const map = Env.parse(data)
          const env = new Env(map, { encoding, override, log })
          return env
        } else if (pathOrData instanceof Map) {
          return new Env(pathOrData, { encoding, override, log })
        } else if (Array.isArray(pathOrData)) {
          return new Env(pathOrData, { encoding, override, log })
        } else {
          const entries = []

          for (const key in pathOrData) {
            entries.push([key, pathOrData[key]])
          }

          return new Env(entries, { encoding, override, log })
        }
      }
    }
  }

  static parse (data) {
    const response = new Map()
    data = data.replace(/[\r\n]+/g, '[REPLACE]').split('[REPLACE]')

    if (!data.length) {
      return response
    }

    let dataIndex = -1
    const { length } = data

    while (++dataIndex < length) {
      const line = data[dataIndex].trim()
      if (!line.length) continue

      if (line[0] === '#') {
        const key = `comment${++commentCounter}`
        response.set(key, new EnvEntry(key, line, 'comment'))
        continue
      }

      const match = LINE_REGEXP.exec(line)
      if (!match) continue
      const key = match[1]

      if (key[0] === '#') { // comment
        continue
      }

      let value = match[3] || ''
      const literals = value.match(LITERAL_REGEXP)

      if (match[2] && literals) {
        let index = 0
        const { length: literalsSize } = literals

        while (++index < literalsSize) {
          const literal = literals[index]

          const literalValue = response.get(literal)
          if (literalValue === undefined) {
            const message = `Parse Error: tried to use string literal '${literal}', before it was defined`
            throw new RangeError(message)
          }

          value = value.replace(`\${${literal}}`, literalValue.value)
        }
      }

      if (match[2]) {
        response.set(
          key,
          new EnvEntry(key, String(value).replace(/['"`\r\n]/g, ''), 'string')
        )

        continue
      }

      if (value === 'true') {
        response.set(key, new EnvEntry(key, true, 'boolean'))
      } else if (value === 'false') {
        response.set(key, new EnvEntry(key, false, 'boolean'))
      } else {
        const numb = Number(value)
        if (isNaN(numb)) {
          throw new RangeError('failed to parse value into number')
        }

        response.set(key, new EnvEntry(key, numb, 'number'))
      }
    }

    return response
  }

  /** @type {Map<string, EnvEntry>} */
  #map
  #options

  constructor (data, options = {}) {
    if (!(data instanceof Map)) {
      data = new Map(data)
    }

    this.#map = data
    this.#options = parseDefaultOptions(options)
  }

  addComment (comment) {
    const key = `comment${++commentCounter}`
    this.#map.set(key, new EnvEntry(key, comment, 'comment'))
  }

  set (key, value) {
    this.#map.set(key, new EnvEntry(key, value))
  }

  get (key) {
    const res = this.#map.get(key)

    if (res === undefined) {
      return res
    }

    return res.value
  }

  toString (encoding) {
    const response = []
    encoding = encoding !== undefined ? encoding : this.#options.encoding

    for (const entry of this.#map.values()) {
      response.push(entry.toString())
    }

    if (encoding !== 'utf8') {
      return ByteView.from(response.join('\n')).toString(encoding)
    }

    return response.join('\n')
  }

  toBuffer () {
    return ByteView.from(this.toString())
  }

  writeFileSync (path) {
    path = nodePath.resolve(process.cwd(), path ?? '.env')
    fs.writeFileSync(path, this.toString())
  }

  writeFile (path) {
    return new Promise((resolve, reject) => {
      path = nodePath.resolve(process.cwd(), path ?? '.env')
      fs.writeFile(path, this.toString(), (err) => {
        if (err) reject(err)
        resolve()
      })
    })
  }

  writeToProcess (options = {}) {
    const override = 'override' in options ? options.override : this.#options.override
    const log = 'log' in options ? options.log : this.#options.log

    for (const entry of this.#map.values()) {
      if (entry.type === 'comment') continue
      if (process.env[entry.key] !== undefined) {
        if (override) {
          process.env[entry.key] = entry.value
          if (log) console.log(`process.env[${entry.key}] = ${entry.value} / after overriding process.env[${entry.key}]`)
        } else {
          if (log) console.log(`process.env[${entry.key}] already set / pass in { override: true } to override`)
        }
      } else {
        process.env[entry.key] = entry.value
      }
    }
  }

  toJSON () {
    const response = []

    for (const entry of this.#map.values()) {
      response.push([entry.key, entry])
    }

    return response
  }
}
