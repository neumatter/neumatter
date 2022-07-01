'use strict'

import { open, stat } from 'fs/promises'
import { existsSync } from 'fs'
import MIME from './mime.js'
import { HEADERS } from './headers.js'
import { pipeline } from 'stream/promises'
import { NeuError } from './error.js'

export default async function serveStatic (request, response) {
  let fd
  try {
    const filePath = `${request.app.static}${request.path}`
    if (!existsSync(filePath)) {
      throw new NeuError(`NOT FOUND: ${request.path}`, { status: 404 })
    } else {
      if (response.sent) return response.end()
      if (response.isHead) return response.end()
      response.status(200)
      fd = await open(filePath)
      const stats = await stat(filePath)
      const fileStream = fd.createReadStream()
      response
        .set(...new MIME(filePath).args)
        .set(HEADERS.CONTENT_LENGTH, stats.size)
      await pipeline(fileStream, response)
    }
  } catch (err) {
    request.app.emit('error', new NeuError(err, { status: 404 }), request, response)
  } finally {
    if (fd) await fd?.close()
  }
}
