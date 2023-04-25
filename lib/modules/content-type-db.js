
import './fetch.g.js'

export default class ContentTypeDB {
  #extensions = {}
  #types = {}

  static async connect () {
    const URL = 'https://svn.apache.org/repos/asf/httpd/httpd/trunk/docs/conf/mime.types'
    const TYPE_LINE_REGEXP = /^(?:# )?([\w-]+\/[\w+.-]+)((?:\s+[\w-]+)*)$/gm
    const response = await fetch(URL)
    const text = await response.text()

    const json = {
      types: {},
      extensions: {}
    }

    let match = null

    TYPE_LINE_REGEXP.index = 0

    while ((match = TYPE_LINE_REGEXP.exec(text))) {
      const mime = match[1]

      if (mime.slice(-8) === '/example') {
        continue
      }

      // parse the extensions
      const extensions = (match[2] || '')
        .split(/\s+/)
        .filter(Boolean)

      const typeArr = mime.split('/')
      const type = typeArr[0]
      const subtype = typeArr[1] || ''

      json.types[mime] = {
        mime,
        type,
        subtype,
        extensions
      }

      let index = -1
      while (++index < extensions.length) {
        if (!json.extensions[extensions[index]]) {
          json.extensions[extensions[index]] = []
        }
        json.extensions[extensions[index]].push(mime)
      }
    }

    return new ContentTypeDB(json)
  }

  constructor ({ extensions, types }) {
    this.#extensions = extensions
    this.#types = types
  }

  /**
   *
   * @param {string} mime
   * @returns {{ mime: string, type: string, subtype: string, extensions: Array<string> }}
   */
  fromType (mime) {
    return this.#types[mime] || null
  }

  /**
   *
   * @param {string} ext
   * @returns {{ mime: string, type: string, subtype: string, extensions: Array<string> }}
   */
  fromExtension (ext) {
    if (!this.#extensions[ext]) {
      return null
    }

    return this.#types[this.#extensions[ext][0]] || null
  }

  /**
   *
   * @param {{ mime?: string, type?: string, subtype?: string, extensions?: Array<string> } | undefined} filter
   * @returns {Promise<Array<{ mime: string, type: string, subtype: string, extensions: Array<string> }>>}
   */
  async find (filter = {}) {
    const keys = Object.keys(this.#types)
    const res = []

    await Promise.all(keys.map(async key => {
      let match = true
      const value = this.#types[key]
      if (typeof filter.mime !== 'undefined' && value.mime !== filter.mime) match = false
      if (typeof filter.type !== 'undefined' && value.type !== filter.type) match = false
      if (typeof filter.subtype !== 'undefined' && value.subtype !== filter.subtype) match = false
      if (typeof filter.extensions !== 'undefined' && value.extensions !== filter.extensions) match = false
      if (match) res.push(value)
    }))

    return res
  }

  /**
   *
   * @param {string | { mime?: string, type?: string, subtype?: string, extensions?: Array<string> }} filter
   * @returns {{ mime: string, type: string, subtype: string, extensions: Array<string> }}
   */
  findOne (filter) {
    let res = null
    if (typeof filter === 'string') {
      res = this.fromExtension(filter)
      if (res) return res
      res = this.fromType(filter)
      return res
    }

    filter = filter || {}
    const keys = Object.keys(this.#types)
    const { length } = keys
    let index = -1

    while (++index < length) {
      const key = keys[index]
      let match = true
      const value = this.#types[key]
      if (typeof filter.mime !== 'undefined' && value.mime !== filter.mime) match = false
      if (typeof filter.type !== 'undefined' && value.type !== filter.type) match = false
      if (typeof filter.subtype !== 'undefined' && value.subtype !== filter.subtype) match = false
      if (typeof filter.extensions !== 'undefined' && value.extensions !== filter.extensions) match = false
      if (match) {
        res = value
        break
      }
    }

    return res
  }
}
