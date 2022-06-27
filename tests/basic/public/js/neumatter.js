//___ neumatter 1.1

const dataBtnLight = n$('[data-btn=light]');
const dataBtnDark = n$('[data-btn=dark]');
const dataBtnTheme = n$('[data-btn=theme]');
const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)');
const navTabs = n$('[data-nav=tab]');
const notificationCenter = n$('[data-nav=toggler]');
const notification = n$('[data-notification=successDemo]');
const navLinks = n$('.c-nav-link');
const dataOffsetNavbar = n$('[data-offset=navbar]');

const setNewNotif = ()=> {
  if (notification) {
    notificationCenter.check();
    setTimeout(()=> {
      notificationCenter.uncheck();
    }, 5000*2);
  }
};

const Theme = {
  dark: ()=> {
    n$('docEl').attribute('data-theme', 'dark');
    dataBtnDark.addClass('u-display/none');
    dataBtnLight.removeClass('u-display/none');
    dataBtnTheme.check();
  },
  light: ()=> {
    n$('docEl').attribute('data-theme', 'light');
    dataBtnDark.removeClass('u-display/none');
    dataBtnLight.addClass('u-display/none');
    dataBtnTheme.uncheck();
  },
  storage:
    n$('stor').storage('theme')
};

n$('window').eventOn('load', ()=> {
  if (Theme.storage === 'dark')
    Theme.dark();
  else if (Theme.storage === 'light')
    Theme.light();
  if (Theme.storage === null)
    (prefersDarkMode.matches ? Theme.dark : Theme.light)();
});

dataBtnLight.eventOn('click', ()=> {
  n$('stor').storage('theme', 'light');
  Theme.light();
});

dataBtnDark.eventOn('click', ()=> {
  n$('stor').storage('theme', 'dark');
  Theme.dark();
});

dataBtnTheme.eventOn('click', ()=> {
  if (Theme.storage === 'dark') {
    Theme.light();
    n$('stor').storage('theme', 'light');
  } else {
    Theme.dark();
    n$('stor').storage('theme', 'dark');
  }
});

navTabs.each(navTab => {
  let navTabId = n$(navTab).id();
  let checkedNav = n$('stor').storage('checkedBox');
  if (checkedNav === navTabId)
    n$(navTab).check();
  n$(navTab).eventOn('click', ()=> {
    let checkedNavTwo = n$('stor').storage('checkedBox');
    if (navTabId === checkedNavTwo) {
      n$(navTab).uncheck();
      n$('stor').storage('checkedBox', 'nulled');
    } else {
      n$(navTab).check();
      n$('stor').storage('checkedBox', navTabId);
    }
  })
});

const ON_REGEX = /^on[A-Z]/

class CustomElement extends HTMLElement {
  constructor () {
    super()
    // set up state object
    this.state = {}
  }

  connectedCallback () {
    let listeners = Object.getOwnPropertyNames(this)
    console.log(listeners)
    listeners = listeners.filter(prop => ON_REGEX.test(prop))
    if (listeners.length) {
      listeners.forEach(key => {
        const trigger = key.replace(/^on/, '').toLowerCase()
        const listener = this[key]
        this.addEventListener(trigger, listener)
      })
    }
    if (typeof this.render === 'function') {
      this.render()
    }
  }

  isCustomElement (element) {
    return (
      Object.getPrototypeOf(customElements.get(element.tagName.toLowerCase()))
        .name === 'CustomElement'
    )
  }

  updateBindings (prop, value = '') {
    const bindings = [...this.queryAll(`[data-bind$="${prop}"]`)]

    bindings.forEach(node => {
      const dataProp = node.dataset.bind
      const bindProp = dataProp.includes(':')
        ? dataProp.split(':').shift()
        : dataProp
      const bindValue = dataProp.includes('.')
        ? dataProp
            .split('.')
            .slice(1)
            .reduce((obj, p) => obj[p], value)
        : value
      const target = [...this.queryAll(node.tagName)].find(el => el === node)
      const isStateUpdate =
        dataProp.includes(':') && this.isCustomElement(target)

      isStateUpdate
        ? target.setState({ [`${bindProp}`]: bindValue })
        : this.isArray(bindValue)
          ? (target[bindProp] = bindValue)
          : (node.textContent = bindValue.toString())
    })
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
      const bindKey = this.isObject(value) ? this.mapBindKey(key, value) : key
      const bindKeys = this.isArray(bindKey) ? bindKey : [bindKey]
      let bindIndex = -1
      const { length: bindLength } = bindKeys
      while (++bindIndex < bindLength) {
        this.updateBindings(bindKeys[bindIndex], value)
      }
    }
    return this
  }

  getState (key) {
    return this.state[key]
  }

  stateIs (key, value) {
    return this.state[key] && this.state[key] === value
  }

  mapBindKey (key, obj) {
    const keys = Object.keys(obj)
    const { length } = keys
    let index = -1
    const output = []
    while (++index < length) {
      const k = keys[index]
      output.push(
        this.isObject(obj[k])
          ? `${key}.${this.mapBindKey(k, obj[k])}`
          : `${key}.${k}`
      )
    }
    return output
  }

  isArray (arr) {
    return Array.isArray(arr)
  }

  isObject (obj) {
    return Object.prototype.toString.call(obj) === '[object Object]'
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
    const elements =
      Array.isArray(elems) || NodeList.prototype.isPrototypeOf(elems)
        ? elems
        : [elems]

    elements.forEach(element => {
      element.style.display = ''
      element.removeAttribute('hidden')
    })
  }

  hide (els = null) {
    const elems = els || this
    const elements =
      Array.isArray(elems) || NodeList.prototype.isPrototypeOf(elems)
        ? elems
        : [elems]
    elements.forEach(element => {
      element.style.display = 'none'
      element.setAttribute('hidden', '')
    })
  }

  css (els, styles) {
    const elements = Array.isArray(els) ? els : [els]
    elements.forEach(element => Object.assign(element.style, styles))
  }

  addTemplate (element, selector, replaceContents = false) {
    const template = this.query(selector).content.cloneNode(true)
    if (replaceContents) element.innerHTML = ''
    element.appendChild(template)
  }
}

function shadow (element, mode = 'open') {
  return element.attachShadow({ mode })
}

function html (strings, ...keys) {
  return strings
    .map((s, i) => s + (keys[i] || ''))
    .join('')
}

class DataRepeater extends HTMLElement {
  constructor () {
    super()

    shadow(this)

    this.css = `
      <style>
        
      </style>
    `
  }

  connectedCallback () {
    this.html = this.innerHTML
  }

  get data () {
    return this._data
  }

  set data (items) {
    this._data = items
    this.shadowRoot.innerHTML = `
      ${this.css}
      <ul>
        ${items.reduce((acc, item) => `${acc}<li>${item}</li>`, ``)}
      </ul>`
  }
}

customElements.define('data-repeater', DataRepeater)

class Demo2Element extends CustomElement {
  constructor () {
    super()

    const shadowRoot = shadow(this)

    shadowRoot.innerHTML = `
      <style>
        :host {
          display: inline-block;
          border: 1px solid #000000;
          padding: 20px;
        }
      </style>
      
      <h3>title</h3>
      <p data-bind="title" id="title"></p>
  `
  }
}

customElements.define('demo2-element', Demo2Element)

class DemoElement extends CustomElement {
  constructor () {
    super()

    const shadowRoot = shadow(this)

    shadowRoot.innerHTML = html`
      <div id="container">
        <h3>title</h3>
        <p data-bind="title" id="title"></p>
        
        <h3>user.name</h3>
        <p data-bind="user.name" id="name"></p>
        
        <h3>user.address.city</h3>
        <p data-bind="user.address.city" id="city"></p>
        
        <h3>data.items</h3>
        
        <data-repeater data-bind="data:data.items"></data-repeater>
      </div>
  `
  }

  onClick = (target) => {
    console.log(target)
    console.log(this)
    const title = this.stateIs('replaced', 'true')
      ? 'Back to Start'
      : 'Title was Replaced'
    const replaced = this.stateIs('replaced', 'true')
      ? 'false'
      : 'true'
    console.log('replaced: ' + replaced)
    this.setState({ title, replaced })
  }
}

customElements.define('demo-element', DemoElement)

const element = document.querySelector('demo-element')

element.setState({
  title: 'Data binding for Web Components',
  data: {
    items: ['foo', 'bar']
  },
  user: {
    name: 'Name',
    address: {
      city: 'City'
    }
  }
})

element.css(element.query('#container'), {
  marginTop: '300px'
})

console.log(element)
