import React, { useCallback, useMemo, useState } from 'react'
import styled from 'styled-components'
import { TransactionResponse } from '@ethersproject/providers'
import { Currency, currencyEquals, NETWORK_CCY, Percent, WRAPPED_NETWORK_TOKENS } from '@requiemswap/sdk'
import { Button, Text, AddIcon, ArrowDownIcon, CardBody, Slider, Box, Flex, useModal } from '@requiemswap/uikit'
import { RouteComponentProps } from 'react-router'
import { BigNumber } from '@ethersproject/bignumber'
import { useTranslation } from 'contexts/Localization'
import getChain from 'utils/getChain'
import { deserializeToken, serializeToken } from 'state/user/hooks/helpers'
import useRefresh from 'hooks/useRefresh'
import { useGetWeightedPairsState } from 'hooks/useGetWeightedPairsState'
import { AutoColumn, ColumnCenter } from '../../components/Layout/Column'
import TransactionConfirmationModal, { ConfirmationModalContent } from '../../components/TransactionConfirmationModal'
import CurrencyInputPanel from '../../components/CurrencyInputPanel'
import { MinimalPositionCard } from '../../components/PositionCard'
import { AppHeader, AppBody } from '../../components/App'
import { RowBetween, RowFixed } from '../../components/Layout/Row'
import ConnectWalletButton from '../../components/ConnectWalletButton'
import { LightGreyCard } from '../../components/Card'

import { CurrencyLogo, DoubleCurrencyLogo } from '../../components/Logo'
import { REQUIEM_PAIR_MANAGER, SWAP_ROUTER } from '../../config/constants'
import useActiveWeb3React from '../../hooks/useActiveWeb3React'
import { useCurrency } from '../../hooks/Tokens'
import useTransactionDeadline from '../../hooks/useTransactionDeadline'

import { useTransactionAdder } from '../../state/transactions/hooks'
import StyledInternalLink from '../../components/Links'
import { calculateGasMargin, calculateSlippageAmount, getPairManagerContract } from '../../utils'
import { currencyId } from '../../utils/currencyId'
import useDebouncedChangeHandler from '../../hooks/useDebouncedChangeHandler'
import { wrappedCurrency } from '../../utils/wrappedCurrency'
import { useApproveCallback, ApprovalState } from '../../hooks/useApproveCallback'
import Dots from '../../components/Loader/Dots'
import { useBurnActionHandlers, useDerivedBurnInfo, useBurnState } from '../../state/burn/hooks'

import { Field } from '../../state/burn/actions'
import { useGasPrice, useUserSlippageTolerance } from '../../state/user/hooks'
import Page from '../Page'

const BorderCard = styled.div`
  border: solid 1px ${({ theme }) => theme.colors.cardBorder};
  border-radius: 16px;
  padding: 16px;
`

export default function RemoveLiquidity({
  history,
  match: {
    params: { chain, weightA, weightB, currencyIdA, currencyIdB },
  },
}: RouteComponentProps<{ chain: string, weightA: string, weightB: string, currencyIdA: string; currencyIdB: string }>) {

  const { account, chainId, library } = useActiveWeb3React()

  const [currencyA, currencyB] = [useCurrency(chainId, currencyIdA) ?? undefined, useCurrency(chainId, currencyIdB) ?? undefined]
  const [tokenA, tokenB] = useMemo(
    () => [wrappedCurrency(currencyA, chainId), wrappedCurrency(currencyB, chainId)],
    [currencyA, currencyB, chainId],
  )

  const { t } = useTranslation()
  const gasPrice = useGasPrice(chainId)

  // burn state
  const { independentField, typedValue } = useBurnState()


  const { slowRefresh, fastRefresh } = useRefresh()

  // first, we fetch all weighted pairs from the state
  // and add some, if not yet included
  const {
    pairs,
    balances: userBalances,
    userBalancesLoaded,
    totalSupply: supplyLp
  } = useGetWeightedPairsState(chainId, account, tokenA && tokenB ? [{ token0: serializeToken(tokenA), token1: deserializeToken(tokenA) }] : [], slowRefresh, fastRefresh)



  const {
    pair,
    parsedAmounts,
    error
  } = useDerivedBurnInfo(chainId, account, currencyA ?? undefined, currencyB ?? undefined, weightA, pairs, userBalances, supplyLp, userBalancesLoaded)

  const { onUserInput: _onUserInput } = useBurnActionHandlers()
  const isValid = !error

  // modal and loading
  const [showDetailed, setShowDetailed] = useState<boolean>(false)
  const [attemptingTxn, setAttemptingTxn] = useState(false) // clicked confirm

  // txn values
  const [txHash, setTxHash] = useState<string>('')
  const deadline = useTransactionDeadline(chainId)
  const [allowedSlippage] = useUserSlippageTolerance()

  const formattedAmounts = useMemo(() => {
    return {
      [Field.LIQUIDITY_PERCENT]: parsedAmounts[Field.LIQUIDITY_PERCENT].equalTo('0')
        ? '0'
        : parsedAmounts[Field.LIQUIDITY_PERCENT].lessThan(new Percent('1', '100'))
          ? '<1'
          : parsedAmounts[Field.LIQUIDITY_PERCENT].toFixed(0),
      [Field.LIQUIDITY]:
        independentField === Field.LIQUIDITY ? typedValue : parsedAmounts[Field.LIQUIDITY]?.toSignificant(6) ?? '',
      [Field.CURRENCY_A]:
        independentField === Field.CURRENCY_A ? typedValue : parsedAmounts[Field.CURRENCY_A]?.toSignificant(6) ?? '',
      [Field.CURRENCY_B]:
        independentField === Field.CURRENCY_B ? typedValue : parsedAmounts[Field.CURRENCY_B]?.toSignificant(6) ?? '',
    }
  }, [parsedAmounts, typedValue, independentField])

  const atMaxAmount = parsedAmounts[Field.LIQUIDITY_PERCENT]?.equalTo(new Percent('1'))

  // allowance handling
  const [signatureData, setSignatureData] = useState<{ v: number; r: string; s: string; deadline: number } | null>(null)
  const [approval, approveCallback] = useApproveCallback(chainId, account, parsedAmounts[Field.LIQUIDITY], SWAP_ROUTER[chainId])

  // wrapped onUserInput to clear signatures
  const onUserInput = useCallback(
    (field: Field, value: string) => {
      setSignatureData(null)
      return _onUserInput(field, value)
    },
    [_onUserInput],
  )

  const onLiquidityInput = useCallback((value: string): void => onUserInput(Field.LIQUIDITY, value), [onUserInput])
  const onCurrencyAInput = useCallback((value: string): void => onUserInput(Field.CURRENCY_A, value), [onUserInput])
  const onCurrencyBInput = useCallback((value: string): void => onUserInput(Field.CURRENCY_B, value), [onUserInput])

  // tx sending
  const addTransaction = useTransactionAdder()

  async function onRemove() {
    if (!chainId || !library || !account || !deadline) throw new Error('missing dependencies')
    const { [Field.CURRENCY_A]: currencyAmountA, [Field.CURRENCY_B]: currencyAmountB } = parsedAmounts
    if (!currencyAmountA || !currencyAmountB) {
      throw new Error('missing currency amounts')
    }
    const pairManager = getPairManagerContract(chainId, library, account)

    const amountsMin = {
      [Field.CURRENCY_A]: calculateSlippageAmount(currencyAmountA, allowedSlippage)[0],
      [Field.CURRENCY_B]: calculateSlippageAmount(currencyAmountB, allowedSlippage)[0],
    }

    if (!currencyA || !currencyB) throw new Error('missing tokens')
    const liquidityAmount = parsedAmounts[Field.LIQUIDITY]
    if (!liquidityAmount) throw new Error('missing liquidity amount')

    const currencyBIsETH = currencyB === NETWORK_CCY[chainId]
    const oneCurrencyIsETH = currencyA === NETWORK_CCY[chainId] || currencyBIsETH

    if (!tokenA || !tokenB) throw new Error('could not wrap')

    let methodNames: string[]
    let args: Array<string | string[] | number | boolean>
    // we have approval, use normal remove liquidity
    if (approval === ApprovalState.APPROVED) {
      // removeLiquidityETH
      if (oneCurrencyIsETH) {
        methodNames = ['removeLiquidityETH', 'removeLiquidityETHSupportingFeeOnTransferTokens']
        args = [
          pair.liquidityToken.address,
          currencyBIsETH ? tokenA.address : tokenB.address,
          liquidityAmount.raw.toString(),
          amountsMin[currencyBIsETH ? Field.CURRENCY_A : Field.CURRENCY_B].toString(),
          amountsMin[currencyBIsETH ? Field.CURRENCY_B : Field.CURRENCY_A].toString(),
          account,
          deadline.toHexString(),
        ]
      }
      // removeLiquidity
      else {
        methodNames = ['removeLiquidity']
        args = [
          pair.liquidityToken.address,
          tokenA.address,
          tokenB.address,
          liquidityAmount.raw.toString(),
          amountsMin[Field.CURRENCY_A].toString(),
          amountsMin[Field.CURRENCY_B].toString(),
          account,
          deadline.toHexString(),
        ]
      }
    }
    // we have a signature, use permit versions of remove liquidity
    else if (signatureData !== null) {
      // removeLiquidityETHWithPermit
      if (oneCurrencyIsETH) {
        methodNames = ['removeLiquidityETHWithPermit', 'removeLiquidityETHWithPermitSupportingFeeOnTransferTokens']
        args = [
          pair.liquidityToken.address,
          currencyBIsETH ? tokenA.address : tokenB.address,
          liquidityAmount.raw.toString(),
          amountsMin[currencyBIsETH ? Field.CURRENCY_A : Field.CURRENCY_B].toString(),
          amountsMin[currencyBIsETH ? Field.CURRENCY_B : Field.CURRENCY_A].toString(),
          account,
          signatureData.deadline,
          false,
          signatureData.v,
          signatureData.r,
          signatureData.s,
        ]
      }
      // removeLiquidityETHWithPermit
      else {
        methodNames = ['removeLiquidityWithPermit']
        args = [
          pair.liquidityToken.address,
          tokenA.address,
          tokenB.address,
          liquidityAmount.raw.toString(),
          amountsMin[Field.CURRENCY_A].toString(),
          amountsMin[Field.CURRENCY_B].toString(),
          account,
          signatureData.deadline,
          false,
          signatureData.v,
          signatureData.r,
          signatureData.s,
        ]
      }
    } else {
      throw new Error('Attempting to confirm without approval or a signature. Please contact support.')
    }

    const safeGasEstimates: (BigNumber | undefined)[] = await Promise.all(
      methodNames.map((methodName) =>
        pairManager.estimateGas[methodName](...args)
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
      await pairManager[methodName](...args, {
        gasLimit: safeGasEstimate,
        gasPrice,
      })
        .then((response: TransactionResponse) => {
          setAttemptingTxn(false)

          addTransaction(response, {
            summary: `Remove ${parsedAmounts[Field.CURRENCY_A]?.toSignificant(3)} ${currencyA?.symbol
              } and ${parsedAmounts[Field.CURRENCY_B]?.toSignificant(3)} ${currencyB?.symbol}`,
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
          <Text fontSize="24px">{parsedAmounts[Field.CURRENCY_A]?.toSignificant(6)}</Text>
          <RowFixed gap="4px">
            <CurrencyLogo chainId={chainId} currency={currencyA} size="24px" />
            <Text fontSize="24px" ml="10px">
              {currencyA?.symbol}
            </Text>
          </RowFixed>
        </RowBetween>
        <RowFixed>
          <AddIcon width="16px" />
        </RowFixed>
        <RowBetween align="flex-end">
          <Text fontSize="24px">{parsedAmounts[Field.CURRENCY_B]?.toSignificant(6)}</Text>
          <RowFixed gap="4px">
            <CurrencyLogo chainId={chainId} currency={currencyB} size="24px" />
            <Text fontSize="24px" ml="10px">
              {currencyB?.symbol}
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

  function modalBottom() {
    return (
      <>
        <RowBetween>
          <Text>
            {t('%assetA%/%assetB% Burned', { assetA: currencyA?.symbol ?? '', assetB: currencyB?.symbol ?? '' })}
          </Text>
          <RowFixed>
            <DoubleCurrencyLogo chainId={chainId} currency0={currencyA} currency1={currencyB} margin />
            <Text>{parsedAmounts[Field.LIQUIDITY]?.toSignificant(6)}</Text>
          </RowFixed>
        </RowBetween>
        {pair && (
          <>
            <RowBetween>
              <Text>{t('Price')}</Text>
              <Text>
                1 {currencyA?.symbol} = {tokenA ? pair.priceOf(tokenA).toSignificant(6) : '-'} {currencyB?.symbol}
              </Text>
            </RowBetween>
            <RowBetween>
              <div />
              <Text>
                1 {currencyB?.symbol} = {tokenB ? pair.priceOf(tokenB).toSignificant(6) : '-'} {currencyA?.symbol}
              </Text>
            </RowBetween>
          </>
        )}
        <Button disabled={!(approval === ApprovalState.APPROVED || signatureData !== null)} onClick={onRemove}>
          {t('Confirm')}
        </Button>
      </>
    )
  }

  const pendingText = t('Removing %amountA% %symbolA% and %amountB% %symbolB%', {
    amountA: parsedAmounts[Field.CURRENCY_A]?.toSignificant(6) ?? '',
    symbolA: currencyA?.symbol ?? '',
    amountB: parsedAmounts[Field.CURRENCY_B]?.toSignificant(6) ?? '',
    symbolB: currencyB?.symbol ?? '',
  })

  const liquidityPercentChangeCallback = useCallback(
    (value: number) => {
      onUserInput(Field.LIQUIDITY_PERCENT, value.toString())
    },
    [onUserInput],
  )

  const oneCurrencyIsETH = currencyA === NETWORK_CCY[chainId] || currencyB === NETWORK_CCY[chainId]
  const oneCurrencyIsWETH = Boolean(
    chainId &&
    ((currencyA && currencyEquals(WRAPPED_NETWORK_TOKENS[chainId], currencyA)) ||
      (currencyB && currencyEquals(WRAPPED_NETWORK_TOKENS[chainId], currencyB))),
  )

  const handleSelectCurrencyA = useCallback(
    (currency: Currency) => {
      const _chain = chain ?? getChain(chainId)
      if (currencyIdB && currencyId(chainId, currency) === currencyIdB) {
        history.push(`/${_chain}/remove/${weightB}-${currencyId(chainId, currency)}/${weightA}-${currencyIdA}`)
      } else {
        history.push(`/${_chain}/remove/${weightA}-${currencyId(chainId, currency)}/${weightB}-${currencyIdB}`)
      }
    },
    [chain, currencyIdA, currencyIdB, history, weightA, weightB, chainId],
  )
  const handleSelectCurrencyB = useCallback(
    (currency: Currency) => {
      const _chain = chain ?? getChain(chainId)
      if (currencyIdA && currencyId(chainId, currency) === currencyIdA) {
        history.push(`/${_chain}/remove/${weightB}-${currencyIdB}/${weightA}-${currencyId(chainId, currency)}`)
      } else {
        history.push(`/${_chain}/remove/${weightA}-${currencyIdA}/${weightB}-${currencyId(chainId, currency)}`)
      }
    },
    [chain, currencyIdA, currencyIdB, history, weightA, weightB, chainId],
  )

  const handleDismissConfirmation = useCallback(() => {
    setSignatureData(null) // important that we clear signature data to avoid bad sigs
    // if there was a tx hash, we want to clear the input
    if (txHash) {
      onUserInput(Field.LIQUIDITY_PERCENT, '0')
    }
    setTxHash('')
  }, [onUserInput, txHash])

  const [innerLiquidityPercentage, setInnerLiquidityPercentage] = useDebouncedChangeHandler(
    Number.parseInt(parsedAmounts[Field.LIQUIDITY_PERCENT].toFixed(0)),
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
          chainId={chainId}
          account={account}
          backTo={`/${chain}/liquidity`}
          title={`Remove\n ${weightA}-${currencyA?.symbol ?? ''}/${weightB}-${currencyB?.symbol ?? ''} liquidity`}
          subtitle={`To receive ${currencyA?.symbol} and ${currencyB?.symbol}`}
          noConfig
        />

        <CardBody>
          <AutoColumn gap="20px">
            <RowBetween>
              <Text>{t('Amount')}</Text>
              <Button variant="text" scale="sm" onClick={() => setShowDetailed(!showDetailed)}>
                {showDetailed ? t('Simple') : t('Detailed')}
              </Button>
            </RowBetween>
            {!showDetailed && (
              <BorderCard>
                <Text fontSize="40px" bold mb="16px" style={{ lineHeight: 1 }}>
                  {formattedAmounts[Field.LIQUIDITY_PERCENT]}%
                </Text>
                <Slider
                  name="lp-amount"
                  min={0}
                  max={100}
                  value={innerLiquidityPercentage}
                  onValueChanged={(value) => setInnerLiquidityPercentage(Math.ceil(value))}
                  mb="16px"
                />
                <Flex flexWrap="wrap" justifyContent="space-evenly">
                  <Button variant="tertiary" scale="sm" onClick={() => onUserInput(Field.LIQUIDITY_PERCENT, '25')}>
                    25%
                  </Button>
                  <Button variant="tertiary" scale="sm" onClick={() => onUserInput(Field.LIQUIDITY_PERCENT, '50')}>
                    50%
                  </Button>
                  <Button variant="tertiary" scale="sm" onClick={() => onUserInput(Field.LIQUIDITY_PERCENT, '75')}>
                    75%
                  </Button>
                  <Button variant="tertiary" scale="sm" onClick={() => onUserInput(Field.LIQUIDITY_PERCENT, '100')}>
                    Max
                  </Button>
                </Flex>
              </BorderCard>
            )}
          </AutoColumn>
          {!showDetailed && (
            <>
              <ColumnCenter>
                <ArrowDownIcon color="textSubtle" width="24px" my="16px" />
              </ColumnCenter>
              <AutoColumn gap="10px">
                <Text bold color="secondary" fontSize="12px" textTransform="uppercase">
                  {t('You will receive')}
                </Text>
                <LightGreyCard>
                  <Flex justifyContent="space-between" mb="8px">
                    <Flex>
                      <CurrencyLogo chainId={chainId} currency={currencyA} />
                      <Text small color="textSubtle" id="remove-liquidity-tokena-symbol" ml="4px">
                        {currencyA?.symbol}
                      </Text>
                    </Flex>
                    <Text small>{formattedAmounts[Field.CURRENCY_A] || '-'}</Text>
                  </Flex>
                  <Flex justifyContent="space-between">
                    <Flex>
                      <CurrencyLogo chainId={chainId} currency={currencyB} />
                      <Text small color="textSubtle" id="remove-liquidity-tokenb-symbol" ml="4px">
                        {currencyB?.symbol}
                      </Text>
                    </Flex>
                    <Text small>{formattedAmounts[Field.CURRENCY_B] || '-'}</Text>
                  </Flex>
                  {chainId && (oneCurrencyIsWETH || oneCurrencyIsETH) ? (
                    <RowBetween style={{ justifyContent: 'flex-end', fontSize: '14px' }}>
                      {oneCurrencyIsETH ? (
                        <StyledInternalLink
                          to={`/remove/${currencyA === NETWORK_CCY[chainId] ? WRAPPED_NETWORK_TOKENS[chainId].address : currencyIdA}/${currencyB === NETWORK_CCY[chainId] ? WRAPPED_NETWORK_TOKENS[chainId].address : currencyIdB
                            }`}
                        >
                          {`Receive ${WRAPPED_NETWORK_TOKENS[chainId].symbol}`}
                        </StyledInternalLink>
                      ) : oneCurrencyIsWETH ? (
                        <StyledInternalLink
                          to={`/remove/${currencyA && currencyEquals(currencyA, WRAPPED_NETWORK_TOKENS[chainId]) ? NETWORK_CCY[chainId].symbol : currencyIdA}/${currencyB && currencyEquals(currencyB, WRAPPED_NETWORK_TOKENS[chainId]) ? NETWORK_CCY[chainId].symbol : currencyIdB
                            }`}
                        >
                          {`Receive ${NETWORK_CCY[chainId].symbol}`}
                        </StyledInternalLink>
                      ) : null}
                    </RowBetween>
                  ) : null}
                </LightGreyCard>
              </AutoColumn>
            </>
          )}

          {showDetailed && (
            <Box my="16px">
              <CurrencyInputPanel
                chainId={chainId}
                account={account}
                value={formattedAmounts[Field.LIQUIDITY]}
                onUserInput={onLiquidityInput}
                onMax={() => {
                  onUserInput(Field.LIQUIDITY_PERCENT, '100')
                }}
                showMaxButton={!atMaxAmount}
                disableCurrencySelect
                currency={pair?.liquidityToken}
                pair={pair}
                id="liquidity-amount"
                onCurrencySelect={() => null}
              />
              <ColumnCenter>
                <ArrowDownIcon width="24px" my="16px" />
              </ColumnCenter>
              <CurrencyInputPanel
                chainId={chainId}
                account={account}
                hideBalance
                value={formattedAmounts[Field.CURRENCY_A]}
                onUserInput={onCurrencyAInput}
                onMax={() => onUserInput(Field.LIQUIDITY_PERCENT, '100')}
                showMaxButton={!atMaxAmount}
                currency={currencyA}
                label={t('Output')}
                onCurrencySelect={handleSelectCurrencyA}
                id="remove-liquidity-tokena"
              />
              <ColumnCenter>
                <AddIcon width="24px" my="16px" />
              </ColumnCenter>
              <CurrencyInputPanel
                chainId={chainId}
                account={account}
                hideBalance
                value={formattedAmounts[Field.CURRENCY_B]}
                onUserInput={onCurrencyBInput}
                onMax={() => onUserInput(Field.LIQUIDITY_PERCENT, '100')}
                showMaxButton={!atMaxAmount}
                currency={currencyB}
                label={t('Output')}
                onCurrencySelect={handleSelectCurrencyB}
                id="remove-liquidity-tokenb"
              />
            </Box>
          )}
          {pair && (
            <AutoColumn gap="10px" style={{ marginTop: '16px' }}>
              <Text bold color="secondary" fontSize="12px" textTransform="uppercase">
                {t('Prices')}
              </Text>
              <LightGreyCard>
                <Flex justifyContent="space-between">
                  <Text small color="textSubtle">
                    1 {currencyA?.symbol} =
                  </Text>
                  <Text small>
                    {tokenA ? pair.priceOf(tokenA).toSignificant(6) : '-'} {currencyB?.symbol}
                  </Text>
                </Flex>
                <Flex justifyContent="space-between">
                  <Text small color="textSubtle">
                    1 {currencyB?.symbol} =
                  </Text>
                  <Text small>
                    {tokenB ? pair.priceOf(tokenB).toSignificant(6) : '-'} {currencyA?.symbol}
                  </Text>
                </Flex>
              </LightGreyCard>
            </AutoColumn>
          )}
          <Box position="relative" mt="16px">
            {!account ? (
              <ConnectWalletButton />
            ) : (
              <RowBetween>
                <Button
                  variant={approval === ApprovalState.APPROVED || signatureData !== null ? 'success' : 'primary'}
                  onClick={approveCallback} // {onAttemptToApprove}
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
                    !isValid && !!parsedAmounts[Field.CURRENCY_A] && !!parsedAmounts[Field.CURRENCY_B]
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

      {pair ? (
        <AutoColumn style={{ minWidth: '20rem', width: '100%', maxWidth: '400px', marginTop: '1rem' }}>
          <MinimalPositionCard showUnwrapped={oneCurrencyIsWETH} pair={pair} />
        </AutoColumn>
      ) : null}
    </Page>
  )
}
