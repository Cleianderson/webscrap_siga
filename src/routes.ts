import express from 'express'

import SigaController from './controllers/SigaController'

export default function route(app: express.Application): express.Router {
  const router = express.Router()

  router.post('/login', (req, res) => SigaController.login(req, res, app))
  router.post('/notes', (req, res) => SigaController.notes(req, res, app))
  router.post('/horary', (req, res) => SigaController.horary(req, res, app))

  return router
}
