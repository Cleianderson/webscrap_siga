import ppr from 'puppeteer-core'

export async function login(login: string, pass: string, page: ppr.Page) {
  await page.waitForSelector('#cpf')
  await page.type('#cpf', login)
  await page.type('#txtPassword', pass)
  await page.click('#btnEntrar')
}

export async function exit(page: ppr.Page) {
  let window: WindowSiga

  await page.waitFor(500)
  await page.click('#botao_sair')
  console.info('Exiting...')
  await page.evaluate(() => window.SIGA.fecharDialogSair(true))
}

export async function extractNotas(browser: ppr.Browser) {
  const pg = await browser.newPage()
  await pg.goto('https://www.siga.ufrpe.br/ufrpe/jsp/siga/consultas/HandlerPesquisarNotasDetalhadasPorPeriodoSIGA.jsp')

  const mat = await pg.evaluate(() => {
    const arrTr: NodeListOf<HTMLTableRowElement> = document.querySelectorAll(
      'div > table > tbody > tr > td > table > tbody > tr'
    )

    const arrFiltered: object[] = []
    for (let n = 0; n < arrTr.length; n++) {
      if (Number(arrTr[n].cells[0].width) != 34 && arrTr[n].cells[0].bgColor == '#FAEBD7') {

        /**
         * Get [Faltas, VA1, VA2, VA3, Média, VAFN, MFIN, TEACHER] for each matter
         */
        let unit: Dict = {}
        for (let n2 = 1; n2 < arrTr[n].cells.length; n2++) {
          let content = arrTr[n + 1].cells[n2].innerText.match(/\w{1,}(\.\d{1,})?/)
          unit[arrTr[n].cells[n2].innerText.match(/\w{1,}(\.\d{1,})?/)![0]] = content ? content[0] : '-'

          /**
           * Get the teacher of the current matter
           */
          let prof = ''
          let mat = ''
          for (let ctrl = n; ctrl >= 0; ctrl--) {
            if (arrTr[ctrl].cells[0].innerText.toLowerCase().includes('docente')) {
              prof = arrTr[ctrl].cells[1].innerText
              mat = arrTr[ctrl - 1].querySelector('td > font > b > font')!.innerText
              break
            }
          }
          unit['prof'] = prof.trim()
          unit['mat'] = mat.trim()
        }
        arrFiltered.push(unit)
      }
    }

    return arrFiltered
  })

  await pg.close()
  return mat
}

export async function getDados(browser: ppr.Browser) {
  const pg = await browser.newPage()
  await pg.goto('https://www.siga.ufrpe.br/ufrpe/jsp/siga/recursosHumanos/pessoa/DetalharPessoaTela.jsf', { waitUntil: 'networkidle0' })

  const finalData = await pg.evaluate(() => {
    const arrayOfSpan: NodeListOf<HTMLSpanElement> = document.querySelectorAll('table > tbody > tr > td > span')

    let json: Dict = {}
    for (let i = 0; i < arrayOfSpan.length; i++) {
      if (arrayOfSpan[i].id.match(/:\w{1,}Pessoa/)) {
        json[
          arrayOfSpan[i - 1].innerText.replace(':', '').toLowerCase()
        ] = arrayOfSpan[i].innerText.toLowerCase()
      }
    }
    return json
  })

  await pg.close()
  return finalData
}
