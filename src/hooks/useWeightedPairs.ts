import { TokenAmount, WeightedPair, Currency, Token } from '@requiemswap/sdk'
import { useMemo } from 'react'
import RequiemPairABI from 'config/abi/avax/RequiemPair.json'
import { Interface } from '@ethersproject/abi'
import { useNetworkState } from 'state/globalNetwork/hooks'
import JSBI from 'jsbi'
import { useWeightedFactoryContract } from './useContract'
import { useMultipleContractSingleData, useSingleContractMultipleData } from '../state/multicall/hooks'
import { wrappedCurrency } from '../utils/wrappedCurrency'


const PAIR_INTERFACE = new Interface(RequiemPairABI)

export enum WeightedPairState {
  LOADING,
  NOT_EXISTS,
  EXISTS,
  INVALID,
}

export function useWeightedPairs(currencies: [Currency | undefined, Currency | undefined][], weightA?: number[], fee?: number[]): [WeightedPairState, WeightedPair | null][] {
  const { chainId } = useNetworkState()

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
        // console.log("addresses in memo", WeightedPair.getAddress(tokenA, tokenB, JSBI.BigInt(weight0), JSBI.BigInt(fee)))
        return tokenA && tokenB && !tokenA.equals(tokenB) ? WeightedPair.getAddress(tokenA, tokenB, JSBI.BigInt(weightA[i]), JSBI.BigInt(fee[i])) : undefined
      }),
    [tokens, weightA, fee],
  )

  const results = useMultipleContractSingleData(pairAddresses, PAIR_INTERFACE, 'getReserves')

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

export function useWeightedPair(tokenA?: Currency, tokenB?: Currency, weightA?: number, fee?: number): [WeightedPairState, WeightedPair | null] {
  return useWeightedPairs([[tokenA, tokenB]], [weightA], [fee])[0]
}

// a function that checks whether the address exists on the specified chain using the factory contract
export function useWeightedPairsExist(chainId: number, addresses: string[], blocksPerFetch: number): { [address: string]: number } {
  const factoryContract = useWeightedFactoryContract(chainId)
  const results = useSingleContractMultipleData(factoryContract, 'isPair', addresses.map(adr => [adr]), { blocksPerFetch })

  return useMemo(() => {
    return Object.assign({}, ...results.map((result, i) => {
      const { result: exists, loading } = result
      if (loading) return { [addresses[i]]: 0 }
      if (!exists[0]) return { [addresses[i]]: 2 }
      return { [addresses[i]]: 1 }
    }))
  }, [results, addresses])
}

