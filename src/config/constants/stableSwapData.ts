import { BigNumber } from "ethers"

// we hard code this data as it only changes if
// the admin changes it manually via the contract itself
export const swapStorageData = {
    43113: {
        "lpToken": '0xDf65aC8079A71f5174A35dE3D29e5458d03D5787',
        "fee": BigNumber.from('0x0f4240'),
        "adminFee": BigNumber.from('0x012a05f200'),
        "initialA": BigNumber.from('0xea60'),
        "futureA": BigNumber.from('0xea60'),
        "initialATime": BigNumber.from('0x00'),
        "futureATime": BigNumber.from('0x00'),
        "defaultWithdrawFee": BigNumber.from('0x02faf080'),
    }
}