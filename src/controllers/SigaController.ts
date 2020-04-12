import {Response, Request, Application} from 'express'
import {Page} from 'puppeteer'

import * as Siga from '../utils/Siga'

const login = async (req: Request, res: Response, app: Application) => {
  const browser = app.get('universalBrowser')

  const funcParam = async (page: Page) =>
    await page.evaluate(() => {
      const extractText = (id: string) => {
        return document.getElementById(id)!.textContent!.trim()
      }

      const name = extractText('lblNomePessoa')
      const func = extractText('lblDescricaoTipoPerfilFuncional')
      const mode = extractText('lblDescricaoModulo')
      const org = extractText('lblNomeOrgao')

      return JSON.stringify({name, func, mode, org})
    })

  const login = await Siga.login(req.query.login, req.query.pass, browser, funcParam)
  return res.status(login.status).json(JSON.parse(login.message))
}

const notes = async (req: Request, res: Response, app: Application) => {
  const browser = app.get('universalBrowser')

  const notes = await Siga.login(
    req.query.login,
    req.query.pass,
    browser,
    async (page) => await Siga.extractNotas(page),
  )
  return res.status(notes.status).json(JSON.parse(notes.message))
}

const horary = async (req: Request, res: Response, app: Application) => {
  const browser = app.get('universalBrowser')

  const horary = await Siga.login(
    req.query.login,
    req.query.pass,
    browser,
    async (page) => await Siga.getHorary(page),
  )
  return res.status(horary.status).json(JSON.parse(horary.message))
}

export default {
  login,
  notes,
  horary
}
