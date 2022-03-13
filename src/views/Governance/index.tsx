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

import { getRedRequiemAddress } from 'utils/addressHelpers'
import Row from 'components/Row'
import getChain from 'utils/getChain'
import { getRedRequiemContract } from 'utils/contractHelpers'
import { deposit_for_value } from './helper/calculator'
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


  enum Action {
    createLock,
    increaseTime,
    increaseAmount
  }

  const { balance: redReqBal, staked, lock, dataLoaded
  } = useGovernanceInfo(chainId, account)

  const now = Math.round((new Date()).getTime() / 1000);

  const timeDiff = useMemo(() => {

    return lock.end - now
  }, [lock, now])


  const [action, setAction] = useState(lock && lock.end > 0 ? Action.increaseTime : Action.createLock)


  console.log("GOV", redReqBal, staked, lock, timeDiff)

  // this one is executed once if it turns out that the user
  // already a lock
  useEffect(() => {
    if (dataLoaded && lock.end > 0) {
      setAction(Action.increaseTime)
    }
  }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    , [dataLoaded]
  )


  const [inputValue, onCurrencyInput] = useState('0')

  const [inputTime, onTimeInput] = useState('0')

  // wrapped onUserInput to clear signatures
  const timeInput = useCallback(
    (value: string) => {
      return onTimeInput(value)
    },
    [onTimeInput])

  console.log("LOCK GOV", lock, now)

  const parsedAmounts = useMemo(() => {
    return {
      [Field.CURRENCY_A]: tryParseTokenAmount(chainId, inputValue, tokenA),
      [Field.CURRENCY_B]: new TokenAmount(tokenB,
        deposit_for_value(
          action !== Action.increaseTime ? BigNumber.from(tryParseTokenAmount(chainId, inputValue, tokenA)?.raw.toString() ?? 0) : BigNumber.from(0),
          action !== Action.increaseAmount ? Number(inputTime ?? 0) : 0,
          BigNumber.from(lock.amount),
          lock.end,
        ).toString() ?? '0')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenA, tokenB, inputValue, chainId, inputTime, action])

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
  const [approval, approveCallback] = useApproveCallback(chainId, account, parsedAmounts[Field.CURRENCY_A], getRedRequiemAddress(chainId))

  // wrapped onUserInput to clear signatures
  const onUserInput = useCallback(
    (value: string) => {
      return onCurrencyInput(value)
    },
    [onCurrencyInput],
  )

  const { balance, isLoading } = useGetRequiemAmount(chainId)

  const noLock = useMemo(() => { return lock.end === 0 || lock.end < now }, [lock, now])
  // tx sending
  const addTransaction = useTransactionAdder()

  // function to create a lock or deposit on existing lock
  async function onCreateLock() {
    if (!chainId || !library || !account) return
    const redRequiemContract = getRedRequiemContract(chainId, library)

    const { [Field.CURRENCY_A]: parsedAmountA, [Field.CURRENCY_B]: parsedAmountB } = parsedAmounts
    if (!parsedAmountA || !parsedAmountB || !deadline) {
      return
    }

    let estimate
    let method: (...args: any) => Promise<TransactionResponse>
    let args: Array<string | string[] | number>
    let value: BigNumber | null

    // we have to differentiate between addLiquidity and createPair (which also does directly add liquidity)
    if (noLock) {

      estimate = redRequiemContract.estimateGas.create_lock
      method = redRequiemContract.create_lock
      args = [
        parsedAmountA.raw.toString(),
        Math.round(Number(inputTime)),
      ]
    } else {
      estimate = redRequiemContract.estimateGas.deposit_for
      method = redRequiemContract.deposit_for
      args = [
        account,
        parsedAmountA.raw.toString(),
      ]
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
            summary: `Lock ${parsedAmounts[Field.CURRENCY_A]?.toSignificant(3)} ${REQT[chainId]?.name
              } for ${parsedAmounts[Field.CURRENCY_B]?.toSignificant(3)} ${RREQT[chainId]?.name}`,
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


  // function to create a lock or deposit on existing lock
  async function onIncreaseAmount() {
    if (!chainId || !library || !account) return
    const redRequiemContract = getRedRequiemContract(chainId, library)

    const { [Field.CURRENCY_A]: parsedAmountA, [Field.CURRENCY_B]: parsedAmountB } = parsedAmounts
    if (!parsedAmountA || !parsedAmountB || !deadline) {
      return
    }

    let estimate
    let method: (...args: any) => Promise<TransactionResponse>
    let args: Array<string | string[] | number>
    let value: BigNumber | null

    // we have to differentiate between addLiquidity and createPair (which also does directly add liquidity)
    if (noLock) {

      estimate = redRequiemContract.estimateGas.create_lock
      method = redRequiemContract.create_lock
      args = [
        parsedAmountA.raw.toString(),
        Math.round(Number(inputTime)),
      ]
    } else {
      estimate = redRequiemContract.estimateGas.deposit_for
      method = redRequiemContract.deposit_for
      args = [
        account,
        parsedAmountA.raw.toString(),
      ]
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
            summary: `Lock ${parsedAmounts[Field.CURRENCY_A]?.toSignificant(3)} ${REQT[chainId]?.name
              } for ${parsedAmounts[Field.CURRENCY_B]?.toSignificant(3)} ${RREQT[chainId]?.name}`,
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
        <Button disabled={!(approval === ApprovalState.APPROVED || signatureData !== null)} onClick={onCreateLock}>
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
    'lockForGovernance',
  )
  console.log("INP GOV", inputTime, Math.round(Number(inputTime) * 100 / 365 / 24 / 3600) / 100, parsedAmounts[Field.CURRENCY_B].toSignificant(18))
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
        <Row width='90%' height='50px' gap='9px' marginTop='7px' >
          <Button
            onClick={() => {
              setAction(Action.createLock)
            }}
            variant={lock && lock.end > 0 ? "secondary" : "primary"}
            width="100%"
            mb="8px"
            disabled={action === Action.createLock || (lock && lock.end > 0)}
            marginLeft='5px'
          >
            {lock && lock.end > 0 ? 'Lock existis' : 'Create Lock'}
          </Button>
          <Button
            onClick={() => {
              setAction(Action.increaseTime)
            }}
            variant={lock.end === 0 ? "secondary" : "primary"}
            width="100%"
            mb="8px"
            disabled={action === Action.increaseTime || lock.end === 0}
          >
            {(lock.end === 0) ? 'No Lock' : (lock.end < now) ? 'Lock expired' : 'Increase Time'}
          </Button>
          <Button
            onClick={() => {
              setAction(Action.increaseAmount)
              onCurrencyInput('0')
            }}
            variant={lock.end === 0 ? "secondary" : "primary"}
            width="100%"
            mb="8px"
            disabled={action === Action.increaseAmount || lock.end === 0}
            marginRight='5px'
          >
            {(lock.end === 0) ? 'No Lock' : (lock.end < now) ? 'Lock expired' : 'Increase Amount'}
          </Button>
        </Row>
        <CardBody>
          <AutoColumn gap="20px">
            <BorderCard>
              {((lock && lock.end === 0 && action !== Action.increaseAmount) || action === Action.increaseTime) ?
                (
                  <>
                    <Text fontSize="20px" bold mb="16px" style={{ lineHeight: 1 }}>
                      {action !== Action.increaseTime ? 'Define your lock period and amount to lock.' : ' Select time to add to your lock.'}
                    </Text>

                    <Text fontSize="30px" bold mb="16px" style={{ lineHeight: 1 }}>
                      {action !== Action.increaseTime ? `${Math.round(Number(inputTime) * 100 / 365) / 100} year(s)` :
                        `Extend lock to ${Math.round((Number(inputTime) + timeDiff / 3600 / 24) * 100 / 365) / 100} year(s)`}
                    </Text>
                    <Text fontSize="20px" bold mb="16px" style={{ lineHeight: 1 }}>
                      {action !== Action.increaseTime ? `${Math.round(Number(inputTime) * 100) / 100} days` : ` Add ${Math.round(Number(inputTime) * 100) / 100} days to Lock`}
                    </Text>

                    <Slider
                      name="lp-amount"
                      min={0}
                      max={action !== Action.increaseTime? 1095:(1095 - timeDiff / 3600 / 24)}
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
                      <Button variant="tertiary" scale="sm" onClick={() => onTimeInput('182')} width='110px'>
                        6 Months
                      </Button>
                    </Flex>
                    <Flex flexWrap="wrap" justifyContent="space-evenly" marginTop='5px'>
                      <Button variant="tertiary" scale="sm" onClick={() => onTimeInput('365')} width='110px'>
                        1 Year
                      </Button>
                      <Button variant="tertiary" scale="sm" onClick={() => onTimeInput('730')} width='110px'>
                        2 Years
                      </Button>
                      <Button variant="tertiary" scale="sm" onClick={() => onTimeInput('1095')} width='110px'>
                        3 Years
                      </Button>
                    </Flex>
                  </>) : (<>
                    <Text fontSize="30px" bold mb="16px" style={{ lineHeight: 1 }}>
                      {`${Math.round(timeDiff * 100 / 365 / 24 / 3600) / 100} year(s)`}
                    </Text>
                    <Text fontSize="20px" bold mb="16px" style={{ lineHeight: 1 }}>
                      {`${Math.round(timeDiff * 100 / 3600 / 24) / 100} days remain until unlock`}
                    </Text>
                  </>)}
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
              label={action === Action.increaseTime ? 'No input required' : 'Input'}
              hideInput={action === Action.increaseTime}
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

              onMax={() => { return null }}
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
                    !!parsedAmounts[Field.CURRENCY_A] && !!parsedAmounts[Field.CURRENCY_B]
                      ? 'primary'
                      : 'danger'
                  }
                  onClick={() => {
                    onPresentRemoveLiquidity()
                  }}
                  width="100%"
                  disabled={(signatureData === null && approval !== ApprovalState.APPROVED)}
                >
                  Lock
                </Button>
              </RowBetween>
            )}
          </Box>
        </CardBody>
      </AppBody>
    </Page>
  )
}
