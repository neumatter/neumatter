'use-strict'

import dns from 'dns/promises'
import net from 'net'

/* eslint-disable-next-line */
const EMAIL_REGEX = /^(?:[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]|[^\u0000-\u007F])+@(?:[a-zA-Z0-9]|[^\u0000-\u007F])(?:(?:[a-zA-Z0-9-]|[^\u0000-\u007F]){0,61}(?:[a-zA-Z0-9]|[^\u0000-\u007F]))?(?:\.(?:[a-zA-Z0-9]|[^\u0000-\u007F])(?:(?:[a-zA-Z0-9-]|[^\u0000-\u007F]){0,61}(?:[a-zA-Z0-9]|[^\u0000-\u007F]))?)*$/

const isEmail = email => {
  return EMAIL_REGEX.test(email)
    ? Promise.resolve('pass')
    : Promise.resolve('fail')
}

const getMx = async (domain) => {
  const records = await dns.resolveMx(domain)
  const { length } = records
  let bestIndex = 0
  let index = -1
  while (++index < length) {
    if (records[index].priority < records[bestIndex].priority) {
      bestIndex = index
    }
  }
  return records[bestIndex]
}

const hasCode = (message, code) => {
  return message.indexOf(`${code}`) === 0 || message.indexOf(`${code}\n`) > -1
}

const checkSMTP = (sender, exchange) => {
  const timeout = 1000 * 10 // 10 seconds
  return new Promise(resolve => {
    let receivedData = false
    const socket = net.createConnection(25, exchange)
    socket.setEncoding('ascii')
    socket.setTimeout(timeout)

    socket
      .on('error', error => {
        socket.emit('fail', error)
      })
      .on('close', hadError => {
        if (!receivedData && !hadError) {
          socket.emit('fail', 'Mail server closed connection without sending any data.')
        }
      })

    socket
      .once('fail', msg => {
        resolve(msg)
        if (socket.writable && !socket.destroyed) {
          socket.write('quit\r\n')
          socket.end()
          socket.destroy()
        }
      })

    socket
      .on('success', () => {
        if (socket.writable && !socket.destroyed) {
          socket.write('quit\r\n')
          socket.end()
          socket.destroy()
        }
        resolve('pass')
      })

    const commands = [`helo ${exchange}\r\n`, `mail from: <${sender}>\r\n`, `rcpt to: <${sender}>\r\n`]
    let index = 0

    socket
      .on('next', () => {
        if (index < 3) {
          if (socket.writable) {
            socket.write(commands[index++])
          } else {
            socket.emit('fail', 'SMTP communication unexpectedly closed.')
          }
        } else {
          socket.emit('success')
        }
      })
      .on('timeout', () => {
        socket.emit('fail', 'Timeout')
      })

    socket
      .on('connect', () => {
        socket
          .on('data', msg => {
            receivedData = true
            if (hasCode(msg, 220) || hasCode(msg, 250)) {
              socket.emit('next', msg)
            } else if (hasCode(msg, 550)) {
              socket.emit('fail', 'Mailbox not found.')
            } else {
              socket.emit('fail', 'Unrecognized SMTP response.')
            }
          })
      })
  })
}

const getMsg = from => {
  const map = {
    IE: 'email is in invalid format',
    MX: 'mx is invalid',
    SM: 'SMTP is invalid',
    DF: 'uknown src/reason',
    IP: 'blocked email',
    LK: 'email contained potentially harmful text.'
  }
  return map[from]
}

function sendResponse (isValid, from = 'DF', message) {
  const res = {
    valid: false,
    reason: 'uknown src/reason'
  }
  if (isValid === 'y') {
    res.valid = true
    res.reason = 'passed'
    return res
  } else {
    res.reason = message || getMsg(from)
    return res
  }
}

const BLOCK_REGEX = /<\/?script|type="text\/javascript"/g

async function validateEmail (email, subject, message) {
  if (BLOCK_REGEX.test(message)) {
    return sendResponse('n', 'LK')
  }

  const emailFormat = await isEmail(email)
  if (emailFormat === 'fail') {
    return sendResponse('n', 'IE')
  }

  const domain = email.split('@')[1]
  const mx = await getMx(domain)
  if (!mx) {
    return sendResponse('n', 'MX')
  }

  const smtpResult = await checkSMTP(email, mx.exchange)
  if (smtpResult === 'pass') {
    return sendResponse('y')
  } else {
    return sendResponse('n', 'SM', smtpResult)
  }
}

export default async function validate ({ email, subject, message }) {
  try {
    return await validateEmail(email, subject, message)
  } catch (err) {
    console.log(err)
    return {
      valid: false,
      reason: 'unknown'
    }
  }
}
