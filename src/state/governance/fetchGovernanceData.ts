/** eslint no-empty-interface: 0 */
import { createAsyncThunk } from '@reduxjs/toolkit'
import { ethers, BigNumber } from 'ethers'
import multicall from 'utils/multicall';
import redRequiemAvax from 'config/abi/avax/BloodRedRequiem.json'
import { Fraction, JSBI, TokenAmount, WeightedPair } from '@requiemswap/sdk';
import { getRedRequiemAddress, getRedRequiemStakingAddress } from 'utils/addressHelpers';
import { SerializedBigNumber } from 'state/types';


const E_NINE = BigNumber.from('1000000000')
const E_EIGHTEEN = BigNumber.from('1000000000000000000')


export function bnParser(bn: BigNumber, decNr: BigNumber) {
  return Number((new Fraction(JSBI.BigInt(bn.toString()), JSBI.BigInt(decNr.toString()))).toSignificant(18))
}

export interface GovernanceUserRequest {
  chainId: number
  account: string
}

export interface GovernanceLock {
  amount: SerializedBigNumber
  end: number
  minted: SerializedBigNumber
  multiplier: SerializedBigNumber
}

export interface GovernanceUserResponse {
  locks: { [end: number]: GovernanceLock }
  balance: SerializedBigNumber
  allowance: SerializedBigNumber
  staked: SerializedBigNumber

}
export const fetchGovernanceData = createAsyncThunk(
  "bonds/fetchGovernanceData",
  async ({ chainId, account }: GovernanceUserRequest): Promise<GovernanceUserResponse> => {

    const redRequiemAddress = getRedRequiemAddress(chainId)
    const redRequiemStakingAddress = getRedRequiemStakingAddress(chainId)

    console.log("RED REQ CALLS inp", account, redRequiemAddress, redRequiemStakingAddress)
    // calls for general bond data
    const calls = [
      // locked data user
      {
        address: redRequiemAddress,
        name: 'get_locks',
        params: [account]
      },
      // userBalance
      {
        address: redRequiemAddress,
        name: 'balanceOf',
        params: [account]
      },
      // allowance
      {
        address: redRequiemAddress,
        name: 'allowance',
        params: [account, redRequiemStakingAddress]
      },
      // userBalance
      {
        address: redRequiemAddress,
        name: 'balanceOf',
        params: [redRequiemStakingAddress]
      },
    ]

    console.log("RED REQ CALLS", calls)

    const [locks, balance, allowance, staked] =
      await multicall(chainId, redRequiemAvax, calls)

    console.log("Red req", locks)

    return {
      locks: Object.assign(
        {}, ...locks._balances.map((data) => {
          return {
            [Number(data.end.toString())]: {
              amount: data.amount.toString(),
              end: Number(data.end.toString()),
              minted: data.minted.toString(),
              multiplier: data.votingPower.toString()
            }
          }
        }))
      ,
      balance: balance.toString(),
      allowance: allowance.toString(),
      staked: staked.toString()
    };
  },
);