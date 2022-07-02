import React, { useCallback, useEffect, useMemo, useState } from 'react'
import styled from 'styled-components'
import { TransactionResponse } from '@ethersproject/providers'
import {
  Percent,
  Price,
  Token,
  TokenAmount
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
  Table,
  Th,
  Td,
} from '@requiemswap/uikit'
import { BigNumber } from '@ethersproject/bignumber'
import { useTranslation } from 'contexts/Localization'
import { RouteComponentProps } from 'react-router-dom'
import { useStablePoolLpBalance } from 'state/stablePools/hooks'
import useRefresh from 'hooks/useRefresh'
import PoolLogo from 'components/Logo/PoolLogo'
import getChain from 'utils/getChain'
import { sliceIntoChunks } from 'utils/arraySlicer'
import Row from 'components/Row'
import SingleTokenInputPanel from 'components/CurrencyInputPanel/SingleTokenInputPanel'
import { useGetStablePoolState } from 'hooks/useGetStablePoolState'
import Page from '../Page'
import { AutoColumn, ColumnCenter } from '../../components/Layout/Column'
import TransactionConfirmationModal, { ConfirmationModalContent } from '../../components/TransactionConfirmationModal'
import CurrencyInputPanelPool from '../../components/CurrencyInputPanel/CurrencyInputPanelPool'
import { MinimalStablesPositionCard } from '../../components/PositionCard/StablesPosition'
import { AppHeader, AppBody } from '../../components/App'
import { RowBetween, RowFixed } from '../../components/Layout/Row'
import ConnectWalletButton from '../../components/ConnectWalletButton'
import { LightGreyCard } from '../../components/Card'
import { CurrencyLogo, DoubleCurrencyLogo } from '../../components/Logo'
import useActiveWeb3React from '../../hooks/useActiveWeb3React'
import useTransactionDeadline from '../../hooks/useTransactionDeadline'

import { useTransactionAdder } from '../../state/transactions/hooks'
import { calculateGasMargin, calculateSlippageAmount, getStableSwapContract } from '../../utils'
import useDebouncedChangeHandler from '../../hooks/useDebouncedChangeHandler'
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


export default function RemoveStableLiquidity({
  history,
  match: {
    params: { chain },
  },
}: RouteComponentProps<{ chain: string }>) {
  const { account, chainId, library } = useActiveWeb3React()

  const { t } = useTranslation()
  const gasPrice = useGasPrice(chainId)

  useEffect(() => {
    const _chain = chain ?? getChain(chainId)
    history.push(`/${_chain}/remove/stables`)

  },
    [chain, chainId, history],
  )

  // burn state
  const {
    independentStablesField,
    typedValueLiquidity,
    // calculatedSingleValues,
    // typedValueSingle,
  } = useBurnStableState()

  // call pool from state
  const { slowRefresh } = useRefresh()
  const { stablePools, stableAmounts, userDataLoaded, publicDataLoaded } = useGetStablePoolState(chainId, account, slowRefresh, slowRefresh)

  const stablePool = stablePools[0]


  const stableLpBalance = useStablePoolLpBalance(chainId, 0)
  // all balances are loaded from state
  const relevantTokenBalances = useMemo(() => {
    return {
      ...{ [stablePool?.liquidityToken.address]: stableLpBalance },
      ...Object.assign({}, ...stableAmounts?.map(amnt => { return { [amnt.token.address]: amnt } }))
    }
  },
    [
      stableAmounts,
      stableLpBalance,
      stablePool
    ]
  )

  const {
    parsedAmounts,
    error,
    liquidityTradeValues,
    parsedOutputTokenAmounts
  } = useDerivedBurnStablesInfo(chainId, relevantTokenBalances, stablePool, publicDataLoaded, account)

  const {
    onLpInput,
    onSelectStableSingle
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
    [StablesField.LIQUIDITY_SINGLE]:
      parsedAmounts[StablesField.LIQUIDITY_SINGLE]?.toSignificant(6) ?? '',
    [StablesField.CURRENCY_SINGLE]:
      parsedAmounts[StablesField.CURRENCY_SINGLE]?.toSignificant(6) ?? '',
  }

  const atMaxAmount = parsedAmounts[StablesField.LIQUIDITY_PERCENT]?.equalTo(new Percent('1'))

  const userPoolBalance = stablePool?.swapStorage && new TokenAmount(
    new Token(chainId, stablePool?.swapStorage.lpAddress, 18, 'RequiemStable-LP', 'Requiem StableSwap LPs'),
    BigNumber.from(0).toBigInt(),
  )

  // allowance handling
  const [signatureData, setSignatureData] = useState<{ v: number; r: string; s: string; deadline: number } | null>(null)

  const priceMatrix = []
  if (publicDataLoaded)
    for (let i = 0; i < Object.values(stablePool?.tokens).length; i++) {
      priceMatrix.push([])
      for (let j = 0; j < Object.values(stablePool?.tokens).length; j++) {
        if (i !== j && parsedOutputTokenAmounts[j] !== undefined) {
          priceMatrix?.[i].push(
            new Price(
              stablePool?.tokens[i],
              stablePool?.tokens[j],
              stablePool.calculateSwapGivenIn(stablePool.tokenFromIndex(j), stablePool.tokenFromIndex(i), parsedOutputTokenAmounts[j].toBigNumber()).toBigInt(),
              parsedOutputTokenAmounts[j].raw,
            ),
          )
        } else {
          priceMatrix?.[i].push(undefined)
        }
      }
    }

  // tx sending
  const addTransaction = useTransactionAdder()

  const [approval, approveCallback] = useApproveCallback(
    chainId,
    account,
    parsedAmounts[StablesField.LIQUIDITY],
    stablePool?.address,
  )

  const symbolText = useMemo(() => parsedOutputTokenAmounts && parsedOutputTokenAmounts?.map(x => x.token.symbol).join('-'), [parsedOutputTokenAmounts])
  const summaryText = useMemo(() => parsedOutputTokenAmounts?.length > 0 ? `Remove [${parsedOutputTokenAmounts?.map(x => x.toSignificant(8)).join(',')}] ${symbolText} for ${parsedAmounts[StablesField.LIQUIDITY]?.toSignificant(6)} LP Tokens` : '',
    [parsedOutputTokenAmounts, symbolText, parsedAmounts]
  )

  // function for removing stable swap liquidity
  // REmoval with LP amount as input
  async function onStablesLpRemove() {
    if (!chainId || !library || !account || !deadline) throw new Error('missing dependencies')

    if (!parsedOutputTokenAmounts) {
      throw new Error('missing currency amounts')
    }
    const router = getStableSwapContract(stablePool, library, account)

    // we take the first results (lower ones) since we want to receive a minimum amount of tokens
    const amountsMin = parsedOutputTokenAmounts.map(am => calculateSlippageAmount(am, allowedSlippage)[0])

    const liquidityAmount = parsedAmounts[StablesField.LIQUIDITY]
    if (!liquidityAmount) throw new Error('missing liquidity amount')

    let methodNames: string[]
    let args: Array<string | string[] | number | boolean | BigNumber | BigNumber[]>
    // we have approval, use normal remove liquidity
    if (approval === ApprovalState.APPROVED) {
      methodNames = ['removeLiquidity']
      args = [
        liquidityAmount.toBigNumber(),
        amountsMin.map(x => x.toHexString()),
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
            summary: summaryText,
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

  // function for removing stable swap liquidity
  // REmoval with LP amount as input
  async function onStablesLpRemoveSingle() {
    if (!chainId || !library || !account || !deadline) throw new Error('missing dependencies')
    const {
      [StablesField.LIQUIDITY]: liquidityAmount,
      [StablesField.CURRENCY_SINGLE]: singleStableAmount,
      [StablesField.SELECTED_SINGLE]: selectedSingle
    } = parsedAmounts
    if (!liquidityAmount || !singleStableAmount) {
      throw new Error('missing currency amounts')
    }
    const router = getStableSwapContract(stablePool, library, account)

    // we take the first results (lower ones) since we want to receive a minimum amount of tokens
    const amountMin = calculateSlippageAmount(singleStableAmount, allowedSlippage)[0]

    if (!liquidityAmount) throw new Error('missing liquidity amount')

    let methodNames: string[]
    let args: Array<string | string[] | number | boolean | BigNumber | BigNumber[]>
    // we have approval, use normal remove liquidity
    // removeLiquidityOneToken( uint256 lpAmount, uint8 index, uint256 minAmount,  uint256 deadline )
    if (approval === ApprovalState.APPROVED) {
      methodNames = ['removeLiquidityOneToken']
      args = [
        liquidityAmount.toBigNumber(),
        selectedSingle,
        BigNumber.from(amountMin.toString()),
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
            summary: `Remove ${parsedAmounts[StablesField.CURRENCY_SINGLE]?.toSignificant(3)} ${parsedAmounts[StablesField.CURRENCY_SINGLE].token.symbol
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

  // function for removing stable swap liquidity
  // removal with stablecoin amounts herre
  async function onStablesAmountsRemove() {
    if (!chainId || !library || !account || !deadline) throw new Error('missing dependencies')

    if (!parsedOutputTokenAmounts) {
      throw new Error('missing currency amounts')
    }
    const router = getStableSwapContract(stablePool, library, account)

    const liquidityAmount = parsedAmounts[StablesField.LIQUIDITY]

    // slippage for LP burn, takes second result from slippage calculation
    const lpAmountMax = calculateSlippageAmount(liquidityAmount, allowedSlippage)[1]


    if (!liquidityAmount) throw new Error('missing liquidity amount')

    let methodNames: string[]
    let args: Array<string | string[] | number | boolean | BigNumber | BigNumber[]>
    // we have approval, use normal remove liquidity
    if (approval === ApprovalState.APPROVED) {
      methodNames = ['removeLiquidityImbalance']
      args = [
        parsedOutputTokenAmounts.map(x => x.raw.toHexString()),
        BigNumber.from(lpAmountMax.toString()),
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
            summary: summaryText,
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
    const last = stablePool?.tokens.length - 1
    return (
      <AutoColumn gap="md">
        {stablePool && stablePool.tokens.map((tk, i) => {
          return (

            <>
              <RowBetween align="flex-end">
                <Text fontSize="24px">{parsedOutputTokenAmounts[i]?.toSignificant(6)}</Text>
                <RowFixed gap="4px">
                  <CurrencyLogo chainId={chainId} currency={tk} size="24px" />
                  <Text fontSize="24px" ml="10px" mr="5px">
                    {tk.symbol}
                  </Text>
                </RowFixed>
              </RowBetween>
              {i !== last && (
                <RowFixed>
                  <AddIcon width="15px" />
                </RowFixed>)
              }
            </>
          )
        })}

        <Text small textAlign="left" pt="12px">
          {t('Output is estimated. If the price changes by more than %slippage%% your transaction will revert.', {
            slippage: allowedSlippage / 100,
          })}
        </Text>
      </AutoColumn>
    )
  }

  function tradeValues() {

    const val = parsedAmounts[StablesField.CURRENCY_SINGLE] && liquidityTradeValues
      && liquidityTradeValues[parsedAmounts[StablesField.SELECTED_SINGLE]] ?
      (parsedAmounts[StablesField.CURRENCY_SINGLE].toBigNumber().toBigInt() -
        liquidityTradeValues?.[parsedAmounts[StablesField.SELECTED_SINGLE]].toBigNumber().toBigInt())
      : undefined

    const valNet = parsedAmounts[StablesField.CURRENCY_SINGLE] && liquidityTradeValues && parsedAmounts[StablesField.CURRENCY_SINGLE_FEE]
      && liquidityTradeValues[parsedAmounts[StablesField.SELECTED_SINGLE]] ?
      (parsedAmounts[StablesField.CURRENCY_SINGLE].toBigNumber().toBigInt() -
        liquidityTradeValues?.[parsedAmounts[StablesField.SELECTED_SINGLE]].toBigNumber().toBigInt()
        - parsedAmounts[StablesField.CURRENCY_SINGLE_FEE].toBigNumber().toBigInt())
      : undefined

    return (

      <>
        <Text bold color="secondary" fontSize="12px" textTransform="uppercase">
          LP Trade Values
        </Text>
        <LightGreyCard>
          <Row justify="start" gap="7px">
            {
              liquidityTradeValues && liquidityTradeValues.map(lpVal => {
                return (
                  <Row justify="start" gap="7px">
                    <CurrencyLogo chainId={stablePool?.chainId} currency={lpVal.token} size='15px' style={{ marginRight: '4px' }} />
                    <Text fontSize="14px" >
                      {
                        lpVal?.toSignificant(6)
                      }
                    </Text>
                  </Row>
                )
              }
              )
            }
          </Row> {
            val && (
              <Row justify="start" gap="4px">
                <Text fontSize="12px" color={val >= 0 ? 'green' : 'red'} textAlign='left'>
                  {`${val >= 0 ? '  ' : '- '}${new TokenAmount(liquidityTradeValues?.[parsedAmounts[StablesField.SELECTED_SINGLE]].token, val >= 0 ? val : -val).toSignificant(4)
                    } ${parsedAmounts[StablesField.CURRENCY_SINGLE].token.symbol}`}
                </Text>
                <Text fontSize="12px" color={val >= 0 ? 'green' : 'red'} textAlign='right' ml='5px'>
                  {val >= 0 ? ' advantage vs manual withdrawl' : ' disadvantage vs manual withdrawl'}
                </Text>
              </Row>

            )
          }
          {
            parsedAmounts[StablesField.CURRENCY_SINGLE_FEE] && (
              <Row justify="start" gap="4px">
                <Text fontSize="12px" textAlign='left'>
                  {`${parsedAmounts[StablesField.CURRENCY_SINGLE_FEE].toSignificant(4)
                    } ${parsedAmounts[StablesField.CURRENCY_SINGLE_FEE].token.symbol} `}
                </Text>
                <Text fontSize="12px" textAlign='right' ml='5px'>
                  withdrawl fee
                </Text>
              </Row>)
          }

          {
            valNet && (
              <Row justify="start" gap="4px">
                <Text fontSize="12px" color={valNet >= 0 ? 'green' : 'red'} textAlign='left'>
                  {`${valNet >= 0 ? '  ' : '- '}${new TokenAmount(liquidityTradeValues?.[parsedAmounts[StablesField.SELECTED_SINGLE]].token, valNet >= 0 ? valNet : -valNet).toSignificant(4)
                    } ${parsedAmounts[StablesField.CURRENCY_SINGLE].token.symbol} `}
                </Text>
                <Text fontSize="12px" color={valNet >= 0 ? 'green' : 'red'} textAlign='right' ml='5px'>
                  net difference
                </Text>
              </Row>

            )}
        </LightGreyCard>
      </>
    )
  }

  function priceMatrixComponent(fontsize: string, width: string) {
    return (
      <>
        <Table width={width}>
          <thead>
            <tr>
              <Th textAlign="left">Base</Th>
              {stablePool && stablePool.tokens.map(tok => {
                return (
                  <Th> {tok.symbol}</Th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {
              stablePool && stablePool.tokens.map((tokenRow, i) => {
                return (
                  <tr>
                    <Td textAlign="left" fontSize={fontsize}>
                      1 {tokenRow.symbol} =
                    </Td>
                    {stablePool.tokens.map((__, j) => {
                      return (

                        <Td fontSize={fontsize}>{i === j ? '-' : priceMatrix?.[i][j]?.toSignificant(4) ?? ' '}</Td>
                      )
                    })}
                  </tr>
                )
              })
            }
          </tbody>
        </Table>
      </>
    )
  }

  function modalBottom() {
    return (
      <>
        <RowBetween>
          <Text>
            {`${symbolText} Stable Swap LP burned`}
          </Text>
          <RowFixed>
            <AutoColumn>
              <PoolLogo tokens={stablePool?.tokens} margin />
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


  function modalBottomSingle() {
    return (
      <>
        <RowBetween>
          <Text>
            {`${stablePool?.tokens[0].symbol}-${stablePool?.tokens[1].symbol}-${stablePool?.tokens[2].symbol}-${stablePool?.tokens[3].symbol} Stable Swap LP burned`}
          </Text>
          <RowFixed>
            <AutoColumn>
              <PoolLogo tokens={stablePool?.tokens} margin />
            </AutoColumn>
            <Text>{parsedAmounts[StablesField.LIQUIDITY_SINGLE]?.toSignificant(6)}</Text>
          </RowFixed>
        </RowBetween>
        {/* <AutoColumn>{stablePool && priceMatrixComponent('13px', '110%')}</AutoColumn> */}
        <Button
          disabled={!(approval === ApprovalState.APPROVED || signatureData !== null)}
          onClick={onStablesLpRemoveSingle}
        >
          Confirm removal by LP Amount versus single Token
        </Button>

      </>
    )
  }

  function modalHeaderSingle() {
    return (
      <AutoColumn gap="md">
        <RowBetween align="flex-end">
          <Text fontSize="24px">{parsedAmounts[StablesField.CURRENCY_SINGLE]?.toSignificant(6)}</Text>
          <RowFixed gap="4px">
            <CurrencyLogo chainId={chainId} currency={parsedAmounts[StablesField.CURRENCY_SINGLE]?.token} size="24px" />
            <Text fontSize="24px" ml="10px" mr="5px">
              {stablePool?.tokens[0].symbol}
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

  const pendingText = summaryText

  const pendingTextSingle = `Removing ${parsedAmounts[StablesField.CURRENCY_SINGLE]?.toSignificant(3)} ${stablePool?.tokens[0].symbol
    } from Requiem Stable Swap`


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

  const [onPresentRemoveLiquiditySingle] = useModal(
    <TransactionConfirmationModal
      title={t('You will receive')}
      customOnDismiss={handleDismissConfirmation}
      attemptingTxn={attemptingTxn}
      hash={txHash || ''}
      content={() => <ConfirmationModalContent topContent={modalHeaderSingle} bottomContent={modalBottomSingle} />}
      pendingText={pendingTextSingle}
    />,
    true,
    true,
    'removeLiquidityModalSingle',
  )

  return (
    <Page>
      <AppBody>
        <AppHeader
          chainId={chainId}
          account={account}
          backTo={`/${chain}/liquidity`}
          title="Remove Stable Swap Liquidity"
          subtitle={`To receive ${symbolText}`}
          noConfig
        />

        <CardBody>
          <AutoColumn gap="20px">
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
                      {parsedOutputTokenAmounts && sliceIntoChunks(parsedOutputTokenAmounts, 2).map(amntArray => {
                        return (
                          <Flex justifyContent="space-between" alignItems='center' mb='10px' ml='10px'>
                            {amntArray.map(amnt => {
                              return (

                                <Flex justifyContent="space-between" ml='20px'>
                                  <Flex>
                                    <CurrencyLogo chainId={chainId} currency={amnt.token} />
                                    <Text small color="textSubtle" id="remove-liquidity-tokenb-symbol" ml="4px" mr="8px">
                                      {amnt.token.symbol}
                                    </Text>
                                  </Flex>
                                  <Text small>{Number(amnt.toSignificant(4).toLocaleString()) || '-'}</Text>
                                </Flex>
                              )
                            })}
                          </Flex>)
                      })}
                    </AutoColumn>
                  </RowBetween>
                </LightGreyCard>
              </AutoColumn>
            </>
          )}
          {stableRemovalState === StableRemovalState.BY_TOKENS && (
            <Box my="16px">
              <CurrencyInputPanelPool
                chainId={chainId}
                account={account}
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
                pool={stablePool}
                hideBalance={false}
                balances={relevantTokenBalances}
              />
              <ColumnCenter>
                <ArrowDownIcon width="24px" my="5px" />
              </ColumnCenter>

              <BorderCard>
                <AutoColumn gap="3px">
                  {
                    parsedOutputTokenAmounts && parsedOutputTokenAmounts.map((amnt, index) => {
                      return (
                        <CurrencyInputPanelPool
                          chainId={chainId}
                          account={account}
                          width="100%"
                          hideBalance
                          value={amnt.toSignificant(8)}
                          hideInput
                          onUserInput={(_: string) => null}
                          // {(value: string) => field1Func(value)}
                          // onMax={() => {
                          //   onLpInput(StablesField.LIQUIDITY_PERCENT, '100')
                          // }}
                          // showMaxButton={!atMaxAmount}
                          showMaxButton={false}
                          stableCurrency={amnt.token}
                          label={t('Output')}
                          id="remove-liquidity-token1"
                          balances={relevantTokenBalances}
                          isBottom={index === parsedOutputTokenAmounts.length - 1}
                          isTop={index === 0}
                        />
                      )
                    }
                    )
                  }
                </AutoColumn>
              </BorderCard>

            </Box>
          )}
          {stableRemovalState === StableRemovalState.BY_SINGLE_TOKEN && (
            <Box my="16px">
              <CurrencyInputPanelPool
                chainId={chainId}
                account={account}
                width="100%"
                value={formattedAmounts[StablesField.LIQUIDITY]}
                onUserInput={(value) => {
                  onLpInput(StablesField.LIQUIDITY, value)
                }}
                onMax={() => {
                  onLpInput(StablesField.LIQUIDITY_PERCENT, '100')
                }}
                showMaxButton
                stableCurrency={stablePool?.liquidityToken}
                id="liquidity-amount"
                pool={stablePool}
                hideBalance={false}
                label='Select LP Amount to Burn'
                balances={relevantTokenBalances}
              />
              <ColumnCenter>
                <ArrowDownIcon width="24px" my="16px" />
              </ColumnCenter>
              <SingleTokenInputPanel
                pool={stablePool}
                account={account}
                value={formattedAmounts[StablesField.CURRENCY_SINGLE]}
                onUserInput={(_: string) => null}
                onCurrencySelect={(ccy: Token) => {
                  onSelectStableSingle(stablePool?.tokens.findIndex(token => token.equals(ccy)))
                }}
                // onMax={() => {
                //   onField2Input(StablesField.CURRENCY_SINGLE, '0')
                // }}
                showMaxButton={false}
                currency={parsedAmounts[StablesField.CURRENCY_SINGLE]?.token}
                id="add-liquidity-input-token-single"
                showCommonBases
                label='Recieved Amount'
              />
            </Box>
          )}
          {stableRemovalState !== StableRemovalState.BY_SINGLE_TOKEN ? stablePool && (
            <AutoColumn gap="10px" style={{ marginTop: '16px' }}>
              <Text bold color="secondary" fontSize="12px" textTransform="uppercase">
                Price Matrix
              </Text>
              <LightGreyCard>{priceMatrixComponent('12px', '80%')}</LightGreyCard>
            </AutoColumn>
          )
            : stablePool && (
              <AutoColumn gap="10px" style={{ marginTop: '16px' }}>
                {tradeValues()}
              </AutoColumn>)
          }
          <Box position="relative" mt="16px">
            {!account ? (
              <ConnectWalletButton />
            ) : (

              stableRemovalState !== StableRemovalState.BY_SINGLE_TOKEN ? (
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
                        && !!parsedAmounts[StablesField.CURRENCY_3] && !!parsedAmounts[StablesField.CURRENCY_4]
                        ? 'danger'
                        : 'primary'
                    }
                    onClick={() => {
                      onPresentRemoveLiquidity()
                    }}
                    width="100%"
                    disabled={!isValid || (signatureData === null && approval !== ApprovalState.APPROVED)}
                  >
                    {t('Remove')}
                  </Button>
                </RowBetween>)
                : (
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
                        !!parsedAmounts[StablesField.CURRENCY_SINGLE] && !!parsedAmounts[StablesField.LIQUIDITY_SINGLE]
                          ? 'danger'
                          : 'primary'
                      }
                      onClick={() => {
                        onPresentRemoveLiquiditySingle()
                      }}
                      width="100%"
                      disabled={(signatureData === null && approval !== ApprovalState.APPROVED)}
                    >
                      {error || t('Remove')}
                    </Button>
                  </RowBetween>
                )
            )
            }
          </Box>
        </CardBody>
      </AppBody>

      {
        stablePool ? (
          <AutoColumn style={{ minWidth: '20rem', width: '100%', maxWidth: '400px', marginTop: '1rem' }}>
            <MinimalStablesPositionCard
              stablePool={stablePool}
              userLpPoolBalance={userPoolBalance[stablePool.liquidityToken.address]}
            />
          </AutoColumn>
        ) : null
      }
    </Page >
  )
}
