import React from 'react'
import styled, { ThemeContext } from 'styled-components'
import { ChevronDownIcon, useMatchBreakpoints } from '@requiemswap/uikit'
import { useTranslation } from 'contexts/Localization'
import InfoIcon from 'assets/info.svg'
import Book from 'assets/infoBook.svg'
import Loupe from 'assets/loupeWide.svg'

interface DetailsProps {
  actionPanelToggled: boolean
}

const Container = styled.div`
  display: flex;
  width: 100%;
  justify-content: flex-end;
  padding-right: 8px;
  color: ${({ theme }) => theme.colors.primary};

  ${({ theme }) => theme.mediaQueries.sm} {
    padding-right: 0px;
  }
`

const ArrowIcon = styled(ChevronDownIcon) <{ toggled: boolean }>`
  transform: ${({ toggled }) => (toggled ? 'rotate(180deg)' : 'rotate(0)')};
  height: 20px;
`

const IconWrapper = styled.div<{ height?: number, width?: number }>`
  ${({ theme }) => theme.flexColumnNoWrap};
  fill: ${({ theme }) => theme.colors.primary};

  align-items: center;
  justify-content: center;
  margin-right: 8px;
  & > img,
  span {
    height: ${({ height }) => (height ? `${height}px` : '32px')};
    width: ${({ width }) => (width ? `${width}px` : '32px')};
  }
  align-items: flex-end;

`

const StyledIcon = styled.div<{ height?: number, width?: number, isActive: boolean }>`
  margin-right:15px;
  display: flex;
  justify-content: center;
  fill: ${({ theme }) => theme.colors.primary};
  filter: invert(65%) sepia(6%) saturate(346%) hue-rotate(186deg) brightness(89%) contrast(85%);
  ${({ isActive }) => isActive && `transform: scale(1.5) rotate(45deg);
  filter: invert(99%) sepia(1%) saturate(270%) hue-rotate(202deg) brightness(118%) contrast(90%);`}
  align-items: center;
  border-radius: 100%;
  img {
    filter: grayscale(80%);
  }
  & > img,
  span {
    height: ${({ height }) => (height ? `${height}px` : '32px')};
    width: ${({ width }) => (width ? `${width}px` : '32px')};
  }
  -webkit-transition: all 700ms ease;
  -moz-transition: all 700ms ease;
  -o-transition: all 700ms ease;
`;

const StyledIconAbs = styled.div<{ height?: number, width?: number, isActive: boolean }>`
  position:absolute;
  display: flex;
  justify-content: center;
  fill: ${({ theme }) => theme.colors.primary};
  filter: invert(98%) sepia(0%) saturate(270%) hue-rotate(198deg) brightness(88%) contrast(100%);
  ${({ isActive }) => isActive && `transform: scale(1.5) rotate(30deg);
  filter: invert(46%) sepia(14%) saturate(17%) hue-rotate(325deg) brightness(91%) contrast(95%)
  drop-shadow(-0.1px -0.1px 0px #363535) 
  drop-shadow(0.1px -0.1px 0px #363535) 
  drop-shadow(0.1px 0.1px 0px #363535)
  drop-shadow(-0.1px 0.1px 0px #363535);`}
  align-items: center;
  border-radius: 100%;
  img {
    filter: grayscale(80%);
  }
  & > img,
  span {
    height: ${({ height }) => (height ? `${height}px` : '32px')};
    width: ${({ width }) => (width ? `${width}px` : '32px')};
  }
  -webkit-transition: all 300ms ease;
  -moz-transition: all 300ms ease;
  -o-transition: all 300ms ease;
`;

const Details: React.FC<DetailsProps> = ({ actionPanelToggled }) => {
  const { t } = useTranslation()
  const { isDesktop } = useMatchBreakpoints()

  return (
    <Container>
      {!isDesktop &&
        (
          <>
            <StyledIcon height={22} width={80} isActive={actionPanelToggled}>
              <img src={Book} alt='' />
            </StyledIcon>
            <StyledIconAbs height={20} width={80} isActive={actionPanelToggled}>
              <img src={Loupe} alt='' />
            </StyledIconAbs>
          </>
        )
      }
      {isDesktop && (<ArrowIcon color="primary" toggled={actionPanelToggled} />)}
    </Container>
  )
}

export default Details
