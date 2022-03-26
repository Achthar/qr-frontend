/* eslint-disable camelcase */
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import styled from 'styled-components'
import { TransactionResponse } from '@ethersproject/providers'
import { Percent, TokenAmount } from '@requiemswap/sdk'
import { Button, Text, ArrowDownIcon, CardBody, Slider, Box, Flex, useModal, useMatchBreakpoints } from '@requiemswap/uikit'
import { RouteComponentProps } from 'react-router'
import { BigNumber } from '@ethersproject/bignumber'
import { REQT, RREQT } from 'config/constants/tokens'
import { tryParseTokenAmount } from 'state/swapV3/hooks'
import { useTranslation } from 'contexts/Localization'
import CurrencyInputPanelExpanded from 'components/CurrencyInputPanel/CurrencyInputPanelExpanded'
import { useGovernanceInfo } from 'state/governance/hooks'
import { useWeb3React } from '@web3-react/core'
import { useChainIdHandling } from 'hooks/useChainIdHandle'
import { useNetworkState } from 'state/globalNetwork/hooks'

import { getRedRequiemAddress } from 'utils/addressHelpers'
import Row from 'components/Row'
import getChain from 'utils/getChain'
import { useGetRawWeightedPairsState } from 'hooks/useGetWeightedPairsState'
import { priceRequiem } from 'utils/poolPricer'
import useRefresh from 'hooks/useRefresh'
import useDebouncedChangeHandler from 'hooks/useDebouncedChangeHandler'

import { getStartDate, timeConverter } from './helper/constants'
import { bn_maxer, deposit_for_value, get_amount_and_multiplier } from './helper/calculator'
import LockCard from './components/lock'
import { Action, LockConfigurator } from './components/lockConfigurator'
import { AutoColumn, ColumnCenter } from '../../components/Layout/Column'
import TransactionConfirmationModal, { ConfirmationModalContent } from '../../components/TransactionConfirmationModal'
import CurrencyInputPanel from '../../components/CurrencyInputPanel'
import { MinimalPositionCard } from '../../components/PositionCard'
import { AppHeader, AppBody } from '../../components/App'
import { RowBetween, RowFixed } from '../../components/Layout/Row'
import ConnectWalletButton from '../../components/ConnectWalletButton'
import { LightGreyCard } from '../../components/Card'

import { CurrencyLogo } from '../../components/Logo'


import { useTransactionAdder } from '../../state/transactions/hooks'
import { calculateGasMargin, getRedRequiemContract } from '../../utils'
import { useApproveCallback, ApprovalState } from '../../hooks/useApproveCallback'
import Dots from '../../components/Loader/Dots'
import { Field } from '../../state/burn/actions'
import { useGasPrice, useGetRequiemAmount, useUserSlippageTolerance } from '../../state/user/hooks'
import Page from '../Page'


const BorderCard = styled.div`
  border: solid 1px ${({ theme }) => theme.colors.cardBorder};
  border-radius: 16px;
  padding: 16px;
`

const BorderCardLockList = styled.div`
  margin-top: 10px;
  border: solid 2px ${({ theme }) => theme.colors.cardBorder};
  border-radius: 16px;
  padding: 1px;
  background-color: #121212;
`

export default function Governance({
  history,
  match: {
    params: { chain },
  },
}: RouteComponentProps<{ chain: string }>) {

  const { chainId: chainIdWeb3, library, account } = useWeb3React()
  useChainIdHandling(chainIdWeb3, account)
  const { chainId } = useNetworkState()


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

  const { isMobile } = useMatchBreakpoints()

  const { balance: redReqBal, staked, locks, dataLoaded
  } = useGovernanceInfo(chainId, account)

  const now = Math.round((new Date()).getTime() / 1000);

  // start time for slider - standardized to gmt midnight of next day
  const startTime = useMemo(() => { return getStartDate() },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [])


  // select maturity with slider component
  const [selectedMaturity, onSelectMaturity] = useState(Math.round(startTime))

  // sets boolean for selected lock
  const [lockSelected, toggleLock] = useState(false)

  // sets selected lock end of existing user locks
  const [toggledLockEnd, toggleLockEnd] = useState(0)

  // define which action to take
  const [action, setAction] = useState(Action.createLock)

  // value for currency input panel
  const [inputValue, onCurrencyInput] = useState('0')

  const { slowRefresh } = useRefresh()

  // debouncer for slider
  const [maturity, selectMaturity] = useDebouncedChangeHandler(
    selectedMaturity,
    onSelectMaturity,
    200
  )

  // the user-selected lock
  const lock = useMemo(() => {
    if (lockSelected && account && dataLoaded) {
      return locks[toggledLockEnd]
    }

    return undefined
  }, [lockSelected, account, dataLoaded, locks, toggledLockEnd])


  const {
    pairs,
    metaDataLoaded,
    reservesAndWeightsLoaded,
  } = useGetRawWeightedPairsState(chainId, account, [], slowRefresh)

  const timeDiff = useMemo(() => {
    return action !== Action.increaseAmount || (lock.end === 0 || !lock) ? selectedMaturity - now : lock.end - now
  }, [lock, now, selectedMaturity, action])


  const reqPrice = useMemo(
    () => {
      return priceRequiem(chainId, pairs)
    },
    [pairs, chainId]
  )

  // useEffect(() => {
  //   if (action !== Action.createLock && selectedMaturity < lock?.end) {
  //     selectMaturity(lock.end + 1000)
  //   }
  // }, [action, selectedMaturity, selectMaturity, lock])

  const lockedAmount = useMemo(() => { return new TokenAmount(tokenA, lock?.amount ?? '0') }, [lock, tokenA])

  const [parsedAmounts, parsedMultiplier] = useMemo(() => {
    const input = BigNumber.from(tryParseTokenAmount(inputValue, tokenA)?.raw.toString() ?? 0)
    console.log("VOTE inpt", action, now, input, lock, selectedMaturity)
    const { voting, multiplier } = get_amount_and_multiplier(action, now, input, selectedMaturity, lock, locks)
    console.log("VOTE output", voting?.toString(), multiplier?.toString())
    return [
      {
        [Field.CURRENCY_A]: tryParseTokenAmount(inputValue, tokenA),
        [Field.CURRENCY_B]: new TokenAmount(tokenB, voting.gte(0) ? voting.toString() : '0')
      },
      multiplier
    ]
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenA, tokenB, inputValue, selectedMaturity, action])



  // modal and loading
  const [attemptingTxn, setAttemptingTxn] = useState(false) // clicked confirm

  // txn values
  const [txHash, setTxHash] = useState<string>('')

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

  const [approvalRreq, approveCallbackRreq] = useApproveCallback(
    chainId, account,
    new TokenAmount(RREQT[chainId], bn_maxer(Object.values(locks).map(l => l.minted)).toString()),
    getRedRequiemAddress(chainId)
  )


  // wrapped onUserInput to clear signatures
  const onUserInput = useCallback(
    (value: string) => {
      return onCurrencyInput(value)
    },
    [onCurrencyInput],
  )

  const { balance, isLoading } = useGetRequiemAmount(chainId)

  // tx sending
  const addTransaction = useTransactionAdder()



  const buttonText = action === Action.createLock ? 'Create Lock' : action === Action.increaseTime ? 'Increase Time' : 'Increase Amount'
  // function to create a lock or deposit on existing lock
  async function onGovernanceLock() {
    if (!chainId || !library || !account) return

    const redRequiemContract = getRedRequiemContract(chainId, library, account)

    const { [Field.CURRENCY_A]: parsedAmountA, [Field.CURRENCY_B]: parsedAmountB } = parsedAmounts

    let estimate
    let method: (...args: any) => Promise<TransactionResponse>
    let args: Array<string | string[] | number | BigNumber>
    let summaryText: string
    const value = BigNumber.from(0)

    // we have to differentiate between addLiquidity and createPair (which also does directly add liquidity)
    if (action === Action.createLock) {

      estimate = redRequiemContract.estimateGas.create_lock
      method = redRequiemContract.create_lock
      args = [
        parsedAmountA.toBigNumber().toHexString(),
        BigNumber.from(selectedMaturity),
      ]
      summaryText = `Lock ${parsedAmounts[Field.CURRENCY_A]?.toSignificant(3)} ${REQT[chainId]?.name
        } for ${parsedAmounts[Field.CURRENCY_B]?.toSignificant(3)} ${RREQT[chainId]?.name}`
    } else if (action === Action.increaseAmount) {
      estimate = redRequiemContract.estimateGas.increase_position
      method = redRequiemContract.increase_position
      args = [
        parsedAmountA.toBigNumber().toHexString(),
        lock.end
      ]
      summaryText = `Add ${parsedAmounts[Field.CURRENCY_A]?.toSignificant(3)} ${REQT[chainId]?.name
        } for ${parsedAmounts[Field.CURRENCY_B]?.toSignificant(3)} ${RREQT[chainId]?.name} to Lock`
    }
    else { // increase time
      estimate = redRequiemContract.estimateGas.increase_time_to_maturity
      method = redRequiemContract.increase_time_to_maturity
      args = [
        parsedAmountA.toBigNumber().toHexString(),
        lock.end,
        selectedMaturity,
      ]
      summaryText = `Add ${timeDiff / 3600 / 24
        } days for ${parsedAmounts[Field.CURRENCY_B]?.toSignificant(3)} ${RREQT[chainId]?.name} to Lock`
    }

    setAttemptingTxn(true)
    await estimate(...args)
      .then((estimatedGasLimit) =>
        method(...args, {
          gasLimit: calculateGasMargin(estimatedGasLimit),
          gasPrice,
        }).then((response) => {
          setAttemptingTxn(false)

          addTransaction(response, {
            summary: summaryText,
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
          <Text fontSize="24px" marginRight='4px'>{action !== Action.increaseTime ? parsedAmounts[Field.CURRENCY_A]?.toSignificant(6) : 'Increased Time'}</Text>
          <RowFixed gap="4px">
            <Text fontSize="24px" ml="10px" marginRight='8px'>
              {tokenA?.name}
            </Text>
            <CurrencyLogo chainId={chainId} currency={tokenA} size="24px" />
          </RowFixed>
        </RowBetween>
        <RowFixed align='flex-end'>
          <ArrowDownIcon width="16px" />
        </RowFixed>
        <RowBetween align="flex-end" >
          <Text fontSize="24px" marginRight='4px'>{parsedAmounts[Field.CURRENCY_B]?.toSignificant(6)}</Text>
          <RowFixed gap="4px">
            <Text fontSize="24px" ml="10px" marginRight='8px'>
              {tokenB?.name}
            </Text>
            <CurrencyLogo chainId={chainId} currency={tokenB} size="24px" />
          </RowFixed>
        </RowBetween>
        {/* 
        <Text small textAlign="left" pt="12px">
          {t('Output is estimated. If the price changes by more than %slippage%% your transaction will revert.', {
            slippage: allowedSlippage / 100,
          })}
        </Text> */}
      </AutoColumn>
    )
  }

  function modalBottom() {
    return (
      <>
        {/* <RowBetween>
          <Text>
            {t('%assetA%/%assetB% Burned', { assetA: tokenA?.symbol ?? '', assetB: tokenB?.symbol ?? '' })}
          </Text>
          <RowFixed>
            <DoubleCurrencyLogo chainId={chainId} currency0={tokenA} currency1={tokenB} margin />
            <Text>{parsedAmounts[Field.LIQUIDITY]?.toSignificant(6)}</Text>
          </RowFixed>
        </RowBetween> */}
        <Button disabled={!(approval === ApprovalState.APPROVED) && !(action === Action.increaseTime)} onClick={onGovernanceLock}>
          {t('Confirm')}
        </Button>
      </>
    )
  }

  const pendingText = action === Action.createLock ? 'Creating Lock' : action === Action.increaseTime ? 'Increase time on Lock' : 'Add funds to Lock'

  const handleDismissConfirmation = useCallback(() => {
    setSignatureData(null) // important that we clear signature data to avoid bad sigs
    // if there was a tx hash, we want to clear the input
    if (txHash) {
      onUserInput('0')
    }
    setTxHash('')
  }, [onUserInput, txHash])



  const [onPresentGovernanceLock] = useModal(
    <TransactionConfirmationModal
      title={action === Action.createLock ? 'You will Lock Requiem for Red Requiem' : action === Action.increaseTime ? ' You will increase the time on your Lock' : 'You will add more funds to the Lock'}
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
  const indexMax = Object.values(locks).length - 1
  console.log("VOTE LE", lock?.end)
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
              toggleLock(false)
              toggleLockEnd(0)
              setAction(Action.createLock)
            }}
            variant={lock && lock.end > 0 ? "secondary" : "primary"}
            width="100%"
            mb="8px"
            // disabled={action === Action.createLock || (lock && lock.end > 0)}
            marginLeft='5px'
          >
            Create Lock
          </Button>
          <Button
            onClick={() => {
              setAction(Action.increaseTime)
            }}
            variant={!lockSelected ? "secondary" : "primary"}
            width="100%"
            mb="8px"
            disabled={action === Action.increaseTime || !lockSelected}
          >
            {!lockSelected ? 'Select Lock' : (lock?.end < now) ? 'Lock expired' : 'Increase Time'}
          </Button>
          <Button
            onClick={() => {
              setAction(Action.increaseAmount)
              onCurrencyInput('0')
            }}
            variant={!lockSelected ? "secondary" : "primary"}
            width="100%"
            mb="8px"
            disabled={action === Action.increaseAmount || !lockSelected}
            marginRight='5px'
          >
            {(!lockSelected) ? 'Select Lock' : (lock?.end < now) ? 'Lock expired' : 'Increase Amount'}
          </Button>
        </Row>
        {lockSelected ? (

          <>
            <BorderCard>
              <Text bold textAlign='center'>{`Manage the ${timeConverter(lock?.end) ?? ''} lock`}</Text>

              <LockCard
                chainId={chainId}
                account={account}
                lock={lock}
                onSelect={() => { return null }}
                reqPrice={reqPrice}
                refTime={now}
                isFirst
                isLast
                selected
                hideSelect
                approval={null}
                approveCallback={() => { return null }}
                hideActionButton
              />
            </BorderCard>
          </>
        ) : (<Text textAlign='center'>No lock selected</Text>)
        }
        <CardBody>
          <LockConfigurator
            lock={lock}
            selectMaturity={onSelectMaturity}
            startTime={startTime}
            selectedMaturity={maturity}
            isMobile={isMobile}
            action={action}
            now={now}
          />
          <Box my="16px">
            <CurrencyInputPanelExpanded
              balanceText={action === Action.increaseTime ? 'Locked' : 'Balance'}
              balances={{ [REQT[chainId].address]: action === Action.increaseTime ? lockedAmount : balance }}
              isLoading={isLoading}
              chainId={chainId}
              account={account}
              value={formattedAmounts[Field.CURRENCY_A]}
              onUserInput={onCurrencyInput}
              onMax={() => onCurrencyInput((action === Action.increaseTime ? lockedAmount : balance)?.toSignificant(18))}
              showMaxButton={!atMaxAmount}
              currency={tokenA}
              label={action === Action.increaseTime ? `Select amount ${tokenA.symbol} locked` : 'Input'}
              // hideInput={action === Action.increaseTime}
              // reducedLine={action === Action.increaseTime}
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
                    (!!parsedAmounts[Field.CURRENCY_A] && !!parsedAmounts[Field.CURRENCY_B]) || (action === Action.increaseTime)
                      ? 'primary'
                      : 'danger'
                  }
                  onClick={() => {
                    onPresentGovernanceLock()
                  }}
                  width="100%"
                  disabled={(approval !== ApprovalState.APPROVED)}
                >
                  {buttonText}
                </Button>
              </RowBetween>
            )}
          </Box>
          <BorderCardLockList>
            <Text textAlign='center' bold>{Object.values(locks).length > 0 ? 'Your Lock(s)' : 'No locks found'}</Text>
          </BorderCardLockList>
          {

            Object.values(locks).map((lockData, index) => {

              return (
                <LockCard
                  chainId={chainId}
                  account={account}
                  lock={lockData}
                  onSelect={() => {
                    setAction(Action.increaseTime)
                    toggleLock(true)
                    selectMaturity(lockData.end)
                    toggleLockEnd(lockData.end)
                  }}
                  reqPrice={reqPrice}
                  refTime={now}
                  isFirst={index === 0}
                  isLast={indexMax === index}
                  selected={lockData.end === toggledLockEnd}
                  hideSelect={lockData.end === toggledLockEnd}
                  approval={approvalRreq}
                  approveCallback={approveCallbackRreq}
                  hideActionButton={false} 
                  toggleLock={toggleLock}
                  />)
            })
          }

        </CardBody>
      </AppBody>
    </Page>
  )
}
