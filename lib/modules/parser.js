import multipart from 'parse-multipart-data'
import ByteView from 'byteview'

function parseJSON (input) {
  return JSON.parse(input, (key, value) => {
    let res

    switch (typeof value) {
      case 'object':
        res = typeof value.type === 'string' && value.type === 'ByteView'
          ? ByteView.from(value.data, 'base64')
          : value
        break
      default:
        res = value
        break
    }

    return res
  })
}

const hasBody = method => ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method.toUpperCase())

const urlencoded = async (req) => {
  const data = await read(req)
  const urlSearchParam = new URLSearchParams(data.toString())
  return Object.fromEntries(urlSearchParam.entries())
}

const json = async (req) => {
  const data = await read(req)
  return parseJSON(data)
}

const raw = (req) => read(req)

const text = async (req) => {
  const data = await read(req)
  return data.toString()
}

/**
 * 
 * @param {import('../request.js').default} req 
 */
async function read (req) {
  let body = ''

  for await (const chunk of req) {
    body += chunk
  }

  return body
}

/**
 * 
 * @param {import('../request.js').default} req 
 */
async function readAsBuffer (req) {
  const body = []

  for await (const chunk of req) {
    body.push(chunk)
  }

  return Buffer.concat(body)
}

async function parseAny (req) {
  const contentType = req.get('Content-Type')
  if (!contentType) {
    return null
  }

  if (contentType.indexOf('multipart/form-data') !== -1) {
    const data = await readAsBuffer(req)
    const boundary = contentType.slice(contentType.indexOf('=') + 1)
    const parts = multipart.parse(data, boundary)
    if (parts.length === 1) return parts[0]
  } else if (contentType === 'application/json') {
    return await json(req)
  } else if (contentType === 'application/x-www-form-urlencoded') {
    return await urlencoded(req)
  } else if (contentType === 'text/plain') {
    return await text(req)
  } else {
    return null
  }
}

const parseBodyMap = {
  json,
  raw,
  text,
  urlencoded
}

export default async function parseData (req, fallback) {
  if (!hasBody(req.method)) {
    return {}
  }

  let res = await parseAny(req)
  if (res) {
    return res
  } else {
    res = await parseBodyMap[fallback](req)
    return res
  }
}
