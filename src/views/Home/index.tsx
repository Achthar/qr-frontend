/* eslint react/no-children-prop: 0 */
import React, { useMemo } from 'react'
import styled from 'styled-components'
import PageSection from 'components/PageSection'
import { useWeb3React } from '@web3-react/core'
import useTheme from 'hooks/useTheme'
import Container from 'components/Layout/Container'
import { Text, Step, Stepper, Card, CardBody } from '@pancakeswap/uikit'
import { Status } from '@pancakeswap/uikit/src/components/Stepper/types'
import ReactDom from 'react-dom'

import ReactMarkdown from 'react-markdown'
// import * as fs from 'fs';
// import { readFile } from 'fs'
// import { swapSectionData, earnSectionData, cakeSectionData } from './components/SalesSection/data'
// import MetricsSection from './components/MetricsSection'
// import SalesSection from './components/SalesSection'
// import FarmsPoolsRow from './components/FarmsPoolsRow'
// import Footer from './components/Footer'
import CakeDataRow from './components/CakeDataRow'


import { WedgeTopLeft, InnerWedgeWrapper, OuterWedgeWrapper, WedgeTopRight, WedgeBottomRight } from './components/WedgeSvgs'
// import Hero from 'views/Ifos/components/Hero'



const Home: React.FC = () => {
  const { theme } = useTheme()
  const { account, chainId } = useWeb3React()

  // useMemo(() => {
  //   const request = new XMLHttpRequest();
  //   request.open('GET', 'https://requiem-finance.s3.eu-west-2.amazonaws.com/home/landing.md', true);
  //   request.send(null);
  //   request.onreadystatechange = function () {
  //     if (request.readyState === 4 && request.status === 200) {
  //       const type = request.getResponseHeader('Content-Type');
  //       if (type.indexOf("text") !== 1) {
  //         console.log(request.responseText)
  //         return request.responseText;
  //       }
  //     }
  //     return ''
  //   }
  // }, [])
  const HomeSectionContainerStyles = { margin: '0', width: '100%', maxWidth: '968px' }
  const StyledBackIcon = styled.div`
  background-image: url(${'https://requiem-finance.s3.eu-west-2.amazonaws.com/home/landing.md'});
  width: 500px;
  zindex: 5;
  opacity: 1;

`;

  const headers = ['Swap', 'Stable Swap', 'Lending', 'Margin Trading']
  const steps = ['Regular product based swap structure is implemented',
    'Stable swap liquidity is set up, trading and integration with product structure to come.',
    'Lending and collateralizable liquidity', 'Leveraged trading - trade loan and collateral positions directly on Requiem DEX'];
  const status: Status[] = ["past", "current", "future", "future"];

  // const fileUrl = new URL('https://requiem-finance.s3.eu-west-2.amazonaws.com/home/landing.md')
  return (


    <>

      <PageSection innerProps={{ style: { margin: '0', width: '100%' } }} index={2} hasCurvedDivider={false}>
        <Container width='600px'>

          <PageSection
            innerProps={{ style: HomeSectionContainerStyles }}
            background={theme.colors.background}
            index={2}
            hasCurvedDivider
          >
            <OuterWedgeWrapper>
              <InnerWedgeWrapper top fill='#D8CBED'>
                <WedgeTopLeft height='20px' />

              </InnerWedgeWrapper>

            </OuterWedgeWrapper>
            <Text fontSize="30px" bold>Requiem Finance</Text>
          </PageSection>

          <Stepper>
            {steps.map((step, index) => (
              <Step key={step} index={index} status={status[index]} >
                <Card>
                  <CardBody>
                    <Text fontSize='24px' textTransform="capitalize" bold>{headers[index]}</Text>
                    {step}
                  </CardBody>
                </Card>
              </Step>
            ))}
          </Stepper>

          <StyledBackIcon />

          <PageSection
            innerProps={{ style: HomeSectionContainerStyles }}
            background={theme.colors.background}
            index={2}
            hasCurvedDivider
          >
            <OuterWedgeWrapper>
              <InnerWedgeWrapper top fill='#D8CBED'>
                <WedgeBottomRight height='20px' />

              </InnerWedgeWrapper>

            </OuterWedgeWrapper>
          </PageSection>

        </Container>


        {/* <ReactMarkdown children={getText()} /> */}


        {/*
      <PageSection
        innerProps={{ style: HomeSectionContainerStyles }}
        background={theme.colors.background}
        index={2}
        hasCurvedDivider={false}
      >
        <OuterWedgeWrapper>
          <InnerWedgeWrapper top fill={theme.isDark ? '#201335' : '#D8CBED'}>
            <WedgeTopLeft />
          </InnerWedgeWrapper>
        </OuterWedgeWrapper>
        <SalesSection {...swapSectionData} />
      </PageSection>
      <PageSection
        innerProps={{ style: HomeSectionContainerStyles }}
        index={2}
        hasCurvedDivider={false}
      >
        <OuterWedgeWrapper>
          <InnerWedgeWrapper width="150%" top fill={theme.colors.background}>
            <WedgeTopRight />
          </InnerWedgeWrapper>
        </OuterWedgeWrapper>
        <SalesSection {...earnSectionData} />
        <FarmsPoolsRow {...chainId} />
      </PageSection>
      <PageSection
        innerProps={{ style: HomeSectionContainerStyles }}
        background={theme.colors.background}
        index={2}
        hasCurvedDivider={false}
      >
        <SalesSection {...cakeSectionData} />
        <CakeDataRow />
      </PageSection> */}
      </PageSection>
    </>
  )
}

export default Home
