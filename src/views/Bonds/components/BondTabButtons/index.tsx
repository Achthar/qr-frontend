import React from 'react'
import styled from 'styled-components'
import { Button, ButtonMenu, ButtonMenuItem, NotificationDot } from '@requiemswap/uikit'

interface BondTabButtonsProps {
  hasStakeInFinishedBonds: boolean
  onLive: () => void;
  isLive: boolean
}

const BondTabButtons: React.FC<BondTabButtonsProps> = ({ hasStakeInFinishedBonds, onLive, isLive }) => {

  let activeIndex
  const otherBool = !isLive;
  if (isLive) {
    activeIndex = 0
  } else {
    activeIndex = 1
  }
  console.log("ISLIVE", isLive)
  return (
    <Wrapper>
      {/* <ButtonMenu activeIndex={activeIndex} scale="sm"> */}
      <Button
        width="130px"
        height='30px'
        onClick={onLive}
        variant="primary"
        disabled={isLive}
        style={{ borderTopLeftRadius: '16px', borderBottomLeftRadius: '16px', marginLeft: '5px', marginRight: '3px', borderBottomRightRadius: '3px', borderTopRightRadius: '3px' }}
      >
        Live
      </Button>
      <NotificationDot show={hasStakeInFinishedBonds}>
        <Button
          width="130px"
          height='30px'
          onClick={onLive}
          variant="primary"
          disabled={!isLive}
          style={{ borderTopLeftRadius: '3px', borderBottomLeftRadius: '3px', marginLeft: '5px', marginRight: '3px', borderBottomRightRadius: '16px', borderTopRightRadius: '16px' }}
        >
          Closed
        </Button>
      </NotificationDot>
      {/* </ButtonMenu> */}
    </Wrapper>
  )
}

export default BondTabButtons

const Wrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;

  a {
    padding-left: 12px;
    padding-right: 12px;
  }

  ${({ theme }) => theme.mediaQueries.sm} {
    margin-left: 16px;
  }
`
