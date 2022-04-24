import { Fraction } from "@requiemswap/sdk";
import { BigNumber } from "ethers";

export function bnParser(bn: BigNumber, decNr: BigNumber) {
    return Number(new Fraction(bn, decNr).toSignificant(18))
  }
  