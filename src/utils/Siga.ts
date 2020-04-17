import ppr from 'puppeteer'

const SIGA_URLS = {
  login: 'https://www.siga.ufrpe.br/ufrpe/index.jsp',
  home: 'https://www.siga.ufrpe.br/ufrpe/logado.jsf',
  horary:
    'https://www.siga.ufrpe.br/ufrpe/jsp/siga/consultas/HandlerConsultaComprovanteMatriculaCoordSIGA.jsp',
  notes:
    'https://www.siga.ufrpe.br/ufrpe/jsp/siga/consultas/HandlerPesquisarNotasDetalhadasPorPeriodoSIGA.jsp',
}

/**
 *
 * A function that make login in Siga and execute fn param
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

  try {
    page.goto(SIGA_URLS.login)

    /**
     * type login and password
     */
    await page.waitForSelector('#cpf')
    await page.type('#cpf', login)
    await page.type('#txtPassword', pass)

    page.click('#btnEntrar')

    /**
     * check if there is some error on login
     */
    await page.waitForNavigation()
    const error = await page.evaluate(() => {
      const errorSpan = document.querySelector('#divMayus ~ span > ul > li')
      return errorSpan ? errorSpan.textContent!.trim() : null
    })

    if (error) {
      await page.close()
      return {status: 400, message: JSON.stringify({error})}
    }
    await page.waitForSelector('#lblNomePessoa')
  } catch (err) {
    await page.close()
    return {status: 400, message: JSON.stringify({error: 'Unable connect to Sig@ '})}
  }

  const response = await fn(page, login, pass)
  if (response) {
    await exit(page)
    return {status: 200, message: response}
  }
  return {status: 400, message: 'Unknow error'}
}

export async function exit(page: ppr.Page) {
  if (page.url() !== SIGA_URLS.home) {
    await page.goto(SIGA_URLS.home)
  }
  await page.waitForSelector('#botao_sair')
  await page.click('#botao_sair')
  await page.evaluate(() => (window as WindowSiga).SIGA.fecharDialogSair(true))
  await page.close()
}

export async function extractNotas(pg: ppr.Page) {
  await pg.goto(SIGA_URLS.notes, {waitUntil: 'networkidle0'})

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
      }
      arrayOfPeriods.push({name: div.id, subjects: arrFiltered})
    })

    return arrayOfPeriods
  })

  return JSON.stringify(mat)
}

export async function getHorary(pg: ppr.Page) {
  await pg.goto(SIGA_URLS.horary, {waitUntil: 'networkidle2'})

  const horary = await pg.evaluate(() => {
    const days: string[] = ['A', 'B', 'C', 'D', 'E', 'F', 'G']
    const allTrs: NodeListOf<HTMLTableDataCellElement> = document.querySelectorAll(
      'table > tbody > tr > td.textoTabela',
    )
    let horaryByDays: Horary = {
      begin: (window as WindowSiga).horariosInicio,
      end: (window as WindowSiga).horariosFim,
      days: [[]],
    }

    const getIndexByLetter = (item: string) => days.indexOf(item.charAt(0).toUpperCase())

    allTrs.forEach((item) => {
      if (horaryByDays.days[getIndexByLetter(item.id)] == undefined)
        horaryByDays.days[getIndexByLetter(item.id)] = []

      horaryByDays.days[getIndexByLetter(item.id)].push(item.innerText)
    })

    return horaryByDays
  })
  return JSON.stringify(horary)
}
