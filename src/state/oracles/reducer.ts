import { createAsyncThunk, createReducer } from '@reduxjs/toolkit'
import { getAddress } from 'ethers/lib/utils'
import { SerializedBigNumber } from 'state/types'
import { getCallBondingDepositoryAddress } from 'utils/addressHelpers'
import multicall from 'utils/multicall'
import bondReserveAVAX from 'config/abi/avax/CallBondDepository.json'
import { OracleConfig, oracleConfig } from 'config/constants/oracles'



export interface OracleData extends OracleConfig {
  value?: SerializedBigNumber
  lasstUpdated?: number
}


export interface OracleState {
  referenceChainId: number,
  data: {
    [chainId: number]: {
      dataLoaded: boolean
      oracles: { [address: string]: OracleData }
    }
  }
}

const initialState = {
  referenceChainId: 43113,
  data: {
    43113: {
      dataLoaded: false,
      oracles: Object.assign({}, ...Object.keys(oracleConfig[43113]).map(k => {
        return {
          [getAddress(k)]: oracleConfig[43113][k]
        }
      })
      )
    }
  }
}


export const fetchOracleDataFromBond = createAsyncThunk<{ oracles: { [address: string]: OracleData } }, { chainId: number, oracleAddresses: string[] }>(
  'oracles/fetchOracleDataFromBond',
  async ({ chainId, oracleAddresses }) => {
    const addresses = oracleAddresses.map(ad => getAddress(ad))
    const callDepoAddress = getCallBondingDepositoryAddress(chainId)

    const oracleCalls = addresses.map(_orclAddr => {
      return {
        address: callDepoAddress,
        name: 'getLatestPriceData',
        params: [_orclAddr]
      }
    })


    const oracleRawData = await multicall(chainId, bondReserveAVAX, oracleCalls)

    return {
      oracles: Object.assign({}, ...addresses.map((adr, index) => {
        return {
          [getAddress(adr)]: {
            lastUpdated: Number(oracleRawData[index].updatedAt.toString()),
            value: oracleRawData[index].answer.toString()
          }
        }
      }))
    }

  },
)

export default createReducer<OracleState>(initialState, (builder) =>
  builder
    .addCase(fetchOracleDataFromBond.pending, state => {
      // state.data[state.referenceChainId].dataLoaded = false;
    })
    .addCase(fetchOracleDataFromBond.fulfilled, (state, action) => {
      const orcls = Object.keys(action.payload.oracles)
      for (let i = 0; i < orcls.length; i++) {
        state.data[state.referenceChainId].oracles[orcls[i]] = { ...state.data[state.referenceChainId].oracles[orcls[i]], ...action.payload.oracles[orcls[i]] }
        state.data[state.referenceChainId].dataLoaded = true
      }
    })
    .addCase(fetchOracleDataFromBond.rejected, (state, { error }) => {
      state.data[state.referenceChainId].dataLoaded = true;
      console.log(error, state)
      console.error(error.message);

    })
)
