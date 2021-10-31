import React, { useCallback, useMemo, useState } from 'react'
import styled from 'styled-components'
import { splitSignature } from '@ethersproject/bytes'
import { Contract } from '@ethersproject/contracts'
import { TransactionResponse } from '@ethersproject/providers'
import {
  Percent,
  Price,
  Token,
  STABLE_POOL_LP_ADDRESS,
  TokenAmount,
  STABLES_INDEX_MAP,
  STABLE_POOL_ADDRESS,
  Currency,
} from '@requiemswap/sdk'
import {
  Button,
  Text,
  AddIcon,
  ArrowDownIcon,
  CardBody,
  Slider,
  Box,
  Flex,
  useModal,
  ButtonMenu,
  ButtonMenuItem,
  TabMenu,
  Tab,
  Table,
  Th,
  Td,
} from '@requiemswap/uikit'
import { RouteComponentProps } from 'react-router'
import { BigNumber } from '@ethersproject/bignumber'
import { useTranslation } from 'contexts/Localization'
import tokens from 'config/constants/tokens'
import { useTokenBalancesWithLoadingIndicator } from 'state/wallet/hooks'
import CurrencyInputPanel from 'components/CurrencyInputPanel'
import Row from 'components/Row'
import SingleStableInputPanel from 'components/CurrencyInputPanel/SingleStableInputPanel'
import Page from '../Page'
import { AutoColumn, ColumnCenter } from '../../components/Layout/Column'
import TransactionConfirmationModal, { ConfirmationModalContent } from '../../components/TransactionConfirmationModal'
import CurrencyInputPanelStable from '../../components/CurrencyInputPanel/CurrencyInputPanelStable'
import { MinimalStablesPositionCard } from '../../components/PositionCard/StablesPosition'
import { AppHeader, AppBody } from '../../components/App'
import { RowBetween, RowFixed } from '../../components/Layout/Row'
import ConnectWalletButton from '../../components/ConnectWalletButton'
import { LightGreyCard } from '../../components/Card'
import { CurrencyLogo, DoubleCurrencyLogo } from '../../components/Logo'
import { ROUTER_ADDRESS } from '../../config/constants'
import useActiveWeb3React from '../../hooks/useActiveWeb3React'
import { useStableLPContract } from '../../hooks/useContract'
import useTransactionDeadline from '../../hooks/useTransactionDeadline'

import { useTransactionAdder } from '../../state/transactions/hooks'
import StyledInternalLink from '../../components/Links'
import { calculateGasMargin, calculateSlippageAmount, getStableRouterContract } from '../../utils'
import { currencyId } from '../../utils/currencyId'
import useDebouncedChangeHandler from '../../hooks/useDebouncedChangeHandler'
import { wrappedCurrency } from '../../utils/wrappedCurrency'
import { useApproveCallback, ApprovalState } from '../../hooks/useApproveCallback'
import Dots from '../../components/Loader/Dots'
import {
  useBurnStablesActionHandlers,
  useDerivedBurnStablesInfo,
  useBurnStableState,
} from '../../state/burnStables/hooks'

import { StablesField } from '../../state/burnStables/actions'
import { useGasPrice, useUserSlippageTolerance } from '../../state/user/hooks'

// const function getStableIndex(token)

const BorderCard = styled.div`
  border: solid 3px ${({ theme }) => theme.colors.cardBorder};
  border-radius: 16px;
  padding: 16px;
`

export default function RemoveLiquidity({
  history,
}: RouteComponentProps<{ currencyIdA: string; currencyIdB: string }>) {
  const { account, chainId, library } = useActiveWeb3React()

  const { t } = useTranslation()
  const gasPrice = useGasPrice(chainId)

  // burn state
  const {
    independentStablesField,
    typedValue1,
    typedValue2,
    typedValue3,
    typedValue4,
    typedValueLiquidity,
    calculatedSingleValues,
    typedValueSingle,
  } = useBurnStableState()

  const { stablePool, parsedAmounts, error, calculatedValuesFormatted } = useDerivedBurnStablesInfo()

  const {
    // onField1Input: _onField1Input,
    // onField2Input: _onField2Input,
    // onField3Input: _onField3Input,
    // onField4Input: _onField4Input,
    onField1Input,
    onField2Input,
    onField3Input,
    onField4Input,
    onLpInput, // : _onLpInput,
    onLpInputSetOthers,
    onField1CalcInput,
    onField2CalcInput,
    onField3CalcInput,
    onField4CalcInput,
  } = useBurnStablesActionHandlers()

  const isValid = !error

  // modal and loading
  const enum StableRemovalState {
    BY_LP,
    BY_TOKENS,
    BY_SINGLE_TOKEN,
  }

  const LiquidityStateButtonWrapper = styled.div`
    margin-bottom: 5px;
  `

  const [stableRemovalState, setStableRemovalState] = useState<StableRemovalState>(StableRemovalState.BY_LP)

  const handleClick = (newIndex: StableRemovalState) => setStableRemovalState(newIndex)

  // map for the selection panel in redemption versus the single stable
  const stableSelectMap = {
    43113: {
      USDC: 0,
      USDT: 1,
      DAI: 2,
      TUSD: 4,
    },
  }

  const [stableSelectState, setStableSelectState] = useState<number>(0)

  const handleSelectClick = (newIndex: number) => setStableSelectState(newIndex)

  const [attemptingTxn, setAttemptingTxn] = useState(false) // clicked confirm

  // txn values
  const [txHash, setTxHash] = useState<string>('')
  const deadline = useTransactionDeadline(chainId)
  const [allowedSlippage] = useUserSlippageTolerance()

  const formattedAmounts = {
    [StablesField.LIQUIDITY_PERCENT]: parsedAmounts[StablesField.LIQUIDITY_PERCENT].equalTo('0')
      ? '0'
      : parsedAmounts[StablesField.LIQUIDITY_PERCENT].lessThan(new Percent('1', '100'))
      ? '<1'
      : parsedAmounts[StablesField.LIQUIDITY_PERCENT].toFixed(0),
    [StablesField.LIQUIDITY]:
      independentStablesField === StablesField.LIQUIDITY
        ? typedValueLiquidity
        : parsedAmounts[StablesField.LIQUIDITY]?.toSignificant(6) ?? '',
    [StablesField.CURRENCY_1]:
      independentStablesField === StablesField.CURRENCY_1
        ? typedValue1
        : parsedAmounts[StablesField.CURRENCY_1]?.toSignificant(6) ?? '',
    [StablesField.CURRENCY_2]:
      independentStablesField === StablesField.CURRENCY_2
        ? typedValue2
        : parsedAmounts[StablesField.CURRENCY_2]?.toSignificant(6) ?? '',
    [StablesField.CURRENCY_3]:
      independentStablesField === StablesField.CURRENCY_3
        ? typedValue3
        : parsedAmounts[StablesField.CURRENCY_3]?.toSignificant(6) ?? '',
    [StablesField.CURRENCY_4]:
      independentStablesField === StablesField.CURRENCY_4
        ? typedValue4
        : parsedAmounts[StablesField.CURRENCY_4]?.toSignificant(6) ?? '',
  }

  const atMaxAmount = parsedAmounts[StablesField.LIQUIDITY_PERCENT]?.equalTo(new Percent('1'))

  // pair contract
  const stableLpContract: Contract | null = useStableLPContract(stablePool?.liquidityToken?.address)

  const userPoolBalance = new TokenAmount(
    new Token(chainId, STABLE_POOL_LP_ADDRESS[chainId ?? 43113], 18, 'RequiemStable-LP', 'Requiem StableSwap LPs'),
    BigNumber.from(0).toBigInt(),
  )

  // allowance handling
  const [signatureData, setSignatureData] = useState<{ v: number; r: string; s: string; deadline: number } | null>(null)

  const amountstoRemove = [
    parsedAmounts[StablesField.CURRENCY_1],
    parsedAmounts[StablesField.CURRENCY_2],
    parsedAmounts[StablesField.CURRENCY_3],
    parsedAmounts[StablesField.CURRENCY_4],
  ]

  const priceMatrix = []
  if (stablePool !== null)
    for (let i = 0; i < Object.values(stablePool?.tokens).length; i++) {
      priceMatrix.push([])
      for (let j = 0; j < Object.values(stablePool?.tokens).length; j++) {
        if (i !== j && amountstoRemove[j] !== undefined) {
          priceMatrix?.[i].push(
            new Price(
              stablePool?.tokens[i],
              stablePool?.tokens[j],
              stablePool.calculateSwap(j, i, amountstoRemove[j].toBigNumber()).toBigInt(),
              amountstoRemove[j].raw,
            ),
          )
        } else {
          priceMatrix?.[i].push(undefined)
        }
      }
    }

  // // wrapped onUserInput to clear signatures
  // const onField1Input = useCallback(
  //   (field: StablesField, value: string) => {
  //     setSignatureData(null)
  //     return _onField1Input(field, value)
  //   },
  //   [_onField1Input],
  // )

  // const onField2Input = useCallback(
  //   (field: StablesField, value: string) => {
  //     setSignatureData(null)
  //     return _onField2Input(field, value)
  //   },
  //   [_onField2Input],
  // )

  // const onField3Input = useCallback(
  //   (field: StablesField, value: string) => {
  //     setSignatureData(null)
  //     return _onField3Input(field, value)
  //   },
  //   [_onField3Input],
  // )

  // const onField4Input = useCallback(
  //   (field: StablesField, value: string) => {
  //     setSignatureData(null)
  //     return _onField4Input(field, value)
  //   },
  //   [_onField4Input],
  // )

  // const onLpInput = useCallback(
  //   (field: StablesField, value: string) => {
  //     setSignatureData(null)
  //     return _onLpInput(field, value)
  //   },
  //   [_onLpInput],
  // )
  // tx sending
  const addTransaction = useTransactionAdder()

  const [approval, approveCallback] = useApproveCallback(
    chainId,
    parsedAmounts[StablesField.LIQUIDITY],
    STABLE_POOL_ADDRESS[chainId],
  )

  // function for removing stable swap liquidity
  // REmoval with LP amount as input
  async function onStablesLpRemove() {
    if (!chainId || !library || !account || !deadline) throw new Error('missing dependencies')
    const {
      [StablesField.CURRENCY_1]: currencyAmount1,
      [StablesField.CURRENCY_2]: currencyAmount2,
      [StablesField.CURRENCY_3]: currencyAmount3,
      [StablesField.CURRENCY_4]: currencyAmount4,
    } = parsedAmounts
    if (!currencyAmount1 || !currencyAmount2 || !currencyAmount3 || !currencyAmount4) {
      throw new Error('missing currency amounts')
    }
    const router = getStableRouterContract(chainId, library, account)

    // we take the first results (lower ones) since we want to receive a minimum amount of tokens
    const amountsMin = {
      [StablesField.CURRENCY_1]: calculateSlippageAmount(currencyAmount1, allowedSlippage)[0],
      [StablesField.CURRENCY_2]: calculateSlippageAmount(currencyAmount2, allowedSlippage)[0],
      [StablesField.CURRENCY_3]: calculateSlippageAmount(currencyAmount3, allowedSlippage)[0],
      [StablesField.CURRENCY_4]: calculateSlippageAmount(currencyAmount4, allowedSlippage)[0],
    }

    const liquidityAmount = parsedAmounts[StablesField.LIQUIDITY]
    if (!liquidityAmount) throw new Error('missing liquidity amount')

    let methodNames: string[]
    let args: Array<string | string[] | number | boolean | BigNumber | BigNumber[]>
    // we have approval, use normal remove liquidity
    if (approval === ApprovalState.APPROVED) {
      methodNames = ['removeLiquidity']
      args = [
        liquidityAmount.toBigNumber(),
        [
          BigNumber.from(amountsMin[StablesField.CURRENCY_1].toString()),
          BigNumber.from(amountsMin[StablesField.CURRENCY_2].toString()),
          BigNumber.from(amountsMin[StablesField.CURRENCY_3].toString()),
          BigNumber.from(amountsMin[StablesField.CURRENCY_4].toString()),
        ],
        deadline,
      ]
    } else {
      throw new Error('Attempting to confirm without approval or a signature. Please contact support.')
    }

    const safeGasEstimates: (BigNumber | undefined)[] = await Promise.all(
      methodNames.map((methodName) =>
        router.estimateGas[methodName](...args)
          .then(calculateGasMargin)
          .catch((err) => {
            console.error(`estimateGas failed`, methodName, args, err)
            return undefined
          }),
      ),
    )

    const indexOfSuccessfulEstimation = safeGasEstimates.findIndex((safeGasEstimate) =>
      BigNumber.isBigNumber(safeGasEstimate),
    )

    // all estimations failed...
    if (indexOfSuccessfulEstimation === -1) {
      console.error('This transaction would fail. Please contact support.')
    } else {
      const methodName = methodNames[indexOfSuccessfulEstimation]
      const safeGasEstimate = safeGasEstimates[indexOfSuccessfulEstimation]

      setAttemptingTxn(true)
      await router[methodName](...args, {
        gasLimit: safeGasEstimate,
        gasPrice,
      })
        .then((response: TransactionResponse) => {
          setAttemptingTxn(false)

          addTransaction(response, {
            summary: `Remove ${parsedAmounts[StablesField.CURRENCY_1]?.toSignificant(3)} ${
              stablePool?.tokens[0].symbol
            }, ${parsedAmounts[StablesField.CURRENCY_2]?.toSignificant(3)} ${
              stablePool?.tokens[1].symbol
            }, ${parsedAmounts[StablesField.CURRENCY_3]?.toSignificant(3)} ${
              stablePool?.tokens[2].symbol
            } and ${parsedAmounts[StablesField.CURRENCY_4]?.toSignificant(3)} ${
              stablePool?.tokens[3].symbol
            } from Requiem Stable Swap`,
          })

          setTxHash(response.hash)
        })
        .catch((err: Error) => {
          setAttemptingTxn(false)
          // we only care if the error is something _other_ than the user rejected the tx
          console.error(err)
        })
    }
  }

  console.log(
    'PA',
    Object.assign(
      {},
      ...Object.values(parsedAmounts).map((amount, index) => ({
        [Object.keys(parsedAmounts)[index]]: amount?.toFixed(6),
      })),
    ),
  )

  // function for removing stable swap liquidity
  // removal with stablecoin amounts herre
  async function onStablesAmountsRemove() {
    if (!chainId || !library || !account || !deadline) throw new Error('missing dependencies')
    const {
      [StablesField.CURRENCY_1]: currencyAmount1,
      [StablesField.CURRENCY_2]: currencyAmount2,
      [StablesField.CURRENCY_3]: currencyAmount3,
      [StablesField.CURRENCY_4]: currencyAmount4,
    } = parsedAmounts
    if (!currencyAmount1 || !currencyAmount2 || !currencyAmount3 || !currencyAmount4) {
      throw new Error('missing currency amounts')
    }
    const router = getStableRouterContract(chainId, library, account)

    const liquidityAmount = parsedAmounts[StablesField.LIQUIDITY]

    // slippage for LP burn, takes second result from slippage calculation
    const lpAmountMax = calculateSlippageAmount(liquidityAmount, allowedSlippage)[1]

    console.log('amMax', lpAmountMax.toString())
    console.log('orig', liquidityAmount.toSignificant(6))

    console.log('amnt raw', liquidityAmount)

    if (!liquidityAmount) throw new Error('missing liquidity amount')

    let methodNames: string[]
    let args: Array<string | string[] | number | boolean | BigNumber | BigNumber[]>
    // we have approval, use normal remove liquidity
    if (approval === ApprovalState.APPROVED) {
      methodNames = ['removeLiquidityImbalance']
      args = [
        [
          currencyAmount1.toBigNumber(),
          currencyAmount2.toBigNumber(),
          currencyAmount3.toBigNumber(),
          currencyAmount4.toBigNumber(),
        ],
        BigNumber.from(lpAmountMax.toString()),
        deadline,
      ]
      console.log(
        'pool amnts',
        stablePool.calculateRemoveLiquidity(liquidityAmount.toBigNumber()).map((bn) => bn.toString()),
      )
      console.log(
        'lp amnts',
        stablePool
          .getLiquidityAmount(
            [
              currencyAmount1.toBigNumber(),
              currencyAmount2.toBigNumber(),
              currencyAmount3.toBigNumber(),
              currencyAmount4.toBigNumber(),
            ],
            false,
          )
          .toString(),
      )

      console.log('CCYS', [currencyAmount1, currencyAmount2, currencyAmount3, currencyAmount4])
    } else {
      throw new Error('Attempting to confirm without approval or a signature. Please contact support.')
    }

    const safeGasEstimates: (BigNumber | undefined)[] = await Promise.all(
      methodNames.map((methodName) =>
        router.estimateGas[methodName](...args)
          .then(calculateGasMargin)
          .catch((err) => {
            console.error(`estimateGas failed`, methodName, args, err)
            return undefined
          }),
      ),
    )

    const indexOfSuccessfulEstimation = safeGasEstimates.findIndex((safeGasEstimate) =>
      BigNumber.isBigNumber(safeGasEstimate),
    )

    // all estimations failed...
    if (indexOfSuccessfulEstimation === -1) {
      console.error('This transaction would fail. Please contact support.')
    } else {
      const methodName = methodNames[indexOfSuccessfulEstimation]
      const safeGasEstimate = safeGasEstimates[indexOfSuccessfulEstimation]

      setAttemptingTxn(true)
      await router[methodName](...args, {
        gasLimit: safeGasEstimate,
        gasPrice,
      })
        .then((response: TransactionResponse) => {
          setAttemptingTxn(false)

          addTransaction(response, {
            summary: `Remove ${parsedAmounts[StablesField.CURRENCY_1]?.toSignificant(3)} ${
              stablePool?.tokens[0].symbol
            }, ${parsedAmounts[StablesField.CURRENCY_2]?.toSignificant(3)} ${
              stablePool?.tokens[1].symbol
            }, ${parsedAmounts[StablesField.CURRENCY_3]?.toSignificant(3)} ${
              stablePool?.tokens[2].symbol
            } and ${parsedAmounts[StablesField.CURRENCY_4]?.toSignificant(3)} ${
              stablePool?.tokens[3].symbol
            } from Requiem Stable Swap`,
          })

          setTxHash(response.hash)
        })
        .catch((err: Error) => {
          setAttemptingTxn(false)
          // we only care if the error is something _other_ than the user rejected the tx
          console.error(err)
        })
    }
  }

  function modalHeader() {
    return (
      <AutoColumn gap="md">
        <RowBetween align="flex-end">
          <Text fontSize="24px">{parsedAmounts[StablesField.CURRENCY_1]?.toSignificant(6)}</Text>
          <RowFixed gap="4px">
            <CurrencyLogo chainId={chainId} currency={stablePool?.tokens[0]} size="24px" />
            <Text fontSize="24px" ml="10px" mr="5px">
              {stablePool?.tokens[0].symbol}
            </Text>
          </RowFixed>
        </RowBetween>
        <RowFixed>
          <AddIcon width="15px" />
        </RowFixed>
        <RowBetween align="flex-end">
          <Text fontSize="24px">{parsedAmounts[StablesField.CURRENCY_2]?.toSignificant(6)}</Text>
          <RowFixed gap="4px">
            <CurrencyLogo chainId={chainId} currency={stablePool?.tokens[1]} size="24px" />
            <Text fontSize="24px" ml="10px" mr="5px">
              {stablePool?.tokens[1].symbol}
            </Text>
          </RowFixed>
        </RowBetween>
        <RowFixed>
          <AddIcon width="15px" />
        </RowFixed>
        <RowBetween align="flex-end">
          <Text fontSize="24px">{parsedAmounts[StablesField.CURRENCY_3]?.toSignificant(6)}</Text>
          <RowFixed gap="4px">
            <CurrencyLogo chainId={chainId} currency={stablePool?.tokens[2]} size="24px" />
            <Text fontSize="24px" ml="10px" mr="5px">
              {stablePool?.tokens[2].symbol}
            </Text>
          </RowFixed>
        </RowBetween>
        <RowFixed>
          <AddIcon width="15px" />
        </RowFixed>
        <RowBetween align="flex-end">
          <Text fontSize="24px">{parsedAmounts[StablesField.CURRENCY_4]?.toSignificant(6)}</Text>
          <RowFixed gap="4px">
            <CurrencyLogo chainId={chainId} currency={stablePool?.tokens[3]} size="24px" />
            <Text fontSize="24px" ml="10px" mr="5px">
              {stablePool?.tokens[3].symbol}
            </Text>
          </RowFixed>
        </RowBetween>

        <Text small textAlign="left" pt="12px">
          {t('Output is estimated. If the price changes by more than %slippage%% your transaction will revert.', {
            slippage: allowedSlippage / 100,
          })}
        </Text>
      </AutoColumn>
    )
  }

  function priceMatrixComponent(fontsize: string, width: string) {
    return (
      <>
        <Table width={width}>
          <thead>
            <tr>
              <Th textAlign="left">Base</Th>
              <Th> {STABLES_INDEX_MAP[chainId ?? 43113][0].symbol}</Th>
              <Th> {STABLES_INDEX_MAP[chainId ?? 43113][1].symbol}</Th>
              <Th> {STABLES_INDEX_MAP[chainId ?? 43113][2].symbol}</Th>
              <Th> {STABLES_INDEX_MAP[chainId ?? 43113][3].symbol}</Th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <Td textAlign="left" fontSize={fontsize}>
                1 {STABLES_INDEX_MAP[chainId ?? 43113][0].symbol} =
              </Td>
              <Td fontSize={fontsize}>-</Td>
              <Td fontSize={fontsize}>{priceMatrix?.[0][1]?.toSignificant(4) ?? ' '}</Td>
              <Td fontSize={fontsize}>{priceMatrix?.[0][2]?.toSignificant(4) ?? ' '}</Td>
              <Td fontSize={fontsize}>{priceMatrix?.[0][3]?.toSignificant(4) ?? ' '}</Td>
            </tr>
            <tr>
              <Td textAlign="left" fontSize={fontsize}>
                1 {STABLES_INDEX_MAP[chainId ?? 43113][1].symbol} =
              </Td>
              <Td fontSize={fontsize}>{priceMatrix?.[1][0]?.toSignificant(4) ?? ' '}</Td>
              <Td fontSize={fontsize}>-</Td>
              <Td fontSize={fontsize}>{priceMatrix?.[1][2]?.toSignificant(4) ?? ' '}</Td>
              <Td fontSize={fontsize}>{priceMatrix?.[1][3]?.toSignificant(4) ?? ' '}</Td>
            </tr>
            <tr>
              <Td textAlign="left" fontSize={fontsize}>
                1 {STABLES_INDEX_MAP[chainId ?? 43113][2].symbol} =
              </Td>
              <Td fontSize={fontsize}>{priceMatrix?.[2][0]?.toSignificant(4) ?? ' '}</Td>
              <Td fontSize={fontsize}>{priceMatrix?.[2][1]?.toSignificant(4) ?? ' '}</Td>
              <Td fontSize={fontsize}>-</Td>
              <Td fontSize={fontsize}>{priceMatrix?.[2][3]?.toSignificant(4) ?? ' '}</Td>
            </tr>
            <tr>
              <Td textAlign="left" fontSize={fontsize}>
                1 {STABLES_INDEX_MAP[chainId ?? 43113][3].symbol} =
              </Td>
              <Td fontSize={fontsize}>{priceMatrix?.[3][0]?.toSignificant(4) ?? ' '}</Td>
              <Td fontSize={fontsize}>{priceMatrix?.[3][1]?.toSignificant(4) ?? ' '}</Td>
              <Td fontSize={fontsize}>{priceMatrix?.[3][2]?.toSignificant(4) ?? ' '}</Td>
              <Td fontSize={fontsize}>-</Td>
            </tr>
          </tbody>
        </Table>
      </>
    )
  }

  function field1Func(value: string) {
    return independentStablesField === StablesField.LIQUIDITY ||
      independentStablesField === StablesField.LIQUIDITY_PERCENT
      ? onField1CalcInput(StablesField.CURRENCY_1, value, calculatedValuesFormatted)
      : onField1Input(StablesField.CURRENCY_1, value)
  }

  function field2Func(value: string) {
    return independentStablesField === StablesField.LIQUIDITY ||
      independentStablesField === StablesField.LIQUIDITY_PERCENT
      ? onField2CalcInput(StablesField.CURRENCY_2, value, calculatedValuesFormatted)
      : onField2Input(StablesField.CURRENCY_2, value)
  }

  function field3Func(value: string) {
    return independentStablesField === StablesField.LIQUIDITY ||
      independentStablesField === StablesField.LIQUIDITY_PERCENT
      ? onField3CalcInput(StablesField.CURRENCY_3, value, calculatedValuesFormatted)
      : onField3Input(StablesField.CURRENCY_3, value)
  }

  function field4Func(value: string) {
    return independentStablesField === StablesField.LIQUIDITY ||
      independentStablesField === StablesField.LIQUIDITY_PERCENT
      ? onField4CalcInput(StablesField.CURRENCY_4, value, calculatedValuesFormatted)
      : onField4Input(StablesField.CURRENCY_4, value)
  }

  function modalBottom() {
    return (
      <>
        <RowBetween>
          <Text>
            {`${stablePool?.tokens[0].symbol}-${stablePool?.tokens[1].symbol}-${stablePool?.tokens[2].symbol}-${stablePool?.tokens[3].symbol} Stable Swap LP burned`}
          </Text>
          <RowFixed>
            <AutoColumn>
              <DoubleCurrencyLogo
                chainId={chainId}
                currency0={stablePool?.tokens[0]}
                currency1={stablePool?.tokens[1]}
                margin
              />
              <DoubleCurrencyLogo
                chainId={chainId}
                currency0={stablePool?.tokens[2]}
                currency1={stablePool?.tokens[3]}
                margin
              />
            </AutoColumn>
            <Text>{parsedAmounts[StablesField.LIQUIDITY]?.toSignificant(6)}</Text>
          </RowFixed>
        </RowBetween>
        <AutoColumn>{stablePool && priceMatrixComponent('13px', '110%')}</AutoColumn>
        {stableRemovalState === StableRemovalState.BY_LP || true ? (
          <Button
            disabled={!(approval === ApprovalState.APPROVED || signatureData !== null)}
            onClick={onStablesLpRemove}
          >
            Confirm removal by LP Amount
          </Button>
        ) : (
          <Button
            disabled={!(approval === ApprovalState.APPROVED || signatureData !== null)}
            onClick={onStablesAmountsRemove}
          >
            Confirm removal by Stable Coin Amounts
          </Button>
        )}
      </>
    )
  }

  const pendingText = t('Removing %amountA% %symbolA% and %amountB% %symbolB%', {
    amountA: parsedAmounts[StablesField.CURRENCY_1]?.toSignificant(6) ?? '',
    symbolA: stablePool?.tokens[0].symbol ?? '',
    amountB: parsedAmounts[StablesField.CURRENCY_1]?.toSignificant(6) ?? '',
    symbolB: stablePool?.tokens[1].symbol ?? '',
  })

  const handleDismissConfirmation = useCallback(() => {
    setSignatureData(null) // important that we clear signature data to avoid bad sigs
    // if there was a tx hash, we want to clear the input
    if (txHash) {
      onLpInput(StablesField.LIQUIDITY_PERCENT, '0')
    }
    setTxHash('')
  }, [txHash, onLpInput])

  const liquidityPercentChangeCallback = useCallback(
    (value: number) => {
      onLpInput(StablesField.LIQUIDITY_PERCENT, value.toString())
    },
    [onLpInput],
  )

  const [innerLiquidityPercentage, setInnerLiquidityPercentage] = useDebouncedChangeHandler(
    Number.parseInt(parsedAmounts[StablesField.LIQUIDITY_PERCENT].toFixed(0)),
    liquidityPercentChangeCallback,
  )

  const [onPresentRemoveLiquidity] = useModal(
    <TransactionConfirmationModal
      title={t('You will receive')}
      customOnDismiss={handleDismissConfirmation}
      attemptingTxn={attemptingTxn}
      hash={txHash || ''}
      content={() => <ConfirmationModalContent topContent={modalHeader} bottomContent={modalBottom} />}
      pendingText={pendingText}
    />,
    true,
    true,
    'removeLiquidityModal',
  )

  return (
    <Page>
      <AppBody>
        <AppHeader
          backTo="/pool"
          title="Remove Stable Swap Liquidity"
          subtitle={`To receive ${STABLES_INDEX_MAP[chainId ?? 43113][0].symbol}, ${
            STABLES_INDEX_MAP[chainId ?? 43113][1].symbol
          }, ${STABLES_INDEX_MAP[chainId ?? 43113][2].symbol} and/or ${STABLES_INDEX_MAP[chainId ?? 43113][3].symbol}`}
          noConfig
        />

        <CardBody>
          <AutoColumn gap="20px">
            {/* <Row>
              <TabMenu activeIndex={stableRemovalState} onItemClick={handleClick}>
                <Tab>LP Percent</Tab>
                <Tab>Unbalanced</Tab>
                <Tab>Single Stable</Tab>
              </TabMenu>
            </Row> */}

            <Text textAlign="center">Select withdrawl Type</Text>

            <LiquidityStateButtonWrapper>
              <ButtonMenu activeIndex={stableRemovalState} onItemClick={handleClick} scale="sm" marginBottom="1px">
                <ButtonMenuItem>LP Percent</ButtonMenuItem>
                <ButtonMenuItem>LP Amount</ButtonMenuItem>
                <ButtonMenuItem>Single Stable</ButtonMenuItem>
              </ButtonMenu>
            </LiquidityStateButtonWrapper>
            <RowBetween>
              <Text>{t('Amount')}</Text>
              {/* <Button variant="text" scale="sm" onClick={() => setShowDetailed(!showDetailed)}>
                {showDetailed ? t('Simple') : t('Detailed')}
              </Button> */}
            </RowBetween>
            {stableRemovalState === StableRemovalState.BY_LP && (
              <BorderCard>
                <Text fontSize="40px" bold mb="16px" style={{ lineHeight: 1 }}>
                  {formattedAmounts[StablesField.LIQUIDITY_PERCENT]}%
                </Text>
                <Slider
                  name="lp-amount"
                  min={0}
                  max={100}
                  value={innerLiquidityPercentage}
                  onValueChanged={(value) => {
                    setInnerLiquidityPercentage(Math.ceil(value))
                  }}
                  mb="16px"
                />
                <Flex flexWrap="wrap" justifyContent="space-evenly">
                  <Button
                    variant="tertiary"
                    scale="sm"
                    onClick={() => {
                      onLpInput(StablesField.LIQUIDITY_PERCENT, '25')
                    }}
                  >
                    25%
                  </Button>
                  <Button
                    variant="tertiary"
                    scale="sm"
                    onClick={() => {
                      onLpInput(StablesField.LIQUIDITY_PERCENT, '50')
                    }}
                  >
                    50%
                  </Button>
                  <Button
                    variant="tertiary"
                    scale="sm"
                    onClick={() => {
                      onLpInput(StablesField.LIQUIDITY_PERCENT, '75')
                    }}
                  >
                    75%
                  </Button>
                  <Button
                    variant="tertiary"
                    scale="sm"
                    onClick={() => {
                      onLpInput(StablesField.LIQUIDITY_PERCENT, '100')
                    }}
                  >
                    Max
                  </Button>
                </Flex>
              </BorderCard>
            )}
          </AutoColumn>
          {stableRemovalState === StableRemovalState.BY_LP && (
            <>
              <ColumnCenter>
                <ArrowDownIcon color="textSubtle" width="24px" my="16px" />
              </ColumnCenter>
              <AutoColumn gap="10px">
                <Text bold color="secondary" fontSize="12px" textTransform="uppercase">
                  {t('You will receive')}
                </Text>
                <LightGreyCard>
                  <RowBetween>
                    <AutoColumn>
                      <Flex justifyContent="space-between" mb="8px">
                        <Flex>
                          <CurrencyLogo chainId={chainId} currency={STABLES_INDEX_MAP[chainId ?? 43113][0]} />
                          <Text small color="textSubtle" id="remove-liquidity-tokena-symbol" ml="4px" mr="8px">
                            {STABLES_INDEX_MAP[chainId ?? 43113][0].symbol}
                          </Text>
                        </Flex>
                        <Text small>{formattedAmounts[StablesField.CURRENCY_1] || '-'}</Text>
                      </Flex>
                      <Flex justifyContent="space-between">
                        <Flex>
                          <CurrencyLogo chainId={chainId} currency={STABLES_INDEX_MAP[chainId ?? 43113][2]} />
                          <Text small color="textSubtle" id="remove-liquidity-tokenb-symbol" ml="4px" mr="8px">
                            {STABLES_INDEX_MAP[chainId ?? 43113][2].symbol}
                          </Text>
                        </Flex>
                        <Text small>{formattedAmounts[StablesField.CURRENCY_3] || '-'}</Text>
                      </Flex>
                    </AutoColumn>
                    <AutoColumn>
                      <Flex justifyContent="space-between" mb="8px">
                        <Flex>
                          <CurrencyLogo chainId={chainId} currency={STABLES_INDEX_MAP[chainId ?? 43113][1]} />
                          <Text small color="textSubtle" id="remove-liquidity-tokena-symbol" ml="4px" mr="8px">
                            {STABLES_INDEX_MAP[chainId ?? 43113][1].symbol}
                          </Text>
                        </Flex>
                        <Text small>{formattedAmounts[StablesField.CURRENCY_2] || '-'}</Text>
                      </Flex>
                      <Flex justifyContent="space-between">
                        <Flex>
                          <CurrencyLogo chainId={chainId} currency={STABLES_INDEX_MAP[chainId ?? 43113][3]} />
                          <Text small color="textSubtle" id="remove-liquidity-tokenb-symbol" ml="4px" mr="8px">
                            {STABLES_INDEX_MAP[chainId ?? 43113][3].symbol}
                          </Text>
                        </Flex>
                        <Text small>{formattedAmounts[StablesField.CURRENCY_4] || '-'}</Text>
                      </Flex>
                    </AutoColumn>
                  </RowBetween>
                </LightGreyCard>
              </AutoColumn>
            </>
          )}
          {stableRemovalState === StableRemovalState.BY_TOKENS && (
            <Box my="16px">
              <CurrencyInputPanelStable
                width="100%"
                value={formattedAmounts[StablesField.LIQUIDITY]}
                onUserInput={(value) => {
                  onLpInput(StablesField.LIQUIDITY, value)
                }}
                onMax={() => {
                  onLpInput(StablesField.LIQUIDITY_PERCENT, '100')
                }}
                showMaxButton={!atMaxAmount}
                stableCurrency={stablePool?.liquidityToken}
                id="liquidity-amount"
                stablePool={stablePool}
                hideBalance={false}
              />
              <ColumnCenter>
                <ArrowDownIcon width="24px" my="5px" />
              </ColumnCenter>
              <AutoColumn gap="2px">
                <CurrencyInputPanelStable
                  width="100%"
                  hideBalance
                  value={formattedAmounts[StablesField.CURRENCY_1]}
                  onUserInput={(_: string) => null}
                  // {(value: string) => field1Func(value)}
                  // onMax={() => {
                  //   onLpInput(StablesField.LIQUIDITY_PERCENT, '100')
                  // }}
                  // showMaxButton={!atMaxAmount}
                  showMaxButton={false}
                  stableCurrency={STABLES_INDEX_MAP[chainId ?? 43113][0]}
                  label={t('Output')}
                  id="remove-liquidity-token1"
                />
                <CurrencyInputPanelStable
                  width="100%"
                  hideBalance
                  value={formattedAmounts[StablesField.CURRENCY_2]}
                  onUserInput={(_: string) => null}
                  // {(value: string) => field2Func(value)}
                  // onMax={() => {
                  //   onLpInput(StablesField.LIQUIDITY_PERCENT, '100')
                  //   onLpInputSetOthers([
                  //     formattedAmounts[StablesField.CURRENCY_1],
                  //     formattedAmounts[StablesField.CURRENCY_2],
                  //     formattedAmounts[StablesField.CURRENCY_3],
                  //     formattedAmounts[StablesField.CURRENCY_4],
                  //   ])
                  // }}
                  // showMaxButton={!atMaxAmount}
                  showMaxButton={false}
                  stableCurrency={STABLES_INDEX_MAP[chainId ?? 43113][1]}
                  label={t('Output')}
                  id="remove-liquidity-token2"
                />

                <CurrencyInputPanelStable
                  width="100%"
                  hideBalance
                  value={formattedAmounts[StablesField.CURRENCY_3]}
                  hideInput
                  onUserInput={(_: string) => null}
                  // {(value: string) => field3Func(value)}
                  // onMax={() => {
                  //   onLpInput(StablesField.LIQUIDITY_PERCENT, '100')
                  // }}
                  // showMaxButton={!atMaxAmount}
                  showMaxButton={false}
                  stableCurrency={STABLES_INDEX_MAP[chainId ?? 43113][2]}
                  label={t('Output')}
                  id="remove-liquidity-token3"
                />

                <CurrencyInputPanelStable
                  width="100%"
                  hideBalance
                  value={formattedAmounts[StablesField.CURRENCY_4]}
                  onUserInput={(_: string) => null}
                  // {(value: string) => field4Func(value)}
                  // onMax={() => {
                  //   onLpInput(StablesField.LIQUIDITY_PERCENT, '100')
                  // }}
                  // showMaxButton={!atMaxAmount}
                  showMaxButton={false}
                  stableCurrency={STABLES_INDEX_MAP[chainId ?? 43113][3]}
                  label={t('Output')}
                  id="remove-liquidity-token4"
                />
              </AutoColumn>
            </Box>
          )}
          {stableRemovalState === StableRemovalState.BY_SINGLE_TOKEN && (
            <Box my="16px">
              <CurrencyInputPanelStable
                width="100%"
                value={formattedAmounts[StablesField.LIQUIDITY]}
                onUserInput={(value) => onLpInput(StablesField.LIQUIDITY, value)}
                onMax={() => {
                  onLpInput(StablesField.LIQUIDITY_PERCENT, '100')
                }}
                showMaxButton={!atMaxAmount}
                stableCurrency={stablePool?.liquidityToken}
                id="liquidity-amount"
                stablePool={stablePool}
              />
              <ColumnCenter>
                <ArrowDownIcon width="24px" my="16px" />
              </ColumnCenter>
              <SingleStableInputPanel
                value={formattedAmounts[StablesField.CURRENCY_SINGLE]}
                onUserInput={(value: string) => onField2Input(StablesField.CURRENCY_SINGLE, value)}
                onCurrencySelect={(ccy: Currency) => {
                  onField2Input(StablesField.CURRENCY_SINGLE, '0')
                }}
                onMax={() => {
                  onField2Input(StablesField.CURRENCY_SINGLE, '0')
                }}
                showMaxButton={false}
                currency={STABLES_INDEX_MAP[chainId ?? 43113][stableSelectState]}
                id="add-liquidity-input-token-single"
                showCommonBases
              />
            </Box>
          )}
          {stablePool && (
            <AutoColumn gap="10px" style={{ marginTop: '16px' }}>
              <Text bold color="secondary" fontSize="12px" textTransform="uppercase">
                Price Matrix
              </Text>
              <LightGreyCard>{priceMatrixComponent('12px', '80%')}</LightGreyCard>
            </AutoColumn>
          )}
          <Box position="relative" mt="16px">
            {!account ? (
              <ConnectWalletButton />
            ) : (
              <RowBetween>
                <Button
                  variant={approval === ApprovalState.APPROVED || signatureData !== null ? 'success' : 'primary'}
                  onClick={approveCallback}
                  disabled={approval !== ApprovalState.NOT_APPROVED || signatureData !== null}
                  width="100%"
                  mr="0.5rem"
                >
                  {approval === ApprovalState.PENDING ? (
                    <Dots>{t('Enabling')}</Dots>
                  ) : approval === ApprovalState.APPROVED || signatureData !== null ? (
                    t('Enabled')
                  ) : (
                    t('Enable')
                  )}
                </Button>
                <Button
                  variant={
                    !isValid && !!parsedAmounts[StablesField.CURRENCY_1] && !!parsedAmounts[StablesField.CURRENCY_2]
                      ? 'danger'
                      : 'primary'
                  }
                  onClick={() => {
                    onPresentRemoveLiquidity()
                  }}
                  width="100%"
                  disabled={!isValid || (signatureData === null && approval !== ApprovalState.APPROVED)}
                >
                  {error || t('Remove')}
                </Button>
              </RowBetween>
            )}
          </Box>
        </CardBody>
      </AppBody>

      {stablePool ? (
        <AutoColumn style={{ minWidth: '20rem', width: '100%', maxWidth: '400px', marginTop: '1rem' }}>
          <MinimalStablesPositionCard
            stablePool={stablePool}
            userLpPoolBalance={userPoolBalance[stablePool.liquidityToken.address]}
          />
        </AutoColumn>
      ) : null}
    </Page>
  )
}
