import React, { useEffect } from 'react'
import styled from 'styled-components'
import { ModalBody, ModalContainer, Message } from '@requiemswap/uikit'
import { WrappedTokenInfo } from 'state/lists/hooks'
import Acknowledgement from './Acknowledgement'

const StyledModalContainer = styled(ModalContainer)`
  max-width: 440px;
`

const MessageContainer = styled(Message)`
  align-items: flex-start;
  justify-content: flex-start;
`

interface SwapWarningModalProps {
  chainId: number
  swapCurrency: WrappedTokenInfo
  onDismiss?: () => void
}

// Modal is fired by a useEffect and doesn't respond to closeOnOverlayClick prop being set to false
const usePreventModalOverlayClick = () => {
  useEffect(() => {
    const preventClickHandler = (e) => {
      e.stopPropagation()
      e.preventDefault()
      return false
    }

    document.querySelectorAll('[role="presentation"]').forEach((el) => {
      el.addEventListener('click', preventClickHandler, true)
    })

    return () => {
      document.querySelectorAll('[role="presentation"]').forEach((el) => {
        el.removeEventListener('click', preventClickHandler, true)
      })
    }
  }, [])
}

const SwapWarningModal: React.FC<SwapWarningModalProps> = ({ onDismiss }) => {
  usePreventModalOverlayClick()
  return (
    <StyledModalContainer minWidth="280px">
      {/* <ModalHeader>
        <Heading p="12px 24px">{t('Notice for trading %symbol%', { symbol: SWAP_WARNING.symbol })}</Heading>
      </ModalHeader> */}
      <ModalBody p="24px">
        {/* <MessageContainer variant="warning" mb="24px">
          <Box>{SWAP_WARNING.component}</Box>
        </MessageContainer> */}
        <Acknowledgement handleContinueClick={onDismiss} />
      </ModalBody>
    </StyledModalContainer>
  )
}

export default SwapWarningModal
