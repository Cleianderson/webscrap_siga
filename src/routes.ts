import ppr from 'puppeteer-core'
import express from 'express'

import * as Siga from './controllers/Siga'

export default function route(app: express.Application): express.Router {

  const router = express.Router()

  router.get('/notas', async (req, res) => {

    const browser: ppr.Browser = app.get('universalBrowser')
    await browser.createIncognitoBrowserContext()
    
    try {
      const pg = await browser.newPage()
      await pg.goto('https://www.siga.ufrpe.br/ufrpe/index.jsp')

      await Siga.login(req.query.login, req.query.pass, pg)

      const response = await Siga.extractNotas(browser)
      await Siga.exit(pg)
      return res.status(200).json(response)
    } catch (err) {
      return res.status(400).json({ error: err })
    }
  })

  return router
}
