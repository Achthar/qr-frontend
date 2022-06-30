import { ethers } from 'ethers'
import getRpcUrl from 'utils/getRpcUrl'

// const RPC_URL = getRpcUrl()

export const simpleRpcProvider = (chainId) => {
  const RPC_URL = getRpcUrl(chainId ?? 43113)
  // console.log(new ethers.providers.JsonRpcProvider(RPC_URL))

  return new ethers.providers.JsonRpcProvider(RPC_URL)
  // return {
  //   _isProvider: true, _events: Array(0), _emitted: { block: -2 }, formatter: null, anyNetwork: false,
  //   getBlockNumber: () => { return 0 }
  // } as unknown as ethers.providers.JsonRpcProvider
}

// export const simpleRpcProvider = new ethers.providers.JsonRpcProvider("https://data-seed-prebsc-1-s1.binance.org:8545/")

export default null
