/* eslint-disable camelcase */
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import styled from 'styled-components'
import { TransactionResponse } from '@ethersproject/providers'
import { Percent, TokenAmount } from '@requiemswap/sdk'
import { Button, Text, ArrowDownIcon, CardBody, Slider, Box, Flex, useModal, useMatchBreakpoints, Image } from '@requiemswap/uikit'
import { RouteComponentProps } from 'react-router'
import { BigNumber } from '@ethersproject/bignumber'
import { ABREQ, GREQ, REQT, RREQT, SREQ } from 'config/constants/tokens'
import { tryParseTokenAmount, tryParseAmount } from 'state/swapV3/hooks'
import { useTranslation } from 'contexts/Localization'
import CurrencyInputPanelExpanded from 'components/CurrencyInputPanel/CurrencyInputPanelExpanded'
import { useGovernanceInfo } from 'state/governance/hooks'
import useActiveWeb3React from 'hooks/useActiveWeb3React'
import { useChainIdHandling } from 'hooks/useChainIdHandle'
import { useNetworkState } from 'state/globalNetwork/hooks'

import { getAssetBackedStakingAddress, getRedRequiemAddress } from 'utils/addressHelpers'
import Row from 'components/Row'
import getChain from 'utils/getChain'
import { useGetRawWeightedPairsState } from 'hooks/useGetWeightedPairsState'
import { priceAssetBackedRequiem, priceRequiem } from 'utils/poolPricer'
import useRefresh from 'hooks/useRefresh'
import wrapImage from 'assets/wrap.png'
import stakeImage from 'assets/stake.svg'
import useDebouncedChangeHandler from 'hooks/useDebouncedChangeHandler'
import { fetchGovernanceData } from 'state/governance/fetchGovernanceData'
import { useAssetBackedStakingInfo } from 'state/assetBackedStaking/hooks'
import { useAppDispatch } from 'state'
import useToast from 'hooks/useToast'
import Column from 'components/Column'
import { getStartDate, timeConverter } from 'utils/time'
import { formatSerializedBigNumber } from 'utils/formatBalance'
import { bn_maxer, get_amount_and_multiplier } from './helper/calculator'
import LockCard from './components/lock'
import { useWrap, useUnwrap, useStake, useUnstake } from './hooks/transactWithStaking'
import Page from '../Page'
import { ColumnCenter } from '../../components/Layout/Column'
import CurrencyInputPanel from '../../components/CurrencyInputPanel'
import { AppHeader, AppBody } from '../../components/App'
import { RowBetween, RowFixed } from '../../components/Layout/Row'
import ConnectWalletButton from '../../components/ConnectWalletButton'


import { useTransactionAdder } from '../../state/transactions/hooks'
import { getRedRequiemContract } from '../../utils'
import { useApproveCallback, ApprovalState } from '../../hooks/useApproveCallback'
import Dots from '../../components/Loader/Dots'
import { Field } from '../../state/burn/actions'
import { useGasPrice, useGetAssetBackedRequiemAmount, useGetRequiemAmount, useGetRequiemAmounts, useUserSlippageTolerance } from '../../state/user/hooks'




export const ColumnMiddleCenter = styled(Column)`
  width: 100%;
  align-items: center;
  margin-top: 10px;
  margin-bottom: 10px;
`

export const ImageButton = styled(Image)`
  color: black;
  border-radius: 30px;
  width: 40px;
  height: 100%;
`

const Wrapping = styled.img`
    margin-left:20px;
    border-radius: 30px;
    width: 40px;
    height: 100%;
    transform:rotate(45deg);
    filter: invert(100%); 
`;

const Staking = styled.img`
    margin-left:20px;
    border-radius: 30px;
    width: 30px;
    height: 100%;
    transform:rotate(45deg);
`;



export const ArrowButton = styled(Button)`
  width: 60%;
  align-items: center;
  background-color:  ${({ theme }) => theme.colors.cardBorder};
  border-radius: 5px;
`

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

export default function GovernanceAssetBackedRequiem({
  history,
  match: {
    params: { chain },
  },
}: RouteComponentProps<{ chain: string }>) {

  const { chainId: chainIdWeb3, library, account } = useActiveWeb3React()
  useChainIdHandling(chainIdWeb3, account)
  const { chainId } = useNetworkState()


  const dispatch = useAppDispatch()

  // const [tokenA, tokenB] = [useCurrency(chainId, currencyIdA) ?? undefined, useCurrency(chainId, currencyIdB) ?? undefined]

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

  // const { balance: redReqBal, staked, locks, dataLoaded
  // } = useGovernanceInfo(chainId, account)

  const now = Math.round((new Date()).getTime() / 1000);

  // start time for slider - standardized to gmt midnight of next day
  const startTime = useMemo(() => { return getStartDate() },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [])


  enum Action {
    stake,
    unstake,
    wrap,
    unwrap
  }

  // select maturity with slider component
  const [selectedMaturity, onSelectMaturity] = useState(Math.round(startTime))

  // sets boolean for selected lock
  const [lockSelected, toggleLock] = useState(false)

  // sets selected lock end of existing user locks
  const [toggledLockEnd, toggleLockEnd] = useState(0)

  // define which action to take
  const [action, setAction] = useState(Action.stake)

  const isStake = useMemo(() => { return action === Action.stake || action === Action.unstake },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [action])

  const [tokenA, tokenB] = useMemo(
    () => {
      return action === Action.stake ? [ABREQ[chainId], SREQ[chainId]] :
        action === Action.unstake ? [SREQ[chainId], ABREQ[chainId]] :
          action === Action.wrap ? [SREQ[chainId], GREQ[chainId]] :
            [GREQ[chainId], SREQ[chainId]]
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [chainId, action]
  )

  const { balances, isLoading } = useGetRequiemAmounts(chainId)

  console.log("STAKING BALS", balances, tokenA.address, tokenB.address)
  // value for currency input panel
  const [inputValue, onCurrencyInput] = useState('0')

  const { slowRefresh } = useRefresh()

  // // the user-selected lock
  // const lock = useMemo(() => {
  //   if (lockSelected && account && dataLoaded) {
  //     return locks[toggledLockEnd]
  //   }

  //   return undefined
  // }, [lockSelected, account, dataLoaded, locks, toggledLockEnd])


  const {
    pairs,
    metaDataLoaded,
    reservesAndWeightsLoaded,
  } = useGetRawWeightedPairsState(chainId, account, [], slowRefresh)

  const reqPrice = useMemo(
    () => {
      return priceAssetBackedRequiem(chainId, pairs)
    },
    [pairs, chainId]
  )


  const { epoch, stakeData, generalDataLoaded, userData, userDataLoaded } = useAssetBackedStakingInfo(chainId, account)

  const parsedAmounts = useMemo(() => {
    if (isStake) {
      return {
        [Field.CURRENCY_A]: tryParseAmount(chainId, inputValue, tokenA),
        [Field.CURRENCY_B]: tryParseTokenAmount(String(inputValue), tokenB)
      }
    }

    const index = Number(formatSerializedBigNumber(stakeData.index, 18, 18))
    if (action === Action.wrap) {
      return {
        // staked REQ
        [Field.CURRENCY_A]: tryParseAmount(chainId, inputValue, tokenA),
        // governance REQ
        [Field.CURRENCY_B]: tryParseTokenAmount(String(Number(inputValue) * index), tokenB)
      }
    }
    return {
      // staked REQ
      [Field.CURRENCY_A]: tryParseAmount(chainId, inputValue, tokenA),
      // governance REQ
      [Field.CURRENCY_B]: tryParseTokenAmount(String(Number(inputValue) / index), tokenB)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenA, tokenB, inputValue, selectedMaturity, action]
  )

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
  const [approval, approveCallback] = useApproveCallback(chainId, account, parsedAmounts[Field.CURRENCY_A], getAssetBackedStakingAddress(chainId))



  // const { balance, isLoading } = useGetAssetBackedRequiemAmount(chainId)

  // tx sending
  const addTransaction = useTransactionAdder()





  const summaryText = action === Action.stake ? `Lock ${parsedAmounts[Field.CURRENCY_A]?.toSignificant(3)} ${GREQ[chainId]?.name
    } for ${parsedAmounts[Field.CURRENCY_B]?.toSignificant(3)} ${RREQT[chainId]?.name}` :
    action === Action.wrap
  // transactions with lock
  const { onStake } = useStake()
  const { onUnstake } = useUnstake()
  const { onWrap } = useWrap()
  const { onUnwrap } = useUnwrap()

  // function to create a lock or deposit on existing lock
  const transactWithGovernance = async () => {
    if (!chainId || !library || !account) return


    const { [Field.CURRENCY_A]: parsedAmountA, [Field.CURRENCY_B]: parsedAmountB } = parsedAmounts

    // we have to differentiate between addLiquidity and createPair (which also does directly add liquidity)
    if (action === Action.stake) {
      await onStake(parsedAmountA.toBigNumber().toHexString())
    } else if (action === Action.unstake) {
      await onUnstake(parsedAmountA.toBigNumber().toHexString())
    } else if (action === Action.wrap) {
      await onWrap(parsedAmountA.toBigNumber().toHexString())
    }
    else {
      await onUnwrap(parsedAmountA.toBigNumber().toHexString())
    }


    dispatch(fetchGovernanceData({ chainId, account }))
  }

  const { toastSuccess, toastError } = useToast()
  const [pendingTx, setPendingTx] = useState(false)

  // the final transaction function
  const transactionFunc = async () => {
    setPendingTx(true)
    try {
      await transactWithGovernance()
      toastSuccess(titleText, summaryText)
      // onDismiss()
    } catch (e) {
      toastError(
        'Error',
        'Please try again. Confirm the transaction and make sure you are paying enough gas!',
      )
      console.error(e)
    } finally {
      setPendingTx(false)
    }
  }

  // const buttonText = action === Action.stake ? 'Stake' : action === Action.unstake ? 'Unstake' : action === Action.wrap ? 'Wrap' : 'Unwrap'


  // const titleText = action === Action.stake ? 'Staked!' :
  //   action === Action.wrap ? 'Wrapped!' : 'Unwrapped'
  const [labelTopPanel, labelBottomPanel, arrowButtonText, buttonText, titleText] = useMemo(() => {
    return action === Action.stake ? ['Stake', 'To Receive', 'Stake instead', 'Stake', 'Stake Asset-Backed Requiem'] :
      action === Action.unstake ? ['Unstake', 'To Receive', 'Unstake instead', 'Unstake', 'Stake Staked Requiem'] :
        action === Action.wrap ? ['Wrap', 'To Receive', 'Unwrap instead', 'Wrap', 'Wrap Staked Requiem'] :
          ['Unwrap', 'To Receive', 'Wrap instead', 'Unwrap', 'Unwrap Governance Requiem']
  },

    // eslint-disable-next-line react-hooks/exhaustive-deps
    [action])

  const pendingText = useMemo(() => {
    return action === Action.stake ? 'Staking' : action === Action.unstake ? 'Unstaking' : action === Action.wrap ? 'Wrapping' : 'Unwrapping'
  },

    // eslint-disable-next-line react-hooks/exhaustive-deps
    [action])


  const onArrowClick = useCallback(() => {
    if (action === Action.stake) {
      return setAction(Action.unstake)
    }
    if (action === Action.wrap) {
      return setAction(Action.unwrap)
    }
    if (action === Action.unstake) {
      return setAction(Action.stake)
    }
    if (action === Action.unwrap) {
      return setAction(Action.wrap)
    }
    return 0;
  },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [action, setAction])

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
              setAction(Action.stake)
            }}
            variant="primary"
            width="100%"
            mb="8px"
            disabled={isStake}
            marginLeft='5px'
          >
            Staking
          </Button>
          <Button
            onClick={() => {
              setAction(Action.wrap)
            }}
            variant="primary"
            width="100%"
            mb="8px"
            disabled={!isStake}
          >
            Wrapper
          </Button>
        </Row>
        <CardBody>
          <Box my="16px">
            {action === Action.stake ? 'Stake Asset-Backed Requiem' : 'Wrap or unwrap Governance Requiem'}
          </Box>
          <Box my="16px">
            <CurrencyInputPanelExpanded
              balanceText={action === Action.wrap ? 'Locked' : 'Balance'}
              balances={{ [tokenA.address]: balances[tokenA.address] }}
              isLoading={isLoading}
              chainId={chainId}
              account={account}
              value={inputValue}
              onUserInput={onCurrencyInput}
              onMax={() => onCurrencyInput((balances[tokenA.address])?.toSignificant(18))}
              showMaxButton={!atMaxAmount}
              currency={tokenA}
              label={labelTopPanel}
              // hideInput={action === Action.wrap}
              // reducedLine={action === Action.wrap}
              onCurrencySelect={() => { return null }}
              disableCurrencySelect
              id="input to lock"
            />
            <ColumnMiddleCenter>
              <ArrowButton onClick={() => { return onArrowClick() }}>
                <ArrowDownIcon width="34px" my="26px" onClick={() => { onArrowClick() }} color='white' />
                <Text color='white' bold>
                  {buttonText}
                </Text>
                {isStake ? (<Staking src={stakeImage} />) : (<Wrapping src={wrapImage} />)}
              </ArrowButton>
            </ColumnMiddleCenter>
            <CurrencyInputPanelExpanded
              isLoading={isLoading}
              chainId={chainId}
              account={account}
              balances={{ [tokenB.address]: balances[tokenB.address] }}
              value={formattedAmounts[Field.CURRENCY_B]}
              onUserInput={() => { return null }}
              onMax={() => { return null }}
              showMaxButton={false}
              currency={tokenB}
              label={labelBottomPanel}
              disableCurrencySelect
              onCurrencySelect={() => { return null }}
              id="token for accounting"
            />
          </Box>
          <Box position="relative" mt="16px">
            {!account ? (
              <ConnectWalletButton align='center' height='27px' width='100%' />
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
                    (!!parsedAmounts[Field.CURRENCY_A] && !!parsedAmounts[Field.CURRENCY_B]) || (action === Action.wrap)
                      ? 'primary'
                      : 'danger'
                  }
                  onClick={() => {
                    transactionFunc()
                  }}
                  width="100%"
                  disabled={(approval !== ApprovalState.APPROVED) || pendingTx}
                >
                  {!pendingTx ? buttonText : (
                    <Dots>
                      {pendingText}
                    </Dots>
                  )}
                </Button>
              </RowBetween>
            )}
          </Box>
        </CardBody>
      </AppBody>
    </Page>
  )
}
