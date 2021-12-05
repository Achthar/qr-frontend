import React, { useCallback, useState } from 'react'
import { BigNumber } from '@ethersproject/bignumber'
import { TransactionResponse } from '@ethersproject/providers'
import {
  Currency,
  currencyEquals,
  ETHER,
  NETWORK_CCY,
  TokenAmount,
  WETH,
  WRAPPED_NETWORK_TOKENS,
  STABLE_POOL_ADDRESS,
  STABLES_INDEX_MAP,
} from '@requiemswap/sdk'
import {
  Button,
  Text,
  Flex,
  CardBody,
  Message,
  useModal,
  ButtonMenu,
  ButtonMenuItem,
  IconButton,
  ModalBackButton,
  Tag,
  AddIcon,
  ArrowBackIcon,
  Box,
  ChevronLeftIcon
} from '@requiemswap/uikit'
import { RouteComponentProps, Link } from 'react-router-dom'
// import {Svg, SvgProps} from '@requiemswap/uikit'
import styled from 'styled-components'
import { useIsTransactionUnsupported } from 'hooks/Trades'
import PercentageInputPanel from 'components/CurrencyInputPanel/PercentageInputPanel'
import BpsInputPanel from 'components/CurrencyInputPanel/BpsInputPanel'
import { useTranslation } from 'contexts/Localization'
import UnsupportedCurrencyFooter from 'components/UnsupportedCurrencyFooter'
import useActiveWeb3React from 'hooks/useActiveWeb3React'

import { LightCard } from 'components/Card'
import { AutoColumn, ColumnCenter } from 'components/Layout/Column'
import TransactionConfirmationModal, { ConfirmationModalContent } from 'components/TransactionConfirmationModal'
import CurrencyInputPanel from 'components/CurrencyInputPanel'
import { DoubleCurrencyLogo } from 'components/Logo'
import { AppHeader, AppBody } from 'components/App'
import { MinimalWeightedPositionCard } from 'components/PositionCard/WeightedPairPosition'
import Row, { RowBetween } from 'components/Layout/Row'
import ConnectWalletButton from 'components/ConnectWalletButton'
import { LinkStyledButton } from 'theme'
import { ROUTER_ADDRESS } from 'config/constants'
import { PairState } from 'hooks/usePairs'
import { useCurrency } from 'hooks/Tokens'
import { ApprovalState, useApproveCallback } from 'hooks/useApproveCallback'
import useTransactionDeadline from 'hooks/useTransactionDeadline'
import { WeightedField } from 'state/mintWeightedPair/actions'
import { useDerivedMintWeightedPairInfo, useMintWeightedPairActionHandlers, useMintWeightedPairState } from 'state/mintWeightedPair/hooks'
import { WeightedPairState } from 'hooks/useWeightedPairs'
import { useTransactionAdder } from 'state/transactions/hooks'
import { useGasPrice, useIsExpertMode, useUserSlippageTolerance } from 'state/user/hooks'
import { calculateGasMargin, calculateSlippageAmount, getPairManagerContract } from 'utils'
import { maxAmountSpend } from 'utils/maxAmountSpend'
import { wrappedCurrency } from 'utils/wrappedCurrency'
import Dots from 'components/Loader/Dots'
import { currencyId } from 'utils/currencyId'
import ConfirmAddModalBottom from './ConfirmAddModalBottom'
import PoolPriceBar from './PoolPriceBar'
import Page from '../Page'

export default function AddLiquidity({
  match: {
    params: { currencyIdA, currencyIdB },
  },
  history,
}: RouteComponentProps<{ currencyIdA?: string; currencyIdB?: string }>) {
  const { account, chainId, library } = useActiveWeb3React()
  const { t } = useTranslation()
  const gasPrice = useGasPrice(chainId)

  const currencyA = useCurrency(chainId, currencyIdA)
  const currencyB = useCurrency(chainId, currencyIdB)

  const oneCurrencyIsWETH = Boolean(
    chainId &&
    ((currencyA && currencyEquals(currencyA, WRAPPED_NETWORK_TOKENS[chainId])) ||
      (currencyB && currencyEquals(currencyB, WRAPPED_NETWORK_TOKENS[chainId]))),
  )

  const expertMode = useIsExpertMode()

  // mint state
  const { independentField, typedValue, otherTypedValue } = useMintWeightedPairState()
  const {
    dependentField,
    currencies,
    weights,
    weightedPair,
    weightedPairState,
    currencyBalances,
    parsedAmounts,
    price,
    noLiquidity,
    liquidityMinted,
    poolTokenPercentage,
    error,
    fee
  } = useDerivedMintWeightedPairInfo(currencyA ?? undefined, currencyB ?? undefined)

  const { onFieldAInput, onFieldBInput, onWeightAInput, onWeightBInput, onFeeInput } = useMintWeightedPairActionHandlers(noLiquidity)

  const isValid = !error

  // modal and loading
  const [attemptingTxn, setAttemptingTxn] = useState<boolean>(false) // clicked confirm

  // txn values
  const deadline = useTransactionDeadline(chainId) // custom from users settings
  const [allowedSlippage] = useUserSlippageTolerance() // custom from users
  const [txHash, setTxHash] = useState<string>('')

  // get formatted amounts
  const formattedAmounts = {
    [independentField]: typedValue,
    [dependentField]: noLiquidity ? otherTypedValue : parsedAmounts[dependentField]?.toSignificant(6) ?? '',
  }

  // get the max amounts user can add
  const maxAmounts: { [field in WeightedField]?: TokenAmount } = [WeightedField.CURRENCY_A, WeightedField.CURRENCY_B].reduce(
    (accumulator, field) => {
      return {
        ...accumulator,
        [field]: maxAmountSpend(chainId, currencyBalances[field]),
      }
    },
    {},
  )

  const atMaxAmounts: { [field in WeightedField]?: TokenAmount } = [WeightedField.CURRENCY_A, WeightedField.CURRENCY_B].reduce(
    (accumulator, field) => {
      return {
        ...accumulator,
        [field]: maxAmounts[field]?.equalTo(parsedAmounts[field] ?? '0'),
      }
    },
    {},
  )

  // check whether the user has approved the router on the tokens
  const [approvalA, approveACallback] = useApproveCallback(
    chainId,
    parsedAmounts[WeightedField.CURRENCY_A],
    ROUTER_ADDRESS[chainId],
  )
  const [approvalB, approveBCallback] = useApproveCallback(
    chainId,
    parsedAmounts[WeightedField.CURRENCY_B],
    ROUTER_ADDRESS[chainId],
  )

  const addTransaction = useTransactionAdder()

  async function onAdd() {
    if (!chainId || !library || !account) return
    const pairManager = getPairManagerContract(chainId, library, account)

    const { [WeightedField.CURRENCY_A]: parsedAmountA, [WeightedField.CURRENCY_B]: parsedAmountB } = parsedAmounts
    if (!parsedAmountA || !parsedAmountB || !currencyA || !currencyB || !deadline) {
      return
    }

    const amountsMin = {
      [WeightedField.CURRENCY_A]: calculateSlippageAmount(parsedAmountA, noLiquidity ? 0 : allowedSlippage)[0],
      [WeightedField.CURRENCY_B]: calculateSlippageAmount(parsedAmountB, noLiquidity ? 0 : allowedSlippage)[0],
    }

    let estimate
    let method: (...args: any) => Promise<TransactionResponse>
    let args: Array<string | string[] | number>
    let value: BigNumber | null
    if (currencyA === NETWORK_CCY[chainId] || currencyB === NETWORK_CCY[chainId]) {
      const tokenBIsETH = currencyB === NETWORK_CCY[chainId]
      estimate = pairManager.estimateGas.addLiquidityETH
      method = pairManager.addLiquidityETH
      args = [
        wrappedCurrency(tokenBIsETH ? currencyA : currencyB, chainId)?.address ?? '', // token
        (tokenBIsETH ? parsedAmountA : parsedAmountB).raw.toString(), // token desired
        amountsMin[tokenBIsETH ? WeightedField.CURRENCY_A : WeightedField.CURRENCY_B].toString(), // token min
        amountsMin[tokenBIsETH ? WeightedField.CURRENCY_B : WeightedField.CURRENCY_A].toString(), // eth min
        account,
        deadline.toHexString(),
      ]
      value = BigNumber.from((tokenBIsETH ? parsedAmountB : parsedAmountA).raw.toString())
    } else {
      estimate = pairManager.estimateGas.addLiquidity
      method = pairManager.addLiquidity
      args = [
        wrappedCurrency(currencyA, chainId)?.address ?? '',
        wrappedCurrency(currencyB, chainId)?.address ?? '',
        parsedAmountA.raw.toString(),
        parsedAmountB.raw.toString(),
        amountsMin[WeightedField.CURRENCY_A].toString(),
        amountsMin[WeightedField.CURRENCY_B].toString(),
        account,
        deadline.toHexString(),
      ]
      value = null
    }

    setAttemptingTxn(true)
    await estimate(...args, value ? { value } : {})
      .then((estimatedGasLimit) =>
        method(...args, {
          ...(value ? { value } : {}),
          gasLimit: calculateGasMargin(estimatedGasLimit),
          gasPrice,
        }).then((response) => {
          setAttemptingTxn(false)

          addTransaction(response, {
            summary: `Add ${parsedAmounts[WeightedField.CURRENCY_A]?.toSignificant(3)} ${currencies[WeightedField.CURRENCY_A]?.symbol
              } and ${parsedAmounts[WeightedField.CURRENCY_B]?.toSignificant(3)} ${currencies[WeightedField.CURRENCY_B]?.symbol}`,
          })

          setTxHash(response.hash)
        }),
      )
      .catch((err) => {
        setAttemptingTxn(false)
        // we only care if the error is something _other_ than the user rejected the tx
        if (err?.code !== 4001) {
          console.error(err)
        }
      })
  }

  const modalHeader = () => {
    return noLiquidity ? (
      <Flex alignItems="center">
        <Text fontSize="48px" marginRight="10px">
          {`${currencies[WeightedField.CURRENCY_A]?.symbol}/${currencies[WeightedField.CURRENCY_B]?.symbol}`}
        </Text>
        <DoubleCurrencyLogo
          chainId={chainId}
          currency0={currencies[WeightedField.CURRENCY_A]}
          currency1={currencies[WeightedField.CURRENCY_B]}
          size={30}
        />
      </Flex>
    ) : (
      <AutoColumn>
        <Flex alignItems="center">
          <Text fontSize="48px" marginRight="10px">
            {liquidityMinted?.toSignificant(6)}
          </Text>
          <DoubleCurrencyLogo
            chainId={chainId}
            currency0={currencies[WeightedField.CURRENCY_A]}
            currency1={currencies[WeightedField.CURRENCY_B]}
            size={30}
          />
        </Flex>
        <Row>
          <Text fontSize="24px">
            {`${currencies[WeightedField.CURRENCY_A]?.symbol}/${currencies[WeightedField.CURRENCY_B]?.symbol} Pool Tokens`}
          </Text>
        </Row>
        <Text small textAlign="left" my="24px">
          {t('Output is estimated. If the price changes by more than %slippage%% your transaction will revert.', {
            slippage: allowedSlippage / 100,
          })}
        </Text>
      </AutoColumn>
    )
  }

  const modalBottom = () => {
    return (
      <ConfirmAddModalBottom
        chainId={chainId}
        price={price}
        currencies={currencies}
        parsedAmounts={parsedAmounts}
        noLiquidity={noLiquidity}
        onAdd={onAdd}
        poolTokenPercentage={poolTokenPercentage}
      />
    )
  }

  const pendingText = t('Supplying %amountA% %symbolA% and %amountB% %symbolB%', {
    amountA: parsedAmounts[WeightedField.CURRENCY_A]?.toSignificant(6) ?? '',
    symbolA: currencies[WeightedField.CURRENCY_A]?.symbol ?? '',
    amountB: parsedAmounts[WeightedField.CURRENCY_B]?.toSignificant(6) ?? '',
    symbolB: currencies[WeightedField.CURRENCY_B]?.symbol ?? '',
  })

  const handleCurrencyASelect = useCallback(
    (currencyA_: Currency) => {
      const newCurrencyIdA = currencyId(chainId, currencyA_)
      if (newCurrencyIdA === currencyIdB) {
        history.push(`/addV2/${currencyIdB}/${currencyIdA}`)
      } else {
        history.push(`/addV2/${newCurrencyIdA}/${currencyIdB}`)
      }
    },
    [chainId, currencyIdB, history, currencyIdA],
  )
  const handleCurrencyBSelect = useCallback(
    (currencyB_: Currency) => {
      const newCurrencyIdB = currencyId(chainId, currencyB_)
      if (currencyIdA === newCurrencyIdB) {
        if (currencyIdB) {
          history.push(`/addV2/${currencyIdB}/${newCurrencyIdB}`)
        } else {
          history.push(`/addV2/${newCurrencyIdB}`)
        }
      } else {
        history.push(`/addV2/${currencyIdA || NETWORK_CCY[chainId].symbol}/${newCurrencyIdB}`)
      }
    },
    [chainId, currencyIdA, history, currencyIdB],
  )

  const handleDismissConfirmation = useCallback(() => {
    // if there was a tx hash, we want to clear the input
    if (txHash) {
      onFieldAInput('')
    }
    setTxHash('')
  }, [onFieldAInput, txHash])

  const addIsUnsupported = useIsTransactionUnsupported(currencies?.CURRENCY_A, currencies?.CURRENCY_B)

  const [onPresentAddLiquidityModal] = useModal(
    <TransactionConfirmationModal
      title={noLiquidity ? t('You are creating a pool') : t('You will receive')}
      customOnDismiss={handleDismissConfirmation}
      attemptingTxn={attemptingTxn}
      hash={txHash}
      content={() => <ConfirmationModalContent topContent={modalHeader} bottomContent={modalBottom} />}
      pendingText={pendingText}
      currencyToAdd={weightedPair?.liquidityToken}
    />,
    true,
    true,
    'addLiquidityModal',
  )

  enum LiquidityState {
    STANDARD,
    STABLE,
  }

  const [liquidityState, setLiquidityState] = useState<LiquidityState>(LiquidityState.STANDARD)
  const handleClick = (newIndex: LiquidityState) => setLiquidityState(newIndex)

  return (
    <Page>
      <Row width='200px' height='50px'>
        {/* <ButtonMenu activeIndex={liquidityState} onItemClick={handleClick} scale="sm" ml="24px"> */}
        <Button
          as={Link}
          to='/add'
          variant="primary"
          width="100%"
          mb="8px"
        >
          Pairs
        </Button>
        <Button
          as={Link}
          to='/add/stable'
          variant="secondary"
          width="100%"
          mb="8px"
        >
          Stables
        </Button>
        {/* </ButtonMenu> */}
      </Row>
      <AppBody>
        <AppHeader
          title={t('Add Liquidity')}
          subtitle={
            t('Add liquidity to receive LP tokens')
          }
          helper={t(
            'Liquidity providers earn a trading fee on all trades made for that token pair, proportional to their share of the liquidity pool.',
          )}
          backTo="/pool"
        />
        <CardBody>
          <AutoColumn gap="20px">
            {noLiquidity && (
              <ColumnCenter>
                <Message variant="warning">
                  <div>
                    <Text bold mb="8px">
                      {t('You are the first liquidity provider.')}
                    </Text>
                    <Text mb="8px">{t('The ratio of tokens you add will set the price of this pool.')}</Text>
                    <Text>{t('Once you are happy with the rate click supply to review.')}</Text>
                  </div>
                </Message>
              </ColumnCenter>
            )}
            <Box>
              <Flex flexDirection="row" justifyContent='space-between' alignItems="center" grid-row-gap='10px'>
                <span>
                  <CurrencyInputPanel
                    borderRadius='5px'
                    width='300px'
                    value={formattedAmounts[WeightedField.CURRENCY_A]}
                    onUserInput={onFieldAInput}
                    onMax={() => {
                      onFieldAInput(maxAmounts[WeightedField.CURRENCY_A]?.toExact() ?? '')
                    }}
                    onCurrencySelect={handleCurrencyASelect}
                    showMaxButton={!atMaxAmounts[WeightedField.CURRENCY_A]}
                    currency={currencies[WeightedField.CURRENCY_A]}
                    id="add-liquidity-input-tokena"
                    showCommonBases
                  />
                </span>
                <ChevronLeftIcon width="16px" />
                <span>
                  <PercentageInputPanel
                    borderRadius='5px'
                    width='30%'
                    value={weights[WeightedField.WEIGHT_A]}
                    onUserInput={onWeightAInput}
                    label={`Weight ${currencies[WeightedField.CURRENCY_A]?.symbol ?? ''}`}
                    id='weight0'
                    onHover
                  />
                </span>
              </Flex>
            </Box>
            <ColumnCenter>
              <Box>
              <Flex flexDirection="row" justifyContent='space-between' alignItems="center" grid-row-gap='10px'>
                <span>
                  <AddIcon width="16px" />
                </span>
                <span>
                  <BpsInputPanel
                    borderRadius='5px'
                    width='5%'
                    value={fee}
                    onUserInput={onFeeInput}
                    label='Fee'
                    id='weight0'
                    onHover
                  />
                </span>
                </Flex>
              </Box>
            </ColumnCenter>
            <Flex flexDirection="row" justifyContent='space-between' alignItems="center" grid-row-gap='10px' >
              <span>
                <CurrencyInputPanel
                  borderRadius='5px'
                  width='300px'
                  value={formattedAmounts[WeightedField.CURRENCY_B]}
                  onUserInput={onFieldBInput}
                  onCurrencySelect={handleCurrencyBSelect}
                  onMax={() => {
                    onFieldBInput(maxAmounts[WeightedField.CURRENCY_B]?.toExact() ?? '')
                  }}
                  showMaxButton={!atMaxAmounts[WeightedField.CURRENCY_B]}
                  currency={currencies[WeightedField.CURRENCY_B]}
                  id="add-liquidity-input-tokenb"
                  showCommonBases
                />
              </span>
              <ChevronLeftIcon width="16px" />
              <span>
                <PercentageInputPanel
                  borderRadius='5px'
                  width='30%'
                  value={weights[WeightedField.WEIGHT_B]}
                  onUserInput={onWeightBInput}
                  label={`Weight ${currencies[WeightedField.CURRENCY_B]?.symbol ?? ''}`}
                  id='weight0'
                  onHover
                />
              </span>
            </Flex>
            {currencies[WeightedField.CURRENCY_A] && currencies[WeightedField.CURRENCY_B] && weightedPairState !== WeightedPairState.INVALID && (
              <>
                <LightCard padding="0px" borderRadius="20px">
                  <RowBetween padding="1rem">
                    <Text fontSize="14px">
                      {noLiquidity ? t('Initial prices and pool share') : t('Prices and pool share')}
                    </Text>
                  </RowBetween>{' '}
                  <LightCard padding="1rem" borderRadius="20px">
                    <PoolPriceBar
                      currencies={currencies}
                      poolTokenPercentage={poolTokenPercentage}
                      noLiquidity={noLiquidity}
                      price={price}
                    />
                  </LightCard>
                </LightCard>
              </>
            )}

            {addIsUnsupported ? (
              <Button disabled mb="4px">
                {t('Unsupported Asset')}
              </Button>
            ) : !account ? (
              <ConnectWalletButton />
            ) : (
              <AutoColumn gap="md">
                {(approvalA === ApprovalState.NOT_APPROVED ||
                  approvalA === ApprovalState.PENDING ||
                  approvalB === ApprovalState.NOT_APPROVED ||
                  approvalB === ApprovalState.PENDING) &&
                  isValid && (
                    <RowBetween>
                      {approvalA !== ApprovalState.APPROVED && (
                        <Button
                          onClick={approveACallback}
                          disabled={approvalA === ApprovalState.PENDING}
                          width={approvalB !== ApprovalState.APPROVED ? '48%' : '100%'}
                        >
                          {approvalA === ApprovalState.PENDING ? (
                            <Dots>{t('Enabling %asset%', { asset: currencies[WeightedField.CURRENCY_A]?.symbol })}</Dots>
                          ) : (
                            t('Enable %asset%', { asset: currencies[WeightedField.CURRENCY_A]?.symbol })
                          )}
                        </Button>
                      )}
                      {approvalB !== ApprovalState.APPROVED && (
                        <Button
                          onClick={approveBCallback}
                          disabled={approvalB === ApprovalState.PENDING}
                          width={approvalA !== ApprovalState.APPROVED ? '48%' : '100%'}
                        >
                          {approvalB === ApprovalState.PENDING ? (
                            <Dots>{t('Enabling %asset%', { asset: currencies[WeightedField.CURRENCY_B]?.symbol })}</Dots>
                          ) : (
                            t('Enable %asset%', { asset: currencies[WeightedField.CURRENCY_B]?.symbol })
                          )}
                        </Button>
                      )}
                    </RowBetween>
                  )}
                <Button
                  variant={
                    !isValid && !!parsedAmounts[WeightedField.CURRENCY_A] && !!parsedAmounts[WeightedField.CURRENCY_B]
                      ? 'danger'
                      : 'primary'
                  }
                  onClick={() => {
                    if (expertMode) {
                      onAdd()
                    } else {
                      onPresentAddLiquidityModal()
                    }
                  }}
                  disabled={!isValid || approvalA !== ApprovalState.APPROVED || approvalB !== ApprovalState.APPROVED}
                >
                  {error ?? t('Supply')}
                </Button>
              </AutoColumn>
            )}
          </AutoColumn>

        </CardBody>
      </AppBody>
      {!addIsUnsupported ? (
        weightedPair && !noLiquidity && weightedPairState !== WeightedPairState.INVALID ? (
          <AutoColumn style={{ minWidth: '20rem', width: '100%', maxWidth: '400px', marginTop: '1rem' }}>
            <MinimalWeightedPositionCard showUnwrapped={oneCurrencyIsWETH} weightedPair={weightedPair} />
          </AutoColumn>
        ) : null
      ) : (
        <UnsupportedCurrencyFooter chainId={chainId} currencies={[currencies.CURRENCY_A, currencies.CURRENCY_B]} />
      )}
    </Page>
  )
}
