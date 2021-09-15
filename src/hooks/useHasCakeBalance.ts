// import { useWeb3React } from '@web3-react/core'
import BigNumber from 'bignumber.js'
import { getCakeAddress } from 'utils/addressHelpers'
import useTokenBalance from './useTokenBalance'

/**
 * A hook to check if a wallet's CAKE balance is at least the amount passed in
 */
const useHasCakeBalance = (chainId:number, minimumBalance: BigNumber) => {
  // const {chainId} = useWeb3React()
  const { balance: cakeBalance } = useTokenBalance(getCakeAddress(chainId))
  return cakeBalance.gte(minimumBalance)
}

export default useHasCakeBalance
