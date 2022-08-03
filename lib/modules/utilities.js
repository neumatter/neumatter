
import { readFile } from 'fs/promises'
import nodePath from 'path'

export function ifStatic (path) {
  return nodePath.extname(path)
}

export function parseRoute (url) {
  let u = url === '/' ? '^(?:(\\?[^#]+))?/?$' : '^' + url.replace(/\/$/, '') + '(?:(\\?[^#]+))?/?$'
  let hasParam = false
  if (url.match(/\/:[a-zA-Z0-9]+/g)) {
    hasParam = true
    const urlArray = url.match(/\/:[a-zA-Z0-9]+/g)
    urlArray.forEach(p => {
      const param = p.replace('/:', '')
      u = u.replace(p, `(?:/(?<${param}>[^/#\\?]+?))`)
    })
  } else {
    hasParam = false
  }
  return {
    regexp: new RegExp(u, 'i'),
    params: hasParam
  }
}

export async function readJSON (path) {
  return JSON.parse((await readFile(path)).toString())
}

const CAMEL_REGEX = /[A-Z\xC0-\xD6\xD8-\xDE]?[a-z\xDF-\xF6\xF8-\xFF]+|[A-Z\xC0-\xD6\xD8-\xDE]+(?![a-z\xDF-\xF6\xF8-\xFF])|\d+/g

/**
 *
 * @param {string} string
 * @returns {string[]}
 * @api private
 */
export function toWords (string) {
  return string.replace(/[\u{0080}-\u{FFFF}]/gu, '').match(CAMEL_REGEX) || [string]
}

export function toCamelCase (string) {
  const a = toWords(string)
  const { length } = a
  let index = -1
  let result = ''
  while (++index < length) {
    const str = a[index].toLowerCase()
    result += index !== 0
      ? str.substring(0, 1).toUpperCase() + str.substring(1)
      : str
  }
  return result
}

export function toPascalCase (string) {
  const a = toWords(string)
  const { length } = a
  let index = -1
  let result = ''
  while (++index < length) {
    const str = a[index].toLowerCase()
    result += str.substring(0, 1).toUpperCase() + str.substring(1)
  }
  return result
}

export function toProperCase (str) {
  return str.toLowerCase().replace(/^\w|\s\w/g, (l) => l.toUpperCase())
}

export function sentenceCase (str) {
  return str.toLowerCase().replace(/(^\w)|\.\s+(\w)/gm, (l) => l.toUpperCase())
}

export function unCamelCase (str) {
  str = str.replace(/([a-z\xE0-\xFF])([A-Z\xC0\xDF])/g, '$1 $2')
  str = str.toLowerCase()
  return str
}

export function addSpaces (str) {
  return toWords(str).join(' ')
}

export function addDelimeter (str, delimeter = '-') {
  const arr = toWords(str)
  return arr.join(delimeter)
}

export function toKebabCase (str) {
  return addDelimeter(str, '-').toLowerCase()
}

export function toSnakeCase (str) {
  return addDelimeter(str, '_').toLowerCase()
}

export function toConstantCase (str) {
  return addDelimeter(str, '_').toUpperCase()
}

export function escapeHTML (str) {
  str = str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/'/g, '&#39;')
    .replace(/"/g, '&quot;')

  return str
}

export function unescapeHTML (str) {
  str = str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, '\'')
    .replace(/&quot;/g, '"')
  return str
}

export function normalizeLines (str, newline = '\n') {
  return str.replace(/\r\n?/g, newline)
}

export function wrapLines (str, tag = 'p', classNames = null) {
  const lines = normalizeLines(str).split('\n')
  const { length } = lines
  const addClasses = classNames ? ` class="${classNames}"` : ''
  let output = ''
  let index = -1
  while (++index < length) {
    if (!lines[index].length) continue
    output += `<${tag}${addClasses}>${lines[index]}</${tag}>`
  }
  return output
}

/**
 *
 * @param {string} str
 * @param {number} max
 * @param {string?} append - Will be appended at the end of the truncated string
 * @returns {string}
 */
export function truncate (str, max, append) {
  max = append ? max - append.length : max
  if (str.length < max) return str
  return append
    ? str.slice(0, max) + append
    : str.slice(0, max)
}

/**
 *
 * @param {any} input
 * @returns {string}
 */
export function toBuiltinType (input) {
  return Object.prototype.toString.call(input).slice(8, -1).toLowerCase()
}

export function encodeURL (str) {
  return encodeURI(str).replace(/%5B/g, '[').replace(/%5D/g, ']')
}
