import React, { useCallback, useMemo, useState } from 'react'
import styled from 'styled-components'
import { splitSignature } from '@ethersproject/bytes'
import { Contract } from '@ethersproject/contracts'
import { TransactionResponse } from '@ethersproject/providers'
import { Percent, Price, Token, STABLE_POOL_LP_ADDRESS, TokenAmount } from '@pancakeswap/sdk'
import { Button, Text, AddIcon, ArrowDownIcon, CardBody, Slider, Box, Flex, useModal } from '@pancakeswap/uikit'
import { RouteComponentProps } from 'react-router'
import { BigNumber } from '@ethersproject/bignumber'
import { useTranslation } from 'contexts/Localization'
import tokens from 'config/constants/tokens'
import { useTokenBalancesWithLoadingIndicator } from 'state/wallet/hooks'
import Row from 'components/Row'
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
import { useBurnStablesActionHandlers, useDerivedBurnStablesInfo, useBurnStableState } from '../../state/burnStables/hooks'

import { StablesField } from '../../state/burnStables/actions'
import { useGasPrice, useUserSlippageTolerance } from '../../state/user/hooks'



const BorderCard = styled.div`
  border: solid 1px ${({ theme }) => theme.colors.cardBorder};
  border-radius: 16px;
  padding: 16px;
`

export default function RemoveLiquidity({
  history
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
    typedValueSingle
  } = useBurnStableState()


  const { stablePool, parsedAmounts, error } = useDerivedBurnStablesInfo()

  const {
    onField1Input: _onField1Input,
    onField2Input: _onField2Input,
    onField3Input: _onField3Input,
    onField4Input: _onField4Input,
    onLpInput: _onLpInput
  } = useBurnStablesActionHandlers()

  const isValid = !error

  // modal and loading
  const [showDetailed, setShowDetailed] = useState<boolean>(false)
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
      independentStablesField === StablesField.LIQUIDITY ? typedValueLiquidity : parsedAmounts[StablesField.LIQUIDITY]?.toSignificant(6) ?? '',
    [StablesField.CURRENCY_1]:
      independentStablesField === StablesField.CURRENCY_1 ? typedValue1 : parsedAmounts[StablesField.CURRENCY_1]?.toSignificant(6) ?? '',
    [StablesField.CURRENCY_2]:
      independentStablesField === StablesField.CURRENCY_2 ? typedValue2 : parsedAmounts[StablesField.CURRENCY_2]?.toSignificant(6) ?? '',
    [StablesField.CURRENCY_3]:
      independentStablesField === StablesField.CURRENCY_3 ? typedValue3 : parsedAmounts[StablesField.CURRENCY_3]?.toSignificant(6) ?? '',
    [StablesField.CURRENCY_4]:
      independentStablesField === StablesField.CURRENCY_4 ? typedValue4 : parsedAmounts[StablesField.CURRENCY_4]?.toSignificant(6) ?? '',

  }

  const atMaxAmount = parsedAmounts[StablesField.LIQUIDITY_PERCENT]?.equalTo(new Percent('1'))

  // pair contract
  const stableLpContract: Contract | null = useStableLPContract(stablePool?.liquidityToken?.address)

  // const [userPoolBalance, fetchingUserPoolBalance] = useTokenBalancesWithLoadingIndicator(
  //   account ?? undefined,
  //   [new Token(chainId, STABLE_POOL_LP_ADDRESS[chainId ?? 43113], 18, 'RequiemStable-LP', 'Requiem StableSwap LPs')],
  // )

  const userPoolBalance = new TokenAmount(new Token(chainId, STABLE_POOL_LP_ADDRESS[chainId ?? 43113], 18, 'RequiemStable-LP', 'Requiem StableSwap LPs'),
    BigNumber.from(0).toBigInt())

  // allowance handling
  const [signatureData, setSignatureData] = useState<{ v: number; r: string; s: string; deadline: number } | null>(null)
  const [approval, approveCallback] = useApproveCallback(chainId, parsedAmounts[StablesField.LIQUIDITY], ROUTER_ADDRESS[chainId])

  async function onAttemptToApprove() {
    if (!stableLpContract || !stablePool || !library || !deadline) throw new Error('missing dependencies')
    const liquidityAmount = parsedAmounts[StablesField.LIQUIDITY]
    if (!liquidityAmount) throw new Error('missing liquidity amount')

    // try to gather a signature for permission
    const nonce = await stableLpContract.nonces(account)

    const EIP712Domain = [
      { name: 'name', type: 'string' },
      { name: 'version', type: 'string' },
      { name: 'chainId', type: 'uint256' },
      { name: 'verifyingContract', type: 'address' },
    ]
    const domain = {
      name: 'Requiem Stable LPs',
      version: '1',
      chainId,
      verifyingContract: stablePool.liquidityToken.address,
    }
    const Permit = [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
      { name: 'value', type: 'uint256' },
      { name: 'nonce', type: 'uint256' },
      { name: 'deadline', type: 'uint256' },
    ]
    const message = {
      owner: account,
      spender: ROUTER_ADDRESS[chainId],
      value: liquidityAmount.raw.toString(),
      nonce: nonce.toHexString(),
      deadline: deadline.toNumber(),
    }
    const data = JSON.stringify({
      types: {
        EIP712Domain,
        Permit,
      },
      domain,
      primaryType: 'Permit',
      message,
    })

    library
      .send('eth_signTypedData_v4', [account, data])
      .then(splitSignature)
      .then((signature) => {
        setSignatureData({
          v: signature.v,
          r: signature.r,
          s: signature.s,
          deadline: deadline.toNumber(),
        })
      })
      .catch((err) => {
        // for all errors other than 4001 (EIP-1193 user rejected request), fall back to manual approve
        if (err?.code !== 4001) {
          approveCallback()
        }
      })
  }
  const amountstoRemove = [
    parsedAmounts[StablesField.CURRENCY_1], parsedAmounts[StablesField.CURRENCY_2],
    parsedAmounts[StablesField.CURRENCY_3], parsedAmounts[StablesField.CURRENCY_4]
  ]


  const priceMatrix = []
  if (stablePool !== null)
    for (let i = 0; i < Object.values(stablePool?.tokens).length; i++) {
      priceMatrix.push([])
      for (let j = 0; j < Object.values(stablePool?.tokens).length; j++) {
        if (i !== j && amountstoRemove[j] !== undefined) {
          priceMatrix?.[i].push(new Price(stablePool?.tokens[i], stablePool?.tokens[j],
            stablePool.calculateSwap(
              j,
              i,
              amountstoRemove[j].toBigNumber()
            ).toBigInt(),
            amountstoRemove[j].raw))
        } else {
          priceMatrix?.[i].push(undefined)
        }
      }
    }
  console.log(priceMatrix)
  // wrapped onUserInput to clear signatures
  const onField1Input = useCallback(
    (field: StablesField, value: string) => {
      setSignatureData(null)
      return _onField1Input(field, value)
    },
    [_onField1Input],
  )

  const onField2Input = useCallback(
    (field: StablesField, value: string) => {
      setSignatureData(null)
      return _onField2Input(field, value)
    },
    [_onField2Input],
  )


  const onField3Input = useCallback(
    (field: StablesField, value: string) => {
      setSignatureData(null)
      return _onField3Input(field, value)
    },
    [_onField3Input],
  )


  const onField4Input = useCallback(
    (field: StablesField, value: string) => {
      setSignatureData(null)
      return _onField4Input(field, value)
    },
    [_onField4Input],
  )

  const onLpInput = useCallback(
    (field: StablesField, value: string) => {
      setSignatureData(null)
      console.log("ONLPVCAL", value)
      return _onLpInput(field, value)
    },
    [_onLpInput],
  )
  // tx sending
  const addTransaction = useTransactionAdder()
  async function onStablesLpRemove() {
    if (!chainId || !library || !account || !deadline) throw new Error('missing dependencies')
    const { [StablesField.CURRENCY_1]: currencyAmount1, [StablesField.CURRENCY_2]: currencyAmount2,
      [StablesField.CURRENCY_3]: currencyAmount3, [StablesField.CURRENCY_4]: currencyAmount4 } = parsedAmounts
    if (!currencyAmount1 || !currencyAmount2 || !currencyAmount3 || !currencyAmount4) {
      throw new Error('missing currency amounts')
    }
    const router = getStableRouterContract(chainId, library, account)

    const amountsMin = {
      [StablesField.CURRENCY_1]: calculateSlippageAmount(currencyAmount1, allowedSlippage)[0],
      [StablesField.CURRENCY_2]: calculateSlippageAmount(currencyAmount2, allowedSlippage)[0],
      [StablesField.CURRENCY_3]: calculateSlippageAmount(currencyAmount3, allowedSlippage)[0],
      [StablesField.CURRENCY_4]: calculateSlippageAmount(currencyAmount4, allowedSlippage)[0],
    }


    const liquidityAmount = parsedAmounts[StablesField.LIQUIDITY]
    if (!liquidityAmount) throw new Error('missing liquidity amount')

    let methodNames: string[]
    let args: Array<string | string[] | number | boolean>
    // we have approval, use normal remove liquidity
    if (approval === ApprovalState.APPROVED) {
      methodNames = ['removeLiquidity']
      args = [
        liquidityAmount.raw.toString(),
        [
          amountsMin[StablesField.CURRENCY_1].toString(),
          amountsMin[StablesField.CURRENCY_2].toString(),
          amountsMin[StablesField.CURRENCY_3].toString(),
          amountsMin[StablesField.CURRENCY_4].toString()
        ],
        deadline.toHexString(),
      ]

    }
    else {
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
            summary: `Remove ${parsedAmounts[StablesField.CURRENCY_1]?.toSignificant(3)} ${stablePool?.tokens[0].symbol
              } and ${parsedAmounts[StablesField.CURRENCY_2]?.toSignificant(3)} ${stablePool?.tokens[1].symbol}`,
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
            <Text fontSize="24px" ml="10px">
              {stablePool?.tokens[0].symbol}
            </Text>
          </RowFixed>
        </RowBetween>
        <RowFixed>
          <AddIcon width="16px" />
        </RowFixed>
        <RowBetween align="flex-end">
          <Text fontSize="24px">{parsedAmounts[StablesField.CURRENCY_2]?.toSignificant(6)}</Text>
          <RowFixed gap="4px">
            <CurrencyLogo chainId={chainId} currency={stablePool?.tokens[1]} size="24px" />
            <Text fontSize="24px" ml="10px">
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

  function modalBottom() {
    return (
      <>
        <RowBetween>
          <Text>
            {t('%assetA%/%assetB% Burned', { assetA: stablePool?.tokens[0].symbol ?? '', assetB: stablePool?.tokens[1].symbol ?? '' })}
          </Text>
          <RowFixed>
            <DoubleCurrencyLogo chainId={chainId} currency0={stablePool?.tokens[0]} currency1={stablePool?.tokens[1]} margin />
            <Text>{parsedAmounts[StablesField.LIQUIDITY]?.toSignificant(6)}</Text>
          </RowFixed>
        </RowBetween>
        {stablePool && (
          // priceMatrix.map(row => row.map(price => price.toSignificant(2)))
          <>
            <RowBetween>
              <Text>{t('Price')}</Text>
              <Text>
                1 {stablePool?.tokens[0].symbol} = {stablePool ? priceMatrix?.[0][1]?.toSignificant(6) : '-'} {stablePool?.tokens[1].symbol}
              </Text>
            </RowBetween>
            <RowBetween>
              <div />
              <Text>
                1 {stablePool?.tokens[1]?.symbol} = {stablePool ? priceMatrix?.[1][2]?.toSignificant(6) : '-'} {stablePool?.tokens[0].symbol}
              </Text>
            </RowBetween>
          </>
        )
        }
        <Button disabled={!(approval === ApprovalState.APPROVED || signatureData !== null)} onClick={onStablesLpRemove}>
          {t('Confirm')}
        </Button>
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
  console.log("innerLiquidityPercentage", innerLiquidityPercentage)

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
          title={t('Remove %assetA%-%assetB% liquidity', {
            assetA: stablePool?.tokens[0].symbol ?? '',
            assetB: stablePool?.tokens[1].symbol ?? '',
          })}
          subtitle={`To receive ${stablePool?.tokens[0].symbol} and ${stablePool?.tokens[1].symbol}`}
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
                  {formattedAmounts[StablesField.LIQUIDITY_PERCENT]}%
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
                  <Button variant="tertiary" scale="sm" onClick={() => onLpInput(StablesField.LIQUIDITY_PERCENT, '25')}>
                    25%
                  </Button>
                  <Button variant="tertiary" scale="sm" onClick={() => onLpInput(StablesField.LIQUIDITY_PERCENT, '50')}>
                    50%
                  </Button>
                  <Button variant="tertiary" scale="sm" onClick={() => onLpInput(StablesField.LIQUIDITY_PERCENT, '75')}>
                    75%
                  </Button>
                  <Button variant="tertiary" scale="sm" onClick={() => onLpInput(StablesField.LIQUIDITY_PERCENT, '100')}>
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

                  <RowBetween>
                    <AutoColumn>
                      <Flex justifyContent="space-between" mb="8px">
                        <Flex>
                          <CurrencyLogo chainId={chainId} currency={stablePool?.tokens[0]} />
                          <Text small color="textSubtle" id="remove-liquidity-tokena-symbol" ml="4px">
                            {stablePool?.tokens[0].symbol}
                          </Text>
                        </Flex>
                        <Text small>{formattedAmounts[StablesField.CURRENCY_1] || '-'}</Text>
                      </Flex>
                      <Flex justifyContent="space-between">
                        <Flex>
                          <CurrencyLogo chainId={chainId} currency={stablePool?.tokens[2]} />
                          <Text small color="textSubtle" id="remove-liquidity-tokenb-symbol" ml="4px">
                            {stablePool?.tokens[2].symbol}
                          </Text>
                        </Flex>
                        <Text small>{formattedAmounts[StablesField.CURRENCY_3] || '-'}</Text>
                      </Flex>
                    </AutoColumn>
                    <AutoColumn>
                      <Flex justifyContent="space-between" mb="8px">
                        <Flex>
                          <CurrencyLogo chainId={chainId} currency={stablePool?.tokens[1]} />
                          <Text small color="textSubtle" id="remove-liquidity-tokena-symbol" ml="4px">
                            {stablePool?.tokens[1].symbol}
                          </Text>
                        </Flex>
                        <Text small>{formattedAmounts[StablesField.CURRENCY_2] || '-'}</Text>
                      </Flex>
                      <Flex justifyContent="space-between">
                        <Flex>
                          <CurrencyLogo chainId={chainId} currency={stablePool?.tokens[3]} />
                          <Text small color="textSubtle" id="remove-liquidity-tokenb-symbol" ml="4px">
                            {stablePool?.tokens[3].symbol}
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

          {showDetailed && (
            <Box my="16px">
              <CurrencyInputPanelStable
                width='100%'
                value={formattedAmounts[StablesField.LIQUIDITY]}
                onUserInput={(value) => onLpInput(StablesField.LIQUIDITY, value)}
                onMax={() => {
                  onLpInput(StablesField.LIQUIDITY_PERCENT, '100')
                }}
                showMaxButton={!atMaxAmount}
                stableCurrency={stablePool?.liquidityToken}
                id="liquidity-amount"
              />
              <ColumnCenter>
                <ArrowDownIcon width="24px" my="16px" />
              </ColumnCenter>
              <CurrencyInputPanelStable
                width='100%'
                hideBalance
                value={formattedAmounts[StablesField.CURRENCY_1]}
                onUserInput={(value: string) => { onField1Input(StablesField.CURRENCY_1, value) }}
                onMax={() => onLpInput(StablesField.LIQUIDITY_PERCENT, '100')}
                showMaxButton={!atMaxAmount}
                stableCurrency={stablePool?.tokens[0]}
                label={t('Output')}
                id="remove-liquidity-token1"
              />
              <ColumnCenter>
                <AddIcon width="24px" my="16px" />
              </ColumnCenter>
              <CurrencyInputPanelStable
                width='100%'
                hideBalance
                value={formattedAmounts[StablesField.CURRENCY_2]}
                onUserInput={(value: string) => { onField2Input(StablesField.CURRENCY_2, value) }}
                onMax={() => onLpInput(StablesField.LIQUIDITY_PERCENT, '100')}
                showMaxButton={!atMaxAmount}
                stableCurrency={stablePool?.tokens[1]}
                label={t('Output')}
                id="remove-liquidity-token2"
              />
              <ColumnCenter>
                <AddIcon width="24px" my="16px" />
              </ColumnCenter>
              <CurrencyInputPanelStable
                width='100%'
                hideBalance
                value={formattedAmounts[StablesField.CURRENCY_3]}
                onUserInput={(value: string) => { onField3Input(StablesField.CURRENCY_3, value) }}
                onMax={() => onLpInput(StablesField.LIQUIDITY_PERCENT, '100')}
                showMaxButton={!atMaxAmount}
                stableCurrency={stablePool?.tokens[2]}
                label={t('Output')}
                id="remove-liquidity-token3"
              />
              <ColumnCenter>
                <AddIcon width="24px" my="16px" />
              </ColumnCenter>
              <CurrencyInputPanelStable
                width='100%'
                hideBalance
                value={formattedAmounts[StablesField.CURRENCY_4]}
                onUserInput={(value: string) => { onField4Input(StablesField.CURRENCY_4, value) }}
                onMax={() => onLpInput(StablesField.LIQUIDITY_PERCENT, '100')}
                showMaxButton={!atMaxAmount}
                stableCurrency={stablePool?.tokens[3]}
                label={t('Output')}
                id="remove-liquidity-token4"
              />
            </Box>
          )}
          {stablePool && (
            <AutoColumn gap="10px" style={{ marginTop: '16px' }}>
              <Text bold color="secondary" fontSize="12px" textTransform="uppercase">
                {t('Prices')}
              </Text>
              <LightGreyCard>
                <RowFixed gap='md' padding='1px' align='center'>
                  <AutoColumn gap='sd'>
                    <Text small color="textSubtle">
                      in/out
                    </Text>
                    <Text small color="textSubtle">
                      1 {stablePool?.tokens[0].symbol} =
                    </Text>
                    <Text small color="textSubtle">
                      1 {stablePool?.tokens[1].symbol} =
                    </Text>
                    <Text small color="textSubtle">
                      1 {stablePool?.tokens[2].symbol} =
                    </Text>
                    <Text small color="textSubtle">
                      1 {stablePool?.tokens[3].symbol} =
                    </Text>
                  </AutoColumn>
                  <AutoColumn>
                    <Text small color="textSubtle">
                      {stablePool?.tokens[0].symbol}
                    </Text>
                    <Text small color="textSubtle" textAlign='center'>
                      -
                    </Text>
                    <Text small color="textSubtle">
                      {priceMatrix?.[1][0]?.toSignificant(6)}
                    </Text>
                    <Text small color="textSubtle">
                      {priceMatrix?.[2][0]?.toSignificant(6)}
                    </Text>
                    <Text small color="textSubtle">
                      {priceMatrix?.[3][0]?.toSignificant(6)}
                    </Text>
                  </AutoColumn>
                  <AutoColumn>
                    <Text small color="textSubtle">
                      {stablePool?.tokens[1].symbol}
                    </Text>
                    <Text small color="textSubtle">
                      {priceMatrix?.[0][1]?.toSignificant(6)}
                    </Text>
                    <Text small color="textSubtle" textAlign='center'>
                      -
                    </Text>
                    <Text small color="textSubtle">
                      {priceMatrix?.[2][1]?.toSignificant(6)}
                    </Text>
                    <Text small color="textSubtle">
                      {priceMatrix?.[3][1]?.toSignificant(6)}
                    </Text>
                  </AutoColumn>
                  <AutoColumn>
                    <Text small color="textSubtle">
                      {stablePool?.tokens[2].symbol}
                    </Text>
                    <Text small color="textSubtle">
                      {priceMatrix?.[0][2]?.toSignificant(6)}
                    </Text>
                    <Text small color="textSubtle">
                      {priceMatrix?.[1][2]?.toSignificant(6)}
                    </Text>
                    <Text small color="textSubtle" textAlign='center'>
                      -
                    </Text>
                    <Text small color="textSubtle">
                      {priceMatrix?.[3][2]?.toSignificant(6)}
                    </Text>
                  </AutoColumn>
                  <AutoColumn>
                    <Text small color="textSubtle">
                      {stablePool?.tokens[3].symbol}
                    </Text>
                    <Text small color="textSubtle">
                      {priceMatrix?.[0][3]?.toSignificant(6)}
                    </Text>
                    <Text small color="textSubtle">
                      {priceMatrix?.[1][3]?.toSignificant(6)}
                    </Text>
                    <Text small color="textSubtle">
                      {priceMatrix?.[2][3]?.toSignificant(6)}
                    </Text>
                    <Text small color="textSubtle" textAlign='center'>
                      -
                    </Text>
                  </AutoColumn>
                </RowFixed>
              </LightGreyCard>

              {/* <LightGreyCard>
                <AutoColumn>
                  <Flex justifyContent="space-between">
                    <Text small color="textSubtle">
                      1 {stablePool?.tokens[0].symbol} =
                    </Text>
                    <Text small>
                      -
                    </Text>
                    <Text small>
                      {priceMatrix?.[0][1]?.toSignificant(6)}
                    </Text>
                    <Text small>
                      {priceMatrix?.[0][2]?.toSignificant(6)}
                    </Text>
                    <Text small>
                      {priceMatrix?.[0][3]?.toSignificant(6)}
                    </Text>
                  </Flex>
                  <Flex justifyContent="space-between">
                    <Text small color="textSubtle">
                      1 {stablePool?.tokens[1].symbol} =
                    </Text>
                    <Text small>
                      {priceMatrix?.[1][0]?.toSignificant(6)}
                    </Text>
                    <Text small>
                      -
                    </Text>
                    <Text small>
                      {priceMatrix?.[1][2]?.toSignificant(6)}
                    </Text>
                    <Text small>
                      {priceMatrix?.[1][3]?.toSignificant(6)}
                    </Text>
                  </Flex>
                  <Flex justifyContent="space-between">
                    <Text small color="textSubtle">
                      1 {stablePool?.tokens[2].symbol} =
                    </Text>
                    <Text small>
                      {priceMatrix?.[2][0]?.toSignificant(6)}
                    </Text>
                    <Text small>
                      {priceMatrix?.[2][1]?.toSignificant(6)}
                    </Text>
                    <Text small>
                      -
                    </Text>
                    <Text small>
                      {priceMatrix?.[2][3]?.toSignificant(6)}
                    </Text>
                  </Flex>
                  <Flex justifyContent="space-between">
                    <Text small color="textSubtle">
                      1 {stablePool?.tokens[3].symbol} =
                    </Text>
                    <Text small>
                      {priceMatrix?.[3][0]?.toSignificant(6)}
                    </Text>
                    <Text small>
                      {priceMatrix?.[3][1]?.toSignificant(6)}
                    </Text>
                    <Text small>
                      {priceMatrix?.[3][2]?.toSignificant(6)}
                    </Text>
                    <Text small>
                      -
                    </Text>
                  </Flex>
                </AutoColumn>
              </LightGreyCard> */}
            </AutoColumn>
          )}
          <Box position="relative" mt="16px">
            {!account ? (
              <ConnectWalletButton />
            ) : (
              <RowBetween>
                <Button
                  variant={approval === ApprovalState.APPROVED || signatureData !== null ? 'success' : 'primary'}
                  onClick={onAttemptToApprove}
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
          <MinimalStablesPositionCard stablePool={stablePool} userLpPoolBalance={userPoolBalance[stablePool.liquidityToken.address]} />
        </AutoColumn>
      ) : null}
    </Page>
  )
}
