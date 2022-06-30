import { useEffect, useState } from 'react'
import BigNumber from 'bignumber.js'
import useActiveWeb3React from 'hooks/useActiveWeb3React'
import { useNetworkState } from 'state/globalNetwork/hooks'
import { getERC20Contract } from 'utils/contractHelpers'
import { BIG_ZERO } from 'utils/bigNumber'
import { simpleRpcProvider } from 'utils/providers'
import useRefresh from './useRefresh'
import useLastUpdated from './useLastUpdated'

type UseTokenBalanceState = {
  balance: BigNumber
  fetchStatus: FetchStatus
}

export enum FetchStatus {
  NOT_FETCHED = 'not-fetched',
  SUCCESS = 'success',
  FAILED = 'failed',
}

const useTokenBalance = (tokenAddress: string) => {
  const { NOT_FETCHED, SUCCESS, FAILED } = FetchStatus
  const [balanceState, setBalanceState] = useState<UseTokenBalanceState>({
    balance: BIG_ZERO,
    fetchStatus: NOT_FETCHED,
  })
  const { account, chainId } = useActiveWeb3React()
  const { fastRefresh } = useRefresh()

  useEffect(() => {
    const fetchBalance = async () => {
      const contract = getERC20Contract(chainId, tokenAddress)
      try {
        const res = await contract.balanceOf(account)
        setBalanceState({ balance: new BigNumber(res.toString()), fetchStatus: SUCCESS })
      } catch (e) {
        console.error(e)
        setBalanceState((prev) => ({
          ...prev,
          fetchStatus: FAILED,
        }))
      }
    }

    if (account) {
      fetchBalance()
    }
  }, [chainId, account, tokenAddress, fastRefresh, SUCCESS, FAILED])

  return balanceState
}

export const useBurnedBalance = (tokenAddress: string) => {
  const { chainId } = useNetworkState()
  const [balance, setBalance] = useState(BIG_ZERO)
  const { slowRefresh } = useRefresh()

  useEffect(() => {
    const fetchBalance = async () => {
      const contract = getERC20Contract(chainId, tokenAddress)
      const res = await contract.balanceOf('0x000000000000000000000000000000000000dEaD')
      setBalance(new BigNumber(res.toString()))
    }

    fetchBalance()
  }, [chainId, tokenAddress, slowRefresh])

  return balance
}

export const useGetNetworkCcyBalance = () => {
  const { account, chainId, library } = useActiveWeb3React()
  const [fetchStatus, setFetchStatus] = useState(FetchStatus.NOT_FETCHED)
  const [balance, setBalance] = useState(BIG_ZERO)
  const { lastUpdated, setLastUpdated } = useLastUpdated()
  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const walletBalance = await simpleRpcProvider(chainId).getBalance(account)
        setBalance(new BigNumber(walletBalance.toString()))
        setFetchStatus(FetchStatus.SUCCESS)
      } catch {
        setFetchStatus(FetchStatus.FAILED)
      }
    }

    if (account) {
      fetchBalance()
    }
  }, [chainId, account, lastUpdated, setBalance, setFetchStatus])

  return { balance, fetchStatus, refresh: setLastUpdated }
}

export default useTokenBalance
