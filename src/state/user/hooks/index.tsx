import { /* ChainId, */ AmplifiedWeightedPair, Token, WRAPPED_NETWORK_TOKENS, STABLECOINS, TokenAmount } from '@requiemswap/sdk'
import flatMap from 'lodash/flatMap'
import { useCallback, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { BASES_TO_TRACK_LIQUIDITY_FOR, PINNED_PAIRS, PINNED_WEIGHTED_PAIRS } from 'config/constants'
import { useNetworkState } from 'state/globalNetwork/hooks'
import { useAllTokens } from 'hooks/Tokens'
import { ABREQ, GREQ, REQT, SREQ, WBTC, WETH } from 'config/constants/tokens'
import { SerializedToken, TokenPair } from 'config/constants/types'
import { SerializedWeightedPair, State, WeightedPairMetaData } from 'state/types'
import { getAddress } from 'ethers/lib/utils'
import { BigNumber } from 'ethers'

import { AppDispatch, AppState } from '../../index'
import {
  addSerializedPair,
  addSerializedWeightedPair,
  addSerializedToken,
  muteAudio,
  removeSerializedToken,
  toggleTheme as toggleThemeAction,
  unmuteAudio,
  updateUserDeadline,
  updateUserExpertMode,
  updateUserFarmStakedOnly,
  updateUserSingleHopOnly,
  updateUserSlippageTolerance,
  updateGasPrice
} from '../actions'
import { deserializeToken, GAS_PRICE_GWEI, serializeToken } from './helpers'
import { ChainId } from '../../../config/index'
import { FarmStakedOnly, SerializedPair, UserBalanceState } from '../types'


export function useAudioModeManager(): [boolean, () => void] {
  const dispatch = useDispatch<AppDispatch>()
  const audioPlay = useSelector<AppState, AppState['user']['audioPlay']>((state) => state.user.audioPlay)

  const toggleSetAudioMode = useCallback(() => {
    if (audioPlay) {
      dispatch(muteAudio())
    } else {
      dispatch(unmuteAudio())
    }
  }, [audioPlay, dispatch])

  return [false, toggleSetAudioMode]
}

export function useIsExpertMode(): boolean {
  return useSelector<AppState, AppState['user']['userExpertMode']>((state) => state.user.userExpertMode)
}

export function useUserBalances(chainId: number) {
  const user = useSelector<AppState, AppState['user']>((state) => state.user)
  return user.userBalances?.[chainId] ?? {
    networkCcyBalance: '0',
    isLoadingTokens: true,
    isLoadingNetworkCcy: true,
    balances: {}

  }
}

export function useExpertModeManager(): [boolean, () => void] {
  const dispatch = useDispatch<AppDispatch>()
  const expertMode = useIsExpertMode()

  const toggleSetExpertMode = useCallback(() => {
    dispatch(updateUserExpertMode({ userExpertMode: !expertMode }))
  }, [expertMode, dispatch])

  return [expertMode, toggleSetExpertMode]
}

export function useURLWarningVisible(): boolean {
  return useSelector((state: AppState) => state.user.URLWarningVisible)
}

export function useThemeManager(): [boolean, () => void] {
  const dispatch = useDispatch<AppDispatch>()
  // const isDark = useSelector<AppState, AppState['user']['isDark']>((state) => state.user.isDark)

  const toggleTheme = useCallback(() => {
    dispatch(toggleThemeAction())
  }, [dispatch])

  return [true, toggleTheme]
}

export function useUserSingleHopOnly(): [boolean, (newSingleHopOnly: boolean) => void] {
  const dispatch = useDispatch<AppDispatch>()

  const singleHopOnly = useSelector<AppState, AppState['user']['userSingleHopOnly']>(
    (state) => state.user.userSingleHopOnly,
  )

  const setSingleHopOnly = useCallback(
    (newSingleHopOnly: boolean) => {
      dispatch(updateUserSingleHopOnly({ userSingleHopOnly: newSingleHopOnly }))
    },
    [dispatch],
  )

  return [singleHopOnly, setSingleHopOnly]
}

export function useUserSlippageTolerance(): [number, (slippage: number) => void] {
  const dispatch = useDispatch<AppDispatch>()
  const userSlippageTolerance = useSelector<AppState, AppState['user']['userSlippageTolerance']>((state) => {
    return state.user.userSlippageTolerance
  })

  const setUserSlippageTolerance = useCallback(
    (slippage: number) => {
      dispatch(updateUserSlippageTolerance({ userSlippageTolerance: slippage }))
    },
    [dispatch],
  )

  return [userSlippageTolerance, setUserSlippageTolerance]
}

export function useUserFarmStakedOnly(isActive: boolean): [boolean, (stakedOnly: boolean) => void] {
  const dispatch = useDispatch<AppDispatch>()
  const userFarmStakedOnly = useSelector<AppState, AppState['user']['userFarmStakedOnly']>((state) => {
    return state.user.userFarmStakedOnly
  })

  const setUserFarmStakedOnly = useCallback(
    (stakedOnly: boolean) => {
      const farmStakedOnly = stakedOnly ? FarmStakedOnly.TRUE : FarmStakedOnly.FALSE
      dispatch(updateUserFarmStakedOnly({ userFarmStakedOnly: farmStakedOnly }))
    },
    [dispatch],
  )

  return [
    userFarmStakedOnly === FarmStakedOnly.ON_FINISHED ? !isActive : userFarmStakedOnly === FarmStakedOnly.TRUE,
    setUserFarmStakedOnly,
  ]
}

export function useUserTransactionTTL(): [number, (slippage: number) => void] {
  const dispatch = useDispatch<AppDispatch>()
  const userDeadline = useSelector<AppState, AppState['user']['userDeadline']>((state) => {
    return state.user.userDeadline
  })

  const setUserDeadline = useCallback(
    (deadline: number) => {
      dispatch(updateUserDeadline({ userDeadline: deadline }))
    },
    [dispatch],
  )

  return [userDeadline, setUserDeadline]
}

export function useAddUserToken(): (token: Token) => void {
  const dispatch = useDispatch<AppDispatch>()
  return useCallback(
    (token: Token) => {
      dispatch(addSerializedToken({ serializedToken: serializeToken(token) }))
    },
    [dispatch],
  )
}

export function useRemoveUserAddedToken(): (chainId: number, address: string) => void {
  const dispatch = useDispatch<AppDispatch>()
  return useCallback(
    (chainId: number, address: string) => {
      dispatch(removeSerializedToken({ chainId, address }))
    },
    [dispatch],
  )
}

export function useGasPrice(chainId: number): string {
  // const chainId = process.env.REACT_APP_CHAIN_ID
  const userGas = useSelector<AppState, AppState['user']['gasPrice']>((state) => state.user.gasPrice)
  return chainId === ChainId.BSC_MAINNET ? userGas : GAS_PRICE_GWEI[chainId ?? 56].default
}

export function useGasPriceManager(chainId: number): [string, (userGasPrice: string) => void] {
  const dispatch = useDispatch<AppDispatch>()
  const userGasPrice = useGasPrice(chainId)

  const setGasPrice = useCallback(
    (gasPrice: string) => {
      dispatch(updateGasPrice({ gasPrice }))
    },
    [dispatch],
  )

  return [userGasPrice, setGasPrice]
}

export function useSerializedPairAdder(): (pair: TokenPair) => void {
  const dispatch = useDispatch<AppDispatch>()

  return useCallback(
    (pair: TokenPair) => {
      dispatch(addSerializedPair({ serializedPair: pair as SerializedPair }))
    },
    [dispatch],
  )
}


/**
 * Given two tokens return the liquidity token that represents its liquidity shares
 * @param tokenA one of the two tokens
 * @param tokenB the other token
 */
export function toV2LiquidityToken([tokenA, tokenB]: [Token, Token]): Token {
  return new Token(tokenA.chainId, AmplifiedWeightedPair.getAddress(tokenA, tokenB, BigNumber.from('0')), 18, 'Cake-LP', 'Pancake LPs')
}

/**
 * Given two tokens return the liquidity token that represents its liquidity shares
 * @param tokenA one of the two tokens
 * @param tokenB the other token
 */
export function toWeightedLiquidityToken([tokenA, tokenB, weightA]: [Token, Token, number]): Token {
  return new Token(tokenA.chainId, AmplifiedWeightedPair.getAddress(tokenA, tokenB, BigNumber.from(weightA)), 18, 'Requiem-LP', 'Requiem LPs')
}

/**
 * Returns all the pairs of tokens that are tracked by the user for the current chain ID.
 */
export function useTrackedTokenPairs(): [Token, Token][] {
  const { chainId } = useNetworkState()
  const tokens = useAllTokens(chainId)

  // pinned pairs
  const pinnedPairs = useMemo(() => (chainId ? PINNED_PAIRS[chainId] ?? [] : []), [chainId])
  // pairs for every token against every base
  const generatedPairs: [Token, Token][] = useMemo(
    () =>
      chainId
        ? flatMap(Object.keys(tokens), (tokenAddress) => {
          const token = tokens[tokenAddress]
          // for each token on the current chain,
          return (
            // loop though all bases on the current chain
            (BASES_TO_TRACK_LIQUIDITY_FOR[chainId] ?? [])
              // to construct pairs of the given token with each base
              .map((base) => {
                if (base.address === token.address) {
                  return null
                }
                return [base, token]
              })
              .filter((p): p is [Token, Token] => p !== null)
          )
        })
        : [],
    [tokens, chainId],
  )

  // pairs saved by users
  const savedSerializedPairs = useSelector<AppState, AppState['user']['pairs']>(({ user: { pairs } }) => pairs)

  const userPairs: [Token, Token][] = useMemo(() => {
    if (!chainId || !savedSerializedPairs) return []
    const forChain = savedSerializedPairs[chainId]
    if (!forChain) return []

    return Object.keys(forChain).map((pairId) => {
      return [deserializeToken(forChain[pairId].token0), deserializeToken(forChain[pairId].token1)]
    })
  }, [savedSerializedPairs, chainId])

  const combinedList = useMemo(
    () => userPairs.concat(generatedPairs).concat(pinnedPairs),
    [generatedPairs, pinnedPairs, userPairs],
  )

  return useMemo(() => {
    // dedupes pairs of tokens in the combined list
    const keyed = combinedList.reduce<{ [key: string]: [Token, Token] }>((memo, [tokenA, tokenB]) => {
      const sorted = tokenA.sortsBefore(tokenB)
      const key = sorted ? `${tokenA.address}:${tokenB.address}` : `${tokenB.address}:${tokenA.address}`
      if (memo[key]) return memo
      memo[key] = sorted ? [tokenA, tokenB] : [tokenB, tokenA]
      return memo
    }, {})

    return Object.keys(keyed).map((key) => keyed[key])
  }, [combinedList])
}


function serializeWeightedPair(weightedPair: AmplifiedWeightedPair): WeightedPairMetaData {
  return {
    token0: serializeToken(weightedPair.token0),
    token1: serializeToken(weightedPair.token1),
    weight0: Number(weightedPair.weight0.toString()),
    fee: Number(weightedPair.fee0.toString()),
    amp: Number(weightedPair.amp)
  }
}

export function useWeightedPairAdder(): (weightedPair: AmplifiedWeightedPair) => void {
  const dispatch = useDispatch<AppDispatch>()

  return useCallback(
    (pair: AmplifiedWeightedPair) => {
      dispatch(addSerializedWeightedPair({ serializedWeightedPair: serializeWeightedPair(pair) }))
    },
    [dispatch],
  )
}

export function useUserPairs(chainId: number): TokenPair[] {
  const savedPairs = useSelector<AppState, AppState['user']['pairs']>(({ user: { pairs } }) => pairs)

  if (!savedPairs[chainId])
    return []

  return Object.values(savedPairs[chainId])
}


/**
 * Returns all the pairs of tokens that are tracked by the user for the current chain ID.
 */
export function useTrackedTokenWeightedPairs(): [Token, Token, number, number][] {
  const { chainId } = useNetworkState()
  const tokens = useAllTokens(chainId)

  // pinned pairs
  const pinnedPairs = useMemo(() => (chainId ? PINNED_WEIGHTED_PAIRS[chainId] ?? [] : []), [chainId])
  // pairs for every token against every base
  const generatedPairs: [Token, Token, number, number][] = useMemo(
    () =>
      chainId
        ? flatMap(Object.keys(tokens), (tokenAddress) => {
          const token = tokens[tokenAddress]
          // for each token on the current chain,
          return (
            // loop though all bases on the current chain
            (BASES_TO_TRACK_LIQUIDITY_FOR[chainId] ?? [])
              // to construct pairs of the given token with each base
              .map((base) => {
                if (base.address === token.address) {
                  return null
                }
                return [base, token]
              })
              .filter((p): p is [Token, Token, 50, 20] => p !== null)
          )
        })
        : [],
    [tokens, chainId],
  )

  // pairs saved by users
  const savedSerializedPairs = useSelector<AppState, AppState['user']['weightedPairs']>(({ user: { weightedPairs } }) => weightedPairs)

  const userPairs: [Token, Token, number, number][] = useMemo(() => {
    if (!chainId || !savedSerializedPairs) return []
    const forChain = savedSerializedPairs[chainId]
    if (!forChain) return []

    return Object.keys(forChain).map((pairId) => {
      return [deserializeToken(forChain[pairId].token0), deserializeToken(forChain[pairId].token1), forChain[pairId].weight0, forChain[pairId].fee]
    })
  }, [savedSerializedPairs, chainId])

  const combinedList = useMemo(
    () => userPairs.concat(generatedPairs).concat(pinnedPairs),
    [generatedPairs, pinnedPairs, userPairs],
  )

  return useMemo(() => {
    // dedupes pairs of tokens in the combined list
    const keyed = combinedList.reduce<{ [key: string]: [Token, Token, number, number] }>((memo, [tokenA, tokenB, weightA, fee]) => {
      const sorted = tokenA.sortsBefore(tokenB)
      const key = sorted ? `${tokenA.address}-${weightA}:${tokenB.address}-${fee}` : `${tokenB.address}-${100 - weightA}:${tokenA.address}${fee}`
      if (memo[key]) return memo
      memo[key] = sorted ? [tokenA, tokenB, weightA, fee] : [tokenB, tokenA, 100 - weightA, fee]
      return memo
    }, {})

    return Object.keys(keyed).map((key) => keyed[key])
  }, [combinedList])
}



export function getMainTokens(chainId: number): Token[] {
  return [WRAPPED_NETWORK_TOKENS[chainId], REQT[chainId], WBTC[chainId], WETH[chainId]]
}

export function getStables(chainId: number): Token[] {
  return STABLECOINS[chainId]
}

export function getTokenAmounts(chainId: number, balances: { [address: string]: string }) {
  return [...[
    WRAPPED_NETWORK_TOKENS[chainId],
    REQT[chainId],
  ],
  ...[WBTC[chainId], WETH[chainId]],
  ...STABLECOINS[chainId]
  ].map(token => new TokenAmount(token, balances[getAddress(token.address)] ?? '0'))

}

export function getStableAmounts(chainId: number, balances: {
  [address: string]: {
    balance: string,
    allowanceRouter: string,
    allowancePairManager: string
  }
}) {
  if (!balances)
    return []

  return STABLECOINS[chainId ?? 43113].map(token => new TokenAmount(token, balances[getAddress(token.address)]?.balance ?? '0'))

}


export function getAmounts(tokens: Token[], balances: {
  [address: string]: {
    balance: string,
    allowanceRouter: string,
    allowancePairManager: string
  }
}) {
  if (!balances || !tokens)
    return []

  return tokens.map(token => new TokenAmount(token, balances[getAddress(token.address)]?.balance ?? '0'))

}

export function getAmountsForSerializedTokens(tokens: SerializedToken[], balances: {
  [address: string]: {
    balance: string,
    allowanceRouter: string,
    allowancePairManager: string
  }
}) {
  if (!balances || !tokens)
    return []

  return tokens.map(token => new TokenAmount(deserializeToken(token), balances[getAddress(token.address)]?.balance ?? '0'))

}

export function getMainAmounts(chainId: number, balances: {
  [address: string]: {
    balance: string,
    allowanceRouter: string,
    allowancePairManager: string
  }
}) {
  if (!balances)
    return []
  if (chainId === 43113)
    return [
      WRAPPED_NETWORK_TOKENS[chainId],
      ABREQ[chainId],
      REQT[chainId],
      WBTC[chainId],
      WETH[chainId]
    ].map(token => new TokenAmount(token, balances[getAddress(token.address)]?.balance ?? '0'))

  return [
    WRAPPED_NETWORK_TOKENS[chainId],
    REQT[chainId],
    WBTC[chainId],
    WETH[chainId]
  ].map(token => new TokenAmount(token, balances[getAddress(token.address)]?.balance ?? '0'))

}


export function useGetRequiemAmount(chainId: number) {
  const balState = useUserBalances(chainId)

  return {
    balance: new TokenAmount(REQT[chainId], balState?.balances[REQT[chainId].address].balance ?? '0'),
    isLoading: balState.isLoadingTokens
  }

}


export function useGetAssetBackedRequiemAmount(chainId: number) {
  const balState = useUserBalances(chainId)

  return {
    balance: new TokenAmount(ABREQ[chainId], balState?.balances[ABREQ[chainId].address].balance ?? '0'),
    isLoading: balState.isLoadingTokens
  }

}


export function useGetRequiemAmounts(chainId: number) {
  const balState = useUserBalances(chainId)
  const requiems = chainId === 43113 ? [REQT[chainId], ABREQ[chainId]] : [REQT[chainId]]
  return {
    balances: Object.assign({}, ...requiems.map(req => { return { [req.address]: new TokenAmount(req, balState?.balances[req.address].balance ?? '0') } })),
    isLoading: balState.isLoadingTokens
  }

}