/** eslint no-empty-interface: 0 */
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
// import { useNetworkState } from 'state/globalNetwork/hooks'
import { useWeb3React } from '@web3-react/core'
import isArchivedBondId from 'utils/bondHelpers'
import { bondList as bondsDict } from 'config/constants/bonds'
import priceHelperLpsConfig from 'config/constants/priceHelperLps'
import { BondConfig } from 'config/constants/types'
// import { useAppDispatch, useAppSelector } from 'state'
import fetchBonds from './fetchBonds'
import fetchBondsPrices from './fetchBondPrices'
import {
  fetchBondUserEarnings,
  fetchBondUserAllowances,
  fetchBondUserTokenBalances,
  fetchBondUserStakedBalances,
} from './fetchBondUser'
import { BondsState, Bond } from '../types'

// import { chain } from 'lodash'

const chainIdFromState = 43113 // useAppSelector((state) => state.application.chainId)

function noAccountBondConfig(chainId: number) {
  return bondsDict[chainId].map((bond) => ({
    ...bond,
    userData: {
      allowance: '0',
      tokenBalance: '0',
      stakedBalance: '0',
      earnings: '0',
    },
  }))
}

function initialState(chainId: number): BondsState { return { data: noAccountBondConfig(chainId), loadArchivedBondsData: false, userDataLoaded: false } }

export function nonArchivedBonds(chainId: number): BondConfig[] { return bondsDict[chainId ?? 43113].filter(({ bondId }) => !isArchivedBondId(bondId)) }

// Async thunks
export const fetchBondsPublicDataAsync = createAsyncThunk<Bond[], number[]>(
  'bonds/fetchBondsPublicDataAsync',
  async (bondIds) => {
    const { chainId } = useWeb3React()
    const bondsToFetch = bondsDict[chainId].filter((bondConfig) => bondIds.includes(bondConfig.bondId))

    // Add price helper bonds
    const bondsWithPriceHelpers = bondsToFetch.concat(priceHelperLpsConfig)

    const bonds = await fetchBonds(chainId, bondsWithPriceHelpers)
    const bondsWithPrices = await fetchBondsPrices(chainId, bonds)


    return bondsWithPrices
  },
)

interface BondUserDataResponse {
  bondId: number
  allowance: string
  tokenBalance: string
  stakedBalance: string
  earnings: string
}

export const fetchBondUserDataAsync = createAsyncThunk<BondUserDataResponse[], { account: string; bondIds: number[] }>(
  'bonds/fetchBondUserDataAsync',
  async ({ account, bondIds }) => {
    const { chainId } = useWeb3React()
    const bondsToFetch = bondsDict[chainId].filter((bondConfig) => bondIds.includes(bondConfig.bondId))
    const userBondAllowances = await fetchBondUserAllowances(chainId, account, bondsToFetch)
    const userBondTokenBalances = await fetchBondUserTokenBalances(chainId, account, bondsToFetch)
    const userStakedBalances = await fetchBondUserStakedBalances(chainId, account, bondsToFetch)
    const userBondEarnings = await fetchBondUserEarnings(chainId, account, bondsToFetch)

    return userBondAllowances.map((bondAllowance, index) => {
      return {
        bondId: bondsToFetch[index].bondId,
        allowance: userBondAllowances[index],
        tokenBalance: userBondTokenBalances[index],
        stakedBalance: userStakedBalances[index],
        earnings: userBondEarnings[index],
      }
    })
  },
)

export const bondsSlice = createSlice({
  name: 'Bonds',
  initialState: initialState(chainIdFromState), // TODO: make that more flexible
  reducers: {
    setLoadArchivedBondsData: (state, action) => {
      const loadArchivedBondsData = action.payload
      state.loadArchivedBondsData = loadArchivedBondsData
    },
  },
  extraReducers: (builder) => {
    // Update bonds with live data
    builder.addCase(fetchBondsPublicDataAsync.fulfilled, (state, action) => {
      state.data = state.data.map((bond) => {
        const liveBondData = action.payload.find((bondData) => bondData.bondId === bond.bondId)
        return { ...bond, ...liveBondData }
      })
    })

    // Update bonds with user data
    builder.addCase(fetchBondUserDataAsync.fulfilled, (state, action) => {
      action.payload.forEach((userDataEl) => {
        const { bondId } = userDataEl
        const index = state.data.findIndex((bond) => bond.bondId === bondId)
        state.data[index] = { ...state.data[index], userData: userDataEl }
      })
      state.userDataLoaded = true
    })
  },
})

// Actions
export const { setLoadArchivedBondsData } = bondsSlice.actions

export default bondsSlice.reducer
