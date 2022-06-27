'use strict'

import { NeuTypeError, NeuError } from '../error.js'
import IS from '@neumatter/is'

const validateType = (type, item) => {
  if (!type(item)) {
    const typeofItem = typeof item
    const err = new NeuTypeError(type.name, typeofItem)
    throw err
  }
}

class Spec {
  /**
   *
   * @param {object} [options]
   * @param {function} [options.fn]
   * @param {function} [options.callback]
   * @param {object} [options.settings]
   * @param {boolean} [options.settings.returnPromise]
   * @param {(input) => boolean} [options.settings.type]
   * @param {*} [options.value]
   * @param {number} [options.time]
   */
  constructor (options) {
    if (options.fn && !IS.function(options.fn)) {
      throw new NeuTypeError(options.fn, 'function')
    }
    if (options.callback && !IS.function(options.callback)) {
      throw new NeuTypeError(options.callback, 'function')
    }
    if (options.settings?.type && !IS.function(options.settings.type)) {
      throw new NeuTypeError(options.settings.type, 'function')
    }
    this.settings = {
      returnPromise: options.settings?.returnPromise || true,
      type: options.settings?.type || null
    }
    this.fn = options.fn || null
    this.value = options.value || null
    this.cb = options.callback || null
    this.time = options.time || null
    this.setDate = new Date()
  }

  /**
   *
   * @returns {boolean}
   */
  get hasFn () {
    if (this.fn) return true
    else return false
  }

  /**
   *
   * @returns {boolean}
   */
  get hasCallback () {
    if (this.cb) return true
    else return false
  }

  /**
   *
   * @returns {boolean} If the item will update itself.
   */
  get willUpdate () {
    return this.hasFn
  }

  get type () {
    return this.settings.type
  }

  set type (t) {
    this.settings.type = t
  }

  get date () {
    return this.setDate.getTime()
  }

  get timeLeft () {
    return this.timeToLive
      ? this.date + this.timeToLive - new Date().getTime()
      : null
  }

  get expired () {
    return this.timeToLive ? this.timeLeft <= 0 : false
  }

  /**
   *
   * @returns {Spec}
   */
  newSetDate () {
    this.setDate = new Date()
    return this
  }
}

export default class NeuCache {
  constructor (options) {
    this.cache = {}
    this.missed = 0
    this.missedSpecs = {}
    this.hit = 0
    this.hitSpecs = {}
    this.settings = {
      throwMissed: options?.settings?.throwMissed
        ? options.settings.throw
        : false,
      returnPromise: options?.settings?.returnPromise
        ? options.settings.returnPromise
        : null
    }
  }

  static export (cacheObj) {
    const newClass = JSON.parse(JSON.stringify(cacheObj))
    console.log(JSON.stringify(newClass))
    const props = Object.keys(newClass.cache)
    props.forEach(prop => {
      newClass.cache[prop].fn = cacheObj.cache[prop].fn
        ? cacheObj.cache[prop].fn.toString()
        : null
      newClass.cache[prop].cb = cacheObj.cache[prop].cb
        ? cacheObj.cache[prop].cb.toString()
        : null
    })
    return JSON.stringify(newClass)
  }

  static import (data) {
    const neuCache = new NeuCache()
    const parsedData = JSON.parse(data)
    const props = Object.keys(parsedData.cache)
    props.forEach(prop => {
      neuCache.put({
        key: prop,
        fn: parsedData.cache[prop].fn
          ? new Function(parsedData.cache[prop].fn)
          : null,
        value: parsedData.cache[prop].value,
        callback: parsedData.cache[prop].cb
          ? new Function(parsedData.cache[prop].cb)
          : null,
        time: parsedData.cache[prop].time
      })
    })
    neuCache.missed = parsedData.missed
    neuCache.missedSpecs = parsedData.missedSpecs
    neuCache.hit = parsedData.hit
    neuCache.hitSpecs = parsedData.hitSpecs
    neuCache.settings = parsedData.settings
    return neuCache
  }

  #returnPromise (key) {
    return this.cache[key].settings.returnPromise || this.settings.returnPromise
  }

  #execMissed (key, from, err) {
    let error = err ? `\n${err}` : ''
    if (!this.cache[key]) {
      this.missed++
      if (this.settings.throwMissed)
        console.error(new NeuError('Key does not exist in cache.').stack)
      return this.#returnPromise(key)
        ? Promise.reject(`{ ${key}: null, from: ${from} }${error}`)
        : null
    }
    this.missed++
    if (this.missedSpecs[key]) this.missedSpecs[key]['count'] += 1
    else this.missedSpecs[key] = { count: 1 }
    if (this.settings.throwMissed) {
      let err = this.cache[key].expired
        ? new NeuError('Key is expired')
        : new Error('Key has no value')
      console.error(err.stack)
    }
    return this.#returnPromise(key)
      ? Promise.reject(`{ ${key}: null, from: ${from} }${error}`)
      : null
  }

  #execHit (key) {
    this.hit++
    if (this.hitSpecs[key]) this.hitSpecs[key]['count'] += 1
    else this.hitSpecs[key] = { count: 1 }
  }

  #setSelfSync (key) {
    try {
      let value = this.cache[key].fn()
      this.cache[key].value = value
      this.cache[key].resetDate()
      console.log(`DataCache: SET: ${key}`)
      this.#execHit(key)
      return value
    } catch (err) {
      this.#execMissed(key, '#setSelfSync.catch(err)')
      throw err
    }
  }

  #setSelfAsync (key) {
    return this.cache[key]
      .fn()
      .then(value => {
        if (this.cache[key].type) validateType(this.cache[key].type, value)
        this.cache[key].value = value
        this.cache[key].newSetDate()
        console.log(`DataCache: SET: ${key}`)
        this.#execHit(key)
        return Promise.resolve(value)
      })
      .catch(err => {
        this.#execMissed(key, '#setSelfAsync.catch(err)', err)
      })
  }

  get hitRatio () {
    let total = this.hit + this.missed
    return (this.hit / total) * 100
  }

  get missRatio () {
    let total = this.missed + this.hit
    return (this.missed / total) * 100
  }

  get hitmiss () {
    return `${this.hitRatio} / ${this.missRatio}`
  }

  /**
   *
   * @param {string} key
   * @returns {boolean}
   */
  has (key) {
    return !this.cache[key] ? false : true
  }

  /**
   *
   * @param {string} key
   * @returns {boolean}
   */
  expired (key) {
    /** @type {Spec} */
    const spec = this.cache[key]
    console.log(spec.date)
    console.log(spec.expired)
    return spec.expired
  }

  put (options) {
    if (!options.key) {
      throw new NeuError('options.key is required, received undefined.')
    }
    validateType(IS.string, options.key)
    if (this.cache[options.key]) {
      delete this.cache[options.key]
    }
    this.cache[options.key] = new Spec(options)
    /** @type {Spec} */
    const spec = this.cache[options.key]
    if (spec.hasCallback && spec.time) {
      setTimeout(spec.cb, spec.time)
    }
    console.log(`DataCache: PUT: ${options.key}`)
    return this
  }

  get (key) {
    if (!this.cache[key]) {
      this.#execMissed(key, 'get.NO_KEY')
    }
    /** @type {Spec} */
    const spec = this.cache[key]
    console.log(spec.timeLeft)
    console.log(spec.date)
    console.log(spec.expired)
    console.log(spec)
    if (spec.expired) {
      if (spec.hasFn) {
        return this.#returnPromise(key)
          ? this.#setSelfAsync(key)
          : this.#setSelfSync(key)
      } else {
        this.#execMissed(key, 'get.EXPIRED')
      }
    }
    if (spec.value) {
      if (spec.type) validateType(spec.type, spec.value)
      console.log(`DataCache: GET: ${key}`)
      this.#execHit(key)
      return this.#returnPromise(key) ? Promise.resolve(spec.value) : spec.value
    } else {
      if (spec.hasFn) {
        return this.#returnPromise(key)
          ? this.#setSelfAsync(key)
          : this.#setSelfSync(key)
      } else {
        this.#execMissed(key, 'get.NO_VALUE')
      }
    }
  }

  delete (key) {
    delete this.cache[key]
  }

  set (key, value) {
    if (this.cache[key].type) validateType(this.cache[key].type, value)
    this.cache[key].value = value
    this.cache[key].resetDate()
    return this
  }
}

export { IS }
