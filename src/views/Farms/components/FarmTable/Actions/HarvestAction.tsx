import React, { useState } from 'react'
import styled from 'styled-components'
import { Button, Flex, Heading, Skeleton, Text, HelpIcon, useTooltip } from '@requiemswap/uikit'
import BigNumber from 'bignumber.js'
import useActiveWeb3React from 'hooks/useActiveWeb3React'
import { FarmWithStakedValue } from 'views/Farms/components/FarmCard/FarmCard'
import Balance from 'components/Balance'
import { BIG_ZERO } from 'utils/bigNumber'
import { getBalanceAmount } from 'utils/formatBalance'
import { prettifySeconds } from 'config'

import { useAppDispatch } from 'state'
import { fetchFarmUserDataAsync } from 'state/farms'
import { usePriceCakeBusd } from 'state/farms/hooks'
import useToast from 'hooks/useToast'
import { useTranslation } from 'contexts/Localization'
import useHarvestFarm from '../../../hooks/useHarvestFarm'

import { ActionContainer, ActionTitles, ActionContent } from './styles'

const ReferenceElement = styled.div`
  display: inline-block;
`


interface HarvestActionProps extends FarmWithStakedValue {
  userDataReady: boolean
}

const HarvestAction: React.FunctionComponent<HarvestActionProps> = ({ lockMaturity, pid, userData, userDataReady }) => {
  const { toastSuccess, toastError } = useToast()
  const earningsBigNumber = new BigNumber(userData.earnings)
  const cakePrice = usePriceCakeBusd()
  let earnings = BIG_ZERO
  let earningsBusd = 0
  let displayBalance = userDataReady ? earnings.toLocaleString() : <Skeleton width={60} />

  // If user didn't connect wallet default balance will be 0
  if (!earningsBigNumber.isZero()) {
    earnings = getBalanceAmount(earningsBigNumber)
    earningsBusd = earnings.multipliedBy(cakePrice).toNumber()
    displayBalance = earnings.toFixed(3, BigNumber.ROUND_DOWN)
  }

  const { targetRef, tooltip, tooltipVisible } = useTooltip(
    'After harvest, the funds will be locked for a short while',
    { placement: 'top-end', tooltipOffset: [20, 10] },
  )

  const [pendingTx, setPendingTx] = useState(false)
  const { onReward } = useHarvestFarm(pid)
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const { account, chainId } = useActiveWeb3React()

  return (
    <ActionContainer>
      <Flex flexDirection="row" alignItems="center">
        <Flex flexDirection="column" alignItems="center" width='30%'>
          <ActionTitles>
            <Text bold textTransform="uppercase" color="secondary" fontSize="12px" pr="4px">
              AREQ
            </Text>
            <Text bold textTransform="uppercase" color="textSubtle" fontSize="12px">
              {t('Earned')}
            </Text>
          </ActionTitles>

          <div>
            <Heading>{displayBalance}</Heading>
            {earningsBusd > 0 && (
              <Balance fontSize="12px" color="textSubtle" decimals={2} value={earningsBusd} unit=" USD" prefix="~" />
            )}
          </div>
        </Flex>
        <Flex flexDirection="column" alignItems="center" width='30%'>
          <ActionTitles>
            <ReferenceElement ref={targetRef}>
              <Flex flexDirection="row" alignItems="center">
                <Text bold textTransform="uppercase" color="secondary" fontSize="12px" pr="4px">
                  Lockup
                </Text>
                <HelpIcon color="textSubtle" />
              </Flex>
            </ReferenceElement>
            {tooltipVisible && tooltip}

          </ActionTitles>
          <div>
            <Text>{lockMaturity > 0 && prettifySeconds(lockMaturity, 's')}</Text>
          </div>
        </Flex>
        <ActionContent>
          <Button
            disabled={earnings.eq(0) || pendingTx || !userDataReady}
            onClick={async () => {
              setPendingTx(true)
              try {
                await onReward()
                toastSuccess(
                  `${t('Harvested')}!`,
                  t('Your %symbol% earnings have been sent to your wallet!', { symbol: 'AREQ' }),
                )
              } catch (e) {
                toastError(
                  t('Error'),
                  t('Please try again. Confirm the transaction and make sure you are paying enough gas!'),
                )
                console.error(e)
              } finally {
                setPendingTx(false)
              }
              dispatch(fetchFarmUserDataAsync({ chainId, account, pids: [pid] }))
            }}
            ml="4px"
          >
            {t('Harvest')}
          </Button>
        </ActionContent>
      </Flex>
    </ActionContainer>
  )
}

export default HarvestAction
