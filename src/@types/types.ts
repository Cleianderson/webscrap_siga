type Dict = {[key: string]: string}
type WindowSiga = Window & typeof globalThis & {
  SIGA: {fecharDialogSair: (boll: boolean) => void}
  horariosFim: string[]
  horariosInicio: string[]
}
type SIGANode = {[key: number]: {querySelector: (str: string) => HTMLFontElement}} & NodeListOf<
  HTMLTableRowElement
>
type Horary = {
  begin: string[]
  end: string[]
  days: [string[]]
}
