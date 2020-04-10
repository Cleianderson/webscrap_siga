type Dict = {[key: string]: string}
type WindowSiga = Window & {SIGA: {fecharDialogSair: (boll: boolean) => void}}
type SIGANode = {[key: number]: {querySelector: (str: string) => HTMLFontElement}} & NodeListOf<
  HTMLTableRowElement
>
type Horary = {
  begin: string[]
  end: string[]
  days:[string[]]
}