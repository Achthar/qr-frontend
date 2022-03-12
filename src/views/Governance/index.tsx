/* eslint-disable camelcase */
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import styled from 'styled-components'
import { TransactionResponse } from '@ethersproject/providers'
import { Currency, currencyEquals, JSBI, NETWORK_CCY, Percent, TokenAmount, WRAPPED_NETWORK_TOKENS } from '@requiemswap/sdk'
import { Button, Text, AddIcon, ArrowDownIcon, CardBody, Slider, Box, Flex, useModal } from '@requiemswap/uikit'
import { RouteComponentProps } from 'react-router'
import { BigNumber } from '@ethersproject/bignumber'
import { DAI, REQT, RREQT } from 'config/constants/tokens'
import { tryParseAmount, tryParseTokenAmount } from 'state/swapV3/hooks'
import { useTranslation } from 'contexts/Localization'
import CurrencyInputPanelExpanded from 'components/CurrencyInputPanel/CurrencyInputPanelExpanded'
import { useGovernanceActionHandlers, useGovernanceInfo, useGovernanceState } from 'state/governance/hooks'

import getChain from 'utils/getChain'
import { AutoColumn, ColumnCenter } from '../../components/Layout/Column'
import TransactionConfirmationModal, { ConfirmationModalContent } from '../../components/TransactionConfirmationModal'
import CurrencyInputPanel from '../../components/CurrencyInputPanel'
import { MinimalPositionCard } from '../../components/PositionCard'
import { AppHeader, AppBody } from '../../components/App'
import { RowBetween, RowFixed } from '../../components/Layout/Row'
import ConnectWalletButton from '../../components/ConnectWalletButton'
import { LightGreyCard } from '../../components/Card'

import { CurrencyLogo, DoubleCurrencyLogo } from '../../components/Logo'
import { REQUIEM_PAIR_MANAGER } from '../../config/constants'
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
import { useGasPrice, useGetRequiemAmount, useUserSlippageTolerance } from '../../state/user/hooks'
import Page from '../Page'
import { deposit_for_value } from './helper/calculator'

const BorderCard = styled.div`
  border: solid 1px ${({ theme }) => theme.colors.cardBorder};
  border-radius: 16px;
  padding: 16px;
`

export default function Governance({
  history,
  match: {
    params: { chain },
  },
}: RouteComponentProps<{ chain: string }>) {

  const { account, chainId, library } = useActiveWeb3React()

  // const [tokenA, tokenB] = [useCurrency(chainId, currencyIdA) ?? undefined, useCurrency(chainId, currencyIdB) ?? undefined]
  const [tokenA, tokenB] = useMemo(
    () => [REQT[chainId], RREQT[chainId]],
    [chainId],
  )

  const { t } = useTranslation()
  const gasPrice = useGasPrice(chainId)

  useEffect(() => {
    const _chain = getChain(chainId ?? 43113)
    if (chain !== _chain) {
      history.push(`/${_chain}/governance`)
    }

  },
    [chain, chainId, history],
  )

  const x = useGovernanceInfo(chainId, account)
  console.log("GOV", x)
  const [inputValue, onCurrencyInput] = useState('0')

  const [inputTime, onTimeInput] = useState('0')
  // burn state
  // const { inputTime, inputValue } = useGovernanceState()

  const error = ''

  const parsedAmounts = useMemo(() => {
    return {
      [Field.CURRENCY_A]: tryParseTokenAmount(chainId, inputValue, tokenA),
      [Field.CURRENCY_B]: new TokenAmount(tokenB,
        deposit_for_value(BigNumber.from(tryParseTokenAmount(chainId, inputValue, tokenA)?.raw.toString() ?? 0), Number(inputTime ?? 0), BigNumber.from(0), 0).toString() ?? '0')
    }
  }, [tokenA, tokenB, inputValue, chainId, inputTime])

  // const { onCurrencyInput, onTimeInput } = useGovernanceActionHandlers()
  const isValid = !error

  // modal and loading
  const [attemptingTxn, setAttemptingTxn] = useState(false) // clicked confirm

  // txn values
  const [txHash, setTxHash] = useState<string>('')
  const deadline = useTransactionDeadline(chainId)
  const [allowedSlippage] = useUserSlippageTolerance()

  const formattedAmounts = useMemo(() => {
    return {
      [Field.CURRENCY_A]:
        parsedAmounts[Field.CURRENCY_A]?.toSignificant(6) ?? '',
      [Field.CURRENCY_B]:
        parsedAmounts[Field.CURRENCY_B]?.toSignificant(6) ?? '',
    }
  }, [parsedAmounts])
  
  const atMaxAmount = parsedAmounts[Field.CURRENCY_A]?.equalTo(new Percent('1'))

  // allowance handling
  const [signatureData, setSignatureData] = useState<{ v: number; r: string; s: string; deadline: number } | null>(null)
  const [approval, approveCallback] = useApproveCallback(chainId, account, parsedAmounts[Field.LIQUIDITY], REQUIEM_PAIR_MANAGER[chainId])

  // wrapped onUserInput to clear signatures
  const onUserInput = useCallback(
    (value: string) => {
      return onCurrencyInput(value)
    },
    [onCurrencyInput],
  )

  const { balance, isLoading } = useGetRequiemAmount(chainId)

  // wrapped onUserInput to clear signatures
  const timeInput = useCallback(
    (value: string) => {
      return onTimeInput(value)
    },
    [onTimeInput],
  )

  // tx sending
  const addTransaction = useTransactionAdder()

  async function onRemove() {
    return 0;
  }

  function modalHeader() {
    return (
      <AutoColumn gap="md">
        <RowBetween align="flex-end">
          <Text fontSize="24px">{parsedAmounts[Field.CURRENCY_A]?.toSignificant(6)}</Text>
          <RowFixed gap="4px">
            <CurrencyLogo chainId={chainId} currency={tokenA} size="24px" />
            <Text fontSize="24px" ml="10px">
              {tokenA?.symbol}
            </Text>
          </RowFixed>
        </RowBetween>
        <RowFixed>
          <AddIcon width="16px" />
        </RowFixed>
        <RowBetween align="flex-end">
          <Text fontSize="24px">{parsedAmounts[Field.CURRENCY_B]?.toSignificant(6)}</Text>
          <RowFixed gap="4px">
            <CurrencyLogo chainId={chainId} currency={tokenB} size="24px" />
            <Text fontSize="24px" ml="10px">
              {tokenB?.symbol}
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
            {t('%assetA%/%assetB% Burned', { assetA: tokenA?.symbol ?? '', assetB: tokenB?.symbol ?? '' })}
          </Text>
          <RowFixed>
            <DoubleCurrencyLogo chainId={chainId} currency0={tokenA} currency1={tokenB} margin />
            <Text>{parsedAmounts[Field.LIQUIDITY]?.toSignificant(6)}</Text>
          </RowFixed>
        </RowBetween>
        <Button disabled={!(approval === ApprovalState.APPROVED || signatureData !== null)} onClick={onRemove}>
          {t('Confirm')}
        </Button>
      </>
    )
  }

  const pendingText = t('Removing %amountA% %symbolA% and %amountB% %symbolB%', {
    amountA: parsedAmounts[Field.CURRENCY_A]?.toSignificant(6) ?? '',
    symbolA: tokenA?.symbol ?? '',
    amountB: parsedAmounts[Field.CURRENCY_B]?.toSignificant(6) ?? '',
    symbolB: tokenB?.symbol ?? '',
  })


  const handleDismissConfirmation = useCallback(() => {
    setSignatureData(null) // important that we clear signature data to avoid bad sigs
    // if there was a tx hash, we want to clear the input
    if (txHash) {
      onUserInput('0')
    }
    setTxHash('')
  }, [onUserInput, txHash])


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
          title='Governance Staking'
          subtitle={`Lock\n ${tokenA?.name ?? ''} to get ${tokenB?.name ?? ''}.`}
          noConfig
        />

        <CardBody>
          <AutoColumn gap="20px">
            <BorderCard>
              <Text fontSize="40px" bold mb="16px" style={{ lineHeight: 1 }}>
                {`${Math.round(Number(inputTime) * 100 / 365) / 100} year(s)`}
              </Text>
              <Text fontSize="20px" bold mb="16px" style={{ lineHeight: 1 }}>
                {`${inputTime} days`}
              </Text>
              <Slider
                name="lp-amount"
                min={0}
                max={730}
                value={Number(inputTime)}
                onValueChanged={(value) => { onTimeInput(String(Math.round(value))) }}
                mb="16px"
              />
              <Flex flexWrap="wrap" justifyContent="space-evenly">
                <Button variant="tertiary" scale="sm" onClick={() => onTimeInput('7')} width='110px'>
                  1 Week
                </Button>
                <Button variant="tertiary" scale="sm" onClick={() => onTimeInput('30')} width='110px'>
                  1 Month
                </Button>
                <Button variant="tertiary" scale="sm" onClick={() => onTimeInput('91')} width='110px'>
                  3 Months
                </Button>
              </Flex>
              <Flex flexWrap="wrap" justifyContent="space-evenly" marginTop='5px'>
                <Button variant="tertiary" scale="sm" onClick={() => onTimeInput('182')} width='110px'>
                  6 Months
                </Button>
                <Button variant="tertiary" scale="sm" onClick={() => onTimeInput('365')} width='110px'>
                  1 Year
                </Button>
                <Button variant="tertiary" scale="sm" onClick={() => onTimeInput('730')} width='110px'>
                  2 Years
                </Button>
              </Flex>
            </BorderCard>
          </AutoColumn>
          <Box my="16px">
            <CurrencyInputPanelExpanded
              balances={{ [REQT[chainId].address]: balance }}
              isLoading={isLoading}
              chainId={chainId}
              account={account}
              value={formattedAmounts[Field.CURRENCY_A]}
              onUserInput={onCurrencyInput}
              onMax={() => onCurrencyInput(balance?.toSignificant(18))}
              showMaxButton={!atMaxAmount}
              currency={tokenA}
              label='Input'
              onCurrencySelect={() => { return null }}
              disableCurrencySelect
              id="remove-liquidity-tokena"
            />
            <ColumnCenter>
              <ArrowDownIcon width="24px" my="16px" />
            </ColumnCenter>
            <CurrencyInputPanel
              chainId={chainId}
              account={account}
              hideBalance
              value={formattedAmounts[Field.CURRENCY_B]}
              onUserInput={() => { return null }}

              onMax={() => onUserInput('100')}
              showMaxButton={false}
              currency={tokenB}
              label='Received Red Requiem'
              disableCurrencySelect
              onCurrencySelect={() => { return null }}
              id="remove-liquidity-tokenb"
            />
          </Box>
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
    </Page>
  )
}
