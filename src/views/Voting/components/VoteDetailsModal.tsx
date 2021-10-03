import React, { useState } from 'react'
import { useWeb3React } from '@web3-react/core'
import { Box, Flex, InjectedModalProps, Modal, Button, Spinner } from '@pancakeswap/uikit'
import { useTranslation } from 'contexts/Localization'
import useTheme from 'hooks/useTheme'
import useGetVotingPower from '../hooks/useGetVotingPower'
import DetailsView from './CastVoteModal/DetailsView'

interface VoteDetailsModalProps extends InjectedModalProps {
  block: number
}

const VoteDetailsModal: React.FC<VoteDetailsModalProps> = ({ block, onDismiss }) => {
  const {chainId} = useWeb3React()
  const { t } = useTranslation()
  const [modalIsOpen, setModalIsOpen] = useState(true)
  const { isLoading, total, cakeBalance, cakeVaultBalance, cakePoolBalance, poolsBalance, cakeBnbLpBalance } =
    useGetVotingPower(chainId, block, modalIsOpen)
  const { theme } = useTheme()

  const handleDismiss = () => {
    setModalIsOpen(false)
    onDismiss()
  }

  return (
    <Modal title={t('Voting Power')} onDismiss={handleDismiss}>
      <Box mb="24px" width="320px">
        {isLoading ? (
          <Flex height="450px" alignItems="center" justifyContent="center">
            <Spinner size={80} />
          </Flex>
        ) : (
          <>
            <DetailsView
              total={total}
              cakeBalance={cakeBalance}
              cakeVaultBalance={cakeVaultBalance}
              cakePoolBalance={cakePoolBalance}
              poolsBalance={poolsBalance}
              cakeBnbLpBalance={cakeBnbLpBalance}
            />
            <Button variant="secondary" onClick={onDismiss} width="100%" mt="16px">
              {t('Close')}
            </Button>
          </>
        )}
      </Box>
    </Modal>
  )
}

export default VoteDetailsModal
