import express from 'express'
import ppr from 'puppeteer'

import Routes from './routes'

const createServer = async (): Promise<express.Express> => {
  const app = express()
  const universalBrowser = await ppr.launch({
    defaultViewport: null,
    args:[
	'--no-sandbox',
	'--disable-setuid-sandbox'
    ],
    // headless: false,
  })

  app.set('universalBrowser', universalBrowser)
  app.use(express.json())
  app.use(Routes(app))

  return app
}

export default createServer
