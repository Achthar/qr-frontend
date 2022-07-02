/** eslint no-empty-interface: 0 */
/* eslint no-continue: 0 */
import { createAsyncThunk } from '@reduxjs/toolkit'
import { getAddress } from 'ethers/lib/utils';
import multicall from 'utils/multicall';
import formulaABI from 'config/abi/avax/RequiemFormula.json'
import weightedPairABI from 'config/abi/avax/RequiemWeightedPair.json'
import { BigNumber } from 'ethers';
import { REQUIEM_WEIGHTED_FORMULA_ADDRESS, FACTORY_ADDRESS, PAIR_FORMULA, SWAP_ROUTER } from 'config/constants';
import { Fraction } from '@requiemswap/sdk';
import { SerializedWeightedPair, WeightedPairMetaData } from '../types'

const TEN = BigNumber.from(10)

const pricePair = (reserve0: string, reserve1: string, dec0: number, dec1: number, weight0: number): { price0: number, price1: number, value0: number, value1: number } => {

  // multipliers to convert BigNumbers
  const multiplier0 = TEN.pow(dec0)
  const multiplier1 = TEN.pow(dec1)

  const scalar = new Fraction(multiplier1, multiplier0)
  // fraction of reserves
  const fraction = new Fraction(reserve0, reserve1)

  const fraction1 = new Fraction(
    reserve1,
    TEN.pow(dec1))

  const fraction0 = new Fraction(
    reserve0,
    TEN.pow(dec0))

  // price rate token0/token1
  const price0 = Number(fraction.multiply(scalar).toSignificant(18)) * (100 - weight0) / weight0
  // price rate token1/token0
  const price1 = Number(fraction.multiply(scalar).invert().toSignificant(18)) * weight0 / (100 - weight0)

  return {
    price0,
    price1,
    // value in token0
    value0: Number(fraction0.toSignificant(18)) + Number(fraction1.toSignificant(18)) * price0,
    // value in token1
    value1: Number(fraction1.toSignificant(18)) + Number(fraction0.toSignificant(18)) * price1
  }
}



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
        address: getAddress(PAIR_FORMULA[chainId]),
        name: 'getFactoryPairData',
        params: [
          FACTORY_ADDRESS[chainId],
          address
        ]
      }
    })
    // returns {
    // address token0,
    // address token1,
    // uint32 tokenWeight0,
    // uint32 tokenWeight1,
    // uint32 swapFee,
    // uint32 amp,
    // IWeightedPair.ReserveData memory reserveData }

    const rawData = await multicall(chainId, formulaABI, calls)

    return Object.assign(
      {}, ...sortedKeys.map(
        (key, index) => {
          const dataIndex = indexAt(dataPoints, index)
          return (
            {
              [key]: Object.assign(
                {}, ...pairMetaData[key].map((data, subIndex) => {
                  const prices = pricePair(
                    rawData[dataIndex + subIndex].reserveData.vReserve0.toString(),
                    rawData[dataIndex + subIndex].reserveData.vReserve1.toString(),
                    pairMetaData[key][0].token0.decimals,
                    pairMetaData[key][0].token1.decimals,
                    rawData[dataIndex + subIndex].tokenWeight0
                  )
                  return {
                    [`${rawData[dataIndex + subIndex].tokenWeight0}`]: {
                      ...data,
                      reserve0: rawData[dataIndex + subIndex].reserveData.reserve0.toString(),
                      reserve1: rawData[dataIndex + subIndex].reserveData.reserve1.toString(),
                      vReserve0: rawData[dataIndex + subIndex].reserveData.vReserve0.toString(),
                      vReserve1: rawData[dataIndex + subIndex].reserveData.vReserve1.toString(),
                      weight0: rawData[dataIndex + subIndex].tokenWeight0,
                      fee: rawData[dataIndex + subIndex].swapFee,
                      amp: rawData[dataIndex + subIndex].amp,
                      ...prices
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
        params: [account, SWAP_ROUTER[chainId]]
      }
    })

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

    return returnDict

  }
);



// for a provided list of token pairs the function returns a dictionary with the addresses of the
// tokens in the pairs as keys and arrays of addresses as values
export const refreshWeightedPairReserves = createAsyncThunk(
  "weightedPairs/refreshWeightedPairReserves",
  async ({ chainId, pairMetaData: pairData }: PairRequestMetaData): Promise<{ [pastedAddresses: string]: SerializedWeightedPair[] }> => {
    const dataPoints = Object.keys(pairData).map(key => pairData[key].length)
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

    const dataPoints = Object.keys(pairData).map(key => pairData[key].length)

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