import fs from 'fs'
import nodePath from 'path'
import Logger from './logger.js'

const LINE_REGEXP = /(^#?\w+)\s*?=\s*?(['"`])?([^\s'"`][^\n\r]*)$/mg
const LITERAL_REGEXP = /\$\{(\w+)\}/

const envLogger = new Logger({ name: 'EnvLogger' })

const parseDefaultOptions = (options) => {
  return {
    encoding: options.encoding || 'utf8',
    path: options.path || nodePath.resolve(process.cwd(), '.env'),
    override: options.override || false,
    log: options.log || false
  }
}

export default class Env {
  constructor ({
    encoding = 'utf8',
    path = nodePath.resolve(process.cwd(), '.env')
  }) {
    let data = fs.readFileSync(path, { encoding }).toString()
    console.log(data.match(LINE_REGEXP))
    data = data.replace(/\r\n?/mg, '\n')
    const booleanMap = { false: false, true: true }
    let match
    while ((match = LINE_REGEXP.exec(data)) !== null) {
      console.log(match)
      const key = match[1]
      if (key[0] === '#') continue // skip comment
      let value = match[3] || ''

      const literals = value.match(LITERAL_REGEXP)
      if (match[2] && literals) {
        literals.forEach(literal => {
          console.log(literal)
          console.log(this[literal])
          if (typeof this[literal] === 'undefined') return
          value = value.replace(`\${${literal}}`, this[literal])
        })
      }

      this[key] = !match[2] && typeof booleanMap[value] !== 'undefined'
        ? booleanMap[value]
        : !match[2]
          ? Number(value) // eslint-disable-line
          : String(value.replace(/['"`\r\n]/g, '')) // eslint-disable-line
    }
  }

  toProcess ({ override = false, log = false }) {
    const keys = Object.keys(this)
    let index = -1
    const { length } = keys
    while (++index < length) {
      const key = keys[index]
      if (!process.env[key]) {
        process.env[key] = this[key]
        if (log) console.log(`process.env[${key}] = ${this[key]}`)
      } else if (override) {
        process.env[key] = this[key]
        if (log) console.log(`process.env[${key}] = ${this[key]} / after overriding process.env[${key}]`)
      } else {
        if (log) console.log(`process.env[${key}] already set / pass in { override: true } to override`)
      }
    }
  }

  static set (options = {}) {
    const {
      encoding,
      path,
      override,
      log
    } = parseDefaultOptions(options)
    if (fs.existsSync(path)) {
      const env = new Env({ encoding, path })
      env.toProcess({ override, log })
    } else {
      envLogger.info('no dotenv file found')
      envLogger.close()
    }
  }
}
