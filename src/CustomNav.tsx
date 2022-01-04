import { UserMenu as UIKitUserMenu, ButtonMenu, ButtonMenuItem, useMatchBreakpoints } from '@requiemswap/uikit'
import config from 'components/Menu/config'
import { useTranslation } from 'contexts/Localization'
import React from 'react'
import { useHistory, useLocation } from 'react-router'
import styled from 'styled-components'
import Logo from './components/Logo/Logo'

const StyledLogo = styled(Logo) <{ size: string }>`
  width: ${({ size }) => size};
  height: ${({ size }) => size};
`

const LIQUIDITY_ROUTES = ['/add', '/find', '/remove']

const CustomNav: React.FC = () => {
  const { t } = useTranslation()
  const history = useHistory()
  const location = useLocation()
  const { isMobile } = useMatchBreakpoints()

  const menuItems = config(t)

  const activeIndex = menuItems.findIndex((i) => {
    const pathname = location.pathname.match(new RegExp(`^${LIQUIDITY_ROUTES.join('|^')}`))
      ? '/liquidity'
      : location.pathname
    return i.href.match(new RegExp(`^${pathname}`))
  })
  const handleMenuItemClick = (index: number) => {
    history.push(menuItems[index].href)
  }
  const current = menuItems[activeIndex]
  return (
    <div
      style={{
        position: 'relative',
        // top: '15px',
        width: '100%',
        justifyContent: 'left',
        alignItems: 'left',
        display: 'flex',
        zIndex: 9,
      }}
    >
      <UIKitUserMenu text={current?.label ?? 'Requiem Finance'} avatarSrc={current?.icon ?? 'https://requiem-finance.s3.eu-west-2.amazonaws.com/logos/requiem/REQT_large.png'}>
        <ButtonMenu activeIndex={activeIndex} onItemClick={handleMenuItemClick} scale="md">
          {menuItems.map((menuItem) =>
            isMobile ? (
              <ButtonMenuItem key={menuItem?.label}>
                <StyledLogo
                  size="24px"
                  srcs={[current?.label === menuItem?.label ? menuItem.iconSelected : menuItem.icon]}
                  alt={menuItem?.label.charAt(0)}
                />
              </ButtonMenuItem>
            ) : (
              <ButtonMenuItem key={menuItem.label}>{menuItem.label}</ButtonMenuItem>
            ),
          )}
        </ButtonMenu>
      </UIKitUserMenu>
    </div>
  )
}

export default CustomNav
