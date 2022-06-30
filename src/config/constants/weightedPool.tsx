import { ChainId, STABLECOINS } from '@requiemswap/sdk'
import { BigNumber } from 'ethers'
import { serializeToken } from 'state/user/hooks/helpers'
import { STABLES, USDT, WBTC, WETH } from './tokens'

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
        // {
        //     key: 0,
        //     address: '0x2a90276992ddC21C3585FE50f5B43D0Cf62aDe03',
        //     tokens: [
        //         serializeToken(STABLES[42261][0]),
        //         serializeToken(STABLES[42261][1]),
        //         serializeToken(STABLES[42261][2]),
        //         serializeToken(STABLES[42261][3])
        //     ],
        //     balances: ['1', '1', '1', '1'],
        //     lpAddress: '0x9364E91ca784ca51f88dE2a76a35Ba2665bdad04',
        //     lpToken: {
        //         chainId: 42261,
        //         decimals: 18,
        //         address: '0x9364E91ca784ca51f88dE2a76a35Ba2665bdad04',
        //         symbol: 'req4USD'
        //     },
        //     swapStorage: {
        //         tokenMultipliers: ['1000000000000', '1000000000000', '1', '1'],
        //         normalizedWeights: ['333333333333333333', '333333333333333333', '333333333333333334'],
        //         lpToken: '0x9364E91ca784ca51f88dE2a76a35Ba2665bdad04',
        //         fee: BigNumber.from('0x0f4240').toString(),
        //         adminFee: BigNumber.from('0x012a05f200').toString(),
        //         initialA: BigNumber.from('0xea60').toString(),
        //         futureA: BigNumber.from('0xea60').toString(),
        //         initialATime: BigNumber.from('0x00').toString(),
        //         futureATime: BigNumber.from('0x00').toString(),
        //         defaultWithdrawFee: BigNumber.from('0x02faf080').toString(),
        //     }
        // },
    ]

}