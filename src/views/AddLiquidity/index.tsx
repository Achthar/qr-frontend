import React, { useCallback, useState, useMemo } from 'react'
import { BigNumber } from '@ethersproject/bignumber'
import { ethers } from 'ethers'
import { TransactionResponse } from '@ethersproject/providers'
import {
  Currency,
  currencyEquals,
  CurrencyAmount,
  NETWORK_CCY,
  TokenAmount,
  WRAPPED_NETWORK_TOKENS
} from '@requiemswap/sdk'
import {
  Button,
  Text,
  Flex,
  CardBody,
  Message,
  useModal,
  AddIcon,
  ChevronLeftIcon,
  ArrowUpIcon,
  Box,
  useMatchBreakpoints
} from '@requiemswap/uikit'
import { RouteComponentProps, Link } from 'react-router-dom'
// import {Svg, SvgProps} from '@requiemswap/uikit'
import styled from 'styled-components'
import { useIsTransactionUnsupported } from 'hooks/TradesV3'
import PercentageInputPanel from 'components/CurrencyInputPanel/PercentageInputPanel'
import BpsInputPanel from 'components/CurrencyInputPanel/BpsInputPanel'
import { useTranslation } from 'contexts/Localization'
import UnsupportedCurrencyFooter from 'components/UnsupportedCurrencyFooter'
import useActiveWeb3React from 'hooks/useActiveWeb3React'
import { REQUIEM_PAIR_MANAGER, SWAP_ROUTER } from 'config/constants'
import { useGetWeightedPairsState } from 'hooks/useGetWeightedPairsState'
import useRefresh from 'hooks/useRefresh'
import { deserializeToken, serializeToken } from 'state/user/hooks/helpers'
import AmpInputPanel from 'components/CurrencyInputPanel/AmpInput'

import { LightCard } from 'components/Card'
import { AutoColumn, ColumnCenter } from 'components/Layout/Column'
import TransactionConfirmationModal, { ConfirmationModalContent } from 'components/TransactionConfirmationModal'
import CurrencyInputPanelExpanded from 'components/CurrencyInputPanel/CurrencyInputPanelExpanded'
import { DoubleCurrencyLogo } from 'components/Logo'
import { AppHeader, AppBody } from 'components/App'
import { MinimalWeightedPositionCard } from 'components/PositionCard/WeightedPairPosition'
import Row, { RowBetween } from 'components/Layout/Row'
import ConnectWalletButton from 'components/ConnectWalletButton'
import { useCurrency, useAllTokens } from 'hooks/Tokens'
import { ApprovalState, useApproveCallback, useApproveCallbackWithAllowance } from 'hooks/useApproveCallback'
import useTransactionDeadline from 'hooks/useTransactionDeadline'
import { WeightedField } from 'state/mintWeightedPair/actions'
import { useDerivedMintWeightedPairInfo, useMintWeightedPairActionHandlers, useMintWeightedPairState } from 'state/mintWeightedPair/hooks'
import { WeightedPairState } from 'hooks/useWeightedPairs'
import { useTransactionAdder } from 'state/transactions/hooks'
import { useGasPrice, useIsExpertMode, useUserBalances, useUserSlippageTolerance } from 'state/user/hooks'
import { calculateGasMargin, calculateSlippageAmount, getPairManagerContract } from 'utils'
import { maxAmountSpend } from 'utils/maxAmountSpend'
import { wrappedCurrency } from 'utils/wrappedCurrency'
import Dots from 'components/Loader/Dots'
import { currencyId } from 'utils/currencyId'
import getChain from 'utils/getChain'
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
    params: { chain, weightA, weightB, currencyIdA, currencyIdB },
  },
  history,
}: RouteComponentProps<{ chain: string, weightA: string, weightB, currencyIdA?: string; currencyIdB?: string }>) {
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

  const { slowRefresh, fastRefresh } = useRefresh()

  const [tokens, aIs0] = useMemo(
    () => {
      if (!currencyA && !currencyB)
        return [{ token0: undefined, token1: undefined }, false]
      const tokenA = wrappedCurrency(currencyA, chainId)
      const tokenB = wrappedCurrency(currencyB, chainId)
      return tokenA?.address.toLowerCase() < tokenB?.address.toLocaleLowerCase() ?
        [{
          token0: serializeToken(tokenA),
          token1: serializeToken(tokenB),
        }, true] : [{
          token1: serializeToken(tokenA),
          token0: serializeToken(tokenB),
        }, false]
    },
    [chainId, currencyA, currencyB],
  )


  // first, we fetch all weighted pairs from the state
  // and add some, if not yet included
  const {
    pairs,
    balances: userBalances,
    userBalancesLoaded,
    totalSupply: supplyLp
  } = useGetWeightedPairsState(chainId, account, tokens.token0 && tokens.token1 ? [tokens] : [], slowRefresh, fastRefresh)


  // use balances from the balance state instead of manually loading them
  const {
    networkCcyBalance: networkCcyBalanceString,
    balances: tokenBalancesStrings,
    isLoadingNetworkCcy,
    isLoadingTokens
  } = useUserBalances(chainId)

  const isLoading = isLoadingNetworkCcy && isLoadingTokens
  const defaultTokens = useAllTokens(chainId)
  const tokenBalances = useMemo(
    () => Object.assign({},
      ...Object.values(defaultTokens).map(
        (x) => ({ [x.address]: new TokenAmount(x, tokenBalancesStrings[x?.address]?.balance ?? '0') })
      )
    ),
    [defaultTokens, tokenBalancesStrings]
  )

  const networkCcyBalance = useMemo(
    () => CurrencyAmount.networkCCYAmount(chainId, networkCcyBalanceString ?? '0'),
    [chainId, networkCcyBalanceString]
  )


  // get derived info for selected pair
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
    fee: _fee,
    amp,
    priceActual
  } = useDerivedMintWeightedPairInfo(
    chainId,
    account,
    weightA,
    weightB,
    currencyA ?? undefined,
    currencyB ?? undefined,
    tokenBalances,
    networkCcyBalance,
    pairs,
    userBalances,
    supplyLp
  )

  const { isMobile, isDesktop } = useMatchBreakpoints()
  const {
    onFieldAInput,
    onFieldBInput,
    onWeightAInput,
    onWeightBInput,
    onFeeInput,
    onAmpInput
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

  // const maxAmountA: CurrencyAmount | undefined = maxAmountSpend(chainId, currencyBalances[WeightedField.CURRENCY_A])
  // const maxAmountB: CurrencyAmount | undefined = maxAmountSpend(chainId, currencyBalances[WeightedField.CURRENCY_B])

  // const atMaxAmounts: { [field in WeightedField]?: TokenAmount } = [WeightedField.CURRENCY_A, WeightedField.CURRENCY_B].reduce(
  //   (accumulator, field) => {
  //     return {
  //       ...accumulator,
  //       [field]: maxAmounts[field]?.equalTo(parsedAmounts[field] ?? '0'),
  //     }
  //   },
  //   {},
  // )
  const [addressA, addressB] = tokens?.token1?.address && tokens?.token0?.address ? (
    aIs0 ?
      [ethers.utils.getAddress(tokens.token0.address), ethers.utils.getAddress(tokens.token1.address)]
      : [ethers.utils.getAddress(tokens.token1.address), ethers.utils.getAddress(tokens.token0.address)]
  ) : ['', '']

  // check whether the user has approved the router on the tokens
  const [approvalA, approveACallback] = useApproveCallbackWithAllowance(
    chainId,
    account,
    tokenBalancesStrings[addressA]?.allowancePairManager ?? '0',
    parsedAmounts[WeightedField.CURRENCY_A],
    SWAP_ROUTER[chainId],
  )
  const [approvalB, approveBCallback] = useApproveCallbackWithAllowance(
    chainId,
    account,
    tokenBalancesStrings[addressB]?.allowancePairManager ?? '0',
    parsedAmounts[WeightedField.CURRENCY_B],
    SWAP_ROUTER[chainId],
  )

  const addTransaction = useTransactionAdder()

  async function onAdd() {
    if (!chainId || !library || !account) return
    const pairManager = getPairManagerContract(chainId, library, account)

    const { [WeightedField.CURRENCY_A]: parsedAmountA, [WeightedField.CURRENCY_B]: parsedAmountB } = parsedAmounts


    if (!parsedAmountA || !parsedAmountB || !currencyA || !currencyB) {
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
          ['0', ethers.constants.MaxUint256.toHexString()],// uint256[2] memory vReserveRatioBounds,
          account,
          deadline?.toHexString() ?? '999999999999999'
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
          ['0', ethers.constants.MaxUint256.toHexString()],
          account,
          deadline?.toHexString() ?? '999999999999999'
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
          amp ?? '10000', // amplification
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
          amp ?? '10000', // amplification
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

  const pairsAvailable = pairs.filter(pair => pair.token0.address === tokens.token0.address && pair.token1.address === tokens.token1.address)

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
      const _chain = chain ?? getChain(chainId)
      if (newCurrencyIdA === currencyIdB) {
        history.push(`/${_chain}/add/${weightB}-${currencyId(chainId, currencyA_)}/${weightA}-${currencyIdA}`)
      } else {
        history.push(`/${_chain}/add/${weightA}-${newCurrencyIdA}/${weightB}-${currencyIdB}`)
      }
    },
    [chainId, currencyIdB, history, currencyIdA, weightA, weightB, chain],
  )
  const handleCurrencyBSelect = useCallback(
    (currencyB_: Currency) => {
      const newCurrencyIdB = currencyId(chainId, currencyB_)
      const _chain = chain ?? getChain(chainId)
      if (currencyIdA === newCurrencyIdB) {
        if (currencyIdB) {
          history.push(`/${_chain}/add/${weightB}-${currencyIdB}/${weightA}-${newCurrencyIdB}`)
        } else {
          history.push(`/${_chain}/add/${weightB}-${newCurrencyIdB}`)
        }
      } else {
        history.push(`/${_chain}/add/${weightA}-${currencyIdA || NETWORK_CCY[chainId].symbol}/${weightB}-${newCurrencyIdB}`)
      }
    },
    [chainId, currencyIdA, history, currencyIdB, weightA, weightB, chain],
  )

  const handleWeightASelect = useCallback(
    (weight: string) => {
      const _chain = chain ?? getChain(chainId)
      history.push(`/${_chain}/add/${weight}-${currencyIdA}/${String(100 - Number(weight))}-${currencyIdB}`)
    },
    [currencyIdA, currencyIdB, history, chainId, chain],
  )

  const handleWeightBSelect = useCallback(
    (weight: string) => {
      const _chain = chain ?? getChain(chainId)
      history.push(`/${_chain}/add/${String(100 - Number(weight))}-${currencyIdA}/${weight}-${currencyIdB}`)
    },
    [currencyIdA, currencyIdB, history, chainId, chain],
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
    onFeeInput(typedValue_)
  }

  const ampInput = (typedValue_: string) => {
    onAmpInput(typedValue_)
  }

  const handleDismissConfirmation = useCallback(() => {
    // if there was a tx hash, we want to clear the input
    if (txHash) {
      onFieldAInput('')
    }
    setTxHash('')
  }, [onFieldAInput, txHash])

  const addIsUnsupported = useIsTransactionUnsupported(chainId, currencies?.CURRENCY_A, currencies?.CURRENCY_B)

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
      <AppBody>
        <Row width='100%' height='50px' marginTop='3px'>
          <Button
            variant="primary"
            width="100%"
            mb="8px"
            style={{ borderTopRightRadius: '3px', borderBottomRightRadius: '3px', marginLeft: '3px', marginRight: '3px', marginBottom: '5px' }}
          >
            Pairs
          </Button>
          <Button
            as={Link}
            to={`/${getChain(chainId)}/add/stables`}
            variant="secondary"
            width="100%"
            mb="8px"
            style={{ borderRadius: '3px', marginLeft: '3px', marginRight: '3px', marginBottom: '5px' }}
          >
            Stables
          </Button>
          <Button
            as={Link}
            to={`/${getChain(chainId)}/add/weighted`}
            variant="secondary"
            width="100%"
            mb="8px"
            style={{ borderTopLeftRadius: '3px', borderBottomLeftRadius: '3px', marginLeft: '3px', marginRight: '3px', marginBottom: '5px' }}
          >
            Weighted
          </Button>
        </Row>
        <AppHeader
          chainId={chainId}
          account={account}
          title={t('Add Liquidity')}
          subtitle={
            t('Add liquidity to receive LP tokens')
          }
          helper={t(
            'Liquidity providers earn a trading fee on all trades made for that token pair, proportional to their share of the liquidity pool.',
          )}
          backTo={`/${getChain(chainId)}/liquidity`}
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
              <Row grid-row-gap='5px'>
                <span>
                  <CurrencyInputPanelExpanded
                    chainId={chainId}
                    account={account}
                    balances={tokenBalances}
                    networkCcyBalance={networkCcyBalance}
                    isLoading={isLoading}
                    borderRadius='5px'
                    width={isMobile ? '210px' : '280px'}
                    value={formattedAmounts[WeightedField.CURRENCY_A]}
                    onUserInput={onFieldAInput}
                    onMax={() => {
                      onFieldAInput(maxAmounts[WeightedField.CURRENCY_A]?.toExact() ?? '')
                    }}
                    onCurrencySelect={handleCurrencyASelect}
                    showMaxButton={false}
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
              </Row>
            </Box>
            {/* <ColumnCenter> */}
            <Box>
              <Flex flexDirection="row" justifyContent='space-between' alignItems="center" grid-row-gap='5px' width='80%'>

                <BpsInputPanel
                  borderRadius='5px'
                  width='100px'
                  value={noLiquidity ? _fee === '-' ? '' : _fee : weightedPair.fee0.toString()}
                  onUserInput={noLiquidity ? feeInput : (x) => null}
                  label='Swap Fee'
                  id='fee'
                  onHover
                />
                <AddIcon width="24px" marginLeft='5px' marginRight='5px' />

                <AmpInputPanel
                  borderRadius='5px'
                  width='180px'
                  value={noLiquidity ? amp : weightedPair.amp.toString()}
                  onUserInput={noLiquidity ? ampInput : (x) => null}
                  label='Amplification'
                  id='Amplification'
                  onHover
                />

              </Flex>
            </Box>
            {/* </ColumnCenter> */}
            <Row grid-row-gap='5px'>
              <span>
                <CurrencyInputPanelExpanded
                  chainId={chainId}
                  account={account}
                  balances={tokenBalances}
                  networkCcyBalance={networkCcyBalance}
                  isLoading={isLoading}
                  borderRadius='5px'
                  width={isMobile ? '210px' : '280px'}
                  value={formattedAmounts[WeightedField.CURRENCY_B]}
                  onUserInput={onFieldBInput}
                  onCurrencySelect={handleCurrencyBSelect}
                  onMax={() => {
                    onFieldBInput(maxAmounts[WeightedField.CURRENCY_B]?.toExact() ?? '')
                  }}
                  showMaxButton={false}
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
            </Row>
            {currencies[WeightedField.CURRENCY_A] && currencies[WeightedField.CURRENCY_B] && weightedPairState !== WeightedPairState.INVALID && (
              <>
                <LightCard padding="0px" borderRadius="20px">
                  <RowBetween padding="1rem">
                    <Text fontSize="14px">
                      {noLiquidity ? t('Initial pool ratio, market prices and pool share') : t('Pool ratios, market prices and pool share')}
                    </Text>
                  </RowBetween>{' '}
                  <LightCard padding="1rem" borderRadius="20px">
                    <PoolPriceBar
                      currencies={currencies}
                      poolTokenPercentage={poolTokenPercentage}
                      noLiquidity={noLiquidity}
                      price={price}
                      priceRatio={priceActual}
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
          {pairsAvailable.length > 0 && (
            <Box>
              <AutoColumn gap="sm" justify="center">
                <Text bold fontSize='15px'>
                  Available constellations
                </Text>
                {pairsAvailable.map((pairData) => (
                  <Flex flexDirection="row" justifyContent='space-between' alignItems="center" grid-row-gap='10px' marginRight='5px' marginLeft='5px'>
                    <AutoColumn>
                      <Text fontSize='13px' width='100px'>
                        {`${currencyA.symbol} ${aIs0 ? pairData.weight0.toString() : pairData.weight1.toString()}%`}
                      </Text>
                      <Text fontSize='13px' width='100px'>
                        {`${currencyB.symbol} ${aIs0 ? pairData.weight1.toString() : pairData.weight0.toString()}%`}
                      </Text>
                    </AutoColumn>
                    <AutoColumn>
                      <Text fontSize='13px' width='100px' marginLeft='10px' marginRight='10px'>
                        {`Fee ${pairData.fee0.toString()}Bps`}
                      </Text>
                      <Text fontSize='13px' width='100px' marginLeft='10px' marginRight='10px'>
                        {`Amp ${Number(pairData.amp.toString()) / 10000}x`}
                      </Text>
                    </AutoColumn>
                    <StyledButton
                      height='20px'
                      endIcon={<ArrowUpIcon />}
                      onClick={() => {
                        feeInput(pairData.fee0.toString())
                        ampInput(pairData.amp.toString())
                        weightAInput(aIs0 ? pairData.weight0.toString() : pairData.weight1.toString())
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
        weightedPair && weightedPairState !== WeightedPairState.INVALID ? (
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
