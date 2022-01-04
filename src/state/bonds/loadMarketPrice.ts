
/** eslint no-empty-interface: 0 */
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
// import { useNetworkState } from 'state/globalNetwork/hooks'
import { JsonRpcProvider, StaticJsonRpcProvider } from "@ethersproject/providers";
import { ChainId, JSBI, Price, TokenAmount, WeightedPair } from '@requiemswap/sdk'
import { useWeb3React } from '@web3-react/core'
// import { useReqtPrice } from 'hooks/usePrice';
import isArchivedBondId from 'utils/bondHelpers'
import { DAI, REQT } from 'config/constants/tokens';
import { bondList as bondsDict } from 'config/constants/bonds'
import { BondConfig } from 'config/constants/types'
import { getContractForBond, getContractForReserve, getBondCalculatorContract, getWeightedPairContract } from 'utils/contractHelpers';
import { IBaseAsyncThunk } from './bondTypes';

const TEN_E_NINE = JSBI.BigInt('1000000000')
const TEN_E_EIGHTEEN = JSBI.BigInt('1000000000000000000')

/**
 * - fetches the REQT price from CoinGecko (via getTokenPrice)
 * - falls back to fetch marketPrice from ohm-dai contract
 * - updates the App.slice when it runs
 */
export const loadMarketPrice = createAsyncThunk("bond/loadMarketPrice", async ({ chainId, provider }: IBaseAsyncThunk) => {
    let marketPrice;
    // console.log("LOAD PRICE")
    try {
        // const price = 0 // usePriceReqtUsd(chainId).toString()
        const address = WeightedPair.getAddress(REQT[chainId], DAI[chainId], JSBI.BigInt(80), JSBI.BigInt(25))
        const relevantLpContract = getWeightedPairContract(address, provider)
        const [_reserve0, _reserve1,] = await relevantLpContract.getReserves()
        const reqtFirst = REQT[chainId].sortsBefore(DAI[chainId])
        // create pair object
        const pair = reqtFirst ? new WeightedPair(
            new TokenAmount(REQT[chainId], _reserve0.toString() ?? 0),
            new TokenAmount(DAI[chainId], _reserve1.toString() ?? 0),
            JSBI.BigInt(80),
            JSBI.BigInt(25)
        )
            : new WeightedPair(
                new TokenAmount(DAI[chainId], _reserve1.toString() ?? 0),
                new TokenAmount(REQT[chainId], _reserve0.toString() ?? 0),
                JSBI.BigInt(20),
                JSBI.BigInt(25)
            )

        // console.log("PPP", pair.priceOf(REQT[chainId]).toSignificant(10))
        const price = pair.priceOf(REQT[chainId])
        // only get marketPrice from eth mainnet
        marketPrice = JSBI.divide(JSBI.multiply(price.numerator, TEN_E_EIGHTEEN), price.denominator).toString() // 41432// await getMarketPrice({ chainId, provider });
        // let mainnetProvider = (marketPrice = await getMarketPrice({ 1: NetworkID, provider }));
        // console.log("MARKETPRICE:", marketPrice)
        // marketPrice /= 10 ** 9;
    } catch (e) {
        // console.log("LOAD FAILED")
        marketPrice = null // await getTokenPrice("olympus");
    }
    return { marketPrice };
});

export const findOrLoadMarketPrice = createAsyncThunk(
    "bond/findOrLoadMarketPrice",
    async ({ chainId, provider }: IBaseAsyncThunk, { dispatch, getState }) => {
        const state: any = getState();
        let marketPrice;
        // check if we already have loaded market price
        if (state.app.loadingMarketPrice === false && state.app.marketPrice) {
            // go get marketPrice from app.state
            // console.log("price from state")
            marketPrice = state.app.marketPrice;
        } else {
            // we don't have marketPrice in app.state, so go get it
            try {
                const originalPromiseResult = await dispatch(
                    loadMarketPrice({ chainId, provider }),
                ).unwrap();
                marketPrice = originalPromiseResult?.marketPrice;
                // console.log("MP DISPAtCH", marketPrice)
            } catch (rejectedValueOrSerializedError) {
                // handle error here
                console.error("Returned a null response from dispatch(loadMarketPrice)");
                return {};
            }
        }
        return { marketPrice };
    },
);