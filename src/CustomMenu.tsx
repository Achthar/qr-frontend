import { useTranslation } from 'contexts/Localization'
import React from 'react'
import UserMenu from 'components/Menu/UserMenu'
import GlobalSettings from 'components/Menu/GlobalSettings'
import ChainIdSelector from 'ChainIdSelector'
import styled from "styled-components";
import { useMatchBreakpoints } from '@requiemswap/uikit'
import GeneralNav from 'GeneralNav'

const AppHeaderContainer = styled.div`
  pointer-events: none;
  position: fixed;
  top: 30px;
  height: 70;
  width: 100%;
  justify-content: flex-end;
  align-items: center;
  display: flex;
  z-index: 9;
  paddingRight: 15;
`

const MenuComponentContainer = styled.div<{ zIndex: number }>`
  pointer-events: all;
  z-index: ${({ zIndex }) => zIndex};
  position: fixed;
`

const CustomMenu: React.FC = () => {
  const { t } = useTranslation()
  const { isMobile, isTablet, isDesktop } = useMatchBreakpoints()
  return (
    <AppHeaderContainer
    >
      <MenuComponentContainer zIndex={9}>
        <GeneralNav />
      </MenuComponentContainer>
      <MenuComponentContainer zIndex={10}>
        <ChainIdSelector />
      </MenuComponentContainer>
      <MenuComponentContainer zIndex={11}>
        <UserMenu />
      </MenuComponentContainer>
    </AppHeaderContainer>
  )
}

export default CustomMenu
