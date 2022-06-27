import NeuJS from '../../../index.js'

process.env.NODE_ENV = 'development'

const app = await NeuJS.load()

app
  .listen({})
