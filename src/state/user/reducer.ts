import { createReducer } from '@reduxjs/toolkit'
import { SerializedToken } from 'config/constants/types'
import { Token, WRAPPED_NETWORK_TOKENS } from '@requiemswap/sdk'
import { STABLES, REQT, STABLES_DICT, WETH, WBTC } from 'config/constants/tokens'
import {
  addSerializedPair,
  addSerializedWeightedPair,
  addSerializedToken,
  removeSerializedPair,
  removeSerializedToken,
  updateUserExpertMode,
  updateUserSlippageTolerance,
  updateUserDeadline,
  updateUserSingleHopOnly,
  updateGasPrice,
  muteAudio,
  unmuteAudio,
  toggleTheme,
  updateUserFarmStakedOnly,
  toggleURLWarning,
  refreshBalances,
  reset,
  refreshNetworkCcyBalance,
  setBalanceLoadingState
} from './actions'
import { GAS_PRICE_GWEI } from './hooks/helpers'
import { fetchUserNetworkCcyBalanceBalances } from './fetchUserNetworkCcyBalance'
import { fetchUserTokenBalances } from './fetchUserTokenBalances'
import { INITIAL_ALLOWED_SLIPPAGE, DEFAULT_DEADLINE_FROM_NOW } from '../../config/constants'
import { updateVersion } from '../global/actions'
import { FarmStakedOnly, UserState } from './types'

const initialChainId = 43113

const currentTimestamp = () => new Date().getTime()

const initialTokenList: Token[] = [
  ...[WRAPPED_NETWORK_TOKENS[initialChainId],
  REQT[initialChainId]],
  ...STABLES[initialChainId]
]

const initialBalances = {
  [WRAPPED_NETWORK_TOKENS[initialChainId].address]: '0',
  [REQT[initialChainId].address]: '0',
  [WETH[initialChainId].address]: '0',
  [WBTC[initialChainId].address]: '0',
  [STABLES[initialChainId][0].address]: '0',
  [STABLES[initialChainId][1].address]: '0',
  [STABLES[initialChainId][2].address]: '0',
  [STABLES[initialChainId][3].address]: '0',
}

function pairKey(token0Address: string, token1Address: string) {
  return `${token0Address};${token1Address}`
}

export const initialState: UserState = {
  userExpertMode: false,
  userSingleHopOnly: false,
  userSlippageTolerance: INITIAL_ALLOWED_SLIPPAGE,
  userDeadline: DEFAULT_DEADLINE_FROM_NOW,
  tokens: {},
  pairs: {},
  weightedPairs: {},
  timestamp: currentTimestamp(),
  audioPlay: true,
  isDark: false,
  userFarmStakedOnly: FarmStakedOnly.ON_FINISHED,
  gasPrice: GAS_PRICE_GWEI[99999].default,
  URLWarningVisible: true,
  userBalances: {
    networkCcyBalance: '0',
    isLoadingTokens: true,
    isLoadingNetworkCcy: true,
    balances: initialBalances
  }
}

export default createReducer<UserState>(initialState, (builder) =>
  builder
    .addCase(updateVersion, (state) => {
      // slippage isnt being tracked in local storage, reset to default
      // noinspection SuspiciousTypeOfGuard
      if (typeof state.userSlippageTolerance !== 'number') {
        state.userSlippageTolerance = INITIAL_ALLOWED_SLIPPAGE
      }

      // deadline isnt being tracked in local storage, reset to default
      // noinspection SuspiciousTypeOfGuard
      if (typeof state.userDeadline !== 'number') {
        state.userDeadline = DEFAULT_DEADLINE_FROM_NOW
      }

      state.lastUpdateVersionTimestamp = currentTimestamp()
    })
    .addCase(updateUserExpertMode, (state, action) => {
      state.userExpertMode = action.payload.userExpertMode
      state.timestamp = currentTimestamp()
    })
    .addCase(updateUserSlippageTolerance, (state, action) => {
      state.userSlippageTolerance = action.payload.userSlippageTolerance
      state.timestamp = currentTimestamp()
    })
    .addCase(updateUserDeadline, (state, action) => {
      state.userDeadline = action.payload.userDeadline
      state.timestamp = currentTimestamp()
    })
    .addCase(updateUserSingleHopOnly, (state, action) => {
      state.userSingleHopOnly = action.payload.userSingleHopOnly
    })
    .addCase(addSerializedToken, (state, { payload: { serializedToken } }) => {
      if (!state.tokens) {
        state.tokens = {}
      }
      state.tokens[serializedToken.chainId] = state.tokens[serializedToken.chainId] || {}
      state.tokens[serializedToken.chainId][serializedToken.address] = serializedToken
      state.timestamp = currentTimestamp()
    })
    .addCase(removeSerializedToken, (state, { payload: { address, chainId } }) => {
      if (!state.tokens) {
        state.tokens = {}
      }
      state.tokens[chainId] = state.tokens[chainId] || {}
      delete state.tokens[chainId][address]
      state.timestamp = currentTimestamp()
    })
    .addCase(addSerializedPair, (state, { payload: { serializedPair } }) => {
      if (
        serializedPair.token0.chainId === serializedPair.token1.chainId &&
        serializedPair.token0.address !== serializedPair.token1.address
      ) {
        const { chainId } = serializedPair.token0
        state.pairs[chainId] = state.pairs[chainId] || {}
        state.pairs[chainId][pairKey(serializedPair.token0.address, serializedPair.token1.address)] = serializedPair
      }
      state.timestamp = currentTimestamp()
    })
    .addCase(addSerializedWeightedPair, (state, { payload: { serializedWeightedPair } }) => {
      if (
        serializedWeightedPair.token0.chainId === serializedWeightedPair.token1.chainId &&
        serializedWeightedPair.token0.address !== serializedWeightedPair.token1.address
      ) {
        const { chainId } = serializedWeightedPair.token0
        state.pairs[chainId] = state.pairs[chainId] || {}
        state.pairs[chainId][pairKey(serializedWeightedPair.token0.address, serializedWeightedPair.token1.address)] = serializedWeightedPair
      }
      state.timestamp = currentTimestamp()
    }).addCase(removeSerializedPair, (state, { payload: { chainId, tokenAAddress, tokenBAddress } }) => {
      if (state.pairs[chainId]) {
        // just delete both keys if either exists
        delete state.pairs[chainId][pairKey(tokenAAddress, tokenBAddress)]
        delete state.pairs[chainId][pairKey(tokenBAddress, tokenAAddress)]
      }
      state.timestamp = currentTimestamp()
    })
    .addCase(muteAudio, (state) => {
      state.audioPlay = false
    })
    .addCase(unmuteAudio, (state) => {
      state.audioPlay = true
    })
    .addCase(toggleTheme, (state) => {
      state.isDark = !state.isDark
    })
    .addCase(updateUserFarmStakedOnly, (state, { payload: { userFarmStakedOnly } }) => {
      state.userFarmStakedOnly = userFarmStakedOnly
    })
    .addCase(updateGasPrice, (state, action) => {
      state.gasPrice = action.payload.gasPrice
    })
    .addCase(toggleURLWarning, state => {
      state.URLWarningVisible = !state.URLWarningVisible
    })
    // user balances state
    .addCase(refreshBalances, (state, { payload: { newBalances } }) => {

      // state.userBalances.balances = newBalances
      return {
        ...state,
        userBalances: {
          ...state.userBalances,
          balances: newBalances
        },
      }
    }
    )
    .addCase(fetchUserTokenBalances.fulfilled, (state, action) => {
      // state.userBalances.isLoadingTokens = false
      // state.userBalances.balances = action.payload
      return {
        ...state,
        userBalances: {
          ...state.userBalances,
          balances: action.payload,
          isLoadingTokens: false
        }
      }
    }
    )
    .addCase(fetchUserTokenBalances.pending, (state, action) => {
      // state.userBalances.isLoadingTokens = true

      return {
        ...state,
        userBalances: {
          ...state.userBalances,
          isLoadingTokens: true
        }
      }
    }
    )
    .addCase(fetchUserNetworkCcyBalanceBalances.fulfilled, (state, action) => {
      // state.userBalances.networkCcyBalance = action.payload.networkCcyBalance
      // state.userBalances.isLoadingNetworkCcy = false

      return {
        ...state,
        userBalances: {
          ...state.userBalances,
          networkCcyBalance: action.payload.networkCcyBalance,
          isLoadingNetworkCcy: false
        }
      }
    }
    )
    .addCase(fetchUserNetworkCcyBalanceBalances.pending, (state, action) => {
      // state.userBalances.isLoadingNetworkCcy = true

      return {
        ...state,
        userBalances: {
          ...state.userBalances,
          isLoadingNetworkCcy: true,
        }
      }
    }
    )
    .addCase(refreshNetworkCcyBalance, (state, { payload: { newBalance } }) => {
      // state.userBalances.networkCcyBalance = newBalance

      return {
        ...state,
        userBalances: {
          ...state.userBalances,
          networkCcyBalance: newBalance,
        }
      }
    }
    ),
)
