
/** eslint no-empty-interface: 0 */
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { ChainId, JSBI, Price, Token, TokenAmount, WeightedPair } from '@requiemswap/sdk'
import { DAI, REQT } from 'config/constants/tokens';
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
    try {
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

        const price = pair.priceOf(REQT[chainId])
        // only get marketPrice from eth mainnet
        marketPrice = JSBI.divide(JSBI.multiply(price.numerator, TEN_E_EIGHTEEN), price.denominator).toString()
    } catch (e) {
        marketPrice = null
    }

    return { marketPrice };
});

export const priceFromData = (token: Token, quoteToken: Token, weight0: any, weight1: any, reserve0: any, reserve1: any, fee: any): string => {
    let marketPrice;

    try {

        const tokenBeforeQToken = token.sortsBefore(quoteToken)
        // create pair object
        const pair = tokenBeforeQToken ? new WeightedPair(
            new TokenAmount(token, reserve0.toString() ?? 0),
            new TokenAmount(quoteToken, reserve1.toString() ?? 0),
            JSBI.BigInt(weight0),
            JSBI.BigInt(fee)
        )
            : new WeightedPair(
                new TokenAmount(quoteToken, reserve1.toString() ?? 0),
                new TokenAmount(token, reserve0.toString() ?? 0),
                JSBI.BigInt(weight1),
                JSBI.BigInt(fee)
            )

        // console.log("PPP", pair.priceOf(REQT[chainId]).toSignificant(10))
        const price = pair.priceOf(token)
        // only get marketPrice from eth mainnet
        marketPrice = JSBI.divide(JSBI.multiply(price.numerator, TEN_E_EIGHTEEN), price.denominator).toString() // 41432// await getMarketPrice({ chainId, provider });
        // let mainnetProvider = (marketPrice = await getMarketPrice({ 1: NetworkID, provider }));
        // console.log("MARKETPRICE:", marketPrice)
        // marketPrice /= 10 ** 9;
    } catch (e) {
        // console.log("LOAD FAILED")
        marketPrice = null // await getTokenPrice("olympus");
    }
    return marketPrice.toString()
}

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