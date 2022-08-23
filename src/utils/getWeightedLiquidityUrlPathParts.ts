// Constructing the two forward-slash-separated parts of the 'Add Liquidity' URL
// Each part of the url represents a different side of the LP pair.
import { NETWORK_CCY } from '@requiemswap/sdk'
import { getWNetworkCcyAddress } from './addressHelpers'

const getWeightedLiquidityUrlPathParts = ({ chainId, quoteTokenAddress, tokenAddress, weightQuote, weightToken, fee }) => {
  const wNetworkCCYAddressString = getWNetworkCcyAddress(chainId ?? process.env.REACT_APP_DEFAULT_CHAIN_ID)
  const quoteTokenAddressString: string = quoteTokenAddress // ? quoteTokenAddress[chainId ?? process.env.REACT_APP_DEFAULT_CHAIN_ID] : null
  const tokenAddressString: string = tokenAddress // ? tokenAddress[chainId] : null
  const firstPart =
    !quoteTokenAddressString || quoteTokenAddressString === wNetworkCCYAddressString ? NETWORK_CCY[chainId ?? process.env.REACT_APP_DEFAULT_CHAIN_ID].symbol : quoteTokenAddressString
  const secondPart = !tokenAddressString || tokenAddressString === wNetworkCCYAddressString ? NETWORK_CCY[chainId ?? process.env.REACT_APP_DEFAULT_CHAIN_ID].symbol : tokenAddressString
  return `${weightQuote}-${firstPart}/${weightToken}-${secondPart}`
}

export default getWeightedLiquidityUrlPathParts
