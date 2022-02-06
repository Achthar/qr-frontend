/** eslint no-empty-interface: 0 */
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { getMulticallContract } from 'utils/contractHelpers'
import { UserProps } from './types';


export const fetchUserNetworkCcyBalanceBalances = createAsyncThunk(
    "userBalances/fetchUserNetworkCcyBalanceBalances",
    async ({ chainId, account }: UserProps, { dispatch }): Promise<{ networkCcyBalance: string }> => {

        const multicallContract = getMulticallContract(chainId)

        const networkCcyBalance = await multicallContract.getEthBalance(account)

        return { networkCcyBalance: networkCcyBalance.toString() }
    },
);