/** eslint no-empty-interface: 0 */
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import erc20Abi from 'config/abi/erc20.json'
import multicall from 'utils/multicall';
import { Fraction, JSBI, STABLECOINS, TokenAmount, WeightedPair, WRAPPED_NETWORK_TOKENS, Token } from '@requiemswap/sdk';
import { WETH, REQT, WBTC } from 'config/constants/tokens';
import { SerializedToken } from 'config/constants/types';
import { UserProps } from './types';


export function getMainTokens(chainId: number): Token[] {
    return [WRAPPED_NETWORK_TOKENS[chainId], REQT[chainId], WBTC[chainId], WETH[chainId]]
}

export function getStables(chainId: number): Token[] {
    return STABLECOINS[chainId]
}

export const fetchUserTokenBalances = createAsyncThunk(
    "user/fetchUserTokenBalances",
    async ({ chainId, account, additionalTokens }: UserProps): Promise<{ [address: string]: string }> => {

        const allTokensAddresses = additionalTokens ? [
            ...getMainTokens(chainId).map(token => token.address),
            ...getStables(chainId).map(token => token.address),
            ...additionalTokens.map(token => token.address)
        ] : [
            ...getMainTokens(chainId).map(token => token.address),
            ...getStables(chainId).map(token => token.address)
        ]



        // cals for general bond data
        const calls = allTokensAddresses.map(
            function (tokenAddress) {
                const obj = {
                    address: tokenAddress,
                    name: 'balanceOf',
                    params: [account]
                }
                // do something with person
                return obj
            }
        )

        const balances = await multicall(chainId, erc20Abi, calls)

        return Object.assign(
            {}, ...allTokensAddresses.map(
                (token, index) => (
                    { [allTokensAddresses[index]]: balances[index][0].toString() }
                )
            )
        );
    },
);