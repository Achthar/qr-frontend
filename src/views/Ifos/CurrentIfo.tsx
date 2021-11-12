import React from 'react'
import { useNetworkState } from 'state/globalNetwork/hooks'
import { ifosConfig } from 'config/constants'
import useGetPublicIfoV2Data from 'views/Ifos/hooks/v2/useGetPublicIfoData'
import useGetWalletIfoV2Data from 'views/Ifos/hooks/v2/useGetWalletIfoData'
import IfoFoldableCard from './components/IfoFoldableCard'
import IfoLayout from './components/IfoLayout'
import IfoSteps from './components/IfoSteps'
import IfoQuestions from './components/IfoQuestions'


/**
 * Note: currently there should be only 1 active IFO at a time
 */
const activeIfo = ifosConfig.find((ifo) => ifo.isActive)

const Ifo = () => {
  const {chainId} = useNetworkState()
  const publicIfoData = useGetPublicIfoV2Data(chainId, activeIfo)
  const walletIfoData = useGetWalletIfoV2Data(chainId, activeIfo)

  return (
    <IfoLayout>
      <IfoFoldableCard ifo={activeIfo} publicIfoData={publicIfoData} walletIfoData={walletIfoData} isInitiallyVisible />
      <IfoSteps chainId={walletIfoData.chainId} ifo={activeIfo} walletIfoData={walletIfoData} />
      <IfoQuestions />
    </IfoLayout>
  )
}

export default Ifo
