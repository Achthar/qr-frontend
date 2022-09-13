import { DigitalBond, Bond, CallableBond } from "state/types";

export interface ICalcBondDetailsAsyncThunk {
    bond: Bond
    chainId: number
    provider: any
}

export interface ICalcCallBondDetailsAsyncThunk {
    bond: DigitalBond
    chainId: number
    provider: any
}

export interface ICalcCallableBondDetailsAsyncThunk {
    bond: CallableBond
    chainId: number
    provider: any
}