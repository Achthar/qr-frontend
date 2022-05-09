import React, { useState, useCallback } from 'react'
import styled from 'styled-components'
import { Button, useModal, IconButton, AddIcon, MinusIcon, Skeleton, Text, Heading } from '@requiemswap/uikit'
import { useLocation } from 'react-router-dom'
import { BigNumber } from 'bignumber.js'
import ConnectWalletButton from 'components/ConnectWalletButton'
import useActiveWeb3React from 'hooks/useActiveWeb3React'
import { fetchBondUserDataAsync } from 'state/bonds'
import { BondWithStakedValue } from 'views/Bonds/components/BondCard/BondCard'
import { useTranslation } from 'contexts/Localization'
import useClaimRewards from 'views/Bonds/hooks/useClaimRewards'
import useToast from 'hooks/useToast'
import { useAppDispatch } from 'state'
import Dots from 'components/Loader/Dots'
import { BondActionContainer, ActionTitles, ActionContent } from './styles'




interface ClaimActionProps extends BondWithStakedValue {
  noBond: boolean
  isMobile: boolean
  userDataReady: boolean
  lpLabel?: string
  displayApr?: string
}

const Claim: React.FunctionComponent<ClaimActionProps> = ({
  noBond,
  isMobile,
  bondId,
  name,
}) => {
  const { t } = useTranslation()
  const { account, chainId } = useActiveWeb3React()
  const { toastSuccess, toastError } = useToast()
  const [pendingTx, setPendingTx] = useState(false)

  const { onClaim } = useClaimRewards(chainId)


  const dispatch = useAppDispatch()
  const handleClaim = async () => {
    await onClaim()
    dispatch(fetchBondUserDataAsync({ chainId, account, bondIds: [bondId] }))
  }




  if (!account) {
    return (
      <BondActionContainer isMobile={isMobile}>
        <ActionTitles>
          <Text bold textTransform="uppercase" color="textSubtle" fontSize="12px">
            {t('Claim Rewards ')}
          </Text>
        </ActionTitles>
        <ActionContent>
          <ConnectWalletButton width="100%" />
        </ActionContent>
      </BondActionContainer>
    )
  }

  return (
      <ActionContent>
        <Button
          width="60px"
          disabled={
            pendingTx || noBond
          }
          onClick={async () => {
            setPendingTx(true)
            try {
              await handleClaim()
              toastSuccess(t('Claimed!'), t('Your rewards have been transferred to you wallet'))
              // onDismiss()
            } catch (e) {
              toastError(
                t('Error'),
                t('Please try again. Confirm the transaction and make sure you are paying enough gas!'),
              )
              console.error(e)
            } finally {
              setPendingTx(false)
            }
          }}
          style={{ borderTopLeftRadius: '3px', borderBottomLeftRadius: '3px', marginLeft: '3px', marginRight: '3px', marginBottom: '5px' }}
        >
          {noBond ? 'No Claims' : pendingTx ? <Dots>Claim ongoing</Dots> : t('Claim')}
        </Button>
      </ActionContent>
  )
}



export default Claim
