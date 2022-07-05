import { createHash } from 'crypto'

export default class ETag {
  constructor (partSizeInMb = 5) {
    this.partSizeInBytes = partSizeInMb * 1024 * 1024
    this.sums = [createHash('md5')]
    this.part = 0
    this.bytes = 0
  }

  update (chunk) {
    const len = chunk.length

    if (this.bytes + len < this.partSizeInBytes) {
      this.sums[this.part].update(chunk)
      this.bytes += len
    } else {
      const bytesNeeded = this.partSizeInBytes - this.bytes
      this.sums[this.part].update(chunk.slice(0, bytesNeeded))
      this.part++
      this.sums.push(createHash('md5'))
      this.bytes = len - bytesNeeded
      this.sums[this.part].update(chunk.slice(bytesNeeded, len))
    }

    return this
  }

  digest () {
    if (!this.part) return this.sums[0].digest('hex')
    const final = createHash('md5')
      .update(Buffer.from(
        this.sums.map(s => s.digest('hex')).join(''),
        'hex'
      ))
      .digest('hex')
    return `${final}-${this.part + 1}`
  }

  static from (chunk, options = {}) {
    const etag = new ETag()
    etag.update(chunk)
    return options.weak
      ? `W/"${etag.digest().toString()}"`
      : etag.digest().toString()
  }
}
