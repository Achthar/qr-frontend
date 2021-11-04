import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { useWeb3React } from '@web3-react/core'
import { farmList as farmsDict } from 'config/constants/farms'
import isArchivedPid from 'utils/farmHelpers'
import priceHelperLpsConfig from 'config/constants/priceHelperLps'
import { FarmConfig } from 'config/constants/types'
import { ChainId, chainIdToChainGroup } from 'config/index'
// import { useAppDispatch, useAppSelector } from 'state'
import fetchFarms from './fetchFarms'
import fetchFarmsPrices from './fetchFarmsPrices'
import {
  fetchFarmUserEarnings,
  fetchFarmUserAllowances,
  fetchFarmUserTokenBalances,
  fetchFarmUserStakedBalances,
} from './fetchFarmUser'
import { FarmsState, Farm } from '../types'

// import { chain } from 'lodash'

const chainIdFromState = 43113 // useAppSelector((state) => state.application.chainId)

function noAccountFarmConfig(chainId: number) {
  return farmsDict[chainId].map((farm) => ({
    ...farm,
    userData: {
      allowance: '0',
      tokenBalance: '0',
      stakedBalance: '0',
      earnings: '0',
    },
  }))
}

function initialState(chainId: number): FarmsState { return { data: noAccountFarmConfig(chainId), loadArchivedFarmsData: false, userDataLoaded: false } }

export function nonArchivedFarms(chainId: number): FarmConfig[] { return farmsDict[chainId ?? 43113].filter(({ pid }) => !isArchivedPid(pid)) }

// Async thunks
export const fetchFarmsPublicDataAsync = createAsyncThunk<Farm[], number[]>(
  'farms/fetchFarmsPublicDataAsync',
  async (pids) => {
    const { chainId } = useWeb3React()
    const farmsToFetch = farmsDict[chainId].filter((farmConfig) => pids.includes(farmConfig.pid))

    // Add price helper farms
    const farmsWithPriceHelpers = farmsToFetch.concat(priceHelperLpsConfig)

    const farms = await fetchFarms(chainId, farmsWithPriceHelpers)
    const farmsWithPrices = await fetchFarmsPrices(chainId, farms)

    // Filter out price helper LP config farms
    const farmsWithoutHelperLps = farmsWithPrices.filter((farm: Farm) => {
      return farm.pid || farm.pid === 0
    })

    return farmsWithoutHelperLps
  },
)

interface FarmUserDataResponse {
  pid: number
  allowance: string
  tokenBalance: string
  stakedBalance: string
  earnings: string
}

export const fetchFarmUserDataAsync = createAsyncThunk<FarmUserDataResponse[], { account: string; pids: number[] }>(
  'farms/fetchFarmUserDataAsync',
  async ({ account, pids }) => {
    const { chainId } = useWeb3React()
    const farmsToFetch = farmsDict[chainId].filter((farmConfig) => pids.includes(farmConfig.pid))
    const userFarmAllowances = await fetchFarmUserAllowances(chainId, account, farmsToFetch)
    const userFarmTokenBalances = await fetchFarmUserTokenBalances(chainId, account, farmsToFetch)
    const userStakedBalances = await fetchFarmUserStakedBalances(chainId, account, farmsToFetch)
    const userFarmEarnings = await fetchFarmUserEarnings(chainId, account, farmsToFetch)

    return userFarmAllowances.map((farmAllowance, index) => {
      return {
        pid: farmsToFetch[index].pid,
        allowance: userFarmAllowances[index],
        tokenBalance: userFarmTokenBalances[index],
        stakedBalance: userStakedBalances[index],
        earnings: userFarmEarnings[index],
      }
    })
  },
)

export const farmsSlice = createSlice({
  name: 'Farms',
  initialState: initialState(chainIdFromState), // TODO: make that more flexible
  reducers: {
    setLoadArchivedFarmsData: (state, action) => {
      const loadArchivedFarmsData = action.payload
      state.loadArchivedFarmsData = loadArchivedFarmsData
    },
  },
  extraReducers: (builder) => {
    // Update farms with live data
    builder.addCase(fetchFarmsPublicDataAsync.fulfilled, (state, action) => {
      state.data = state.data.map((farm) => {
        const liveFarmData = action.payload.find((farmData) => farmData.pid === farm.pid)
        return { ...farm, ...liveFarmData }
      })
    })

    // Update farms with user data
    builder.addCase(fetchFarmUserDataAsync.fulfilled, (state, action) => {
      action.payload.forEach((userDataEl) => {
        const { pid } = userDataEl
        const index = state.data.findIndex((farm) => farm.pid === pid)
        state.data[index] = { ...state.data[index], userData: userDataEl }
      })
      state.userDataLoaded = true
    })
  },
})

// Actions
export const { setLoadArchivedFarmsData } = farmsSlice.actions

export default farmsSlice.reducer
