
/** eslint no-empty-interface: 0 */
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { ChainId, Price, Token, TokenAmount, AmplifiedWeightedPair, getAmountOut } from '@requiemswap/sdk'
import { DAI, REQT } from 'config/constants/tokens';
import { BigNumber } from 'ethers';
import { getWeightedPairContract } from 'utils/contractHelpers';

const TEN_E_NINE = BigNumber.from('1000000000')
const TEN_E_EIGHTEEN = BigNumber.from('1000000000000000000')

export const TEN_ES: { [num: number]: BigNumber } = {
    6: BigNumber.from('1000000'),
    8: BigNumber.from('100000000'),
    9: BigNumber.from('1000000000'),
    10: BigNumber.from('10000000000'),
    11: BigNumber.from('100000000000'),
    12: BigNumber.from('1000000000000'),
    13: BigNumber.from('10000000000000'),
    18: BigNumber.from('1000000000000000000')
}
interface IBaseAsyncThunk {
    chainId: number
    provider: any
}
/**
 * - fetches the REQT price from CoinGecko (via getTokenPrice)
 * - falls back to fetch marketPrice from ohm-dai contract
 * - updates the App.slice when it runs
 */
// export const loadMarketPrice = createAsyncThunk("bond/loadMarketPrice", async ({ chainId, provider }: IBaseAsyncThunk) => {
//     let marketPrice;
//     try {
//         const address = AmplifiedWeightedPair.getAddress(REQT[chainId], DAI[chainId], BigNumber.from(80), BigNumber.from(25))
//         const relevantLpContract = getWeightedPairContract(address, provider)
//         const [_reserve0, _reserve1,] = await relevantLpContract.getReserves()
//         const reqtFirst = REQT[chainId].sortsBefore(DAI[chainId])
//         // create pair object
//         const pair = reqtFirst ? new AmplifiedWeightedPair(
//             new TokenAmount(REQT[chainId], _reserve0.toString() ?? 0),
//             new TokenAmount(DAI[chainId], _reserve1.toString() ?? 0),
//             BigNumber.from(80),
//             BigNumber.from(25),
//             BigNumber.from(10000)
//         )
//             : new AmplifiedWeightedPair(
//                 new TokenAmount(DAI[chainId], _reserve1.toString() ?? 0),
//                 new TokenAmount(REQT[chainId], _reserve0.toString() ?? 0),
//                 BigNumber.from(20),
//                 BigNumber.from(25)
//             )

//         const price = pair.priceOf(REQT[chainId])
//         // only get marketPrice from eth mainnet
//         marketPrice = JSBI.divide(JSBI.multiply(price.numerator, TEN_E_EIGHTEEN), price.denominator).toString()
//     } catch (e) {
//         marketPrice = null
//     }

//     return { marketPrice };
// });


// pricer for LP that are stored in a bond
// reserves are provided as read out from the blockchain (ordered by address)
export const priceFromData = (token: Token, quoteToken: Token, weightToken: any, weightQuoteToken: any, reserve0: any, reserve1: any, fee: any): string => {
    let marketPrice;
    try {
        const tokenIs0 = token.sortsBefore(quoteToken)
        // create pair object

        const price = tokenIs0 ? new Price(token, quoteToken, reserve0.mul(weightQuoteToken), reserve1.mul(weightToken)) :
            new Price(token, quoteToken, reserve1.mul(weightQuoteToken), reserve0.mul(weightToken))
        // only get marketPrice from eth mainnet
        marketPrice = price.numerator.mul(TEN_ES[quoteToken.decimals ?? 18]).div(price.denominator).toString() // 41432// await getMarketPrice({ chainId, provider });

    } catch (e) {
        marketPrice = null
    }
    return marketPrice.toString()
}

// export const findOrLoadMarketPrice = createAsyncThunk(
//     "bond/findOrLoadMarketPrice",
//     async ({ chainId, provider }: IBaseAsyncThunk, { dispatch, getState }) => {
//         const state: any = getState();
//         let marketPrice;
//         // check if we already have loaded market price
//         if (state.app.loadingMarketPrice === false && state.app.marketPrice) {
//             // go get marketPrice from app.state
//             // console.log("price from state")
//             marketPrice = state.app.marketPrice;
//         } else {
//             // we don't have marketPrice in app.state, so go get it
//             try {
//                 const originalPromiseResult = await dispatch(
//                     loadMarketPrice({ chainId, provider }),
//                 ).unwrap();
//                 marketPrice = originalPromiseResult?.marketPrice;
//                 // console.log("MP DISPAtCH", marketPrice)
//             } catch (rejectedValueOrSerializedError) {
//                 // handle error here
//                 console.error("Returned a null response from dispatch(loadMarketPrice)");
//                 return {};
//             }
//         }
//         return { marketPrice };
//     },
// );