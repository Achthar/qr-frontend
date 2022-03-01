/* eslint react/no-children-prop: 0 */
import React from 'react'
import PageSection from 'components/PageSection'
import Container from 'components/Layout/Container'
import { Text, Step, Stepper, Card, CardBody, Image, useMatchBreakpoints } from '@requiemswap/uikit'
import { Status } from '@requiemswap/uikit/src/components/Stepper/types'
import iconREQTransparent from 'assets/REQ_Transparent.png';

import Row from 'components/Row'

const Home: React.FC = () => {
  const { isMobile } = useMatchBreakpoints()


  const intro = 'Requiem Finance is a decentralized platform that will give traders easy access to the most powerful tools in DeFi. At its core, it is a decentralized exchange with a stable swap built-in -ensuring traders get access to the best pricing. We already have a beta of our DEX  deployed on the AVAX testnet on requiem.finance. However, this is just the beginning. The following features are on our immediate release roadmap:'
  const headers = ['Swap', 'Stable Swap', 'Lending', 'Margin Trading', 'Farm Swap', 'Yield swap']
  const steps = [
    'Regular product based swap structure is implemented',
    'Stable swap liquidity is set up, trading and integration with product structure to come.',
    'Lending and collateralizable liquidity',
    'Traders will have access to loans with a wide range of accepted collateral for trading on margin. To ensure that margin trading, and especially margin calls, stay efficient for both sides, loans will be directly tradable against their collateral -meaning a trader can sell their collateral to repay their loan in just 1 transaction, or vise-versa.',
    'This will enable users to swap rewards/yields from farming on foreign LPs (e.g. Pangolin) against the ones from Requiem LPs.',
    'Which are analog to interest rate swaps in CeFi. Users will be able to draw a collateralized loan (that then is instantly locked for providing liquidity/lending over a fixed time) versus a similar collateral (e.g. USDT vs. USDC) to directly and efficiently benefit from different yields (also between multiple platforms) without being required to bring the collateral upfront. This will also keep our borrowing and lending rates competitive.'
  ]

  const outlook = 'These features are the ones we have chosen to tackle first, however, we aim to continuously innovate to be the most sophisticated trading platform DeFi has to offer. At the moment, we are a small team of engineers and ex-CeFi employees but we hope that with your support, we can attract additional experienced individuals to join us on our journey.'
  const status: Status[] = ['past', 'past', 'current', 'future']

  const titleFont = {
    lineHeight: 1.2,
    fontSize: '60px',
    bold: true,
    fontWeight: 600,
  }

  const mobileIconStyle = {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15,
  }

  const iconStyle = isMobile ? mobileIconStyle : {}

  return (
    <>
      <PageSection
        innerProps={{
          style: { margin: '0', width: '100%', maxWidth: '1000px' },
        }}
        index={2}
        hasCurvedDivider={false}
      >
        <Container width="100%" maxWidth="25000px" style={{ marginBottom: 60 }}>
          <div
            style={{
              justifyContent: 'center'
            }}
          >
            <Row align="space-between" style={{ marginBottom: 20, justifyContent: 'center', ...iconStyle }}>

              {!isMobile ? (
                <>
                  <Text marginTop='50px' marginRight='10px' {...titleFont}>Requiem</Text>

                  <Image
                    src={iconREQTransparent}
                    width={991 / 4}
                    height={927 / 4}
                    alt="REQT"
                  />
                  <Text marginTop='50px' marginLeft='10px' {...titleFont}>Finance</Text>
                </>)
                :
                (
                  <>
                    <Image
                      src={iconREQTransparent}
                      width={991 / 4}
                      height={927 / 4}
                      alt="REQT"
                    />

                    <Text marginTop='50px' marginLeft='10px' fontSize='30px' bold>Requiem Finance</Text>
                  </>
                )
              }
            </Row>
          </div>
          <Text fontSize="24px" color='white'>
            {intro}
          </Text>
          <Stepper>
            {steps.map((step, index) => (
              <Step key={step} index={index} status={status[index]}>
                <Card>
                  <CardBody>
                    <Text fontSize="24px" textTransform="capitalize" bold>
                      {headers[index]}
                    </Text>
                    {step}
                  </CardBody>
                </Card>
              </Step>
            ))}
          </Stepper>
          <Text fontSize="24px" color='white'>
            {outlook}
          </Text>
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
        <SalesSection {...REQTSectionData} />
        <REQTDataRow />
      </PageSection> */}
      </PageSection>
    </>
  )
}

export default Home
