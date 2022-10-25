import { tokenList } from "config/constants/tokenLists/tokenlist"
import abreq from "../assets/tokens/abREQ.png"
import rose from "../assets/tokens/ROSE.png"


export const getTokenLogoURL = (address: string) =>
  `https://assets.trustwalletapp.com/blockchains/smartchain/assets/${address}/logo.png`



export const getTokenLogoURLFromSymbol = (symbol: string) =>
  getTokenLogo(symbol)


const getTokenLogo = (symbol: string) => {


  if (symbol.toLowerCase() === 'abreq') {
    return abreq
  }

  if (symbol.toLowerCase() === 'rose' || symbol.toLowerCase() === 'wrose') {
    return rose
  }
  return tokenList[42261].tokens.find(t => t.symbol.toLowerCase() === symbol.toLowerCase())?.logoURI
}