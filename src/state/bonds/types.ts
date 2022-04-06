import { Bond } from "state/types";

export interface ICalcBondDetailsAsyncThunk {
    bond: Bond
    chainId: number
    provider: any
}