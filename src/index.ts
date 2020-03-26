import express from 'express'
import ppr from 'puppeteer-core'

import * as Siga from './controllers/Siga'

const app = express()
app.get('/notas', async (req, res) => {
  const browser = await ppr.launch({
    executablePath: 'C:\\Program Files\\Chromium\\chrome.exe',
  })
  try {
    const pg = await browser.newPage()
    await pg.goto('https://www.siga.ufrpe.br/ufrpe/index.jsp')

    await Siga.login(req.query.login, req.query.pass, pg)

    const response = await Siga.extractNotas(browser)
    await Siga.exit(pg)
    return res.status(200).json(response)
  } catch (err) {
    await browser.close()
    return res.status(400).json({ error: err })
  }
})

app.listen(2222, () => console.log('Server running...'))