import React from 'react'
import { useWeb3React } from '@web3-react/core'
import { ifosConfig } from 'config/constants'
import { Ifo } from 'config/constants/types'
import IfoCardV2Data from './components/IfoCardV2Data'
// import IfoCardV1Data from './components/IfoCardV1Data'
import IfoLayout from './components/IfoLayout'


const inactiveIfo: Ifo[] = ifosConfig.filter((ifo) => !ifo.isActive)

const PastIfo = () => {
  const {chainId} =useWeb3React()
  return (
    <IfoLayout>
      {inactiveIfo.map((ifo) =>
          <IfoCardV2Data chainId={chainId} key={ifo.id} ifo={ifo} isInitiallyVisible={false} />
      )}
    </IfoLayout>
  )
}

export default PastIfo
