import { StablePool, WeightedPool } from "@requiemswap/sdk"
import { useStablePools } from "state/stablePools/hooks"
import { SerializedStablePool, SerializedWeightedPool, WeightedPairMetaData } from "state/types"
import { useWeightedPairsState } from "state/weightedPairs/hooks"
import { useWeightedPools } from "state/weightedPools/hooks"


export function useTradeRefreshData(chainId: number): {
    weightedPools: SerializedWeightedPool[],
    stablePools: SerializedStablePool[],
    pairsMeta: { [pastedAddresses: string]: WeightedPairMetaData[] }
} {
    const { pools: stables } = useStablePools(chainId)
    const { pools: weighteds } = useWeightedPools(chainId)

    const {
        weightedPairMeta,
    } = useWeightedPairsState(chainId)

    return {
        weightedPools: weighteds,
        stablePools: stables,
        pairsMeta: weightedPairMeta
    }

}