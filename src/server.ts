import express from 'express'
import ppr from 'puppeteer'

import Routes from './routes'

const createServer = async (): Promise<express.Express> => {
  const app = express()
  const universalBrowser = await ppr.launch({
    defaultViewport: null,
    args:['--no-sandbox'],
    // headless: false,
  })

  app.set('universalBrowser', universalBrowser)
  app.use(Routes(app))

  return app
}

export default createServer
