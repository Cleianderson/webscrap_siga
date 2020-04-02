import express from 'express'
import ppr from 'puppeteer-core'

import * as Siga from '../utils/Siga'

export default {
  async login(req: express.Request, res: express.Response, app: express.Application) {
    const browser = app.get('universalBrowser')

    try {
      const login = await Siga.login(
        req.query.login,
        req.query.pass,
        browser,
        async page =>
          await page.evaluate(() => {
            const name = document.getElementById('lblNomePessoa')!.innerText
            const func = document.getElementById('lblDescricaoTipoPerfilFuncional')!.innerText
            const mode = document.getElementById('lblDescricaoModulo')!.innerText
            const org = document.getElementById('lblNomeOrgao')!.innerText
            return JSON.stringify({name, func, mode, org})
          }),
      )
      return res.status(200).json(JSON.parse(login))
    } catch (err) {
      return res.status(400).json({error: 'Login failed'})
    }
  },
  async notes(req: express.Request, res: express.Response, app: express.Application) {
    const browser = app.get('universalBrowser')

    try {
      const notes = await Siga.login(
        req.query.login,
        req.query.pass,
        browser,
        async page => await Siga.extractNotas(page),
        true,
      )
      return res.status(200).json(notes)
    } catch (error) {
      return res.status(400)
    }
  },
}
