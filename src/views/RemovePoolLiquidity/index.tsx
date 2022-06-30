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
import { useWeightedPoolLpBalance } from 'state/weightedPools/hooks'
import useRefresh from 'hooks/useRefresh'
import PoolLogo from 'components/Logo/PoolLogo'
import getChain from 'utils/getChain'
import { sliceIntoChunks } from 'utils/arraySlicer'
import Row from 'components/Row'
import SingleTokenInputPanel from 'components/CurrencyInputPanel/SingleTokenInputPanel'

import { useBurnPoolLpActionHandlers, useBurnPoolLpState, useDerivedBurnPoolLpInfo } from 'state/burnPoolLp/hooks'
import { useGetWeightedPoolState } from 'hooks/useGetWeightedPoolState'
import { PoolField } from 'state/burnPoolLp/actions'
import { MinimalPoolPositionCard } from 'components/PositionCard/PoolPosition'

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
import { calculateGasMargin, calculateSlippageAmount, getStableSwapContract, getWeightedPoolContract } from '../../utils'
import useDebouncedChangeHandler from '../../hooks/useDebouncedChangeHandler'
import { useApproveCallback, ApprovalState } from '../../hooks/useApproveCallback'
import Dots from '../../components/Loader/Dots'
import { useGasPrice, useUserSlippageTolerance } from '../../state/user/hooks'



// const function getStableIndex(token)

const BorderCard = styled.div`
  border: solid 3px ${({ theme }) => theme.colors.cardBorder};
  border-radius: 16px;
  padding: 16px;
`


export default function RemovePoolLiquidity({
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
    history.push(`/${_chain}/remove/weighted`)

  },
    [chain, chainId, history],
  )

  // burn state
  const {
    independentPoolField,
    typedValueLiquidity,
    // calculatedSingleValues,
    // typedValueSingle,
  } = useBurnPoolLpState()

  // call pool from state
  const { slowRefresh } = useRefresh()
  const { weightedPools, userBalances, userDataLoaded, publicDataLoaded } = useGetWeightedPoolState(chainId, account, slowRefresh, slowRefresh)

  const weightedPool = weightedPools[0]


  const stableLpBalance = useWeightedPoolLpBalance(chainId, 0)
  // all balances are loaded from state
  const relevantTokenBalances = useMemo(() => {
    return {
      ...{ [weightedPool?.liquidityToken.address]: stableLpBalance },
      ...Object.assign({}, ...userBalances?.map(amnt => { return { [amnt.token.address]: amnt } }))
    }
  },
    [
      userBalances,
      stableLpBalance,
      weightedPool
    ]
  )

  const {
    parsedAmounts,
    error,
    liquidityTradeValues,
    parsedOutputTokenAmounts
  } = useDerivedBurnPoolLpInfo(chainId, relevantTokenBalances, weightedPool, publicDataLoaded, account)

  const {
    onLpInput,
    onSelectStableSingle
  } = useBurnPoolLpActionHandlers()

  const isValid = !error

  // modal and loading
  const enum PoolRemovalState {
    BY_LP,
    BY_TOKENS,
    BY_SINGLE_TOKEN,
  }

  const LiquidityStateButtonWrapper = styled.div`
    margin-bottom: 5px;
  `

  const [poolRemovalState, setPoolRemovalState] = useState<PoolRemovalState>(PoolRemovalState.BY_LP)

  const handleClick = (newIndex: PoolRemovalState) => setPoolRemovalState(newIndex)


  const [attemptingTxn, setAttemptingTxn] = useState(false) // clicked confirm

  // txn values
  const [txHash, setTxHash] = useState<string>('')
  const deadline = useTransactionDeadline(chainId)
  const [allowedSlippage] = useUserSlippageTolerance()

  const formattedAmounts = {
    [PoolField.LIQUIDITY_PERCENT]: parsedAmounts[PoolField.LIQUIDITY_PERCENT].equalTo('0')
      ? '0'
      : parsedAmounts[PoolField.LIQUIDITY_PERCENT].lessThan(new Percent('1', '100'))
        ? '<1'
        : parsedAmounts[PoolField.LIQUIDITY_PERCENT].toFixed(0),
    [PoolField.LIQUIDITY]:
      independentPoolField === PoolField.LIQUIDITY
        ? typedValueLiquidity
        : parsedAmounts[PoolField.LIQUIDITY]?.toSignificant(6) ?? '',
    [PoolField.LIQUIDITY_SINGLE]:
      parsedAmounts[PoolField.LIQUIDITY_SINGLE]?.toSignificant(6) ?? '',
    [PoolField.CURRENCY_SINGLE]:
      parsedAmounts[PoolField.CURRENCY_SINGLE]?.toSignificant(6) ?? '',
  }

  const atMaxAmount = parsedAmounts[PoolField.LIQUIDITY_PERCENT]?.equalTo(new Percent('1'))

  const userPoolBalance = weightedPool?.swapStorage && new TokenAmount(
    weightedPool?.liquidityToken,
    BigNumber.from(0).toBigInt(),
  )

  // allowance handling
  const [signatureData, setSignatureData] = useState<{ v: number; r: string; s: string; deadline: number } | null>(null)

  const priceMatrix = []
  if (publicDataLoaded)
    for (let i = 0; i < Object.values(weightedPool?.tokens).length; i++) {
      priceMatrix.push([])
      for (let j = 0; j < Object.values(weightedPool?.tokens).length; j++) {
        if (i !== j && parsedOutputTokenAmounts[j] !== undefined) {
          try {
            priceMatrix?.[i].push(
              new Price(
                weightedPool?.tokens[i],
                weightedPool?.tokens[j],
                weightedPool.calculateSwapGivenIn(weightedPool.tokenFromIndex(j), weightedPool.tokenFromIndex(i), parsedOutputTokenAmounts[j].toBigNumber()).toBigInt(),
                parsedOutputTokenAmounts[j].raw,
              ),
            )
          } catch {
            priceMatrix?.[i].push(undefined)
          }
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
    parsedAmounts[PoolField.LIQUIDITY],
    weightedPool?.address,
  )

  const symbolText = useMemo(() => weightedPool && weightedPool?.tokens?.map(x => x.symbol).join('-'), [weightedPool])
  const summaryText = useMemo(() => parsedOutputTokenAmounts?.length > 0 ? `Remove [${parsedOutputTokenAmounts?.map(x => x.toSignificant(8)).join(',')}] ${symbolText} for ${parsedAmounts[PoolField.LIQUIDITY]?.toSignificant(6)} LP Tokens` : '',
    [parsedOutputTokenAmounts, symbolText, parsedAmounts]
  )

  // function for removing stable swap liquidity
  // REmoval with LP amount as input
  async function onLpRemoveExactInMultipleOut() {
    if (!chainId || !library || !account || !deadline) throw new Error('missing dependencies')

    if (!parsedOutputTokenAmounts) {
      throw new Error('missing currency amounts')
    }
    const router = getWeightedPoolContract(weightedPool, library, account)

    // we take the first results (lower ones) since we want to receive a minimum amount of tokens
    const amountsMin = parsedOutputTokenAmounts.map(am => calculateSlippageAmount(am, allowedSlippage)[0])

    const liquidityAmount = parsedAmounts[PoolField.LIQUIDITY]
    if (!liquidityAmount) throw new Error('missing liquidity amount')

    let methodNames: string[]
    let args: Array<string | string[] | number | boolean | BigNumber | BigNumber[]>
    // we have approval, use normal remove liquidity
    if (approval === ApprovalState.APPROVED) {
      methodNames = ['removeLiquidityExactIn']
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
  async function onLpRemoveSingleExactOut() {
    if (!chainId || !library || !account || !deadline) throw new Error('missing dependencies')
    const {
      [PoolField.LIQUIDITY]: liquidityAmount,
      [PoolField.CURRENCY_SINGLE]: singleStableAmount,
      [PoolField.SELECTED_SINGLE]: selectedSingle
    } = parsedAmounts
    if (!liquidityAmount || !singleStableAmount) {
      throw new Error('missing currency amounts')
    }
    const router = getWeightedPoolContract(weightedPool, library, account)

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
            summary: `Remove ${parsedAmounts[PoolField.CURRENCY_SINGLE]?.toSignificant(3)} ${parsedAmounts[PoolField.CURRENCY_SINGLE].token.symbol
              } from Pool`,
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
    const router = getWeightedPoolContract(weightedPool, library, account)

    const liquidityAmount = parsedAmounts[PoolField.LIQUIDITY]

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
    const last = weightedPool?.tokens.length - 1
    return (
      <AutoColumn gap="md">
        {weightedPool && weightedPool.tokens.map((tk, i) => {
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

    const val = parsedAmounts[PoolField.CURRENCY_SINGLE] && liquidityTradeValues
      && liquidityTradeValues[parsedAmounts[PoolField.SELECTED_SINGLE]] ?
      (parsedAmounts[PoolField.CURRENCY_SINGLE].toBigNumber().toBigInt() -
        liquidityTradeValues?.[parsedAmounts[PoolField.SELECTED_SINGLE]].toBigNumber().toBigInt())
      : undefined

    const valNet = parsedAmounts[PoolField.CURRENCY_SINGLE] && liquidityTradeValues && parsedAmounts[PoolField.CURRENCY_SINGLE_FEE]
      && liquidityTradeValues[parsedAmounts[PoolField.SELECTED_SINGLE]] ?
      (parsedAmounts[PoolField.CURRENCY_SINGLE].toBigNumber().toBigInt() -
        liquidityTradeValues?.[parsedAmounts[PoolField.SELECTED_SINGLE]].toBigNumber().toBigInt()
        - parsedAmounts[PoolField.CURRENCY_SINGLE_FEE].toBigNumber().toBigInt())
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
                    <CurrencyLogo chainId={weightedPool?.chainId} currency={lpVal.token} size='15px' style={{ marginRight: '4px' }} />
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
                  {`${val >= 0 ? '  ' : '- '}${new TokenAmount(liquidityTradeValues?.[parsedAmounts[PoolField.SELECTED_SINGLE]].token, val >= 0 ? val : -val).toSignificant(4)
                    } ${parsedAmounts[PoolField.CURRENCY_SINGLE].token.symbol}`}
                </Text>
                <Text fontSize="12px" color={val >= 0 ? 'green' : 'red'} textAlign='right' ml='5px'>
                  {val >= 0 ? ' advantage vs manual withdrawl' : ' disadvantage vs manual withdrawl'}
                </Text>
              </Row>

            )
          }
          {
            parsedAmounts[PoolField.CURRENCY_SINGLE_FEE] && (
              <Row justify="start" gap="4px">
                <Text fontSize="12px" textAlign='left'>
                  {`${parsedAmounts[PoolField.CURRENCY_SINGLE_FEE].toSignificant(4)
                    } ${parsedAmounts[PoolField.CURRENCY_SINGLE_FEE].token.symbol} `}
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
                  {`${valNet >= 0 ? '  ' : '- '}${new TokenAmount(liquidityTradeValues?.[parsedAmounts[PoolField.SELECTED_SINGLE]].token, valNet >= 0 ? valNet : -valNet).toSignificant(4)
                    } ${parsedAmounts[PoolField.CURRENCY_SINGLE].token.symbol} `}
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
              {weightedPool && weightedPool.tokens.map(tok => {
                return (
                  <Th> {tok.symbol}</Th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {
              weightedPool && weightedPool.tokens.map((tokenRow, i) => {
                return (
                  <tr>
                    <Td textAlign="left" fontSize={fontsize}>
                      1 {tokenRow.symbol} =
                    </Td>
                    {weightedPool.tokens.map((__, j) => {
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
              <PoolLogo tokens={weightedPool?.tokens} margin />
            </AutoColumn>
            <Text>{parsedAmounts[PoolField.LIQUIDITY]?.toSignificant(6)}</Text>
          </RowFixed>
        </RowBetween>
        <AutoColumn>{weightedPool && priceMatrixComponent('13px', '110%')}</AutoColumn>
        {poolRemovalState === PoolRemovalState.BY_LP || true ? (
          <Button
            disabled={!(approval === ApprovalState.APPROVED || signatureData !== null)}
            onClick={onLpRemoveExactInMultipleOut}
          >
            Confirm removal by LP Amount
          </Button>
        ) : (
          <Button
            disabled={!(approval === ApprovalState.APPROVED || signatureData !== null)}
            onClick={onStablesAmountsRemove}
          >
            Confirm removal by Token Amounts
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
            {`${weightedPool?.name} Pool LP burned`}
          </Text>
          <RowFixed>
            <AutoColumn>
              <PoolLogo tokens={weightedPool?.tokens} margin />
            </AutoColumn>
            <Text>{parsedAmounts[PoolField.LIQUIDITY_SINGLE]?.toSignificant(6)}</Text>
          </RowFixed>
        </RowBetween>
        {/* <AutoColumn>{stablePool && priceMatrixComponent('13px', '110%')}</AutoColumn> */}
        <Button
          disabled={!(approval === ApprovalState.APPROVED || signatureData !== null)}
          onClick={onLpRemoveSingleExactOut}
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
          <Text fontSize="24px">{parsedAmounts[PoolField.CURRENCY_SINGLE]?.toSignificant(6)}</Text>
          <RowFixed gap="4px">
            <CurrencyLogo chainId={chainId} currency={parsedAmounts[PoolField.CURRENCY_SINGLE]?.token} size="24px" />
            <Text fontSize="24px" ml="10px" mr="5px">
              {weightedPool?.tokens[0].symbol}
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

  const pendingTextSingle = `Removing ${parsedAmounts[PoolField.CURRENCY_SINGLE]?.toSignificant(3)} ${weightedPool?.tokens[0].symbol
    } from Requiem Stable Swap`


  const handleDismissConfirmation = useCallback(() => {
    setSignatureData(null) // important that we clear signature data to avoid bad sigs
    // if there was a tx hash, we want to clear the input
    if (txHash) {
      onLpInput(PoolField.LIQUIDITY_PERCENT, '0')
    }
    setTxHash('')
  }, [txHash, onLpInput])

  const liquidityPercentChangeCallback = useCallback(
    (value: number) => {
      onLpInput(PoolField.LIQUIDITY_PERCENT, value.toString())
    },
    [onLpInput],
  )

  const [innerLiquidityPercentage, setInnerLiquidityPercentage] = useDebouncedChangeHandler(
    Number.parseInt(parsedAmounts[PoolField.LIQUIDITY_PERCENT].toFixed(0)),
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
          title="Remove Pool Liquidity"
          subtitle={`To receive ${symbolText}`}
          noConfig
        />

        <CardBody>
          <AutoColumn gap="20px">
            <Text textAlign="center">Select withdrawl Type</Text>

            <LiquidityStateButtonWrapper>
              <ButtonMenu activeIndex={poolRemovalState} onItemClick={handleClick} scale="sm" marginBottom="1px">
                <ButtonMenuItem>LP Percent</ButtonMenuItem>
                <ButtonMenuItem>LP Amount</ButtonMenuItem>
                <ButtonMenuItem>Single Token</ButtonMenuItem>
              </ButtonMenu>
            </LiquidityStateButtonWrapper>
            <RowBetween>
              <Text>{t('Amount')}</Text>
            </RowBetween>
            {poolRemovalState === PoolRemovalState.BY_LP && (
              <BorderCard>
                <Text fontSize="40px" bold mb="16px" style={{ lineHeight: 1 }}>
                  {formattedAmounts[PoolField.LIQUIDITY_PERCENT]}%
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
                      onLpInput(PoolField.LIQUIDITY_PERCENT, '25')
                    }}
                  >
                    25%
                  </Button>
                  <Button
                    variant="tertiary"
                    scale="sm"
                    onClick={() => {
                      onLpInput(PoolField.LIQUIDITY_PERCENT, '50')
                    }}
                  >
                    50%
                  </Button>
                  <Button
                    variant="tertiary"
                    scale="sm"
                    onClick={() => {
                      onLpInput(PoolField.LIQUIDITY_PERCENT, '75')
                    }}
                  >
                    75%
                  </Button>
                  <Button
                    variant="tertiary"
                    scale="sm"
                    onClick={() => {
                      onLpInput(PoolField.LIQUIDITY_PERCENT, '100')
                    }}
                  >
                    Max
                  </Button>
                </Flex>
              </BorderCard>
            )}
          </AutoColumn>
          {poolRemovalState === PoolRemovalState.BY_LP && (
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
          {poolRemovalState === PoolRemovalState.BY_TOKENS && (
            <Box my="16px">
              <CurrencyInputPanelPool
                chainId={chainId}
                account={account}
                width="100%"
                value={formattedAmounts[PoolField.LIQUIDITY]}
                onUserInput={(value) => {
                  onLpInput(PoolField.LIQUIDITY, value)
                }}
                onMax={() => {
                  onLpInput(PoolField.LIQUIDITY_PERCENT, '100')
                }}
                showMaxButton={!atMaxAmount}
                stableCurrency={weightedPool?.liquidityToken}
                id="liquidity-amount"
                pool={weightedPool}
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
                          //   onLpInput(PoolField.LIQUIDITY_PERCENT, '100')
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
          {poolRemovalState === PoolRemovalState.BY_SINGLE_TOKEN && (
            <Box my="16px">
              <CurrencyInputPanelPool
                chainId={chainId}
                account={account}
                width="100%"
                value={formattedAmounts[PoolField.LIQUIDITY]}
                onUserInput={(value) => {
                  onLpInput(PoolField.LIQUIDITY, value)
                }}
                onMax={() => {
                  onLpInput(PoolField.LIQUIDITY_PERCENT, '100')
                }}
                showMaxButton
                stableCurrency={weightedPool?.liquidityToken}
                id="liquidity-amount"
                pool={weightedPool}
                hideBalance={false}
                label='Select LP Amount to Burn'
                balances={relevantTokenBalances}
              />
              <ColumnCenter>
                <ArrowDownIcon width="24px" my="16px" />
              </ColumnCenter>
              <SingleTokenInputPanel
                pool={weightedPool}
                account={account}
                value={formattedAmounts[PoolField.CURRENCY_SINGLE]}
                onUserInput={(_: string) => null}
                onCurrencySelect={(ccy: Token) => {
                  onSelectStableSingle(weightedPool?.tokens.findIndex(token => token.equals(ccy)))
                }}
                // onMax={() => {
                //   onField2Input(PoolField.CURRENCY_SINGLE, '0')
                // }}
                showMaxButton={false}
                currency={parsedAmounts[PoolField.CURRENCY_SINGLE]?.token}
                id="add-liquidity-input-token-single"
                showCommonBases
                label='Recieved Amount'
              />
            </Box>
          )}
          {poolRemovalState !== PoolRemovalState.BY_SINGLE_TOKEN ? weightedPool && (
            <AutoColumn gap="10px" style={{ marginTop: '16px' }}>
              <Text bold color="secondary" fontSize="12px" textTransform="uppercase">
                Price Matrix
              </Text>
              <LightGreyCard>{priceMatrixComponent('12px', '80%')}</LightGreyCard>
            </AutoColumn>
          )
            : weightedPool && (
              <AutoColumn gap="10px" style={{ marginTop: '16px' }}>
                {tradeValues()}
              </AutoColumn>)
          }
          <Box position="relative" mt="16px">
            {!account ? (
              <ConnectWalletButton />
            ) : (

              poolRemovalState !== PoolRemovalState.BY_SINGLE_TOKEN ? (
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
                      !isValid && parsedOutputTokenAmounts
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
                        !!parsedAmounts[PoolField.CURRENCY_SINGLE] && !!parsedAmounts[PoolField.LIQUIDITY_SINGLE]
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
        weightedPool ? (
          <AutoColumn style={{ minWidth: '20rem', width: '100%', maxWidth: '400px', marginTop: '1rem' }}>
            <MinimalPoolPositionCard
              pool={weightedPool}
              userLpPoolBalance={userPoolBalance[weightedPool.liquidityToken.address]}
            />
          </AutoColumn>
        ) : null
      }
    </Page >
  )
}
