'use-strict'

function toBuiltInName (obj) {
  return Object.prototype.toString.call(obj).slice(8, -1)
}

export function shadow (element, mode = 'open') {
  return element.attachShadow({ mode })
}

/**
 *
 * @param {Array<string>} strings
 * @param  {...any} keys
 * @returns {string}
 */
export function html (strings, ...keys) {
  return strings
    .map((s, i) => s + (keys[i] || ''))
    .join('')
}

const ON_REGEX = /^on[A-Z]/

export class WebComponent extends HTMLElement {
  state
  context
  #contextMap
  #stateMap

  constructor () {
    super()
    // set up state object
    this.state = {}
    this.context = {}
    this.#contextMap = {}
    this.#stateMap = {}
  }

  connectedCallback () {
    if (!this.isConnected) return
    const props = Object.getOwnPropertyNames(this)
    const listeners = props.filter(prop => ON_REGEX.test(prop))
    const { length } = listeners
    if (length) {
      let index = -1
      while (++index < length) {
        const key = listeners[index]
        const event = key.replace(/^on/, '').toLowerCase()
        const callback = this[key]
        this.addEventListener(event, callback)
        console.info(`New Event Listener Added: ${key}`)
      }
    }
    if (typeof this.render === 'function') {
      console.info('HTMLComponent.render method found and called')
      try {
        this.render()
      } catch (err) {
        console.error(err)
      }
    }
    if (typeof this.componentOnMount === 'function') {
      console.info('HTMLComponent.postMount method found and called')
      try {
        this.componentOnMount()
      } catch (err) {
        console.error(err)
      }
    }
  }

  disconnectedCallback () {
    console.info('component will unmount')
    if (typeof this.componentOnUnmount === 'function') {
      console.info('HTMLComponent.preUnmount method found and called')
      try {
        this.componentOnUnmount()
      } catch (err) {
        console.error(err)
      }
    }
  }

  attributeChangedCallback (name, oldValue, newValue) {
    console.info('HTMLComponent attributes changed')
    if (typeof this.attributeListener === 'function') {
      console.info('HTMLComponent.preUnmount method found and called')
      try {
        this.attributeListener(this)
      } catch (err) {
        console.error(err)
      }
    }
  }

  isCustomElement (element) {
    return (
      Object.getPrototypeOf(customElements.get(element.tagName.toLowerCase()))
        .name === 'HTMLComponent'
    )
  }

  #updateBindings (prop, value = '') {
    const bindings = [...this.queryAll(`[state-bind$="${prop}"]`)]
    const { length } = bindings
    let index = -1

    while (++index < length) {
      const node = bindings[index]
      const dataProp = node.dataset.bind
      const bindProp = dataProp.includes(':')
        ? dataProp.split(':').shift()
        : dataProp
      const bindValue = dataProp.includes('.')
        ? dataProp
            .split('.').slice(1)
            .reduce((obj, p) => obj[p], value)
        : value
      const target = [...this.queryAll(node.tagName)].find(el => el === node)
      const isStateUpdate = dataProp.includes(':') && this.isCustomElement(target)
      isStateUpdate
        ? target.setState({ [`${bindProp}`]: bindValue })
        : this.isArray(bindValue)
          ? (target[bindProp] = bindValue)
          : (node.innerHTML = bindValue.toString())
    }
  }

  setContext (newContext) {
    const keys = Object.keys(newContext)
    const { length } = keys
    let index = -1

    while (++index < length) {
      const key = keys[index]
      const value = newContext[key]
      this.context[key] = this.isObject(this.context[key]) && this.isObject(value)
        ? { ...this.context[key], ...value }
        : value
      if (this.#contextMap[key]) {
        this.#contextMap[key](this.context[key])
      }
    }
  }

  getContext (key) {
    return this.context[key]
  }

  useContext (key, callback) {
    this.#contextMap[key] = callback
    return this
  }

  setState (newState) {
    const keys = Object.keys(newState)
    const { length } = keys
    let index = -1

    while (++index < length) {
      const key = keys[index]
      const value = newState[key]
      this.state[key] = this.isObject(this.state[key]) && this.isObject(value)
        ? { ...this.state[key], ...value }
        : value
      const bindKey = this.isObject(value) ? this.#mapBindKey(key, value) : key
      const bindKeys = this.isArray(bindKey) ? bindKey : [bindKey]
      let bindIndex = -1
      const { length: bindLength } = bindKeys
      while (++bindIndex < bindLength) {
        this.#updateBindings(bindKeys[bindIndex], value)
      }
      if (this.#stateMap[key]) {
        this.#stateMap[key](newState[key], key)
      }
    }
    return this
  }

  getState (key) {
    return this.state[key]
  }

  useState (key, callback) {
    this.#stateMap[key] = callback
    return this
  }

  stateIs (key, value) {
    return this.state[key] && this.state[key] === value
  }

  #mapBindKey (key, obj) {
    const keys = Object.keys(obj)
    const { length } = keys
    let index = -1
    const output = []

    while (++index < length) {
      const k = this.isObject(obj[keys[index]])
        ? this.#mapBindKey(keys[index], obj[keys[index]])
        : keys[index]
      // push binding
      output.push(`${key}.${k}`)
    }
    return output
  }

  isArray (arr) {
    return Array.isArray(arr)
  }

  isObject (obj) {
    return toBuiltInName(obj) === 'Object'
  }

  isNodeList (obj) {
    return toBuiltInName(obj) === 'NodeList'
  }

  get (attribute, childSelector = null) {
    return childSelector
      ? this.query(childSelector).getAttribute(attribute)
      : this.shadowRoot
        ? this.shadowRoot.getAttribute(attribute)
        : this.getAttribute(attribute)
  }

  query (selector) {
    return this.shadowRoot
      ? this.shadowRoot.querySelector(selector)
      : this.querySelector(selector)
  }

  queryAll (selector) {
    return this.shadowRoot
      ? this.shadowRoot.querySelectorAll(selector)
      : this.querySelectorAll(selector)
  }

  multiSelect (config) {
    Object.entries(config).forEach(([prop, selector]) => {
      this[prop] = this.query(selector)
    })
  }

  show (els = null) {
    const elems = els || this
    const elements = Array.isArray(elems) || this.isNodeList(elems)
      ? elems
      : [elems]
    const { length } = elements
    let index = -1

    while (++index < length) {
      elements[index].style.display = ''
      elements[index].removeAttribute('hidden')
    }
  }

  hide (els = null) {
    const elems = els || this
    const elements = Array.isArray(elems) || this.isNodeList(elems)
      ? elems
      : [elems]
    const { length } = elements
    let index = -1

    while (++index < length) {
      elements[index].style.display = 'none'
      elements[index].setAttribute('hidden', '')
    }
  }

  setStyle (els, styles) {
    const elements = Array.isArray(els) ? els : [els]
    const { length } = elements
    let index = -1

    while (++index < length) {
      Object.assign(elements[index].style, styles)
    }
  }

  setClassList (els, ...classes) {
    const elements = Array.isArray(els) ? els : [els]
    const { length } = elements
    let index = -1

    while (++index < length) {
      elements[index].classList.add(...classes)
    }
  }

  removeClassList (els, ...classes) {
    const elements = Array.isArray(els) ? els : [els]
    const { length } = elements
    let index = -1

    while (++index < length) {
      elements[index].classList.remove(...classes)
    }
  }

  addTemplate (element, selector, replaceContents = false) {
    const template = this.query(selector).content.cloneNode(true)
    if (replaceContents) element.innerHTML = ''
    element.appendChild(template)
  }
}

export function stripHTML (html) {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  return doc.body.textContent || ''
}

export function define (tag, Class) {
  customElements.define(tag, Class)
}

const webC = {
  define,
  html,
  shadow,
  WebComponent
}

export default webC

class SplitViews extends webC.WebComponent {
  constructor () {
    super()
    // this.attachShadow({ mode: 'open' })
    this.innerHTML = html`
      <div id="split-view-left">Left</div>
      <div id="dragMe"></div>
      <div id="split-view-right">Right</div>
    `
  }

  useMouseDown = e => {
    const resizer = this.query('#dragMe')
    const leftSide = resizer.previousElementSibling
    const rightSide = resizer.nextElementSibling
    const context = {
      x: 0,
      y: 0,
      leftWidth: 0
    }
    context.x = e.clientX
    context.y = e.clientY
    context.leftWidth = leftSide.getBoundingClientRect().width
    resizer.setAttribute('selected', '')

    const mouseMoveHandler = (el) => {
      document.body.style.cursor = 'col-resize'

      leftSide.style.userSelect = 'none'
      leftSide.style.pointerEvents = 'none'

      rightSide.style.userSelect = 'none'
      rightSide.style.pointerEvents = 'none'
      // How far the mouse has been moved
      const dx = el.clientX - context.x
      // const dy = el.clientY - context.y
      const newLeftWidth = ((context.leftWidth + dx) * 100) / resizer.parentNode.getBoundingClientRect().width
      leftSide.style.width = `${newLeftWidth}%`
    }

    const mouseUpHandler = () => {
      resizer.style.removeProperty('cursor')
      document.body.style.removeProperty('cursor')

      leftSide.style.removeProperty('user-select')
      leftSide.style.removeProperty('pointer-events')

      rightSide.style.removeProperty('user-select')
      rightSide.style.removeProperty('pointer-events')

      // Remove the handlers of `mousemove` and `mouseup`
      document.removeEventListener('mousemove', mouseMoveHandler)
      document.removeEventListener('mouseup', mouseUpHandler)
    }

    // Attach the listeners to `document`
    document.addEventListener('mousemove', mouseMoveHandler)
    document.addEventListener('mouseup', mouseUpHandler)
  }

  render () {
    Object.assign(this.style, {
      display: 'flex',
      height: '16rem',
      width: '100%'
    })
    this.setStyle(this.query('#split-view-left'), {
      width: '75%',
      alignItems: 'center',
      display: 'flex',
      justifyContent: 'center'
    })
    this.setStyle(this.query('#dragMe'), {
      width: '1rem',
      alignItems: 'center',
      display: 'flex',
      justifyContent: 'center',
      backgroundColor: '#454545'
    })
    this.setStyle(this.query('#split-view-right'), {
      flex: '1',
      alignItems: 'center',
      display: 'flex',
      justifyContent: 'center'
    })

    this.query('#dragMe').addEventListener('mousedown', this.useMouseDown)
  }
}

webC.define('split-views', SplitViews)
