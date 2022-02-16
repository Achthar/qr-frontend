import { ChainId, STABLECOINS } from '@requiemswap/sdk'
import { BigNumber } from 'ethers'
import { serializeToken } from 'state/user/hooks/helpers'
import { STABLES } from './tokens'

// we hard code this data as it only changes if
// the admin changes it manually via the contract itself
export const stableSwapInitialData: { [chainId: number]: any[] } = {
    43113: [
        {
            key: 0,
            address: '0x0Be60C571BdA7841D8F6eE68afDBa648EC710fD7',
            tokens: [
                serializeToken(STABLES[43113][0]),
                serializeToken(STABLES[43113][1]),
                serializeToken(STABLES[43113][2]),
                serializeToken(STABLES[43113][3])
            ],
            balances: ['1', '1', '1', '1'],
            lpAddress: '0x3372DE341A07418765Ae12f77aEe9029EaA4442A',
            lpToken: {
                chainId: 43113,
                decimals: 18,
                address: '0x3372DE341A07418765Ae12f77aEe9029EaA4442A',
                symbol: 'req4USD'
            },
            swapStorage: {
                tokenMultipliers: ['1000000000000', '1000000000000', '1', '1'],
                lpToken: '0x3372DE341A07418765Ae12f77aEe9029EaA4442A',
                fee: BigNumber.from('0x0f4240').toString(),
                adminFee: BigNumber.from('0x012a05f200').toString(),
                initialA: BigNumber.from('0xea60').toString(),
                futureA: BigNumber.from('0xea60').toString(),
                initialATime: BigNumber.from('0x00').toString(),
                futureATime: BigNumber.from('0x00').toString(),
                defaultWithdrawFee: BigNumber.from('0x02faf080').toString(),
            }
        },
    ],
    42261: [
        {
            key: 0,
            address: '0x2a90276992ddC21C3585FE50f5B43D0Cf62aDe03',
            tokens: [
                serializeToken(STABLES[42261][0]),
                serializeToken(STABLES[42261][1]),
                serializeToken(STABLES[42261][2]),
                serializeToken(STABLES[42261][3])
            ],
            balances: ['1', '1', '1', '1'],
            lpAddress: '0x9364E91ca784ca51f88dE2a76a35Ba2665bdad04',
            lpToken: {
                chainId: 42261,
                decimals: 18,
                address: '0x9364E91ca784ca51f88dE2a76a35Ba2665bdad04',
                symbol: 'req4USD'
            },
            swapStorage: {
                tokenMultipliers: ['1000000000000', '1000000000000', '1', '1'],
                lpToken: '0x9364E91ca784ca51f88dE2a76a35Ba2665bdad04',
                fee: BigNumber.from('0x0f4240').toString(),
                adminFee: BigNumber.from('0x012a05f200').toString(),
                initialA: BigNumber.from('0xea60').toString(),
                futureA: BigNumber.from('0xea60').toString(),
                initialATime: BigNumber.from('0x00').toString(),
                futureATime: BigNumber.from('0x00').toString(),
                defaultWithdrawFee: BigNumber.from('0x02faf080').toString(),
            }
        },
    ]

}