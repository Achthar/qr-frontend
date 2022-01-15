import { UserMenu as UIKitUserMenu, ButtonMenu, ButtonMenuItem, useMatchBreakpoints, UserMenuItem } from '@requiemswap/uikit'
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

interface MenuProps {
  history: any
  current: any
  menuItem: any
  isMobile: boolean
}


const MenuItem: React.FC<MenuProps> = ({ history, current, menuItem, isMobile }) => {
  return (
    isMobile ? (
      <UserMenuItem as='button' onClick={() => history.push(menuItem.href)}>
        {/* <ButtonMenuItem key={menuItem?.label}> */}
          <StyledLogo
            size="24px"
            srcs={[current?.label === menuItem?.label ? menuItem.iconSelected : menuItem.icon]}
            alt={menuItem?.label.charAt(0)}
          />
        {/* </ButtonMenuItem> */}

      </UserMenuItem>
    ) 
    : (
      <UserMenuItem as='button' onClick={() => history.push(menuItem.href)}>
        {menuItem.label}
      </UserMenuItem>
    )
  )
}

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

  const current = menuItems[activeIndex]
  return (
    <UIKitUserMenu
      text={current?.label ?? 'Requiem Finance'}
      avatarSrc={current?.icon ?? 'https://requiem-finance.s3.eu-west-2.amazonaws.com/logos/requiem/REQT_large.png'}
    >
      {menuItems.map((menuItem) =>
        <MenuItem history={history} current={current} isMobile={isMobile} menuItem={menuItem} />
      )}
    </UIKitUserMenu>
  )
}

export default CustomNav
