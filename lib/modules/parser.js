
const hasBody = method => ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method.toUpperCase())

const parse = (parseMethod) => {
  return async (req) => {
    try {
      let body = ''
      for await (const chunk of req) body += chunk
      return parseMethod(body)
    } catch (e) {
      const err = new Error(e)
      throw err.stack
    }
  }
}

const json = async (req) => {
  if (hasBody(req.method)) return await parse(x => JSON.parse(x))(req)
  else return {}
}

const raw = async (req) => {
  if (hasBody(req.method)) return await parse(x => x)(req)
  else return {}
}

const text = async (req) => {
  if (hasBody(req.method)) return await parse(x => x.toString())(req)
  else return {}
}

const urlencoded = async (req) => {
  if (req.get('Content-Type') && req.get('Content-Type').match(/multipart\/form-data/)) {
    return {}
  }
  if (hasBody(req.method)) {
    if (req.get('Content-Type') && req.get('Content-Type') === 'application/json') {
      return await json(req)
    } else {
      return await parse(x => {
        const urlSearchParam = new URLSearchParams(x.toString())
        return Object.fromEntries(urlSearchParam.entries())
      })(req)
    }
  } else {
    return {}
  }
}

const parseBody = {
  json,
  raw,
  text,
  urlencoded
}

export default parseBody
