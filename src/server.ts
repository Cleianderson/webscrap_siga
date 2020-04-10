import express from 'express'
import ppr from 'puppeteer-core'

import Routes from './routes'

const createServer = async (): Promise<express.Express> => {
  const app = express()
  const universalBrowser = await ppr.launch({
    executablePath: 'C:\\Program Files\\Chromium\\chrome.exe',
    defaultViewport: null,
   // headless: false,
  })

  app.set('universalBrowser', universalBrowser)
  app.use(Routes(app))

  return app
}

export default createServer
