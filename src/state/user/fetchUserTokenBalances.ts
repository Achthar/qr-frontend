/** eslint no-empty-interface: 0 */
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import erc20Abi from 'config/abi/erc20.json'
import multicall from 'utils/multicall';
import { STABLECOINS, WRAPPED_NETWORK_TOKENS, Token } from '@requiemswap/sdk';
import { WETH, REQT, WBTC, GREQ, ABREQ, SREQ, LINK } from 'config/constants/tokens';
import { SerializedToken } from 'config/constants/types';
import { SWAP_ROUTER } from 'config/constants';
import { UserProps } from './types';


export function getMainTokens(chainId: number): Token[] {
    return chainId === 43113 ? [WRAPPED_NETWORK_TOKENS[chainId], ABREQ[chainId], SREQ[chainId], GREQ[chainId], REQT[chainId], WBTC[chainId], WETH[chainId], LINK[chainId]] :
        [WRAPPED_NETWORK_TOKENS[chainId], REQT[chainId], WBTC[chainId], WETH[chainId]]
}

export function getStables(chainId: number): Token[] {
    return STABLECOINS[chainId]
}

export interface UserTokenDataResponse {
    balance: string
    allowanceRouter: string
    allowancePairManager: string
}

export const fetchUserTokenData = createAsyncThunk(
    "user/fetchUserTokenData",
    async ({ chainId, account, additionalTokens }: UserProps): Promise<{ data: { [address: string]: UserTokenDataResponse }, chainId: number }> => {

        const allTokensAddresses = additionalTokens ? [
            ...getMainTokens(chainId).map(token => token.address),
            ...getStables(chainId).map(token => token.address),
            ...additionalTokens.map(token => token.address)
        ] : [
            ...getMainTokens(chainId).map(token => token.address),
            ...getStables(chainId).map(token => token.address)
        ]



        // cals for balance
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

        // cals for Router Allowance
        const callsAllowanceRouter = allTokensAddresses.map(
            function (tokenAddress) {
                const objR = {
                    address: tokenAddress,
                    name: 'allowance',
                    params: [account, SWAP_ROUTER[chainId]]
                }
                // do something with person
                return objR
            }
        )


        // cals for Router Allowance
        const callsAllowancePairManager = allTokensAddresses.map(
            function (tokenAddress) {
                const objP = {
                    address: tokenAddress,
                    name: 'allowance',
                    params: [account, SWAP_ROUTER[chainId]]
                }
                // do something with person
                return objP
            }
        )

        const rawData = await multicall(chainId, erc20Abi, [...calls, ...callsAllowanceRouter, ...callsAllowancePairManager])

        const sliceLength = calls.length
        const balances = rawData.slice(0, sliceLength).map((s) => {
            return s.toString()
        })

        const allowanceRouter = rawData.slice(sliceLength, 2 * sliceLength).map((b) => {
            return b.toString()
        })

        const allowancePairManager = rawData.slice(2 * sliceLength, 3 * sliceLength).map((a) => {
            return a.toString()
        })

        return {
            data: Object.assign(
                {}, ...allTokensAddresses.map(
                    (token, index) => (
                        {
                            [allTokensAddresses[index]]: {
                                balance: balances[index],
                                allowanceRouter: allowanceRouter[index],
                                allowancePairManager: allowancePairManager[index],
                            }
                        }
                    )
                )
            ),
            chainId
        }
    },
);