import IS from '@neumatter/is'
import NeuPack from 'neupack'

/* eslint-disable-next-line */
const unicodeRegEx = /[\\\'\u0000-\u001f\u007f-\u009f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g

const cleanString = string => {
  string = string.replace(/\\/gi, '\\\\')
  if (/[\t\n\f\r"]/g.test(string)) {
    string = string
      .replace(/\t/g, '\\t')
      .replace(/\n/g, '\\n')
      .replace(/\f/g, '\\f')
      .replace(/\r/g, '\\r')
      .replace(/"/g, '\\"')
  }
  if (unicodeRegEx.test(string)) {
    string = string
      .replace(unicodeRegEx, uc => {
        return '\\u' + ('0000' + uc.charCodeAt(0).toString(16)).slice(-4)
      })
  }
  return string
}

const isNullType = input => {
  return IS.NaN(input) || IS.infinite(input) || IS.null(input)
}
const isUndefinedType = input => {
  return IS.undefined(input) || IS.symbol(input)
}

const NOT_NUM_REGEX = /[^0-9]+/i

const toBuiltinType = input => {
  let result = Object.prototype.toString.call(input).slice(8, -1)
  if (result === 'Number') {
    result = NOT_NUM_REGEX.test(input.toString()) ? 'NaN' : 'Number'
  }
  return result === 'AsyncFunction' ? 'Function' : result
}

const isNull = type => {
  return type === 'Null' || type === 'NaN' || type === 'Infinite'
}

const isDontEscape = type => {
  return type === 'Boolean' || type === 'Number'
}

const isUndefined = type => {
  return type === 'Undefined' || type === 'Symbol'
}

const isFunction = type => {
  return type === 'Function'
}

const isDate = type => {
  return type === 'Date'
}

const isRegExp = type => {
  return type === 'RegExp'
}

const isObject = type => {
  return type === 'Object'
}

const isArray = type => {
  return type === 'Array'
}

const isString = type => {
  return type === 'String'
}

function isHexadecimal (char) {
  return (
    (char >= '0' && char <= '9') ||
    (char.toLowerCase() >= 'a' && char.toLowerCase() <= 'f')
  )
}

class Parser {
  constructor (str) {
    this.str = str
    this.i = 0
    this.result = null
  }

  skipSpaces () {
    while (
      this.str[this.i] === ' ' ||
      this.str[this.i] === '\n' ||
      this.str[this.i] === '\t' ||
      this.str[this.i] === '\r'
    ) {
      this.i++
    }
  }

  eatComma () {
    if (this.str[this.i] !== ',') {
      throw new Error(`Expected: "," | Received: "${this.str[this.i]}"`)
    }
    this.i++
  }

  eatColon () {
    if (this.str[this.i] !== ':') {
      throw new Error(`Expected: ":" | Received: "${this.str[this.i]}"`)
    }
    this.i++
  }

  parseString () {
    if (this.str[this.i] === '"') {
      this.i++
      let result = ''
      while (this.str[this.i] !== '"') {
        if (this.str[this.i] === '\\') {
          const char = this.str[this.i + 1]
          if (
            char === '"' ||
            char === '\\' ||
            char === '/' ||
            char === 'b' ||
            char === 'f' ||
            char === 'n' ||
            char === 'r' ||
            char === 't'
          ) {
            result += char
            this.i++
          } else if (char === 'u') {
            if (
              isHexadecimal(this.str[this.i + 2]) &&
              isHexadecimal(this.str[this.i + 3]) &&
              isHexadecimal(this.str[this.i + 4]) &&
              isHexadecimal(this.str[this.i + 5])
            ) {
              const start = this.i + 2
              const end = this.i + 6
              result += String.fromCharCode(
                parseInt(this.str.slice(start, end), 16)
              )
              this.i += 5
            }
          }
        } else {
          result += this.str[this.i]
          this.i++
        }
      }
      this.i++
      return result
    }
  }

  parseArray () {
    if (this.str[this.i] === '[') {
      this.i++
      this.skipSpaces()

      const result = []
      let initial = true
      while (this.str[this.i] !== ']') {
        if (!initial) {
          this.eatComma()
        }
        const value = this.parseValue()
        result.push(value)
        initial = false
      }
      this.i++
      return result
    }
  }

  parseObject () {
    const result = {}
    if (this.str[this.i] === '{') {
      this.i++
      this.skipSpaces()
      let initial = true
      while (this.str[this.i] !== '}') {
        if (!initial) {
          this.eatComma()
          this.skipSpaces()
        }
        const key = this.parseString()
        this.skipSpaces()
        this.eatColon()
        const value = this.parseValue()
        result[key] = value
        initial = false
      }
      this.i++
      return result
    }
  }

  parseIfNumber () {
    const start = this.i
    let end = this.i
    if (this.str[end] === '-') {
      end++
    }
    if (this.str[end] === '0') {
      end++
    } else if (this.str[end] >= '1' && this.str[end] <= '9') {
      end++
      while (this.str[end] >= '0' && this.str[end] <= '9') {
        end++
      }
    }

    if (this.str[end] === '.') {
      end++
      while (this.str[end] >= '0' && this.str[end] <= '9') {
        end++
      }
    }
    if (this.str[end] === 'e' || this.str[end] === 'E') {
      end++
      if (this.str[end] === '-' || this.str[end] === '+') {
        end++
      }
      while (this.str[end] >= '0' && this.str[end] <= '9') {
        end++
      }
    }
    if (end > start) {
      return Number(this.str.slice(start, end)) || false
    } else {
      return false
    }
  }

  parseIfKeyword () {
    const names = ['true', 'false', 'null']
    const raw = {
      true: true,
      false: false,
      null: null
    }
    let result = 'false'
    NeuPack.each(names, name => {
      if (this.str.slice(this.i, this.i + name.length) === name) {
        this.i += name.length
        result = raw[name]
      }
    })
    return result
  }

  parseValue () {
    this.skipSpaces()
    const currentStr = this.str[this.i]
    const wrappers = {
      '"': 'parseString',
      '[': 'parseArray',
      '{': 'parseObject'
    }
    if (wrappers[currentStr]) {
      return this[wrappers[currentStr]]()
    }
    const numberResult = this.parseIfNumber()
    if (numberResult) {
      return numberResult
    }
    const keywordResult = this.parseIfKeyword()
    if (keywordResult !== 'false') {
      return keywordResult
    }
    this.skipSpaces()
  }
}

export default class NeuJSON {
  static async toJSONString ({ key, container, replacer = null, space = 0 }) {
    let obj = container[key]
    let id = space
    let spacer = ''
    while (id--) {
      spacer += ' '
    }

    if (obj && IS.function(obj.toJSON)) {
      const objValue = obj.toJSON()
      obj = objValue
    }

    if (replacer && IS.function(replacer)) {
      obj = replacer(container, key, container[key])
    }

    const type = toBuiltinType(obj)

    if (obj === null || isNull(type) || isFunction(type)) {
      return null
    }

    if (isObject(type)) {
      const objKeys = Object.keys(obj)
      const json = await NeuPack.all(objKeys, async key => {
        if (!isUndefinedType(obj[key]) && !IS.function(obj[key])) {
          const value = await NeuJSON.toJSONString({ key, container: obj, replacer, space })
          const str = key
          return `"${str}":${spacer}${value}`
        } else {
          return `"${key}":${spacer}${undefined}`
        }
      })
      return `{${json.join(',')}}`
    }

    if (isArray(type)) {
      if (!obj.length) return '[]'
      let arrayString = ''
      await NeuPack.all(obj, async (el, i) => {
        const str = isNullType(el) || isUndefinedType(el)
          ? null
          : await NeuJSON.toJSONString({ key: i, container: obj, replacer, space })
        arrayString += i === 0 ? `${str}` : `,${str}`
      })
      return `[${arrayString}]`
    }

    if (isString(type)) {
      const str = cleanString(obj)
      return `"${str}"`
    }

    if (isDontEscape(type)) {
      return obj
    }

    if (isUndefined(type)) {
      return
    }

    if (isDate(type)) {
      return `"${obj.toISOString()}"`
    }

    if (isRegExp(type)) {
      const strObj = obj.toString()
      const str = cleanString(strObj)
      return `"${str}"`
    }
  }

  static async stringify (input, replacer, space) {
    return (
      (
        IS.function(replacer) && IS.number(space) &&
        NeuJSON.toJSONString({ key: '', container: { '': input }, replacer, space })
      ) || (
        IS.number(replacer) && IS.undefined(space) &&
        NeuJSON.toJSONString({ key: '', container: { '': input }, space: replacer })
      ) || (
        NeuJSON.toJSONString({ key: '', container: { '': input } })
      )
    )
  }

  static parse (str) {
    return new Parser(str).parseValue()
  }
}
