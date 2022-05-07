import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "state";
import { setChainId } from "state/globalNetwork/actions";
import { useNetworkState } from "state/globalNetwork/hooks";
import { changeChainIdStables } from "state/stablePools/actions";
import { changeChainId } from "state/user/actions";
import { changeChainIdWeighted } from "state/weightedPairs/actions";

const supportedChains = [43113]

// sets the chainId if provided by web3
export function useChainIdHandling(chainIdWeb3: number, account: string) {
    const { chainId } = useNetworkState()
    const dispatch = useDispatch<AppDispatch>()
    useEffect(() => {
        if (chainIdWeb3 && chainId !== chainIdWeb3 && supportedChains.includes(chainIdWeb3) && account) {
            dispatch(setChainId({ chainId: chainIdWeb3 }))
            dispatch(changeChainId({ newChainId: chainIdWeb3 }))
            dispatch(changeChainIdWeighted({ newChainId: chainIdWeb3 }))
            dispatch(changeChainIdStables({ newChainId: chainIdWeb3 }))
        }
    },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [dispatch, chainId, chainIdWeb3, account]
    )
}