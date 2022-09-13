import { createAsyncThunk, createReducer, createSlice } from '@reduxjs/toolkit'
import { getAddress } from 'ethers/lib/utils'
import { FALLBACK_CHAINID } from 'config/constants'
import { getDigitalBondingDepositoryAddress } from 'utils/addressHelpers'
import multicall from 'utils/multicall'
import bondReserveAVAX from 'config/abi/avax/CallBondDepository.json'
import bondReserveOasis from 'config/abi/oasis/bandOracle.json'
import { BandOracleConfig, BaseOracleConfig, ChainLinkOracleConfig, oracleConfig } from 'config/constants/oracles'
import { setChainIdOracles } from './actions'


export enum Oracle {
  ChainLink,
  Band
}


export interface OracleFetchedData {
  lastUpdated: number
  value: string
}

export interface OracleData extends BaseOracleConfig, OracleFetchedData {

}

export interface OracleState {
  referenceChainId: number
  chainLinkLoaded: boolean
  bandLoaded: boolean
  oracles: {
    [chainId: number]: {
      chainLink?: { [address: string]: OracleData }
      band?: { [assetQuote: string]: OracleData }
    }
  }
}

const initialState = (chainId: number): OracleState => {
  return {
    referenceChainId: chainId,
    chainLinkLoaded: false,
    bandLoaded: false,
    oracles: {
      43113: {
        chainLink: Object.assign({}, ...oracleConfig[43113].map(cfg => {
          const addr = getAddress(cfg.address)
          return {
            [addr]: {
              ...cfg,
              address: addr,
              value: '0',
              lastUpdated: 0
            }
          }
        })),
        band: {}
      },
      42261: {
        chainLink: {},
        band: Object.assign({}, ...oracleConfig[42261].map(cfg => {
          const addr = getAddress(cfg.address)
          return {
            [`${cfg.token}-${cfg.quote}`]: {
              ...cfg,
              address: addr,
              value: '0',
              lastUpdated: 0
            }
          }
        })),
      }
    }
  }
}


export const fetchChainLinkOracleDataFromBond = createAsyncThunk<{ oracles: { [key: string]: OracleFetchedData } }, { chainId: number, oracleAddresses: string[], oracleType: Oracle }>(
  'oracles/fetchChainLinkOracleDataFromBond',
  async ({ chainId, oracleAddresses, oracleType }) => {


    const callDepoAddress = getDigitalBondingDepositoryAddress(chainId)

    // works for chainLink only
    if (oracleType === Oracle.ChainLink) {
      const addresses = oracleAddresses.map(ad => getAddress(ad))
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
    }

    return { oracles: [] }
  },
)

interface CallParams {
  asset: string
  quote: string
}

export const fetchBandOracleData = createAsyncThunk<{ oracles: { [key: string]: OracleFetchedData } }, { chainId: number, oracleAddress: string, callParams: CallParams[], oracleType: Oracle }>(
  'oracles/fetchBandOracleData',
  async ({ chainId, oracleAddress, callParams, oracleType }) => {


    // band oracle case
    if (oracleType === Oracle.Band) {
      const oracleCalls = callParams.map(_param => {
        return {
          address: oracleAddress,
          name: 'getReferenceData',
          params: [_param.asset, _param.quote]
        }
      })

      const oracleRawData = await multicall(chainId, bondReserveOasis, oracleCalls)
      return {
        oracles: Object.assign({}, ...callParams.map((_param, index) => {
          return {
            [`${_param.asset}-${_param.quote}`]: {
              lastUpdated: Math.min(Number(oracleRawData[index][0].lastUpdatedBase.toString()), Number(oracleRawData[index][0].lastUpdatedQuote.toString())),
              value: oracleRawData[index][0].rate.toString()
            }
          }
        })
        )
      }
    }

    return { oracles: {} }
  },
)


const initialChainId = Number(process?.env?.REACT_APP_DEFAULT_CHAIN_ID ?? FALLBACK_CHAINID)

export const bondsSlice = createSlice({
  name: 'Oracles',
  initialState: initialState(initialChainId), // TODO: make that more flexible
  reducers: {
  },
  extraReducers: (builder) =>
    builder
      .addCase(fetchChainLinkOracleDataFromBond.pending, state => {
        // state.data[state.referenceChainId].dataLoaded = false;
      })
      .addCase(fetchChainLinkOracleDataFromBond.fulfilled, (state, action) => {
        const orcls = Object.keys(action.payload.oracles)
        for (let i = 0; i < orcls.length; i++) {
          state.oracles[action.meta.arg.chainId].chainLink[orcls[i]] = { ...state.oracles[action.meta.arg.chainId].chainLink[orcls[i]], ...action.payload.oracles[orcls[i]] }
          state.chainLinkLoaded = true
        }
      })
      .addCase(fetchChainLinkOracleDataFromBond.rejected, (state, { error }) => {
        state.chainLinkLoaded = true;
        console.log(error, state)
        console.error(error.message);
      })
      .addCase(fetchBandOracleData.pending, state => {
        // state.data[action.meta.arg.chainId].dataLoaded = false;
      })
      .addCase(fetchBandOracleData.fulfilled, (state, action) => {
        const orcls = Object.keys(action.payload.oracles)
        for (let i = 0; i < orcls.length; i++) {
          state.oracles[action.meta.arg.chainId].band[orcls[i]] = { ...state.oracles[action.meta.arg.chainId].band[orcls[i]], ...action.payload.oracles[orcls[i]] }
          state.bandLoaded = true
        }
      })
      .addCase(fetchBandOracleData.rejected, (state, { error }) => {
        state.bandLoaded = true;
        console.log(error, state)
        console.error(error.message);
      })
      .addCase(setChainIdOracles, (state, action) => {
        state.referenceChainId = action.payload.newChainId
        state = initialState(action.payload.newChainId)
        state.chainLinkLoaded = false
        state.bandLoaded = false
      })
}
)

export default bondsSlice.reducer
