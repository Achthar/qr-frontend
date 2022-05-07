import BigNumber from 'bignumber.js'
import { BIG_ONE, BIG_ZERO } from 'utils/bigNumber'
import { filterFarmsByQuoteToken } from 'utils/farmsPriceHelpers'
import { SerializedFarm } from 'state/types'
import { WRAPPED_NETWORK_TOKENS } from '@requiemswap/sdk'
import tokens from 'config/constants/tokens'

const getFarmFromTokenSymbol = (
  farms: SerializedFarm[],
  tokenSymbol: string,
  preferredQuoteTokens?: string[],
): SerializedFarm => {
  const farmsWithTokenSymbol = farms.filter((farm) => farm.tokens.map(t => t.symbol).includes(tokenSymbol))
  const filteredFarm = filterFarmsByQuoteToken(farmsWithTokenSymbol, preferredQuoteTokens)
  return filteredFarm
}

const getFarmBaseTokenPrice = (
  farm: SerializedFarm,
  quoteTokenFarm: SerializedFarm,
  networkCcyPriceUSD: BigNumber,
): BigNumber => {
  const hasTokenPriceVsQuote = Boolean(farm.tokenPriceVsQuote)

  const quoteToken = farm.tokens[farm.quoteTokenIndex]
  const quoteTokenQuoteFarm = quoteTokenFarm.tokens[quoteTokenFarm.quoteTokenIndex]

  if (quoteToken.symbol === tokens.dai.symbol) {
    return hasTokenPriceVsQuote ? new BigNumber(farm.tokenPriceVsQuote) : BIG_ZERO
  }

  if (quoteToken.symbol === tokens.wavax.symbol) {
    return hasTokenPriceVsQuote ? networkCcyPriceUSD.times(farm.tokenPriceVsQuote) : BIG_ZERO
  }

  // We can only calculate profits without a quoteTokenFarm for BUSD/BNB farms
  if (!quoteTokenFarm) {
    return BIG_ZERO
  }

  // Possible alternative farm quoteTokens:
  // UST (i.e. MIR-UST), pBTC (i.e. PNT-pBTC), BTCB (i.e. bBADGER-BTCB), ETH (i.e. SUSHI-ETH)
  // If the farm's quote token isn't BUSD or WBNB, we then use the quote token, of the original farm's quote token
  // i.e. for farm PNT - pBTC we use the pBTC farm's quote token - BNB, (pBTC - BNB)
  // from the BNB - pBTC price, we can calculate the PNT - BUSD price
  if (quoteTokenQuoteFarm.symbol === tokens.wavax.symbol) {
    const quoteTokenInBusd = networkCcyPriceUSD.times(quoteTokenFarm.tokenPriceVsQuote)
    return hasTokenPriceVsQuote && quoteTokenInBusd
      ? new BigNumber(farm.tokenPriceVsQuote).times(quoteTokenInBusd)
      : BIG_ZERO
  }

  if (quoteTokenQuoteFarm.symbol === tokens.dai.symbol) {
    const quoteTokenInBusd = quoteTokenFarm.tokenPriceVsQuote
    return hasTokenPriceVsQuote && quoteTokenInBusd
      ? new BigNumber(farm.tokenPriceVsQuote).times(quoteTokenInBusd)
      : BIG_ZERO
  }

  // Catch in case token does not have immediate or once-removed BUSD/WBNB quoteToken
  return BIG_ZERO
}

const getFarmQuoteTokenPrice = (
  farm: SerializedFarm,
  quoteTokenFarm: SerializedFarm,
  networkCcyPriceUSD: BigNumber,
): BigNumber => {

  const quoteToken = farm.tokens[farm.quoteTokenIndex]
  const quoteTokenQuoteFarm = quoteTokenFarm.tokens[quoteTokenFarm.quoteTokenIndex]

  if (quoteToken.symbol === 'DAI' || quoteToken.symbol === 'USDC') {
    return BIG_ONE
  }

  if (quoteToken.symbol === WRAPPED_NETWORK_TOKENS[quoteToken.chainId].symbol) {
    return networkCcyPriceUSD
  }

  if (!quoteTokenFarm) {
    return BIG_ZERO
  }

  if (quoteTokenQuoteFarm.symbol === WRAPPED_NETWORK_TOKENS[quoteToken.chainId].symbol) {
    return quoteTokenFarm.tokenPriceVsQuote ? networkCcyPriceUSD.times(quoteTokenFarm.tokenPriceVsQuote) : BIG_ZERO
  }

  if (quoteTokenQuoteFarm.symbol === 'DAI') {
    return quoteTokenFarm.tokenPriceVsQuote ? new BigNumber(quoteTokenFarm.tokenPriceVsQuote) : BIG_ZERO
  }

  return BIG_ZERO
}

const fetchFarmsPrices = async (farms: SerializedFarm[]) => {
  const networkCcyUSDFarm = farms.find((farm) => farm.pid === 2)
  const networkCcyPriceUSD = networkCcyUSDFarm.tokenPriceVsQuote ? BIG_ONE.div(networkCcyUSDFarm.tokenPriceVsQuote) : BIG_ZERO

  const farmsWithPrices = farms.map((farm) => {

    const quoteTokenFarm = getFarmFromTokenSymbol(farms, farm.tokens[farm.quoteTokenIndex].symbol)
    const tokenPriceBusd = getFarmBaseTokenPrice(farm, quoteTokenFarm, networkCcyPriceUSD)
    const quoteTokenPriceBusd = getFarmQuoteTokenPrice(farm, quoteTokenFarm, networkCcyPriceUSD)

    return {
      ...farm,
      tokenPriceBusd: tokenPriceBusd.toJSON(),
      quoteTokenPriceBusd: quoteTokenPriceBusd.toJSON(),
    }
  })

  return farmsWithPrices
}

export default fetchFarmsPrices
