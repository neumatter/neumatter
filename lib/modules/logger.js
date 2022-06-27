
import * as fs from 'fs'
import nodePath from 'path'

export default class Logger {
  constructor ({
    name,
    dir = nodePath.join(process.cwd(), './logs'),
    cacheSize = 100,
    json = false,
    virtual = false
  }) {
    this.name = name
    if (!fs.existsSync(dir)) fs.mkdirSync(dir)
    this.path = nodePath.join(dir, `${
      new Date().toISOString().replaceAll(':', '-').split('.')[0].split('T')[0]
    }-${this.name}.log`)
    this.json = json
    this.virtual = virtual
    this.cacheSize = cacheSize
    this.cache = []
    this.colors = {
      cyan: '\x1b[38;5;123m',
      magenta: '\x1b[38;5;213m',
      orange: '\x1b[38;5;208m',
      purple: '\x1b[38;5;141m',
      red: '\x1b[38;5;9m',
      green: '\x1b[38;5;10m',
      yellow: '\x1b[38;5;221m',
      reset: '\x1b[0m'
    }

    process.on('exit', () => {
      fs.appendFileSync(this.path, this.fileData)
    })
  }

  toJSON () {
    return this.cache
  }

  get fileData () {
    return this.json
      ? JSON.stringify(this.cache)
      : this.cache.map(log => `${log}\n`).join('')
  }

  log (level, message) {
    const levelMap = {
      info: this.colors.cyan,
      debug: this.colors.green,
      trace: this.colors.yellow,
      warn: this.colors.orange,
      error: this.colors.red,
      fatal: this.colors.red
    }
    const date = new Date().toISOString().replace('T', ' ').split('.')[0]
    const output = this.json
      ? { name: this.name, date, level, message }
      : `[${this.name}] [${date}] [${level}] ${message}`
    const consoleOutput = this.json
      ? JSON.stringify({ name: this.name, date, level, message })
      : `[${this.colors.magenta}${this.name}${this.colors.reset}] [${date}] [${levelMap[level]}${level}${this.colors.reset}] `
    if (process.env.NODE_ENV !== 'production') {
      console.log(consoleOutput)
      if (!this.json) console.log(message)
    }
    if (this.virtual) return this
    this.cache.push(output)
    if (this.cache.length >= this.cacheSize) {
      fs.appendFileSync(this.path, this.fileData)
      this.cache = []
    }
    return this
  }

  close () {
    if (this.virtual) return this
    fs.appendFileSync(this.path, this.cache.map(l => `${l}\n`).join(''))
    this.cache = []
  }

  info (message) {
    this.log('info', message)
    return this
  }

  debug (message) {
    this.log('debug', message)
    return this
  }

  trace (message) {
    this.log('trace', message)
    return this
  }

  warn (message) {
    this.log('warn', message)
    return this
  }

  error (message) {
    this.log('error', message)
    return this
  }

  fatal (message) {
    this.log('fatal', message)
    return this
  }
}
