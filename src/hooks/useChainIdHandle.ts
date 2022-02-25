import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "state";
import { setChainId } from "state/globalNetwork/actions";
import { useNetworkState } from "state/globalNetwork/hooks";

// sets the chainId if provided by web3
export function useChainIdHandling(chainIdWeb3: number) {
    const { chainId } = useNetworkState()
    const dispatch = useDispatch<AppDispatch>()
    useEffect(() => {
        if (chainIdWeb3) {
            dispatch(setChainId({ chainId: chainIdWeb3 }))
        }
    }, [dispatch, chainId, chainIdWeb3])
}