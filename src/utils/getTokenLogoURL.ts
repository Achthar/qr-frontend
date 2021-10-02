export const getTokenLogoURL = (address: string) =>
  `https://assets.trustwalletapp.com/blockchains/smartchain/assets/${address}/logo.png`



export const getTokenLogoURLFromSymbol = (symbol:string) =>
  `https://requiem-finance.s3.eu-west-2.amazonaws.com/logos/tokens/${symbol}.png`
