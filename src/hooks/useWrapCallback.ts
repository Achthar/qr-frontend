import { Currency, currencyEquals,  WETH, WRAPPED_NETWORK_TOKENS, NETWORK_CCY } from '@requiemswap/sdk'
import { useMemo } from 'react'
import useActiveWeb3React from 'hooks/useActiveWeb3React'
import { tryParseAmount } from '../state/swapV3/hooks'
import { useTransactionAdder } from '../state/transactions/hooks'
import { useCurrencyBalance } from '../state/wallet/hooks'
import { useWETHContract } from './useContract'
import { useCallWithGasPrice } from './useCallWithGasPrice'

export enum WrapType {
  NOT_APPLICABLE,
  WRAP,
  UNWRAP,
}

const NOT_APPLICABLE = { wrapType: WrapType.NOT_APPLICABLE }
/**
 * Given the selected input and output currency, return a wrap callback
 * @param inputCurrency the selected input currency
 * @param outputCurrency the selected output currency
 * @param typedValue the user input value
 */
export default function useWrapCallback(
  inputCurrency: Currency | undefined,
  outputCurrency: Currency | undefined,
  typedValue: string | undefined,
): { wrapType: WrapType; execute?: undefined | (() => Promise<void>); inputError?: string } {
  const { chainId, account } = useActiveWeb3React()
  const { callWithGasPrice } = useCallWithGasPrice()
  const wethContract = useWETHContract()
  const balance = useCurrencyBalance(chainId, account ?? undefined, inputCurrency)
  // we can always parse the amount typed as the input currency, since wrapping is 1:1
  const inputAmount = useMemo(() => tryParseAmount(chainId, typedValue, inputCurrency), [chainId, inputCurrency, typedValue])
  const addTransaction = useTransactionAdder()

  return useMemo(() => {
    if (!wethContract || !chainId || !inputCurrency || !outputCurrency) return NOT_APPLICABLE

    const sufficientBalance = inputAmount && balance && !balance.lessThan(inputAmount)

    if (inputCurrency === NETWORK_CCY[chainId] && currencyEquals(WRAPPED_NETWORK_TOKENS[chainId], outputCurrency)) {
      return {
        wrapType: WrapType.WRAP,
        execute:
          sufficientBalance && inputAmount
            ? async () => {
              try {
                const txReceipt = await callWithGasPrice(wethContract, 'deposit', undefined, {
                  value: inputAmount.raw.toHexString(),
                })
                addTransaction(txReceipt, { summary: `Wrap ${inputAmount.toSignificant(6)} ${NETWORK_CCY[chainId].symbol} to ${WRAPPED_NETWORK_TOKENS[chainId].symbol}` })
              } catch (error: any) {
                console.error('Could not deposit', error)
              }
            }
            : undefined,
        inputError: sufficientBalance ? undefined : `Insufficient ${NETWORK_CCY[chainId].symbol} balance`,
      }
    }
    if (currencyEquals(WRAPPED_NETWORK_TOKENS[chainId], inputCurrency) && outputCurrency === NETWORK_CCY[chainId]) {
      return {
        wrapType: WrapType.UNWRAP,
        execute:
          sufficientBalance && inputAmount
            ? async () => {
              try {
                const txReceipt = await callWithGasPrice(wethContract, 'withdraw', [
                  inputAmount.raw.toHexString(),
                ])
                addTransaction(txReceipt, { summary: `Unwrap ${inputAmount.toSignificant(6)} ${WRAPPED_NETWORK_TOKENS[chainId].symbol} to ${NETWORK_CCY[chainId].symbol}` })
              } catch (error: any) {
                console.error('Could not withdraw', error)
              }
            }
            : undefined,
        inputError: sufficientBalance ? undefined : `Insufficient ${WRAPPED_NETWORK_TOKENS[chainId].symbol} balance`,
      }
    }
    return NOT_APPLICABLE
  }, [wethContract, chainId, inputCurrency, outputCurrency, inputAmount, balance, addTransaction, callWithGasPrice])
}
