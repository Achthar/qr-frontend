import React, { useCallback, useState } from 'react'
import { BigNumber } from '@ethersproject/bignumber'
import { TransactionResponse } from '@ethersproject/providers'
import { Currency, currencyEquals, ETHER, NETWORK_CCY, TokenAmount, WETH, WRAPPED_NETWORK_TOKENS } from '@pancakeswap/sdk'
import { Button, Text, Flex, AddIcon, CardBody, Message, useModal, ButtonMenu, ButtonMenuItem } from '@pancakeswap/uikit'
import { RouteComponentProps } from 'react-router-dom'
import styled from 'styled-components'
import { useIsTransactionUnsupported } from 'hooks/Trades'
import { useTranslation } from 'contexts/Localization'
import UnsupportedCurrencyFooter from 'components/UnsupportedCurrencyFooter'
import useActiveWeb3React from 'hooks/useActiveWeb3React'

import { stableCCYs } from 'components/CurrencyInputPanel/stableCurrencies'
import { LightCard } from 'components/Card'
import { AutoColumn, ColumnCenter } from 'components/Layout/Column'
import TransactionConfirmationModal, { ConfirmationModalContent } from 'components/TransactionConfirmationModal'
import CurrencyInputPanel from 'components/CurrencyInputPanel'
import CurrencyInputPanelStable from 'components/CurrencyInputPanel/CurrencyInputPanelStable'
import { DoubleCurrencyLogo } from 'components/Logo'
import { AppHeader, AppBody } from 'components/App'
import { MinimalPositionCard } from 'components/PositionCard'
import Row, { RowBetween } from 'components/Layout/Row'
import ConnectWalletButton from 'components/ConnectWalletButton'

import { ROUTER_ADDRESS } from 'config/constants'
import { PairState } from 'hooks/usePairs'
import { useCurrency } from 'hooks/Tokens'
import { ApprovalState, useApproveCallback } from 'hooks/useApproveCallback'
import useTransactionDeadline from 'hooks/useTransactionDeadline'
import { Field } from 'state/mint/actions'
import { StablesField } from 'state/mintStables/actions'
import { useDerivedMintInfo, useMintActionHandlers, useMintState } from 'state/mint/hooks'
import { useDerivedMintStablesInfo, useMintStablesActionHandlers, useMintStablesState } from 'state/mintStables/hooks'

import { useTransactionAdder } from 'state/transactions/hooks'
import { useGasPrice, useIsExpertMode, useUserSlippageTolerance } from 'state/user/hooks'
import { calculateGasMargin, calculateSlippageAmount, getRouterContract } from 'utils'
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
  const { independentField, typedValue, otherTypedValue } = useMintState()
  const {
    dependentField,
    currencies,
    pair,
    pairState,
    currencyBalances,
    parsedAmounts,
    price,
    noLiquidity,
    liquidityMinted,
    poolTokenPercentage,
    error,
  } = useDerivedMintInfo(currencyA ?? undefined, currencyB ?? undefined)



  const { onFieldAInput, onFieldBInput } = useMintActionHandlers(noLiquidity)

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
  const maxAmounts: { [field in Field]?: TokenAmount } = [Field.CURRENCY_A, Field.CURRENCY_B].reduce(
    (accumulator, field) => {
      return {
        ...accumulator,
        [field]: maxAmountSpend(chainId, currencyBalances[field]),
      }
    },
    {},
  )

  const atMaxAmounts: { [field in Field]?: TokenAmount } = [Field.CURRENCY_A, Field.CURRENCY_B].reduce(
    (accumulator, field) => {
      return {
        ...accumulator,
        [field]: maxAmounts[field]?.equalTo(parsedAmounts[field] ?? '0'),
      }
    },
    {},
  )

  // check whether the user has approved the router on the tokens
  const [approvalA, approveACallback] = useApproveCallback(chainId, parsedAmounts[Field.CURRENCY_A], ROUTER_ADDRESS[chainId])
  const [approvalB, approveBCallback] = useApproveCallback(chainId, parsedAmounts[Field.CURRENCY_B], ROUTER_ADDRESS[chainId])


  const addTransaction = useTransactionAdder()

  async function onAdd() {
    if (!chainId || !library || !account) return
    const router = getRouterContract(chainId, library, account)

    const { [Field.CURRENCY_A]: parsedAmountA, [Field.CURRENCY_B]: parsedAmountB } = parsedAmounts
    if (!parsedAmountA || !parsedAmountB || !currencyA || !currencyB || !deadline) {
      return
    }

    const amountsMin = {
      [Field.CURRENCY_A]: calculateSlippageAmount(parsedAmountA, noLiquidity ? 0 : allowedSlippage)[0],
      [Field.CURRENCY_B]: calculateSlippageAmount(parsedAmountB, noLiquidity ? 0 : allowedSlippage)[0],
    }

    let estimate
    let method: (...args: any) => Promise<TransactionResponse>
    let args: Array<string | string[] | number>
    let value: BigNumber | null
    if (currencyA === NETWORK_CCY[chainId] || currencyB === NETWORK_CCY[chainId]) {
      const tokenBIsETH = currencyB === NETWORK_CCY[chainId]
      estimate = router.estimateGas.addLiquidityETH
      method = router.addLiquidityETH
      args = [
        wrappedCurrency(tokenBIsETH ? currencyA : currencyB, chainId)?.address ?? '', // token
        (tokenBIsETH ? parsedAmountA : parsedAmountB).raw.toString(), // token desired
        amountsMin[tokenBIsETH ? Field.CURRENCY_A : Field.CURRENCY_B].toString(), // token min
        amountsMin[tokenBIsETH ? Field.CURRENCY_B : Field.CURRENCY_A].toString(), // eth min
        account,
        deadline.toHexString(),
      ]
      value = BigNumber.from((tokenBIsETH ? parsedAmountB : parsedAmountA).raw.toString())
    } else {
      estimate = router.estimateGas.addLiquidity
      method = router.addLiquidity
      args = [
        wrappedCurrency(currencyA, chainId)?.address ?? '',
        wrappedCurrency(currencyB, chainId)?.address ?? '',
        parsedAmountA.raw.toString(),
        parsedAmountB.raw.toString(),
        amountsMin[Field.CURRENCY_A].toString(),
        amountsMin[Field.CURRENCY_B].toString(),
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
            summary: `Add ${parsedAmounts[Field.CURRENCY_A]?.toSignificant(3)} ${currencies[Field.CURRENCY_A]?.symbol
              } and ${parsedAmounts[Field.CURRENCY_B]?.toSignificant(3)} ${currencies[Field.CURRENCY_B]?.symbol}`,
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
          {`${currencies[Field.CURRENCY_A]?.symbol}/${currencies[Field.CURRENCY_B]?.symbol}`}
        </Text>
        <DoubleCurrencyLogo
          chainId={chainId}
          currency0={currencies[Field.CURRENCY_A]}
          currency1={currencies[Field.CURRENCY_B]}
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
            currency0={currencies[Field.CURRENCY_A]}
            currency1={currencies[Field.CURRENCY_B]}
            size={30}
          />
        </Flex>
        <Row>
          <Text fontSize="24px">
            {`${currencies[Field.CURRENCY_A]?.symbol}/${currencies[Field.CURRENCY_B]?.symbol} Pool Tokens`}
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
    amountA: parsedAmounts[Field.CURRENCY_A]?.toSignificant(6) ?? '',
    symbolA: currencies[Field.CURRENCY_A]?.symbol ?? '',
    amountB: parsedAmounts[Field.CURRENCY_B]?.toSignificant(6) ?? '',
    symbolB: currencies[Field.CURRENCY_B]?.symbol ?? '',
  })

  const handleCurrencyASelect = useCallback(
    (currencyA_: Currency) => {
      const newCurrencyIdA = currencyId(chainId, currencyA_)
      if (newCurrencyIdA === currencyIdB) {
        history.push(`/add/${currencyIdB}/${currencyIdA}`)
      } else {
        history.push(`/add/${newCurrencyIdA}/${currencyIdB}`)
      }
    },
    [chainId, currencyIdB, history, currencyIdA],
  )
  const handleCurrencyBSelect = useCallback(
    (currencyB_: Currency) => {
      const newCurrencyIdB = currencyId(chainId, currencyB_)
      if (currencyIdA === newCurrencyIdB) {
        if (currencyIdB) {
          history.push(`/add/${currencyIdB}/${newCurrencyIdB}`)
        } else {
          history.push(`/add/${newCurrencyIdB}`)
        }
      } else {
        history.push(`/add/${currencyIdA || NETWORK_CCY[chainId].symbol}/${newCurrencyIdB}`)
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
      currencyToAdd={pair?.liquidityToken}
    />,
    true,
    true,
    'addLiquidityModal',
  )

  enum LiquidityState {
    STANDARD,
    STABLE
  }

  interface StablesFieldInput {
    currencyies: Currency[]
    fieldInputs: StablesField


  }

  const [liquidityState, setLiquidityState] = useState<LiquidityState>(LiquidityState.STANDARD)
  const handleClick = (newIndex: LiquidityState) => setLiquidityState(newIndex);

  const LiquidityStateButtonWrapper = styled.div`
    margin-bottom: 20px
  `

  //  stuff for stable swap starts here
  const stables = stableCCYs(chainId ?? 43113)

  // mint state
  const { typedValue1, typedValue2, typedValue3, typedValue4 } = useMintStablesState()
  const typedValues = [typedValue1, typedValue2, typedValue3, typedValue4]

  const {
    stableCurrencies,
    stablesPair,
    stablesPairState,
    stablesCurrencyBalances,
    parsedStablesAmounts,
    stablesLiquidityMinted,
    stablesPoolTokenPercentage,
    stablesError,
  } = useDerivedMintStablesInfo(stables[0], stables[1], stables[2], stables[3])
 console.log(stablesError)
  const formattedStablesAmounts = {
    [StablesField.CURRENCY_1]: parsedStablesAmounts[StablesField.CURRENCY_1]?.toSignificant(6) ?? '',
    [StablesField.CURRENCY_2]: parsedStablesAmounts[StablesField.CURRENCY_2]?.toSignificant(6) ?? '',
    [StablesField.CURRENCY_3]: parsedStablesAmounts[StablesField.CURRENCY_3]?.toSignificant(6) ?? '',
    [StablesField.CURRENCY_4]: parsedStablesAmounts[StablesField.CURRENCY_4]?.toSignificant(6) ?? ''
  }

  const { onField1Input, onField2Input, onField3Input, onField4Input } = useMintStablesActionHandlers()

  // get the max amounts user can add
  const maxAmountsStables: { [field in StablesField]?: TokenAmount } = [StablesField.CURRENCY_1, StablesField.CURRENCY_2, StablesField.CURRENCY_3, StablesField.CURRENCY_4].reduce(
    (accumulator, field) => {
      return {
        ...accumulator,
        [field]: maxAmountSpend(chainId, stablesCurrencyBalances[field]),
      }
    },
    {},
  )

  console.log(stables)

  return (
    <Page>
      <LiquidityStateButtonWrapper>
        <ButtonMenu activeIndex={liquidityState} onItemClick={handleClick} scale="sm" variant="subtle" ml="24px">
          <ButtonMenuItem>Pairs</ButtonMenuItem>
          <ButtonMenuItem>Stable</ButtonMenuItem>
        </ButtonMenu>
      </LiquidityStateButtonWrapper>
      <AppBody>
        <AppHeader
          title={t('Add Liquidity')}
          subtitle={t('Add liquidity to receive LP tokens')}
          helper={t(
            'Liquidity providers earn a 0.17% trading fee on all trades made for that token pair, proportional to their share of the liquidity pool.',
          )}
          backTo="/pool"
        />
        <CardBody>
          {liquidityState === LiquidityState.STANDARD ?
            (<AutoColumn gap="20px">
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
              <CurrencyInputPanel
                value={formattedAmounts[Field.CURRENCY_A]}
                onUserInput={onFieldAInput}
                onMax={() => {
                  onFieldAInput(maxAmounts[Field.CURRENCY_A]?.toExact() ?? '')
                }}
                onCurrencySelect={handleCurrencyASelect}
                showMaxButton={!atMaxAmounts[Field.CURRENCY_A]}
                currency={currencies[Field.CURRENCY_A]}
                id="add-liquidity-input-tokena"
                showCommonBases
              />
              <ColumnCenter>
                <AddIcon width="16px" />
              </ColumnCenter>
              <CurrencyInputPanel
                value={formattedAmounts[Field.CURRENCY_B]}
                onUserInput={onFieldBInput}
                onCurrencySelect={handleCurrencyBSelect}
                onMax={() => {
                  onFieldBInput(maxAmounts[Field.CURRENCY_B]?.toExact() ?? '')
                }}
                showMaxButton={!atMaxAmounts[Field.CURRENCY_B]}
                currency={currencies[Field.CURRENCY_B]}
                id="add-liquidity-input-tokenb"
                showCommonBases
              />
              {currencies[Field.CURRENCY_A] && currencies[Field.CURRENCY_B] && pairState !== PairState.INVALID && (
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
                              <Dots>{t('Enabling %asset%', { asset: currencies[Field.CURRENCY_A]?.symbol })}</Dots>
                            ) : (
                              t('Enable %asset%', { asset: currencies[Field.CURRENCY_A]?.symbol })
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
                              <Dots>{t('Enabling %asset%', { asset: currencies[Field.CURRENCY_B]?.symbol })}</Dots>
                            ) : (
                              t('Enable %asset%', { asset: currencies[Field.CURRENCY_B]?.symbol })
                            )}
                          </Button>
                        )}
                      </RowBetween>
                    )}
                  <Button
                    variant={
                      !isValid && !!parsedAmounts[Field.CURRENCY_A] && !!parsedAmounts[Field.CURRENCY_B]
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
            </AutoColumn>) : // stableSwap Liquidity here
            (<AutoColumn gap="20px">

              <CurrencyInputPanelStable
                value={formattedStablesAmounts[StablesField.CURRENCY_1]}
                onUserInput={onField1Input}
                onMax={() => {
                  onField1Input(maxAmountsStables[StablesField.CURRENCY_1]?.toExact() ?? '')
                }}
                showMaxButton={!atMaxAmounts[Field.CURRENCY_A]}
                stableCurrency={stables[0]}
                id="add-liquidity-input-token1"
                showCommonBases
              />
              <CurrencyInputPanelStable
                value={formattedStablesAmounts[StablesField.CURRENCY_2]}
                onUserInput={onField2Input}
                onMax={() => {
                  onField2Input(maxAmountsStables[StablesField.CURRENCY_2]?.toExact() ?? '')
                }}
                showMaxButton={!atMaxAmounts[Field.CURRENCY_A]}
                stableCurrency={stables[1]}
                id="add-liquidity-input-token2"
                showCommonBases
              />
              <CurrencyInputPanelStable
                value={formattedStablesAmounts[StablesField.CURRENCY_3]}
                onUserInput={onField3Input}
                onMax={() => {
                  onField3Input(maxAmountsStables[StablesField.CURRENCY_3]?.toExact() ?? '')
                }}
                showMaxButton={!atMaxAmounts[Field.CURRENCY_A]}
                stableCurrency={stables[2]}
                id="add-liquidity-input-token3"
                showCommonBases
              />
              <CurrencyInputPanelStable
                value={formattedStablesAmounts[StablesField.CURRENCY_4]}
                onUserInput={onField4Input}
                onMax={() => {
                  onField4Input(maxAmountsStables[StablesField.CURRENCY_4]?.toExact() ?? '')
                }}
                showMaxButton={!atMaxAmounts[Field.CURRENCY_A]}
                stableCurrency={stables[3]}
                id="add-liquidity-input-token4"
                showCommonBases
              />
              {currencies[Field.CURRENCY_A] && currencies[Field.CURRENCY_B] && pairState !== PairState.INVALID && (
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
                              <Dots>{t('Enabling %asset%', { asset: currencies[Field.CURRENCY_A]?.symbol })}</Dots>
                            ) : (
                              t('Enable %asset%', { asset: currencies[Field.CURRENCY_A]?.symbol })
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
                              <Dots>{t('Enabling %asset%', { asset: currencies[Field.CURRENCY_B]?.symbol })}</Dots>
                            ) : (
                              t('Enable %asset%', { asset: currencies[Field.CURRENCY_B]?.symbol })
                            )}
                          </Button>
                        )}
                      </RowBetween>
                    )}
                  <Button
                    variant={
                      !isValid && !!parsedAmounts[Field.CURRENCY_A] && !!parsedAmounts[Field.CURRENCY_B]
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
            </AutoColumn>)
          }
        </CardBody>
      </AppBody>
      {!addIsUnsupported ? (
        pair && !noLiquidity && pairState !== PairState.INVALID ? (
          <AutoColumn style={{ minWidth: '20rem', width: '100%', maxWidth: '400px', marginTop: '1rem' }}>
            <MinimalPositionCard showUnwrapped={oneCurrencyIsWETH} pair={pair} />
          </AutoColumn>
        ) : null
      ) : (
        <UnsupportedCurrencyFooter currencies={[currencies.CURRENCY_A, currencies.CURRENCY_B]} />
      )}
    </Page>
  )
}
