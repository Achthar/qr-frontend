import React from 'react'
import styled from 'styled-components'
import { BondAssetType, SerializedToken } from 'config/constants/types'
import { deserializeToken } from 'state/user/hooks/helpers'
import PoolLogo from 'components/Logo/PoolLogo'

export interface CallBondProps {
  label: string
  bondId: number
  bondType: BondAssetType
  tokens: SerializedToken[]
}

const Container = styled.div`
  padding-left: 16px;
  display: flex;
  align-items: center;

  ${({ theme }) => theme.mediaQueries.sm} {
    padding-left: 26px;
  }
`

const TokenWrapper = styled.div`
  padding-right: 8px;
  width: 48px;

  ${({ theme }) => theme.mediaQueries.sm} {
    width: 40px;
  }
`

const CallBondMobile: React.FunctionComponent<CallBondProps> = ({ tokens, label, bondId, bondType }) => {

  return (
    <Container>
      <PoolLogo tokens={tokens.map(tok => deserializeToken(tok))} size={25} overlap='-5px' />
    </Container>
  )
}

export default CallBondMobile
