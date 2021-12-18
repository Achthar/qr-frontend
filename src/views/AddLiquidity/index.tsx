import React, { useCallback, useState, useMemo } from 'react'
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
  REQUIEM_PAIR_MANAGER
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
  ChevronLeftIcon,
  ArrowUpIcon,
  Box
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
import { STANDARD_FEES, STANDARD_WEIGHTS } from 'config/constants'

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
import { PairState } from 'hooks/usePairs'
import { useCurrency } from 'hooks/Tokens'
import { ApprovalState, useApproveCallback } from 'hooks/useApproveCallback'
import useTransactionDeadline from 'hooks/useTransactionDeadline'
import { WeightedField } from 'state/mintWeightedPair/actions'
import { useDerivedMintWeightedPairInfo, useMintWeightedPairActionHandlers, useMintWeightedPairState } from 'state/mintWeightedPair/hooks'
import { WeightedPairState, useWeightedPairsExist } from 'hooks/useWeightedPairs'
import { useTransactionAdder } from 'state/transactions/hooks'
import { useGasPrice, useIsExpertMode, useUserSlippageTolerance } from 'state/user/hooks'
import { calculateGasMargin, calculateSlippageAmount, getPairManagerContract } from 'utils'
import { maxAmountSpend } from 'utils/maxAmountSpend'
import { wrappedCurrency } from 'utils/wrappedCurrency'
import { weightedPairAddresses } from 'utils/weightedPairAddresses'
import Dots from 'components/Loader/Dots'
import { currencyId } from 'utils/currencyId'
import ConfirmAddModalBottom from './ConfirmAddModalBottom'
import PoolPriceBar from './PoolPriceBar'
import Page from '../Page'

const StyledButton = styled(Button)`
  background-color: ${({ theme }) => theme.colors.input};
  color: ${({ theme }) => theme.colors.text};
  box-shadow: none;
  border-radius: 16px;
  width: 80%;
  align: right;
`


export default function AddLiquidity({
  match: {
    params: { weightA, weightB, fee, currencyIdA, currencyIdB },
  },
  history,
}: RouteComponentProps<{ weightA: string, weightB, fee: string, currencyIdA?: string; currencyIdB?: string }>) {
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
    fee: _fee
  } = useDerivedMintWeightedPairInfo(currencyA ?? undefined, currencyB ?? undefined)

  const {
    onFieldAInput,
    onFieldBInput,
    onWeightAInput,
    onWeightBInput,
    onFeeInput
  } = useMintWeightedPairActionHandlers(noLiquidity)

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
    REQUIEM_PAIR_MANAGER[chainId],
  )
  const [approvalB, approveBCallback] = useApproveCallback(
    chainId,
    parsedAmounts[WeightedField.CURRENCY_B],
    REQUIEM_PAIR_MANAGER[chainId],
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

    // we have to differentiate between addLiquidity and createPair (which also does directly add liquidity)
    if (!noLiquidity) {
      // case of network CCY
      if (currencyA === NETWORK_CCY[chainId] || currencyB === NETWORK_CCY[chainId]) {
        const tokenBIsETH = currencyB === NETWORK_CCY[chainId]
        estimate = pairManager.estimateGas.addLiquidityETH
        method = pairManager.addLiquidityETH
        args = [
          weightedPair.liquidityToken.address ?? '',
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
          weightedPair.liquidityToken.address ?? '',
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
    } // no liquidity available - create pair
    else {
      // eslint-disable-next-line no-lonely-if
      if (currencyA === NETWORK_CCY[chainId] || currencyB === NETWORK_CCY[chainId]) {
        const tokenBIsETH = currencyB === NETWORK_CCY[chainId]
        estimate = pairManager.estimateGas.createPairETH
        method = pairManager.createPairETH
        args = [
          wrappedCurrency(tokenBIsETH ? currencyA : currencyB, chainId)?.address ?? '', // token
          (tokenBIsETH ? parsedAmountA : parsedAmountB).raw.toString(), // token desired
          weights[tokenBIsETH ? WeightedField.WEIGHT_B : WeightedField.WEIGHT_A], // weight Token A
          _fee, // _fee
          account
        ]
        value = BigNumber.from((tokenBIsETH ? parsedAmountB : parsedAmountA).raw.toString())
      } else {
        estimate = pairManager.estimateGas.createPair
        method = pairManager.createPair
        args = [
          wrappedCurrency(currencyA, chainId)?.address ?? '',
          wrappedCurrency(currencyB, chainId)?.address ?? '',
          parsedAmountA.raw.toString(),
          parsedAmountB.raw.toString(),
          weights[WeightedField.WEIGHT_A], // weight Token A
          _fee, // _fee
          account
        ]
        value = null
      }
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


  const addressesRange = useMemo(
    () =>
      currencyA && currencyB ? weightedPairAddresses(wrappedCurrency(currencyA, chainId), wrappedCurrency(currencyB, chainId), STANDARD_WEIGHTS, STANDARD_FEES) : {}
    ,
    [currencyA, currencyB, chainId]
  )

  const allConstellations = useWeightedPairsExist(chainId, Object.values(addressesRange) ?? ['0xfcD5aB89AFB2280a9ff98DAaa2749C6D11aB4161'], 99999)


  const constellation = useMemo(() =>
    Object.keys(addressesRange).filter(x => { return allConstellations[addressesRange[x]] === 1 }),
    [addressesRange, allConstellations]
  )

  // console.log("constellations", constellation)

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
        history.push(`/add/${weightB}-${currencyId(chainId, currencyA_)}/${weightA}-${currencyIdA}/${_fee}`)
      } else {
        history.push(`/add/${weightA}-${newCurrencyIdA}/${weightB}-${currencyIdB}/${_fee}`)
      }
    },
    [chainId, currencyIdB, history, currencyIdA, weightA, weightB, _fee],
  )
  const handleCurrencyBSelect = useCallback(
    (currencyB_: Currency) => {
      const newCurrencyIdB = currencyId(chainId, currencyB_)
      if (currencyIdA === newCurrencyIdB) {
        if (currencyIdB) {
          history.push(`/add/${weightB}-${currencyIdB}/${weightA}-${newCurrencyIdB}/${_fee}`)
        } else {
          history.push(`/add/${weightB}-${newCurrencyIdB}/${_fee}`)
        }
      } else {
        history.push(`/add/${weightA}-${currencyIdA || NETWORK_CCY[chainId].symbol}/${weightB}-${newCurrencyIdB}/${_fee}`)
      }
    },
    [chainId, currencyIdA, history, currencyIdB, weightA, weightB, _fee],
  )

  const handleWeightASelect = useCallback(
    (weight: string) => {

      history.push(`/add/${weight}-${currencyIdA}/${String(100 - Number(weight))}-${currencyIdB}/${_fee}`)
    },
    [currencyIdA, currencyIdB, history, _fee],
  )

  const handleWeightBSelect = useCallback(
    (weight: string) => {

      history.push(`/add/${String(100 - Number(weight))}-${currencyIdA}/${weight}-${currencyIdB}/${_fee}`)
    },
    [currencyIdA, currencyIdB, history, _fee],
  )

  const handleFeeSelect = useCallback(
    (fee_: string) => {
      history.push(`/add/${weightA}-${currencyIdA}/${weightB}-${currencyIdB}/${fee_ === '' ? '-' : fee_}`)
    },
    [currencyIdA, currencyIdB, history, weightA, weightB],
  )


  const weightAInput
    = (typedValue_: string) => {
      onWeightAInput(typedValue_)
      handleWeightASelect(typedValue_)
    }

  const weightBInput
    = (typedValue_: string) => {
      onWeightBInput(typedValue_)
      handleWeightBSelect(typedValue_)
    }

  const feeInput = (typedValue_: string) => {
    handleFeeSelect(typedValue_)
    onFeeInput(typedValue_)
  }

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

  return (
    <Page>
      <Row width='200px' height='50px'>
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
                    width='250px'
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
                    onUserInput={
                      weightAInput
                    }
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
                      width='30pxs'
                      value={fee === '-' ? '' : fee}
                      onUserInput={feeInput}
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
                  width='250px'
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
                  onUserInput={weightBInput}
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
          {constellation.length > 0 && (
            <Box>
              <AutoColumn gap="sm" justify="center">
                <Text bold fontSize='15px'>
                  Available constellations
                </Text>
                {constellation.map((id) => (
                  <Flex flexDirection="row" justifyContent='space-between' alignItems="center" grid-row-gap='10px' marginRight='5px' marginLeft='5px'>
                    <AutoColumn>
                      <Text fontSize='13px' width='100px'>
                        {`${currencyA.symbol} ${id.split('-', 2)[0]}%`}
                      </Text>
                      <Text fontSize='13px' width='100px'>
                        {`${currencyB.symbol} ${100 - Number(id.split('-', 2)[0])}%`}
                      </Text>
                    </AutoColumn>
                    <Text fontSize='13px' width='30px' marginLeft='20px' marginRight='20px'>
                      {`Fee ${id.split('-', 2)[1]}Bps`}
                    </Text>
                    <StyledButton
                      height='20px'
                      endIcon={<ArrowUpIcon />}
                      onClick={() => {
                        feeInput(id.split('-', 2)[1])
                        weightAInput(id.split('-', 2)[0])
                      }}
                    >
                      <Text fontSize='15px'>
                        Set
                      </Text>
                    </StyledButton>
                  </Flex>
                ))}
              </AutoColumn>
            </Box>
          )}
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
