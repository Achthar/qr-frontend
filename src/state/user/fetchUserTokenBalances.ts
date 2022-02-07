/** eslint no-empty-interface: 0 */
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import erc20Abi from 'config/abi/erc20.json'
import multicall from 'utils/multicall';
import { Fraction, JSBI, STABLECOINS, TokenAmount, WeightedPair, WETH, WRAPPED_NETWORK_TOKENS, Token } from '@requiemswap/sdk';
import { REQT, WBTC } from 'config/constants/tokens';
import { UserProps } from './types';




export function getMainTokens(chainId: number): Token[] {
    return [WRAPPED_NETWORK_TOKENS[chainId], REQT[chainId], WBTC[chainId], WETH[chainId]]
}

export function getStables(chainId: number): Token[] {
    return STABLECOINS[chainId]
}


export const fetchUserTokenBalances = createAsyncThunk(
    "user/fetchUserTokenBalances",
    async ({ chainId, account }: UserProps): Promise<{ [address: string]: string }> => {


        const allTokens = [...getMainTokens(chainId), ...getStables(chainId)]


        // cals for general bond data
        const calls = allTokens.map(
            function (token) {
                const obj = {
                    address: token.address,
                    name: 'balanceOf',
                    params: [account]
                }
                // do something with person
                return obj
            }
        )

        const balances = await multicall(chainId, erc20Abi, calls)

        return Object.assign(
            {}, ...allTokens.map(
                (token, index) => (
                    { [allTokens[index].address]: balances[index][0].toString() }
                )
            )
        );
    },
);