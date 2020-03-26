import pptr from 'puppeteer-core'
import process from 'process'
import { writeFile } from 'fs'

import * as Siga from './controllers/Siga'

const main = async () => {
  const browser = await pptr.launch({
    executablePath: 'C:\\Program Files\\chrome-win\\chrome.exe',
  })

  const page = await browser.newPage()
  await page.goto('https://www.siga.ufrpe.br/ufrpe/index.jsp')

  await Siga.login(process.argv[2], process.argv[3], page)

  await page.waitForSelector('#Conteudo')

  const notasDetalhadas = await Siga.extractNotas(browser)
  const dadosDiscente = await Siga.getDados(browser)

  await writeFile('dados.json', JSON.stringify({
    discente: dadosDiscente,
    notas: notasDetalhadas
  }), () => { console.info('Saving...')})

  await Siga.exit(page)

  await browser.close()

}

main()
