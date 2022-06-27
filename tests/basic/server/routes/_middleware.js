
export default async (req, res, next) => {
  console.log('router level')
  await next()
}
