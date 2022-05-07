import { useEffect, useMemo } from 'react'
import { useSelector } from 'react-redux'
import { useAppDispatch } from 'state'
import { useWeb3React } from '@web3-react/core'
import BigNumber from 'bignumber.js'
import { BIG_ZERO } from 'utils/bigNumber'
import { getBalanceAmount } from 'utils/formatBalance'
import { farmsConfig } from 'config/constants'
import useRefresh from 'hooks/useRefresh'
import { deserializeToken } from 'state/user/hooks/helpers'
import { fetchFarmsPublicDataAsync, fetchFarmUserDataAsync, nonArchivedFarms } from '.'
import { State, SerializedFarm, DeserializedFarmUserData, DeserializedFarm, DeserializedFarmsState } from '../types'


const deserializeFarmUserData = (farm: SerializedFarm): DeserializedFarmUserData => {
  return {
    allowance: farm.userData ? new BigNumber(farm.userData.allowance) : BIG_ZERO,
    tokenBalance: farm.userData ? new BigNumber(farm.userData.tokenBalance) : BIG_ZERO,
    stakedBalance: farm.userData ? new BigNumber(farm.userData.stakedBalance) : BIG_ZERO,
    earnings: farm.userData ? new BigNumber(farm.userData.earnings) : BIG_ZERO,
  }
}

const deserializeFarm = (farm: SerializedFarm): DeserializedFarm => {
  const { lpAddresses, lpSymbol, pid, dual, multiplier, isCommunity, quoteTokenPriceBusd, tokenPriceBusd } = farm

  return {
    poolAddress: farm.poolAddress,
    lpAddresses,
    lpSymbol,
    pid,
    dual,
    multiplier,
    isCommunity,
    quoteTokenPriceBusd,
    tokenPriceBusd,
    // token: deserializeToken(farm.token),
    // quoteToken: deserializeToken(farm.quoteToken),
    userData: deserializeFarmUserData(farm),
    tokenAmountTotal: farm.tokenAmountTotal ? new BigNumber(farm.tokenAmountTotal) : BIG_ZERO,
    lpTotalInQuoteToken: farm.lpTotalInQuoteToken ? new BigNumber(farm.lpTotalInQuoteToken) : BIG_ZERO,
    lpTotalSupply: farm.lpTotalSupply ? new BigNumber(farm.lpTotalSupply) : BIG_ZERO,
    lpTokenRatio: farm.lpTokenRatio ? Number(farm.lpTokenRatio) : 0,
    tokenPriceVsQuote: farm.tokenPriceVsQuote ? new BigNumber(farm.tokenPriceVsQuote) : BIG_ZERO,
    poolWeight: farm.poolWeight ? new BigNumber(farm.poolWeight) : BIG_ZERO,
    lpData: farm.lpData,
    tokens: farm.tokens.map(t => deserializeToken(t)),
    quoteTokenIndex: farm.quoteTokenIndex,
    lockMaturity: farm.lockMaturity
    // token2: farm.token2 ? deserializeToken(farm.token2) : undefined,
    // token3: farm.token3 ? deserializeToken(farm.token3) : undefined,
  }
}

export const usePollFarmsPublicData = (chainId: number, includeArchive = false) => {
  const dispatch = useAppDispatch()
  const { slowRefresh } = useRefresh()

  useEffect(() => {
    const farmsToFetch = includeArchive ? farmsConfig(chainId) : nonArchivedFarms(chainId)
    const pids = farmsToFetch.map((farmToFetch) => farmToFetch.pid)

    dispatch(fetchFarmsPublicDataAsync({ chainId, pids }))
  }, [includeArchive, dispatch, slowRefresh, chainId])
}

export const usePollFarmsWithUserData = (includeArchive = false) => {
  const dispatch = useAppDispatch()
  const { slowRefresh } = useRefresh()
  const { chainId, account } = useWeb3React()

  useEffect(() => {
    const farmsToFetch = includeArchive ? farmsConfig(chainId) : nonArchivedFarms(chainId)
    const pids = farmsToFetch.map((farmToFetch) => farmToFetch.pid)

    dispatch(fetchFarmsPublicDataAsync({ chainId, pids }))

    if (account) {
      dispatch(fetchFarmUserDataAsync({ chainId, account, pids }))
    }
  }, [includeArchive, dispatch, slowRefresh, account, chainId])
}


/**
 * Fetches the "core" farm data used globally
 * 251 = CAKE-BNB LP
 * 252 = BUSD-BNB LP
 */
export const usePollCoreFarmData = (chainId: number) => {
  const dispatch = useAppDispatch()
  const { fastRefresh } = useRefresh()

  useEffect(() => {
    dispatch(fetchFarmsPublicDataAsync({ chainId, pids: [0, 1] }))
  }, [dispatch, fastRefresh, chainId])
}

export const useFarms = (): DeserializedFarmsState => {
  const farms = useSelector((state: State) => state.farms)
  const deserializedFarmsData = farms.data.map(deserializeFarm)
  const { loadArchivedFarmsData, userDataLoaded } = farms
  return {
    loadArchivedFarmsData,
    userDataLoaded,
    data: deserializedFarmsData,
  }
}

export const useFarmFromPid = (pid: number): DeserializedFarm => {
  const farm = useSelector((state: State) => state.farms.data.find((f) => f.pid === pid))
  return deserializeFarm(farm)
}

export const useFarmFromLpSymbol = (lpSymbol: string): DeserializedFarm => {
  const farm = useSelector((state: State) => state.farms.data.find((f) => f.lpSymbol === lpSymbol))
  return deserializeFarm(farm)
}

export const useFarmUser = (pid): DeserializedFarmUserData => {
  const { userData } = useFarmFromPid(pid)
  const { allowance, tokenBalance, stakedBalance, earnings } = userData
  return {
    allowance,
    tokenBalance,
    stakedBalance,
    earnings,
  }
}

// Return the base token price for a farm, from a given pid
export const useBusdPriceFromPid = (pid: number): BigNumber => {
  const farm = useFarmFromPid(pid)
  return farm && new BigNumber(farm.tokenPriceBusd)
}

export const useLpTokenPrice = (symbol: string) => {
  const farm = useFarmFromLpSymbol(symbol)
  const farmTokenPriceInUsd = useBusdPriceFromPid(farm.pid)
  let lpTokenPrice = BIG_ZERO

  if (farm.lpTotalSupply.gt(0) && farm.lpTotalInQuoteToken.gt(0)) {
    // Total value of base token in LP
    const valueOfBaseTokenInFarm = farmTokenPriceInUsd.times(farm.tokenAmountTotal)
    // Double it to get overall value in LP
    const overallValueOfAllTokensInFarm = valueOfBaseTokenInFarm.times(2)
    // Divide total value of all tokens, by the number of LP tokens
    const totalLpTokens = getBalanceAmount(farm.lpTotalSupply)
    lpTokenPrice = overallValueOfAllTokensInFarm.div(totalLpTokens)
  }

  return lpTokenPrice
}

// /!\ Deprecated , use the BUSD hook in /hooks

export const usePriceCakeBusd = (): BigNumber => {
  const cakeBnbFarm = useFarmFromPid(0)

  const cakePriceBusdAsString = cakeBnbFarm.tokenPriceBusd

  const cakePriceBusd = useMemo(() => {
    return new BigNumber(cakePriceBusdAsString)
  }, [cakePriceBusdAsString])

  return cakePriceBusd
}
