import { createReducer } from '@reduxjs/toolkit'
import { WRAPPED_NETWORK_TOKENS } from '@requiemswap/sdk'
import { STABLES, WETH, WBTC, ABREQ, USDC, USDT, DAI, BUSD, WBNB } from 'config/constants/tokens'
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
  setBalanceLoadingState,
  changeChainId
} from './actions'
import { GAS_PRICE_GWEI } from './hooks/helpers'
import { fetchUserNetworkCcyBalance } from './fetchUserNetworkCcyBalance'
import { fetchUserTokenData } from './fetchUserTokenBalances'
import { INITIAL_ALLOWED_SLIPPAGE, DEFAULT_DEADLINE_FROM_NOW } from '../../config/constants'
import { updateVersion } from '../global/actions'
import { FarmStakedOnly, UserState } from './types'

const currentTimestamp = () => new Date().getTime()

const initialData = {
  balance: '0',
  allowanceRouter: '0',
  allowancePairManager: '0'
}

const getAdditionalTokens = (chainId: number) => { return chainId === 43113 ? [] : [WBNB[chainId]] }

const getStables = (chainId: number) => { return chainId === 43113 ? STABLES[chainId] : [USDC[chainId], USDT[chainId], BUSD[chainId]] }

const initialBalances = (chainId: number) => {
  return {
    ...{
      [WRAPPED_NETWORK_TOKENS[chainId].address]: initialData,
      [ABREQ[chainId].address]: initialData,
      [WETH[chainId].address]: initialData,
      [WBTC[chainId].address]: initialData,
    },
    ...Object.assign({}, ...getStables(chainId).map(x => { return { [x.address]: initialData } })),
    ...Object.assign({}, ...getAdditionalTokens(chainId).map(x => { return { [x.address]: initialData } }))
  }
}

function pairKey(token0Address: string, token1Address: string) {
  return `${token0Address}-${token1Address}`
}

export const initialState: UserState = {
  referenceChainId: 43113,
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
    43113: {
      networkCcyBalance: '0',
      isLoadingTokens: true,
      isLoadingNetworkCcy: true,
      balances: initialBalances(43113)
    },
    42261: {
      networkCcyBalance: '0',
      isLoadingTokens: true,
      isLoadingNetworkCcy: true,
      balances: initialBalances(42261)

    }
  },
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
    .addCase(refreshBalances, (state, { payload: { chainId, newBalances } }) => {
      const keys = Object.keys(newBalances)
      for (let j = 0; j < keys.length; j++) {
        state.userBalances[chainId].balances[keys[j]].balance = newBalances[keys[j]]
      }
    }
    )
    .addCase(fetchUserTokenData.fulfilled, (state, action) => {
      const chainId = action.payload.chainId
      state.referenceChainId = chainId

      if (!state.userBalances[chainId])
        state.userBalances[chainId] = {}

      if (!state.userBalances[chainId].balances)
        state.userBalances[chainId] = { ...state.userBalances[chainId], balances: {} }

      const changedKeys = Object.keys(action.payload.data)
      for (let i = 0; i < changedKeys.length; i++) {
        state.userBalances[chainId].balances[changedKeys[i]] = action.payload.data[changedKeys[i]]
      }

      state.userBalances[chainId] = { ...state.userBalances[chainId], isLoadingTokens: false }
    }
    )
    .addCase(fetchUserTokenData.pending, (state) => {
      if (!state.userBalances[state.referenceChainId])
        state.userBalances[state.referenceChainId] = { ...state.userBalances[state.referenceChainId], isLoadingTokens: true }
      // state.userBalances[state.referenceChainId].isLoadingTokens = true
    }
    )
    .addCase(fetchUserNetworkCcyBalance.fulfilled, (state, action) => {
      const chainId = action.payload.chainId
      state.referenceChainId = chainId
      state.userBalances[chainId].networkCcyBalance = action.payload.networkCcyBalance
      state.userBalances[chainId].isLoadingNetworkCcy = false
    }
    )
    .addCase(fetchUserNetworkCcyBalance.pending, (state, action) => {
      // state.userBalances[state.referenceChainId].isLoadingNetworkCcy = true
    }
    )
    .addCase(refreshNetworkCcyBalance, (state, { payload: { newBalance } }) => {
      state.userBalances[state.referenceChainId].networkCcyBalance = newBalance
    }
    )
    .addCase(changeChainId, (state, { payload: { newChainId } }) => {
      state.referenceChainId = newChainId
    }
    ),
)
