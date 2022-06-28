import React, { useState, useCallback } from 'react'
import styled from 'styled-components'
import { Button, useModal, IconButton, AddIcon, MinusIcon, Skeleton, Text, Heading } from '@requiemswap/uikit'
import ConnectWalletButton from 'components/ConnectWalletButton'
import useActiveWeb3React from 'hooks/useActiveWeb3React'
import { fetchCallBondUserDataAsync } from 'state/bonds'
import { useTranslation } from 'contexts/Localization'
import useClaimRewards from 'views/Bonds/hooks/callBond/useClaimRewards'
import useToast from 'hooks/useToast'
import { useCallBondFromBondIds } from 'state/bonds/hooks'
import { useAppDispatch } from 'state'
import Dots from 'components/Loader/Dots'




interface ClaimActionProps {
  noBond: boolean
  isMobile: boolean
  userDataReady: boolean
  bondIds: number[]
}

const Claim: React.FunctionComponent<ClaimActionProps> = ({
  noBond,
  isMobile,
  bondIds
}) => {
  const { t } = useTranslation()
  const { account, chainId } = useActiveWeb3React()
  const { toastSuccess, toastError } = useToast()
  const [pendingTx, setPendingTx] = useState(false)
  const bonds = useCallBondFromBondIds(bondIds)
  const { onClaim } = useClaimRewards(chainId)


  const dispatch = useAppDispatch()
  const handleClaim = async () => {
    await onClaim()
    dispatch(fetchCallBondUserDataAsync({ chainId, account, bonds }))
  }




  if (!account) {
    return (
      <ConnectWalletButton
        height='auto'
        width={isMobile ? "40%" : "80px"}
        style={{ fontSize: '12px', borderTopLeftRadius: '10px', borderBottomLeftRadius: '10px', marginLeft: 'auto', marginRight: '3px', borderBottomRightRadius: '10px', borderTopRightRadius: '10px' }} />

    )
  }

  return (
    // <ActionContent>
    <Button
      height='auto'
      width={isMobile ? "40%" : "80px"}
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
      style={{ borderTopLeftRadius: '3px', borderBottomLeftRadius: '3px', marginLeft: 'auto', marginRight: '3px', borderBottomRightRadius: '3px', borderTopRightRadius: '3px', fontSize: '14px' }}
    >
      {noBond ? 'No Claims' : pendingTx ? <Dots>Claiming</Dots> : t('Claim')}
    </Button>
    // </ActionContent>
  )
}



export default Claim
