import Server from './server'

Server().then((serve) => serve.listen(2222, () => console.log('Server running...')))