import { serializeToken } from 'state/user/hooks/helpers'
import { USDC, USDT, WBTC, WETH } from './tokens'

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
            address: '0xE817Fea2febC07001280750f9b6d78aDA0Bb6398',
            tokens: [
                serializeToken(WETH[42261]),
                serializeToken(WBTC[42261]),
                serializeToken(USDC[42261])
            ],
            balances: ['1', '1', '1'],
            lpAddress: '0x1FDc773CDeA6beb576AcF0CD58dd6f70732Fb098',
            lpToken: {
                chainId: 42261,
                decimals: 18,
                address: '0x1FDc773CDeA6beb576AcF0CD58dd6f70732Fb098',
                symbol: 'req4USD'
            },
            swapStorage: {
                tokenMultipliers: ['1', '10000000000', '1000000000000',],
                normalizedWeights: ['333333333333333333', '333333333333333333', '333333333333333334'],
                lpToken: '0x1FDc773CDeA6beb576AcF0CD58dd6f70732Fb098',
                fee: '1500000000000000',
                adminFee: '200000000000000000'
            }
        },
    ]

}