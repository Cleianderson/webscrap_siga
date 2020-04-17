import Server from './server'
import process from 'process'

Server()
  .then((serve) => serve.listen(process.env.PORT || 2222, ()=>console.info('Running')))
  .catch((reason) => {
    throw reason
  })
