import NeuJS from '../../../../index.js'

const router = NeuJS.createRouter()

router.route('/products/:sku/:id')
  .get(async (req, res) => {
    await res.render('products', {
      items: [
        'hello',
        'world'
      ],
      sku: req.params.sku,
      id: req.params.id
    })
  })

router.get('/prototype', (ctx, res) => {
  res.json(ctx.app)
})

router.get('/products', (ctx, res) => {
  res.redirect('/')
})

router.post('/products', (ctx, res) => {
  console.info('body', ctx.body)
  res.json(ctx.body)
})

router.get('/orders', (ctx, res, next) => {
  console.log('next', next)
  console.log('middleware-2')
  // let error = new Error('test ERROR');
  // try {
  // if (error)
  // throw error;
  return next()
  // else await next()
  // } catch(err) {
  // if (error) console.log(error)
  // }
  /*
  if (req.headers['authorization'] === 'abc123') {
    //console.log('next', next)
    //await next()
  } else {
    res.statusCode = 401;
    res.send('Not allowed')
  }
  */
}, (ctx, res, next) => {
  console.log('middleware-4')
  let error = new Error('test ERROR')
  throw error
  next()
}, async (ctx, res) => {
  console.log('route end / middleware-5')
  res.send('Protected route')
})

export default router
