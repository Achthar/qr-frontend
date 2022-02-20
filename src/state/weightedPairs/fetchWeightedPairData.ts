/** eslint no-empty-interface: 0 */
/* eslint no-continue: 0 */
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { ethers, BigNumber, BigNumberish } from 'ethers'
import { getAddress } from 'ethers/lib/utils';
import multicall from 'utils/multicall';
import formulaABI from 'config/abi/avax/RequiemFormula.json'
import weightedPairABI from 'config/abi/avax/RequiemWeightedPair.json'
import { REQUIEM_PAIR_MANAGER, REQUIEM_WEIGHTED_FORMULA_ADDRESS } from 'config/constants';
import { BondType, SerializedToken, TokenPair } from 'config/constants/types';
import { Fraction, JSBI, TokenAmount, WeightedPair, WEIGHTED_FACTORY_ADDRESS } from '@requiemswap/sdk';
import { SerializedWeightedPair, WeightedPairMetaData } from '../types'


const indexAt = (dataPoints: number[], index) => {
  let sum = 0
  if (index === 0)
    return 0
  for (let j = 0; j <= index; j++) {
    sum += dataPoints[j]
  }
  return sum - 1
}


interface PairRequestMetaData {
  chainId: number,
  pairMetaData: { [addresses: string]: WeightedPairMetaData[] }
}

// for a provided list of token pairs the function returns a dictionary with the addresses of the
// tokens in the pairs as keys and arrays of addresses as values
export const fetchWeightedPairData = createAsyncThunk(
  "weightedPairs/fetchWeightedPairData",
  async ({ chainId, pairMetaData }: PairRequestMetaData): Promise<{ [pastedAddresses: string]: { [weight0Fee: string]: SerializedWeightedPair } }> => {
    console.log("WP: INPUT DATA", pairMetaData)

    // // cals for existing pool addresses
    let pairAddresses = []
    let tokenAAddresses = []
    const sortedKeys = Object.keys(pairMetaData).sort()
    const dataPoints = sortedKeys.map(key => pairMetaData[key].length)
    for (let i = 0; i < sortedKeys.length; i++) {
      const key = sortedKeys[i]
      pairAddresses = [...pairAddresses, ...pairMetaData[key].map(x => x.address)]
      tokenAAddresses = [...tokenAAddresses, ...pairMetaData[key].map(x => key.split('-', 1)[0])]
    }
    const calls = pairAddresses.map((address, index) => {
      return {
        address: getAddress(REQUIEM_WEIGHTED_FORMULA_ADDRESS[chainId]),
        name: 'getFactoryReserveAndWeights',
        params: [
          WEIGHTED_FACTORY_ADDRESS[chainId],
          address,
          tokenAAddresses[index]
        ]
      }
    })
    console.log("WP D CALLS", calls, dataPoints)
    const rawData = await multicall(chainId, formulaABI, calls)
    console.log("WP: RAWREG DATA", rawData)
    return Object.assign(
      {}, ...sortedKeys.map(
        (key, index) => {
          const dataIndex = indexAt(dataPoints, index)
          return (
            {
              [key]: Object.assign(
                {}, ...pairMetaData[key].map((data, subIndex) => {
                  return {
                    [`${rawData[dataIndex + subIndex].tokenWeightA}-${rawData[dataIndex + subIndex].swapFee}`]: {
                      ...data,
                      reserve0: rawData[dataIndex + subIndex].reserveA.toString(),
                      reserve1: rawData[dataIndex + subIndex].reserveB.toString(),
                      weight0: rawData[dataIndex + subIndex].tokenWeightA,
                      fee: rawData[dataIndex + subIndex].swapFee
                    }
                  }
                }
                ))
            }
          )
        }
      )
    );
  }
);



const dictToArray = (dict: { [pastedAddresses: string]: { [weight0Fee: string]: any } }) => {
  let res = []
  const orderedFirstLvKeys = Object.keys(dict).sort()
  for (let i = 0; i < orderedFirstLvKeys.length; i++) {
    const key = orderedFirstLvKeys[i]
    const orderedSecondLvKeys = Object.keys(dict[key]).sort()
    for (let j = 0; j < orderedSecondLvKeys.length; i++) {
      const key1 = orderedSecondLvKeys[j]
      res = [...res, dict[key][key1]]
    }
  }
  return res
}

interface PairAddress {
  address: string
}
/**
 * Function to fetch user data
 */
interface PairRequestUserData {
  chainId: number,
  account?: string,
  pairData: { [addresses: string]: { [key: string]: PairAddress } }
}

export const reduceDataFromDict = (pairData: { [pastedAddresses: string]: { [weight0Fee: string]: SerializedWeightedPair } }) => {

  const sortedKeys = Object.keys(pairData).sort()

  const reducedDict = {}
  for (let i = 0; i < sortedKeys.length; i++) {

    const key = sortedKeys[i]
    // sometimes these entries can be empty, we skip them
    // if (!pairData[key])
    //   continue;

    reducedDict[key] = {}
    const sortedPairDataKeys = Object.keys(pairData[key]).sort()
    for (let j = 0; j < sortedPairDataKeys.length; j++) {
      const key1 = sortedPairDataKeys[j]
      reducedDict[key][key1] = { address: pairData[key][key1].address }
    }
  }
  return reducedDict
}

// for a provided list of token pairs the function returns a dictionary with the addresses of the
// tokens in the pairs as keys and arrays of addresses as values
export const fetchWeightedPairUserData = createAsyncThunk(
  "weightedPairs/fetchWeightedPairUserData",
  async ({ chainId, account, pairData }: PairRequestUserData): Promise<{ [addresses: string]: { [key: string]: SerializedWeightedPair } }> => {
    console.log("WPRS: DU INPUT DATA USER", pairData)

    // // cals for existing pool addresses

    const sortedKeys = Object.keys(pairData).sort()

    const pairAddresses = []
    for (let i = 0; i < sortedKeys.length; i++) {

      const key = sortedKeys[i]
      const sortedPairDataKeys = Object.keys(pairData[key]).sort()
      for (let j = 0; j < sortedPairDataKeys.length; j++) {
        const key1 = sortedPairDataKeys[j]
        pairAddresses.push(pairData[key][key1].address)
      }
    }



    const callsSupply = pairAddresses.map((addr) => {
      return {
        address: addr,
        name: 'totalSupply',
        params: []
      }
    })

    const callsBalance = pairAddresses.map((addr) => {
      return {
        address: addr,
        name: 'balanceOf',
        params: [account]
      }
    })

    const callsAllowancePm = pairAddresses.map((addr) => {
      return {
        address: addr,
        name: 'allowance',
        params: [account, REQUIEM_PAIR_MANAGER[chainId]]
      }
    })
    console.log("WPRS CALLS", [...callsSupply, ...callsBalance, ...callsAllowancePm])
    const rawData = await multicall(chainId, weightedPairABI, [...callsSupply, ...callsBalance, ...callsAllowancePm])

    const sliceLength = callsSupply.length
    const supply = rawData.slice(0, sliceLength).map((s) => {
      return s.toString()
    })

    const balances = rawData.slice(sliceLength, 2 * sliceLength).map((b) => {
      return b.toString()
    })

    const allowance = rawData.slice(2 * sliceLength, 3 * sliceLength).map((a) => {
      return a.toString()
    })
    console.log("WPRS: RAWUSER DATA", rawData, supply, balances, allowance)
    const returnDict = {}
    for (let i = 0; i < sortedKeys.length; i++) {

      const key = sortedKeys[i]
      const sortedPairDataKeys = Object.keys(pairData[key]).sort()
      if (sortedPairDataKeys.length > 0)
        returnDict[key] = {}
      for (let j = 0; j < sortedPairDataKeys.length; j++) {

        const keyLv2 = sortedPairDataKeys[j]
        returnDict[key][keyLv2] = {
          totalSupply: supply[i + j]?.toString(),
          userData: {
            allowancePairManager: allowance[i + j]?.toString(),
            balance: balances[i + j]?.toString()
          }
        }

      }
    }
    console.log("WP PD", returnDict)
    return returnDict

  }
);



// for a provided list of token pairs the function returns a dictionary with the addresses of the
// tokens in the pairs as keys and arrays of addresses as values
export const refreshWeightedPairReserves = createAsyncThunk(
  "weightedPairs/refreshWeightedPairReserves",
  async ({ chainId, pairMetaData: pairData }: PairRequestMetaData): Promise<{ [pastedAddresses: string]: SerializedWeightedPair[] }> => {
    console.log("WPRS: INPUT DATA", pairData)
    const dataPoints = Object.keys(pairData).map(key => pairData[key].length)
    console.log("WPRS: DP", dataPoints)
    // // cals for existing pool addresses
    let pairAddresses = []
    let tokenAAddresses = []
    for (let i = 0; i < Object.keys(pairData).length; i++) {
      const key = Object.keys(pairData)[i]
      pairAddresses = [...pairAddresses, ...pairData[key].map(x => x.address)]
      tokenAAddresses = [...tokenAAddresses, ...pairData[key].map(x => key.split('-', 1)[0])]
    }
    const calls = pairAddresses.map((address, index) => {
      return {
        address,
        name: 'getReserves'
      }
    })

    const rawData = await multicall(chainId, weightedPairABI, calls)

    console.log("WPRS: RAWMETA DATA", rawData, Object.keys(pairData).map((k, i) => { return indexAt(dataPoints, i) }))
    return Object.assign(
      {}, ...Object.keys(pairData).map(
        (key, index) => {
          const dataIndex = indexAt(dataPoints, index)
          return (
            {
              [key]: pairData[key].map((data, subIndex) => {
                return {
                  ...data,
                  reserve0: rawData[dataIndex + subIndex].reserve0.toString(),
                  reserve1: rawData[dataIndex + subIndex].reserve1.toString(),
                }
              }
              ),

            }
          )
        }
      )
    );

  }
);


// for a provided list of token pairs the function returns a dictionary with the addresses of the
// tokens in the pairs as keys and arrays of addresses as values
export const fetchWeightedPairReserves = createAsyncThunk(
  "weightedPairs/fetchWeightedPairSupplyBalancesAndAllowance",
  async ({ chainId, pairMetaData: pairData }: PairRequestMetaData): Promise<{ [pastedAddresses: string]: SerializedWeightedPair[] }> => {
    console.log("WP: INPUT DATA", pairData)
    const dataPoints = Object.keys(pairData).map(key => pairData[key].length)
    console.log("WP: DP", dataPoints)
    // // cals for existing pool addresses
    let pairAddresses = []
    let tokenAAddresses = []
    for (let i = 0; i < Object.keys(pairData).length; i++) {
      const key = Object.keys(pairData)[i]
      pairAddresses = [...pairAddresses, ...pairData[key].map(x => x.address)]
      tokenAAddresses = [...tokenAAddresses, ...pairData[key].map(x => key.split('-', 1)[0])]
    }
    const callsReserves = pairAddresses.map((address, index) => {
      return {
        address: getAddress(REQUIEM_WEIGHTED_FORMULA_ADDRESS[chainId]),
        name: 'getReserves'
      }
    })

    const callsSupply = pairAddresses.map((address, index) => {
      return {
        address: getAddress(REQUIEM_WEIGHTED_FORMULA_ADDRESS[chainId]),
        name: 'totalSupply',
      }
    })


    const rawData = await multicall(chainId, weightedPairABI, [...callsReserves, ...callsSupply])


    console.log("WP: RAWMETA DATA", rawData, Object.keys(pairData).map((k, i) => { return indexAt(dataPoints, i) }))
    return Object.assign(
      {}, ...Object.keys(pairData).map(
        (key, index) => {
          const dataIndex = indexAt(dataPoints, index)
          return (
            {
              [key]: pairData[key].map((data, subIndex) => {
                return {
                  ...data,
                  reserve0: rawData[dataIndex + subIndex].reserveA.toString(),
                  reserve1: rawData[dataIndex + subIndex].reserveB.toString(),
                }
              }
              ),

            }
          )
        }
      )
    );

  }
);