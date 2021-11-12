/* eslint prefer-template: 0 */
/* eslint react/jsx-pascal-case: 0 */
import React, { useContext } from 'react'
import { AlertCircle, CheckCircle } from 'react-feather'
import { getNetworkExplorerLink } from 'utils'
import { AutoColumn } from 'components/Column'
import { AutoRow } from 'components/Row'
import { useTranslation } from 'contexts/Localization'
import styled, { ThemeContext } from 'styled-components'
import { useNetworkState } from 'state/globalNetwork/hooks'
import { TYPE } from '../../theme'
import { ExternalLink } from '../../theme/components'


const RowNoFlex = styled(AutoRow)`
  flex-wrap: nowrap;
`

export default function TransactionPopup({
  hash,
  success,
  summary
}: {
  hash: string
  success?: boolean
  summary?: string
}) {
  const { chainId } = useNetworkState()

  const { t } = useTranslation()
  const theme = useContext(ThemeContext)

  return (
    <RowNoFlex>
      <div style={{ paddingRight: 16 }}>
        {success ? <CheckCircle color={theme.green1} size={24} /> : <AlertCircle color={theme.red1} size={24} />}
      </div>
      <AutoColumn gap="8px">
        <TYPE.body fontWeight={500}>
          {summary ?? (t('popups.hash') + hash.slice(0, 8) + '...' + hash.slice(58, 65))}
        </TYPE.body>
        {chainId && (
          <ExternalLink href={getNetworkExplorerLink(hash, 'transaction', chainId)}>{t('popups.viewExplorer')}</ExternalLink>
        )}
      </AutoColumn>
    </RowNoFlex>
  )
}
