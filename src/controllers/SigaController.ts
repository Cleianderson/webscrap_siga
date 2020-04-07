import express from 'express'

import * as Siga from '../utils/Siga'

export default {
  async login(req: express.Request, res: express.Response, app: express.Application) {
    const browser = app.get('universalBrowser')

    const login = await Siga.login(
      req.query.login,
      req.query.pass,
      browser,
      async (page) =>
        await page.evaluate(() => {
          const name = document.getElementById('lblNomePessoa')!.innerText
          const func = document.getElementById('lblDescricaoTipoPerfilFuncional')!.innerText
          const mode = document.getElementById('lblDescricaoModulo')!.innerText
          const org = document.getElementById('lblNomeOrgao')!.innerText
          return JSON.stringify({name, func, mode, org})
        }),
    )
    return res.status(login.status).json(JSON.parse(login.message))
  },
  async notes(req: express.Request, res: express.Response, app: express.Application) {
    const browser = app.get('universalBrowser')

      const notes = await Siga.login(
        req.query.login,
        req.query.pass,
        browser,
        async (page) => await Siga.extractNotas(page),
      )
      return res.status(notes.status).json(JSON.parse(notes.message))
  },
  async horary(req: express.Request, res: express.Response, app: express.Application) {
    const browser = app.get('universalBrowser')

    const horary = await Siga.login(
        req.query.login,
        req.query.pass,
        browser,
        async (page) => await Siga.getHorary(page),
      )
      return res.status(horary.status).json(JSON.parse(horary.message))
    },
}
