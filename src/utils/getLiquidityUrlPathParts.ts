// Constructing the two forward-slash-separated parts of the 'Add Liquidity' URL
// Each part of the url represents a different side of the LP pair.
import { NETWORK_CCY } from '@pancakeswap/sdk'
import { useWeb3React } from '@web3-react/core'
import { getWbnbAddress } from './addressHelpers'

const getLiquidityUrlPathParts = ({chainId, quoteTokenAddress, tokenAddress }) => {
  // const {chainId} = useWeb3React()
  // const chainId = process.env.REACT_APP_CHAIN_ID
  const wBNBAddressString = getWbnbAddress(chainId)
  console.log("WBNB",wBNBAddressString)
  const quoteTokenAddressString: string = quoteTokenAddress ? quoteTokenAddress[chainId] : null
  const tokenAddressString: string = tokenAddress ? tokenAddress[chainId] : null
  const firstPart =
    !quoteTokenAddressString || quoteTokenAddressString === wBNBAddressString ? NETWORK_CCY[chainId].symbol : quoteTokenAddressString
  const secondPart = !tokenAddressString || tokenAddressString === wBNBAddressString ? NETWORK_CCY[chainId].symbol : tokenAddressString
  return `${firstPart}/${secondPart}`
}

export default getLiquidityUrlPathParts
