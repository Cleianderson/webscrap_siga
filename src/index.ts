import Server from './server'
import process from 'process'

Server()
  .then((serve) => serve.listen(process.env.PORT || 2222, () => console.log('Server running...')))
  .catch((reason) => {
    throw reason
  })
