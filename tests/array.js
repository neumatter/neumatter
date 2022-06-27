
import NeuSet from '../lib/set.js'
import { performance, PerformanceObserver } from 'perf_hooks'
import { fileURLToPath } from 'url'
import IS, { NeuType } from '../../@neumatter/is/index.js'
import Record from '../../@neumatter/record/index.js'
/*
const FILEURL_REGEX = /^([a-z]+:)?\/\/([^?#]*)/
const FILEEXT_REGEX = /([^/]*\.[a-z]+)$/
const percentRegEx = /%/g;
const backslashRegEx = /\\/g;
const newlineRegEx = /\n/g;
const carriageReturnRegEx = /\r/g;
const tabRegEx = /\t/g;

class FileURL {
  constructor (input) {
    const filepath = fileURLToPath(input)
    const matches = input.match(FILEURL_REGEX)
    if (!matches || !matches[1] || !matches[2]) {
      this.path = filepath
      const fileMatch = this.path.match(FILEEXT_REGEX)
      if (fileMatch) {
        this.filename = fileMatch[1]
        this.dirURL = this.path.replace(this.filename, '')
      } else {
        this.filename = null
        this.dirURL = new URL('.', filepath)
      }
    } else {
      const fileMatch = matches[2].match(FILEEXT_REGEX)
      this.protocol = matches[1]
      this.path = filepath
      this.filename = fileMatch[1] || null
      this.dirURL = this.filename ? this.path.replace(this.filename, '') : this.path
    }
    this.original = input
  }
}
*/
// console.log(new FileURL(import.meta.url))

// const testArray = new NeuSet(100).fill(Math.random())
// const testArray = new Array(1000).fill(Math.random())
// console.log(testArray)
const products = new NeuSet({
  input: [{ id: 'NM587', name: 'NOVA Complete', rel: '1574' }, { id: 'NM202', name: 'Power Greens', rel: '1574' }],
  id: 'id'
})

const toFirstUpperCase = input => {
  const first = input.slice(0, 1).toUpperCase()
  const rest = input.slice(1)
  return first + rest
}

const neuSet = () => {
  console.log(toFirstUpperCase('products'))
  performance.mark('NeuSet.each-init')
  products.includes('NOVA Complete')
  const filteredProducts = products.filter(el => el.rel === '1574')
  products.patch('NM587', { rel: '2000' })
  products.delete('NM202')
  products.post({ id: 'NM456', name: 'NeuTest', rel: '2020' })
  const allProducts = products.get()
  performance.mark('NeuSet.each-end')
  performance.measure('NeuSet.each', 'NeuSet.each-init', 'NeuSet.each-end')
  console.log(products)
  console.log(allProducts)
  console.log(filteredProducts)
}

const whileLoop = () => {
  performance.mark('whileLoop-init')
  const { length } = testArray
  let index = -1
  while (++index < length) {
    testArray[index] += 1
  }
  performance.mark('whileLoop-end')
  performance.measure('whileLoop', 'whileLoop-init', 'whileLoop-end')
}

const forLoop = () => {
  performance.mark('forLoop.each-init')
  const length = testArray.length
  for (let index = 0; index < length; index++) {
    testArray[index] += 1
  }
  performance.mark('forLoop.each-end')
  performance.measure('forLoop.each', 'forLoop.each-init', 'forLoop.each-end')
}

// const wrappedNeuSetEach = performance.timerify(NeuSetWhileReverse)
// const wrappedNeuSetEachForward = performance.timerify(NeuSetWhileForward)
const obs = new PerformanceObserver((list) => {
  console.log(list.getEntries())
  // console.log(list.getEntries()[1])
  // console.log('NeuSync \n' + list.getEntries()[2].duration)
  obs.disconnect()
})
obs.observe({ entryTypes: ['measure'], buffered: false })

neuSet()
// console.log(testArray)

// forLoop()
// neuSet()
// whileLoop()
// neuArrayWhileReverse()
// neuArrayWhileForward()
// wrappedNeuSetEach()
// wrappedNeuSetEachForward()
