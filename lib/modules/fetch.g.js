import fetch, {
  Blob, // eslint-disable-line
  blobFrom, // eslint-disable-line
  blobFromSync, // eslint-disable-line
  File, // eslint-disable-line
  fileFrom, // eslint-disable-line
  fileFromSync, // eslint-disable-line
  FormData, // eslint-disable-line
  Headers,
  Request,
  Response
} from 'node-fetch'

if (!globalThis.fetch) {
  globalThis.fetch = fetch
  globalThis.Headers = Headers
  globalThis.Request = Request
  globalThis.Response = Response
}
