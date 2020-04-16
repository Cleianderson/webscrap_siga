const fs = require('fs')
const {exec} = require('child_process')

console.info('Compiling code')
exec('/home/cleianderson/.yarn/bin/tsc', () => {

  console.info('Creating package.json')
  const package = JSON.parse(fs.readFileSync('./package.json', {encoding: 'utf-8'}))
  package.scripts.start = 'node index.js'
  fs.writeFile('./dist/package.json', JSON.stringify(package), () => {})

  console.info('Copying node_modules')
  exec('cp -avr ./node_modules ./dist/node_modules')
})
