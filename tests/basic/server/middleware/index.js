import process from 'process'

const ifError = async (err, req, res, next) => {
  console.log('middleware-Error:')
  console.log(err)
  await next(err)
}

const userMiddleware = async (req, res, next) => {
  console.log('1')
  await next()
}
const userMiddleware2 = async (req, res, next) => {
  console.log('2')
  await next()
}
const userMiddleware3 = async (req, res, next) => {
  console.log('3')
  await next()
}
const userMiddleware4 = async (req, res, next) => {
  console.log('4')
  await next()
}
const getActualRequestDurationInMilliseconds = start => {
  const NS_TO_MS = 1e6 // convert to milliseconds
  const end = process.hrtime.bigint().toString()
  return (Number(end) - Number(start)) / NS_TO_MS
}

const demoLogger = (req, res, next) => {
  // middleware function
  const date = new Date().toISOString().replace('T', ' ').split('.')[0]
  // const [month, day, year] = [date.getMonth(), date.getDate(), date.getFullYear()]
  // const [hour, minutes, seconds] = [date.getHours(), date.getMinutes(), date.getSeconds()]
  // const formattedDate = `${year}-${month + 1}-${day} ${hour}:${minutes}:${seconds}`
  const { method, url } = req
  const start = process.hrtime.bigint().toString()
  const resFinishListener = () => {
    const durationInMilliseconds = getActualRequestDurationInMilliseconds(start)
    const log = `[${date}] ${method}:${url} ${res.statusCode} ${durationInMilliseconds.toLocaleString()} ms`
    console.info(log)
    if (process.env.NODE_ENV === 'development') console.info(log)
  }
  res.on('close', resFinishListener)
  next()
}

export default [
  userMiddleware,
  userMiddleware2,
  userMiddleware3,
  userMiddleware4,
  demoLogger,
  ifError
]
