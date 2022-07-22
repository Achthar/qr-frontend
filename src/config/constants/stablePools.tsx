import { ChainId, STABLECOINS } from '@requiemswap/sdk'
import { BigNumber } from 'ethers'
import { serializeToken } from 'state/user/hooks/helpers'
import { BUSD, STABLES, USDC, USDT } from './tokens'

// we hard code this data as it only changes if
// the admin changes it manually via the contract itself
export const stableSwapInitialData: { [chainId: number]: any[] } = {
    43113: [
        {
            key: 0,
            address: '0xCB44176D91067c6819C35094159c825BEFf7Dc92',
            name: 'req4USD',
            tokens: [
                serializeToken(STABLES[43113][0]),
                serializeToken(STABLES[43113][1]),
                serializeToken(STABLES[43113][2]),
                serializeToken(STABLES[43113][3])
            ],
            balances: ['1', '1', '1', '1'],
            lpAddress: '0x99674285c50CdB86AE423aac9be7917d7D054994',
            lpToken: {
                chainId: 43113,
                decimals: 18,
                address: '0x99674285c50CdB86AE423aac9be7917d7D054994',
                symbol: 'req4USD'
            },
            swapStorage: {
                tokenMultipliers: ['1000000000000', '1000000000000', '1', '1'],
                lpToken: '0x99674285c50CdB86AE423aac9be7917d7D054994',
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
            address: '0x90B7174ee0680d339dc4becfEDdfA19F40Af20B8',
            name: 'req3USD',
            tokens: [
                serializeToken(USDC[42261]),
                serializeToken(USDT[42261]),
                serializeToken(BUSD[42261])
            ],
            balances: ['1', '1', '1'],
            lpAddress: '0xc1876F6B14dC9ce6481Cf35782aCc5Bee3F63b22',
            lpToken: {
                chainId: 42261,
                decimals: 18,
                address: '0xc1876F6B14dC9ce6481Cf35782aCc5Bee3F63b22',
                symbol: 'req3USD'
            },
            swapStorage: {
                tokenMultipliers: ['1000000000000', '1000000000000', '1'],
                lpToken: '0xc1876F6B14dC9ce6481Cf35782aCc5Bee3F63b22',
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