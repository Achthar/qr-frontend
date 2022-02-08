import { useTranslation } from 'contexts/Localization'
import React from 'react'
import UserMenu from 'components/Menu/UserMenu'
import GlobalSettings from 'components/Menu/GlobalSettings'
import ChainIdSelector from 'ChainIdSelector'
import CustomNav from 'CustomNav'
import { useMatchBreakpoints } from '@requiemswap/uikit'
import GeneralNav from 'GeneralNav'

const CustomMenu: React.FC = () => {
  const { t } = useTranslation()
  const { isMobile, isTablet, isDesktop } = useMatchBreakpoints()
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        height: 70,
        width: '100%',
        justifyContent: 'flex-end',
        alignItems: 'center',
        display: 'flex',
        zIndex: 9,
        paddingRight: 15,
      }}
    >
      <div style={{ marginRight: 10 }}>
        <GeneralNav />
      </div>
      {/* <GlobalSettings /> */}
      <div style={{ marginRight: 10 }}>
        <ChainIdSelector />
      </div>
      <UserMenu />
    </div>
  )
}

export default CustomMenu
