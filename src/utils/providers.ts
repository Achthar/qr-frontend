import { ethers } from 'ethers'
import getRpcUrl from 'utils/getRpcUrl'

// const RPC_URL = getRpcUrl()

export const simpleRpcProvider = (chainId) => {
  const RPC_URL = getRpcUrl(chainId ?? 43113)
  return new ethers.providers.JsonRpcProvider(RPC_URL)
}

// export const simpleRpcProvider = new ethers.providers.JsonRpcProvider("https://data-seed-prebsc-1-s1.binance.org:8545/")

export default null
