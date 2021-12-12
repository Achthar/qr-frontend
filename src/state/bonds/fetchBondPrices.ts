import BigNumber from 'bignumber.js'
import { BIG_ONE, BIG_ZERO } from 'utils/bigNumber'
import { Bond } from 'state/types'
import { WRAPPED_NETWORK_TOKENS } from '@requiemswap/sdk'
import {PublicBondData} from './fetchPublicBondData'


const getBondBaseTokenPrice = (chainId: number, bond: PublicBondData, quoteTokenBond: Bond, bnbPriceBusd: BigNumber): BigNumber => {
  // const hasTokenPriceVsQuote = Boolean(bond.tokenPriceVsQuote)

  // if (bond.quoteToken.symbol === 'BUSD') {
  //   return hasTokenPriceVsQuote ? new BigNumber(bond.tokenPriceVsQuote) : BIG_ZERO
  // }

  // if (bond.quoteToken.symbol === WRAPPED_NETWORK_TOKENS[chainId].symbol) {
  //   return hasTokenPriceVsQuote ? bnbPriceBusd.times(bond.tokenPriceVsQuote) : BIG_ZERO
  // }

  // // We can only calculate profits without a quoteTokenBond for BUSD/BNB bonds
  // if (!quoteTokenBond) {
  //   return BIG_ZERO
  // }

  // // Possible alternative bond quoteTokens:
  // // UST (i.e. MIR-UST), pBTC (i.e. PNT-pBTC), BTCB (i.e. bBADGER-BTCB), ETH (i.e. SUSHI-ETH)
  // // If the bond's quote token isn't BUSD or wBNB, we then use the quote token, of the original bond's quote token
  // // i.e. for bond PNT - pBTC we use the pBTC bond's quote token - BNB, (pBTC - BNB)
  // // from the BNB - pBTC price, we can calculate the PNT - BUSD price
  // if (quoteTokenBond.quoteToken.symbol === WRAPPED_NETWORK_TOKENS[chainId].symbol) {
  //   const quoteTokenInBusd = bnbPriceBusd.times(quoteTokenBond.tokenPriceVsQuote)
  //   return hasTokenPriceVsQuote && quoteTokenInBusd
  //     ? new BigNumber(bond.tokenPriceVsQuote).times(quoteTokenInBusd)
  //     : BIG_ZERO
  // }

  // if (quoteTokenBond.quoteToken.symbol === 'BUSD') {
  //   const quoteTokenInBusd = quoteTokenBond.tokenPriceVsQuote
  //   return hasTokenPriceVsQuote && quoteTokenInBusd
  //     ? new BigNumber(bond.tokenPriceVsQuote).times(quoteTokenInBusd)
  //     : BIG_ZERO
  // }

  // Catch in case token does not have immediate or once-removed BUSD/wBNB quoteToken
  return BIG_ZERO
}

const getBondQuoteTokenPrice = (chainId:number, bond: Bond, quoteTokenBond: Bond, networkCCYPriceBusd: BigNumber): BigNumber => {
  // if (bond.quoteToken.symbol === 'BUSD') {
  //   return BIG_ONE
  // }

  // if (bond.quoteToken.symbol === WRAPPED_NETWORK_TOKENS[chainId].symbol) {
  //   return networkCCYPriceBusd
  // }

  // if (!quoteTokenBond) {
  //   return BIG_ZERO
  // }

  // if (quoteTokenBond.quoteToken.symbol === WRAPPED_NETWORK_TOKENS[chainId].symbol) {
  //   return quoteTokenBond.tokenPriceVsQuote ? networkCCYPriceBusd.times(quoteTokenBond.tokenPriceVsQuote) : BIG_ZERO
  // }

  // if (quoteTokenBond.quoteToken.symbol === 'BUSD') {
  //   return quoteTokenBond.tokenPriceVsQuote ? new BigNumber(quoteTokenBond.tokenPriceVsQuote) : BIG_ZERO
  // }

  return BIG_ZERO
}

const fetchBondsPrices = async (chainId: number, bonds) => {
  // const networkCCYBusdBond = bonds.find((bond: Bond) => bond.pid === 252)
  // const networkCCYPriceBusd = networkCCYBusdBond.tokenPriceVsQuote ? BIG_ONE.div(networkCCYBusdBond.tokenPriceVsQuote) : BIG_ZERO

  // const bondsWithPrices = bonds.map((bond) => {
  //   const quoteTokenBond = getBondFromTokenSymbol(bonds, bond.quoteToken.symbol)
  //   const baseTokenPrice = getBondBaseTokenPrice(chainId, bond, quoteTokenBond, networkCCYPriceBusd)
  //   const quoteTokenPrice = getBondQuoteTokenPrice(chainId, bond, quoteTokenBond, networkCCYPriceBusd)
  //   const token = { ...bond.token, usdPrice: baseTokenPrice.toJSON() }
  //   const quoteToken = { ...bond.quoteToken, usdPrice: quoteTokenPrice.toJSON() }
  //   return { ...bond, token, quoteToken }
  // })

  return null; // bondsWithPrices
}

export default fetchBondsPrices
