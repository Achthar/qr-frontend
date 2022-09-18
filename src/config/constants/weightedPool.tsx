import { serializeToken } from 'state/user/hooks/helpers'
import { DAI, USDC, USDT, WBTC, WETH } from './tokens'

// we hard code this data as it only changes if
// the admin changes it manually via the contract itself
export const weightedSwapInitialData: { [chainId: number]: any[] } = {
    43113: [
        {
            key: 0,
            name: 'req3Classic',
            address: '0x33eae5C8D1c634387de8BDB7db1251Ae1B2497A9',
            tokens: [
                serializeToken(WETH[43113]),
                serializeToken(WBTC[43113]),
                serializeToken(USDT[43113])
            ],
            balances: ['1', '1', '1'],
            lpAddress: '0xa63a39F656E0890857987Dfc0AEB90654Bc231B1',
            lpToken: {
                chainId: 43113,
                decimals: 18,
                address: '0xa63a39F656E0890857987Dfc0AEB90654Bc231B1',
                symbol: 'req4USD'
            },
            swapStorage: {
                tokenMultipliers: ['1', '10000000000', '1000000000000',],
                normalizedWeights: ['333333333333333333', '333333333333333333', '333333333333333334'],
                lpToken: '0xa63a39F656E0890857987Dfc0AEB90654Bc231B1',
                fee: '1500000000000000',
                adminFee: '200000000000000000'
            }
        },
    ],
    42261: [
        {
            key: 0,
            name: '3CryptoClassic',
            address: '0xb288d26a17aab729a64d8320836c2ea4794b3baf',
            tokens: [
                serializeToken(WETH[42261]),
                serializeToken(WBTC[42261]),
                serializeToken(USDT[42261])
            ],
            balances: ['1', '1', '1'],
            lpAddress: '0xb288d26a17aab729a64d8320836c2ea4794b3baf',
            lpToken: {
                chainId: 42261,
                decimals: 18,
                address: '0xb288d26a17aab729a64d8320836c2ea4794b3baf',
                symbol: 'req3USD'
            },
            swapStorage: {
                tokenMultipliers: ['1', '10000000000', '1000000000000',],
                normalizedWeights: ['333333333333333333', '333333333333333333', '333333333333333334'],
                lpToken: '0xb288d26a17aab729a64d8320836c2ea4794b3baf',
                fee: '1500000000000000',
                adminFee: '200000000000000000'
            }
        },
    ],
    18: [
        {
            key: 0,
            name: '3CryptoClassic',
            address: '0x7c2184b96ed6881ab49b238adbe6d905d7512bf5',
            tokens: [
                serializeToken(WETH[18]),
                serializeToken(WBTC[18]),
                serializeToken(USDC[18])
            ],
            balances: ['1', '1', '1'],
            lpAddress: '0x7c2184b96ed6881ab49b238adbe6d905d7512bf5',
            lpToken: {
                chainId: 18,
                decimals: 18,
                address: '0x7c2184b96ed6881ab49b238adbe6d905d7512bf5',
                symbol: 'req3USD'
            },
            swapStorage: {
                tokenMultipliers: ['1', '10000000000', '1000000000000',],
                normalizedWeights: ['333333333333333333', '333333333333333333', '333333333333333334'],
                lpToken: '0x7c2184b96ed6881ab49b238adbe6d905d7512bf5',
                fee: '1500000000000000',
                adminFee: '200000000000000000'
            }
        },
    ]

}