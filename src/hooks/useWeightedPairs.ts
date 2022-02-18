import { TokenAmount, WeightedPair, Currency, WEIGHTED_FACTORY_ADDRESS, Token } from '@requiemswap/sdk'
import { useMemo } from 'react'
import RequiemPairABI from 'config/abi/avax/RequiemWeightedPair.json'
import { Interface } from '@ethersproject/abi'
// import { useNetworkState } from 'state/globalNetwork/hooks'
import JSBI from 'jsbi'
import { DAI, REQT } from 'config/constants/tokens'
import { useBlock } from 'state/block/hooks'
import { useMultipleContractSingleData, useSingleContractMultipleData } from 'state/multicall/hooks'
import { useWeightedFactoryContract, useWeightedFormulaContract } from './useContract'
import { wrappedCurrency } from '../utils/wrappedCurrency'
// import { getWeightedPairFactory } from '../utils/contractHelpers'



const PAIR_INTERFACE = new Interface(RequiemPairABI)

export enum WeightedPairState {
  LOADING,
  NOT_EXISTS,
  EXISTS,
  INVALID,
}

export function useWeightedPairs(
  chainId: number,
  currencies: [Currency | undefined, Currency | undefined][],
  weightA?: number[],
  fee?: number[]
): [WeightedPairState, WeightedPair | null][] {

  // const { chainId } = useNetworkState()

  const tokens = useMemo(
    () =>
      currencies.map(([currencyA, currencyB]) => [
        wrappedCurrency(currencyA, chainId),
        wrappedCurrency(currencyB, chainId),
      ]),
    [chainId, currencies],
  )

  const pairAddresses = useMemo(
    () =>
      tokens.map(([tokenA, tokenB], i) => {
        // console.log("addresses in memo", WeightedPair.getAddress(tokenA, tokenB, JSBI.BigInt(weightA[i]), JSBI.BigInt(fee)))
        return tokenA && tokenB && !tokenA.equals(tokenB) ? WeightedPair.getAddress(tokenA, tokenB, JSBI.BigInt(weightA[i]), JSBI.BigInt(fee[i])) : undefined
      }),
    [tokens, weightA, fee],
  )
      console.log("WPA PA", pairAddresses)
  const results = useMultipleContractSingleData(chainId, pairAddresses, PAIR_INTERFACE, 'getReserves')
console.log("WPA results", results)
  return useMemo(() => {
    return results.map((result, i) => {

      const { result: reserves, loading } = result
      const tokenA = tokens[i][0]
      const tokenB = tokens[i][1]

      if (loading) return [WeightedPairState.LOADING, null]
      if (!tokenA || !tokenB || tokenA.equals(tokenB)) return [WeightedPairState.INVALID, null]
      if (!reserves) return [WeightedPairState.NOT_EXISTS, null]
      const { _reserve0: reserve0, _reserve1: reserve1 } = reserves
      const [token0, token1] = tokenA.sortsBefore(tokenB) ? [tokenA, tokenB] : [tokenB, tokenA]
      const weight0 = tokenA.sortsBefore(tokenB) ? JSBI.BigInt(weightA[i]) : JSBI.BigInt(100 - weightA[i])
      return [
        WeightedPairState.EXISTS,
        new WeightedPair(new TokenAmount(token0, reserve0.toString()), new TokenAmount(token1, reserve1.toString()), weight0, JSBI.BigInt(fee[i])),
      ]
    })
  }, [results, tokens, weightA, fee])
}

export function useWeightedPair(chainId: number, tokenA?: Currency, tokenB?: Currency, weightA?: number, fee?: number): [WeightedPairState, WeightedPair | null] {
  
  return useWeightedPairs(chainId, [[tokenA, tokenB]], [weightA], [fee])[0]
}

// a function that checks whether the address exists on the specified chain using the factory contract
export function useWeightedPairsExist(chainId: number, addresses: string[], blocksPerFetch: number): { [address: string]: number } {
  const factoryContract = useWeightedFactoryContract(chainId)
  const results = useSingleContractMultipleData(chainId, factoryContract, 'isPair', addresses.map(adr => [adr]),
    //  useBlock, 
    { blocksPerFetch })

  return useMemo(() => {
    return Object.assign({}, ...results.map((result, i) => {
      const { result: exists, loading } = result
      if (loading) return { [addresses[i]]: 0 }
      if (!exists[0]) return { [addresses[i]]: 2 }
      return { [addresses[i]]: 1 }
    }))
  }, [results, addresses])
}

// gets weighted pair address list for povided token pairs
export function useGetWeightedPairs(currencies: [Currency | undefined, Currency | undefined][], chainId: number): [WeightedPairState, string[] | null][] {

  const tokens = useMemo(
    () =>
      currencies.map(([currencyA, currencyB]) => [
        wrappedCurrency(currencyA, chainId),
        wrappedCurrency(currencyB, chainId),
      ]),
    [chainId, currencies],
  )
  const factoryContract = useWeightedFactoryContract(chainId)

  // gets pair contract addresses for alls constellations with the provided tokens
  const resultsPairs = useSingleContractMultipleData(
    chainId,
    factoryContract,
    'getPairs',
    tokens.map(tokenPair => [tokenPair[0]?.address ?? REQT[chainId].address, tokenPair[1]?.address ?? DAI[chainId].address]),
    // useBlock
  )

  return useMemo(() => {
    return resultsPairs.map((result) => {

      const { result: resultLocal, loading } = result
      // console.log("res local", resultLocal)
      if (loading) return [WeightedPairState.LOADING, null]
      if (!resultLocal) return [WeightedPairState.INVALID, null]
      if (resultLocal[0].length === 0) return [WeightedPairState.INVALID, null]
      return [
        WeightedPairState.EXISTS,
        resultLocal[0],
      ]
    })
  }, [resultsPairs])
}

// for a list of tokenAs, pair addresses, we fetch the weighted pair list
export function useWeightedPairsData(tokens: [Token, Token][], pairAddresses: string[], chainId: number, blocksPerFetch: number): [WeightedPairState, WeightedPair | null][] {

  const formulaContract = useWeightedFormulaContract(chainId)

  const results = useSingleContractMultipleData(
    chainId,
    formulaContract,
    'getFactoryReserveAndWeights', // arguments: factory, pair, tokenA, 
    tokens.map((tokenPair, index) => [WEIGHTED_FACTORY_ADDRESS[chainId],
    pairAddresses?.[index] ?? '0x6F21d456E5832E0b35C2C09a610DBa691E8Fb684',
    tokenPair[0]?.address ?? '0x6f21d456e5832e0b35c2c09a610dba691e8fb684'],
      { blocksPerFetch }
    ),
    // useBlock,
  )
  // console.log("FORMULA", results)
  // returns:
  // address tokenB,
  // uint256 reserveA,
  // uint256 reserveB,
  // uint32 tokenWeightA,
  // uint32 tokenWeightB,
  // uint32 swapFee

  return useMemo(() => {
    return results.map((result, i) => {

      const { result: data, loading } = result
      const tokenA = tokens[i][0]
      const tokenB = tokens[i][1]

      if (loading) return [WeightedPairState.LOADING, null]
      if (!tokenA || !tokenB || tokenA.equals(tokenB)) return [WeightedPairState.INVALID, null]
      if (!data) return [WeightedPairState.NOT_EXISTS, null]
      const { reserveA, reserveB, swapFee, tokenB: tokenBAddress, tokenWeightA, tokenWeightB } = data

      const [token0, token1] = tokenA.sortsBefore(tokenB) ? [tokenA, tokenB] : [tokenB, tokenA]
      const weight0 = tokenA.sortsBefore(tokenB) ? JSBI.BigInt(tokenWeightA) : JSBI.BigInt(tokenWeightB)
      const [reserve0, reserve1] = tokenA.sortsBefore(tokenB) ? [reserveA, reserveB] : [reserveB, reserveA]

      return [
        WeightedPairState.EXISTS,
        new WeightedPair(new TokenAmount(token0, reserve0.toString()), new TokenAmount(token1, reserve1.toString()), weight0, JSBI.BigInt(swapFee)),
      ]
    })
  }, [results, tokens])
}



// for a list of tokenAs, pair addresses, we fetch the weighted pair list
// assumes that all pair data exists
export function useWeightedPairsDataLite(
  tokens: [Token, Token][],
  pairAddresses: string[],
  chainId: number
): [WeightedPairState, WeightedPair | null][] {

  const factoryContract = useWeightedFactoryContract(chainId)

  // gets pair contract addresses for alls constellations with the provided tokens
  const resultsStatic = useSingleContractMultipleData(
    chainId,
    factoryContract,
    'getWeightsAndSwapFee',
    pairAddresses?.map(address => [address ?? '0x6f21d456e5832e0b35c2c09a610dba691e8fb684']) ?? [['0x6f21d456e5832e0b35c2c09a610dba691e8fb684']],
    // useBlock,

    // { blocksPerFetch: 1 }
  )


  const resultsReserves = useMultipleContractSingleData(chainId, pairAddresses, PAIR_INTERFACE, 'getReserves',
    // useBlock
  )
  // returns:
  // address tokenB,
  // uint256 reserveA,
  // uint256 reserveB,
  // uint32 tokenWeightA,
  // uint32 tokenWeightB,
  // uint32 swapFee

  return useMemo(() => {
    return resultsStatic.map((result, i) => {

      const { result: data, loading } = result
      if (loading) return [WeightedPairState.LOADING, null]
      if (resultsReserves[i] === undefined) return [WeightedPairState.LOADING, null]
      const { result: dataReserves, loading: loadingReserves } = resultsReserves[i]
      const tokenA = tokens[i][0]
      const tokenB = tokens[i][1]

      if (loading || loadingReserves) return [WeightedPairState.LOADING, null]
      if (!tokenA || !tokenB || tokenA.equals(tokenB)) return [WeightedPairState.INVALID, null]
      if (!data || !dataReserves) return [WeightedPairState.NOT_EXISTS, null]

      const { tokenWeight0, tokenWeight1, swapFee } = data
      const { _reserve0: reserve0, _reserve1: reserve1 } = dataReserves

      const [token0, token1] = tokenA.sortsBefore(tokenB) ? [tokenA, tokenB] : [tokenB, tokenA]
      // const weight0 = tokenA.sortsBefore(tokenB) ? JSBI.BigInt(tokenWeightA) : JSBI.BigInt(tokenWeightB)
      // const [reserve0, reserve1] = tokenA.sortsBefore(tokenB) ? [reserveA, reserveB] : [reserveB, reserveA]

      return [
        WeightedPairState.EXISTS,
        new WeightedPair(new TokenAmount(token0, reserve0.toString()), new TokenAmount(token1, reserve1.toString()), JSBI.BigInt(tokenWeight0), JSBI.BigInt(swapFee)),
      ]
    })
  }, [resultsStatic, resultsReserves, tokens])
}