import ppr from 'puppeteer-core'

/**
 *
 * A function that make login in Siga and execute a function
 *
 * @param login the login used to acess Siga
 * @param pass the password used to acess Siga
 * @param browser an instance of chromium
 * @param fn a function that will be executed until the login has finished
 * @param returnToHome return to initial home until logout
 */
export async function login(
  login: string,
  pass: string,
  browser: ppr.Browser,
  fn: (pg: ppr.Page, login: string, pass: string) => Promise<any>,
): Promise<{status: number; message: string}> {
  const incognitoBrowser = await browser.createIncognitoBrowserContext()
  const page = await incognitoBrowser.newPage()

  await page.goto('https://www.siga.ufrpe.br/ufrpe/index.jsp')

  await page.waitForSelector('#cpf')
  await page.evaluate(() => {
    ;(document.getElementById('cpf')! as HTMLInputElement).value = ''
    ;(document.getElementById('txtPassword')! as HTMLInputElement).value = ''
  })
  await page.type('#cpf', login)
  await page.type('#txtPassword', pass)
  await page.click('#btnEntrar')
  await page.waitForNavigation()
  const error = await page.evaluate(() => {
    const errorSpan: NodeListOf<HTMLSpanElement> = document.querySelectorAll('#divMayus ~ span')
    return errorSpan[0] ? errorSpan[0].querySelector('ul > li')!.textContent : null
  })

  if (error) {
    await page.close()
    return {status: 400, message: JSON.stringify({error: error.trim()})}
  }
  await page.waitForSelector('#Conteudo')
  const response = await fn(page, login, pass)
  if (response) {
    await exit(page)
    return {status: 200, message: response}
  }
  return {status: 400, message: 'Unknow error'}
}

export async function exit(page: ppr.Page, returnToHome = true) {
  let window: WindowSiga

  if (returnToHome) {
    await page.goto('https://www.siga.ufrpe.br/ufrpe/logado.jsf')
    await page.waitFor(500)
  }
  await page.waitForSelector('#botao_sair')
  await page.click('#botao_sair')
  await page.evaluate(() => window.SIGA.fecharDialogSair(true))
  await page.close()
}

export async function extractNotas(pg: ppr.Page) {
  await pg.goto(
    'https://www.siga.ufrpe.br/ufrpe/jsp/siga/consultas/HandlerPesquisarNotasDetalhadasPorPeriodoSIGA.jsp',
    {waitUntil: 'networkidle0'},
  )

  const mat = await pg.evaluate(() => {
    /**
     * get all perios that begin with '20'
     */
    const arrOfPer: SIGANode = document.querySelectorAll('div[id^="20"]')

    const arrayOfPeriods: object[] = []
    arrOfPer.forEach((div) => {
      /**
       * get all trs that contains information
       */
      const arrTr: NodeListOf<HTMLTableRowElement> = div.querySelectorAll(
        'div > table > tbody > tr > td > table > tbody > tr',
      )

      const arrFiltered: object[] = []
      for (let n = 0; n < arrTr.length; n++) {
        /**
         * check if arrTr[n] is a title of matter
         */
        if (arrTr[n].querySelector('td > font > b > font')) {
          const mat = (arrTr[n].querySelector(
            'td > font > b > font',
          )! as HTMLFontElement).innerText.trim()

          /**
           * get the name of teacher
           */
          const prof = (arrTr[n + 1].querySelector(
            'td > font.editPesquisa',
          )! as HTMLFontElement).innerText.trim()

          /**
           * check if label 'Avaliação' is not a formula
           */
          const typeEvaluation = arrTr[n + 2].querySelector('td:last-child > font.edit')

          let unit: Dict = {}
          if (typeEvaluation) {
            if (
              (arrTr[n + 3].querySelector(
                'td:last-child > font.edit',
              )! as HTMLFontElement).innerText.toLowerCase() === 'faltas'
            ) {
              unit['Faltas'] = arrTr[n + 4].cells[1].innerText.trim()
            }
          } else {
            for (let n2 = 1; n2 < arrTr[n + 3].cells.length; n2++) {

              let text = (arrTr[n + 3].cells[n2].querySelector(
                'td > font.edit',
              )! as HTMLFontElement).innerText.trim()
              
              let content = (arrTr[n + 4].cells[n2].querySelector(
                'td > font.editPesquisa',
              )! as HTMLFontElement).innerText.trim()
              
              unit[text] = content
            }
          }
          unit['prof'] = prof
          unit['mat'] = mat
          arrFiltered.push(unit)
        }
        // if (Number(arrTr[n].cells[0].width) != 34 && arrTr[n].cells[0].bgColor == '#FAEBD7') {
        //   /**
        //    * Get [Faltas, VA1, VA2, VA3, Média, VAFN, MFIN, TEACHER] for each matter
        //    */
        //   for (let n2 = 1; n2 < arrTr[n].cells.length; n2++) {
        //     let content = arrTr[n + 1].cells[n2].innerText.match(/\w{1,}(\.\d{1,})?/)
        //     unit[arrTr[n].cells[n2].innerText.match(/\w{1,}(\.\d{1,})?/)![0]] = content
        //       ? content[0]
        //       : '-'

        //     /**
        //      * Get the teacher of the current matter
        //      */
        //     let prof = ''
        //     let mat = ''
        //     for (let ctrl = n; ctrl >= 0; ctrl--) {
        //       if (arrTr[ctrl].cells[0].innerText.toLowerCase().includes('docente')) {
        //         prof = arrTr[ctrl].cells[1].innerText
        //         mat = arrTr[ctrl - 1].querySelector('td > font > b > font')!.innerText
        //         break
        //       }
        //     }
        //     unit['prof'] = prof.trim()
        //     unit['mat'] = mat.trim()
        //   }
        //   arrFiltered.push(unit)
        // }
      }
      arrayOfPeriods.push({name: div.id, subjects: arrFiltered})
    })

    return arrayOfPeriods
  })

  return JSON.stringify(mat)
}

export async function getDados(browser: ppr.Browser) {
  const pg = await browser.newPage()
  await pg.goto(
    'https://www.siga.ufrpe.br/ufrpe/jsp/siga/recursosHumanos/pessoa/DetalharPessoaTela.jsf',
    {waitUntil: 'networkidle0'},
  )

  const finalData = await pg.evaluate(() => {
    const arrayOfSpan: NodeListOf<HTMLSpanElement> = document.querySelectorAll(
      'table > tbody > tr > td > span',
    )

    let json: Dict = {}
    for (let i = 0; i < arrayOfSpan.length; i++) {
      if (arrayOfSpan[i].id.match(/:\w{1,}Pessoa/)) {
        json[arrayOfSpan[i - 1].innerText.replace(':', '').toLowerCase()] = arrayOfSpan[
          i
        ].innerText.toLowerCase()
      }
    }
    return json
  })

  await pg.close()
  return finalData
}

export async function getHorary(pg: ppr.Page) {
  await pg.goto(
    'https://www.siga.ufrpe.br/ufrpe/jsp/siga/consultas/HandlerConsultaComprovanteMatriculaCoordSIGA.jsp',
    {waitUntil: 'networkidle2'},
  )

  const horary = await pg.evaluate(() => {
    const days: string[] = ['A', 'B', 'C', 'D', 'E', 'F', 'G']
    const allTrs: NodeListOf<HTMLTableDataCellElement> = document.querySelectorAll(
      'table > tbody > tr > td.textoTabela',
    )
    let horaryByDays: Horary = {begin: window.horariosInicio, end: window.horariosFim, days: [[]]}
    allTrs.forEach((item) => {
      if (horaryByDays.days[days.indexOf(item.id.charAt(0).toUpperCase())] == undefined)
        horaryByDays.days[days.indexOf(item.id.charAt(0).toUpperCase())] = []
      horaryByDays.days[days.indexOf(item.id.charAt(0).toUpperCase())].push(item.innerText)
    })
    return horaryByDays
  })
  return JSON.stringify(horary)
}
