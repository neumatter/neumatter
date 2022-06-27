import * as fsp from 'fs/promises'
import nodePath from 'path'
import NeuPack from 'neupack'

const REGEX_DELIM = /{{.*?}}|{#.*?#}/
const REGEX_IS_CODE = /^{{#/
const FIND_BLOCKS = /{{# importBlock\('.*?'\) #}}/g
const FIND_LAYOUT = /{{# extends .*? #}}/g
const LAYOUT_BLOCKS = /{{# block .*? #}}/g
const FOR_OF_G = /{{# for (.*?) of (.*?) #}}/g
const FOR_OF = /{{# for (.*?) of (.*?) #}}/
const FOR_AWAIT_OF_G = /{{# for await (.*?) of (.*?) #}}/g
const FOR_AWAIT_OF = /{{# for await (.*?) of (.*?) #}}/

const readFileJoin = async (...args) => (await fsp.readFile(nodePath.join(...args))).toString()

const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor

class Cache {
  constructor () {
    this.data = {}
  }

  get (key) {
    return this.data[key] || null
  }

  set (key, value) {
    this.data[key] = value
    return this
  }

  remove (key) {
    const { [key]: deleted, ...rest } = this.data
    this.data = rest
    return this
  }

  edit (key, value) {
    const oldValue = this.data[key]
    this.data[key] = {
      ...oldValue,
      ...value
    }
    return this
  }
}

const findLayout = data => {
  const layoutFound = data.match(FIND_LAYOUT)[0] || null
  if (!layoutFound) return null
  return layoutFound.slice(12, -4)
}

class Template {
  constructor ({
    name,
    dirname,
    data
  }) {
    this.name = name
    this.dirname = dirname
    this.path = nodePath.join(dirname, name)
    this.data = data
    this.layout = findLayout(data)
  }

  get layoutBlocks () {
    return this.data.match(LAYOUT_BLOCKS)
  }
}

export default class JoinX {
  boilerplate = null

  constructor ({
    layouts = null,
    views,
    defaultData = {}
  }) {
    this.dirname = nodePath.resolve(views)
    this.layoutsDir = nodePath.resolve(layouts)
    this.default = defaultData
    this.cache = new Cache()
    this.render = this.render.bind(this)
    this.parseBlocks = this.parseBlocks.bind(this)
    this.parseLayout = this.parseLayout.bind(this)
  }

  split (template) {
    let result = REGEX_DELIM.exec(template)
    const arr = []
    let firstPos
    while (result) {
      firstPos = result.index
      if (firstPos !== 0) {
        arr.push({
          is: 'html',
          string: template.substring(0, firstPos)
        })
        template = template.slice(firstPos)
      }
      arr.push({
        is: REGEX_IS_CODE.test(result[0]) ? 'code' : 'literal',
        string: result[0]
      })
      template = template.slice(result[0].length)
      result = REGEX_DELIM.exec(template)
    }
    if (template) {
      arr.push({
        is: 'html',
        string: template
      })
    }
    return arr
  }

  parse (template) {
    let returnArray = []
    template = template.replace(/ <\$_ENTER_\$> /g, '\n')
    const jxArray = this.split(template)
    returnArray = jxArray
    return returnArray
  }

  compile (template, data) {
    const els = this.parse(template)
    const printKeys = Object.keys(data).join(', ')
    let code = `const { ${printKeys} } = data\n  const _output = []\n`
    NeuPack.each(els, el => {
      if (el.string === '\n') return
      if (el.is === 'code') {
        el.string = el.string.replace(/{{# endFor #}}/g, '{{# } #}}')
        const forOfMatches = el.string.match(FOR_OF_G)
        const forAwaitOfMatches = el.string.match(FOR_AWAIT_OF_G)
        if (forOfMatches) {
          NeuPack.each(forOfMatches, forOf => {
            const matches = forOf.match(FOR_OF)
            const item = matches[1]
            const arr = matches[2]
            el.string = el.string.replace(`{{# for ${item} of ${arr} #}}`, `{{# for (let ${item} of ${arr}) { #}}`)
          })
        }
        if (forAwaitOfMatches) {
          NeuPack.each(forOfMatches, forOf => {
            const matches = forOf.match(FOR_AWAIT_OF)
            const item = matches[1]
            const arr = matches[2]
            el.string = el.string.replace(`{{# for await ${item} of ${arr} #}}`, `{{# for await (let ${item} of ${arr}) { #}}`)
          })
        }
      }
      code += el.is === 'html'
        ? `\n_output.push(\`${el.string}\`)`
        : el.is === 'code'
          ? `\n${el.string.replace(/{{# | #}}/g, '')}`
          : `\n_output.push(\`\${${el.string.replace(/{{ | }}/g, '')}}\`)`
    })
    code += '\nreturn _output.join(\'\')'
    return data?.isAsync
      ? new AsyncFunction('data', code)
      : new Function('data', code) // eslint-disable-line
  }

  async parseBlocks (template, dir) {
    dir = dir || this.dirname
    const blocks = template.match(FIND_BLOCKS)
    if (!blocks) return template
    await NeuPack.all(blocks, async block => {
      const blockName = `${block.slice(17, -6)}.jx`
      const blockContent = await readFileJoin(dir, blockName)
      template = template.replace(block, blockContent)
    })
    return template
  }

  async parseLayout (template) {
    let layout = await readFileJoin(this.layoutsDir, `${template.layout}.jx`)
    const blocks = template.layoutBlocks
    await NeuPack.all(blocks, async blockStart => {
      const blockEnd = blockStart.replace('block', 'end')
      const blockRegExp = new RegExp(`${blockStart}([^]*?)${blockEnd}`)
      const block = template.data.match(blockRegExp)[1]
      const layoutReplace = blockStart.replace('block', 'import')
      layout = layout.replace(layoutReplace, block)
    })
    const layoutParsed = await this.parseBlocks(layout.replace(/\n/g, ' <$_ENTER_$> '), this.layoutsDir)
    return layoutParsed
  }

  async render (file, options) {
    const data = {
      ...this.default,
      ...options
    }
    const cachedCompileHTML = this.cache.get(file)
    if (cachedCompileHTML) {
      return cachedCompileHTML(data)
    }
    const templateData = await readFileJoin(this.dirname, `${file}.jx`)
    const template = new Template({ name: file, dirname: this.dirname, data: templateData })
    const layout = await this.parseLayout(template)
    const templateParsed = await this.parseBlocks(layout.replace(/\n/g, ' <$_ENTER_$> '))
    const compileHTML = this.compile(templateParsed, data)
    this.cache.set(file, compileHTML)
    return compileHTML(data)
  }
}
