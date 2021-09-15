import tokens from './tokens'
import { FarmConfig, FarmConfigNew } from './types'
import { ChainId } from '../index'

export const farms: FarmConfig[] = [
  /**
   * These 3 farms (PID 0, 251, 252) should always be at the top of the file.
   */
  {
    pid: 0,
    lpSymbol: 'CAKE',
    lpAddresses: {
      97: '0x9C21123D94b93361a29B2C2EFB3d5CD8B17e0A9e',
      56: '0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82',
    },
    token: tokens.syrup,
    quoteToken: tokens.wbnb,
  },
  {
    pid: 251,
    lpSymbol: 'CAKE-BNB LP',
    lpAddresses: {
      97: '0x3ed8936cAFDF85cfDBa29Fbe5940A5b0524824F4',
      56: '0x0eD7e52944161450477ee417DE9Cd3a859b14fD0',
    },
    token: tokens.cake,
    quoteToken: tokens.wbnb,
  },
  {
    pid: 252,
    lpSymbol: 'BUSD-BNB LP',
    lpAddresses: {
      97: '',
      56: '0x58F876857a02D6762E0101bb5C46A8c1ED44Dc16',
    },
    token: tokens.busd,
    quoteToken: tokens.wbnb,
  },
  /**
   * V2 farms, set to be removed once unstaked
   */
  {
    pid: 139,
    lpSymbol: 'CAKE-BNB LP',
    lpAddresses: {
      97: '',
      56: '0xFB7E9FE9D13561AdA7131Fa746942a14F7dd4Cf6',
    },
    token: tokens.cake,
    quoteToken: tokens.wbnb,
  },
  {
    pid: 63,
    lpSymbol: 'UST-BUSD LP',
    lpAddresses: {
      97: '',
      56: '0xD1F12370b2ba1C79838337648F820a87eDF5e1e6',
    },
    token: tokens.ust,
    quoteToken: tokens.busd,
  },
  {
    pid: 54,
    lpSymbol: 'LTC-BNB LP',
    lpAddresses: {
      97: '',
      56: '0xbc765fd113c5bdb2ebc25f711191b56bb8690aec',
    },
    token: tokens.ltc,
    quoteToken: tokens.wbnb,
  },
  {
    pid: 53,
    lpSymbol: 'USDC-BUSD LP',
    lpAddresses: {
      97: '',
      56: '0x680dd100e4b394bda26a59dd5c119a391e747d18',
    },
    token: tokens.usdc,
    quoteToken: tokens.busd,
  },
  {
    pid: 52,
    lpSymbol: 'DAI-BUSD LP',
    lpAddresses: {
      97: '',
      56: '0x3aB77e40340AB084c3e23Be8e5A6f7afed9D41DC',
    },
    token: tokens.dai,
    quoteToken: tokens.busd,
  },
  {
    pid: 51,
    lpSymbol: 'BSCX-BNB LP',
    lpAddresses: {
      97: '',
      56: '0x20781bc3701c5309ac75291f5d09bdc23d7b7fa8',
    },
    token: tokens.bscx,
    quoteToken: tokens.wbnb,
  },
  {
    pid: 50,
    lpSymbol: 'TEN-BNB LP',
    lpAddresses: {
      97: '',
      56: '0x01ecc44ddd2d104f44d2aa1a2bd9dfbc91ae8275',
    },
    token: tokens.ten,
    quoteToken: tokens.wbnb,
  },
  {
    pid: 49,
    lpSymbol: 'bALBT-BNB LP',
    lpAddresses: {
      97: '',
      56: '0xbe14f3a89a4f7f279af9d99554cf12e8c29db921',
    },
    token: tokens.balbt,
    quoteToken: tokens.wbnb,
  },
  {
    pid: 46,
    lpSymbol: 'OG-BNB LP',
    lpAddresses: {
      97: '',
      56: '0x64373608f2e93ea97ad4d8ca2cce6b2575db2f55',
    },
    token: tokens.og,
    quoteToken: tokens.wbnb,
  },
  {
    pid: 47,
    lpSymbol: 'ASR-BNB LP',
    lpAddresses: {
      97: '',
      56: '0xd6b900d5308356317299dafe303e661271aa12f1',
    },
    token: tokens.asr,
    quoteToken: tokens.wbnb,
  },
  {
    pid: 48,
    lpSymbol: 'ATM-BNB LP',
    lpAddresses: {
      97: '',
      56: '0xd5b3ebf1a85d32c73a82b40f75e1cd929caf4029',
    },
    token: tokens.atm,
    quoteToken: tokens.wbnb,
  },
  {
    pid: 45,
    lpSymbol: 'REEF-BNB LP',
    lpAddresses: {
      97: '',
      56: '0x58B58cab6C5cF158f63A2390b817710826d116D0',
    },
    token: tokens.reef,
    quoteToken: tokens.wbnb,
  },
  {
    pid: 44,
    lpSymbol: 'Ditto-BNB LP',
    lpAddresses: {
      97: '',
      56: '0x470bc451810b312bbb1256f96b0895d95ea659b1',
    },
    token: tokens.ditto,
    quoteToken: tokens.wbnb,
  },
  {
    pid: 43,
    lpSymbol: 'JUV-BNB LP',
    lpAddresses: {
      97: '',
      56: '0x51a2ffa5b7de506f9a22549e48b33f6cf0d9030e',
    },
    token: tokens.juv,
    quoteToken: tokens.wbnb,
  },
  {
    pid: 42,
    lpSymbol: 'PSG-BNB LP',
    lpAddresses: {
      97: '',
      56: '0x9c4f6a5050cf863e67a402e8b377973b4e3372c1',
    },
    token: tokens.psg,
    quoteToken: tokens.wbnb,
  },
  {
    pid: 39,
    lpSymbol: 'UNFI-BNB LP',
    lpAddresses: {
      97: '',
      56: '0xbEA35584b9a88107102ABEf0BDeE2c4FaE5D8c31',
    },
    token: tokens.unfi,
    quoteToken: tokens.wbnb,
  },
  {
    pid: 41,
    lpSymbol: 'VAI-BUSD LP',
    lpAddresses: {
      97: '',
      56: '0xff17ff314925dff772b71abdff2782bc913b3575',
    },
    token: tokens.vai,
    quoteToken: tokens.busd,
  },
  {
    pid: 40,
    lpSymbol: 'BLK-BNB LP',
    lpAddresses: {
      97: '',
      56: '0xC743Dc05F03D25E1aF8eC5F8228f4BD25513c8d0',
    },
    token: tokens.blink,
    quoteToken: tokens.wbnb,
  },
  {
    pid: 37,
    lpSymbol: 'HARD-BNB LP',
    lpAddresses: {
      97: '0xE66790075ad839978fEBa15D4d8bB2b415556a1D',
      56: '0x9f40e8a2fcaa267a0c374b6c661e0b372264cc3d',
    },
    token: tokens.hard,
    quoteToken: tokens.wbnb,
  },
  {
    pid: 2,
    lpSymbol: 'BUSD-BNB LP',
    lpAddresses: {
      97: '0x2f7682b64b88149ba3250aee32db712964de5fa9',
      56: '0x1b96b92314c44b159149f7e0303511fb2fc4774f',
    },
    token: tokens.busd,
    quoteToken: tokens.wbnb,
  },
  {
    pid: 3,
    lpSymbol: 'ADA-BNB LP',
    lpAddresses: {
      97: '0xcbe3282a562e23b8c61ed04bb72ffdbb9233b1ce',
      56: '0xba51d1ab95756ca4eab8737ecd450cd8f05384cf',
    },
    token: tokens.ada,
    quoteToken: tokens.wbnb,
  },
  {
    pid: 4,
    lpSymbol: 'BAND-BNB LP',
    lpAddresses: {
      97: '0xcbe3282a562e23b8c61ed04bb72ffdbb9233b1ce',
      56: '0xc639187ef82271d8f517de6feae4faf5b517533c',
    },
    token: tokens.band,
    quoteToken: tokens.wbnb,
  },
  {
    pid: 5,
    lpSymbol: 'DOT-BNB LP',
    lpAddresses: {
      97: '0xE66790075ad839978fEBa15D4d8bB2b415556a1D',
      56: '0xbcd62661a6b1ded703585d3af7d7649ef4dcdb5c',
    },
    token: tokens.dot,
    quoteToken: tokens.wbnb,
  },
  {
    pid: 6,
    lpSymbol: 'EOS-BNB LP',
    lpAddresses: {
      97: '0xE66790075ad839978fEBa15D4d8bB2b415556a1D',
      56: '0x981d2ba1b298888408d342c39c2ab92e8991691e',
    },
    token: tokens.eos,
    quoteToken: tokens.wbnb,
  },
  {
    pid: 7,
    lpSymbol: 'LINK-BNB LP',
    lpAddresses: {
      97: '0xE66790075ad839978fEBa15D4d8bB2b415556a1D',
      56: '0xaebe45e3a03b734c68e5557ae04bfc76917b4686',
    },
    token: tokens.link,
    quoteToken: tokens.wbnb,
  },
  {
    pid: 11,
    lpSymbol: 'USDT-BUSD LP',
    lpAddresses: {
      97: '0xE66790075ad839978fEBa15D4d8bB2b415556a1D',
      56: '0xc15fa3E22c912A276550F3E5FE3b0Deb87B55aCd',
    },
    token: tokens.usdt,
    quoteToken: tokens.busd,
  },
  {
    pid: 12,
    lpSymbol: 'TWT-BNB LP',
    lpAddresses: {
      97: '0xE66790075ad839978fEBa15D4d8bB2b415556a1D',
      56: '0x610e7a287c27dfFcaC0F0a94f547Cc1B770cF483',
    },
    token: tokens.twt,
    quoteToken: tokens.wbnb,
  },
  {
    pid: 13,
    lpSymbol: 'XVS-BNB LP',
    lpAddresses: {
      97: '0xE66790075ad839978fEBa15D4d8bB2b415556a1D',
      56: '0x41182c32F854dd97bA0e0B1816022e0aCB2fc0bb',
    },
    token: tokens.xvs,
    quoteToken: tokens.wbnb,
  },
  {
    pid: 14,
    lpSymbol: 'ETH-BNB LP',
    lpAddresses: {
      97: '0xE66790075ad839978fEBa15D4d8bB2b415556a1D',
      56: '0x70D8929d04b60Af4fb9B58713eBcf18765aDE422',
    },
    token: tokens.eth,
    quoteToken: tokens.wbnb,
  },
  {
    pid: 15,
    lpSymbol: 'BTCB-BNB LP',
    lpAddresses: {
      97: '0xE66790075ad839978fEBa15D4d8bB2b415556a1D',
      56: '0x7561EEe90e24F3b348E1087A005F78B4c8453524',
    },
    token: tokens.btcb,
    quoteToken: tokens.wbnb,
  },
  {
    pid: 16,
    lpSymbol: 'ALPHA-BNB LP',
    lpAddresses: {
      97: '0xE66790075ad839978fEBa15D4d8bB2b415556a1D',
      56: '0x4e0f3385d932F7179DeE045369286FFa6B03d887',
    },
    token: tokens.alpha,
    quoteToken: tokens.wbnb,
  },
  {
    pid: 17,
    lpSymbol: 'USDT-BNB LP',
    lpAddresses: {
      97: '0xE66790075ad839978fEBa15D4d8bB2b415556a1D',
      56: '0x20bcc3b8a0091ddac2d0bc30f68e6cbb97de59cd',
    },
    token: tokens.usdt,
    quoteToken: tokens.wbnb,
  },
  {
    pid: 21,
    lpSymbol: 'DAI-BNB LP',
    lpAddresses: {
      97: '0xE66790075ad839978fEBa15D4d8bB2b415556a1D',
      56: '0x56c77d59e82f33c712f919d09fceddf49660a829',
    },
    token: tokens.dai,
    quoteToken: tokens.wbnb,
  },
  {
    pid: 22,
    lpSymbol: 'XTZ-BNB LP',
    lpAddresses: {
      97: '0xE66790075ad839978fEBa15D4d8bB2b415556a1D',
      56: '0x5acac332f0f49c8badc7afd0134ad19d3db972e6',
    },
    token: tokens.xtz,
    quoteToken: tokens.wbnb,
  },
  {
    pid: 23,
    lpSymbol: 'BCH-BNB LP',
    lpAddresses: {
      97: '0xE66790075ad839978fEBa15D4d8bB2b415556a1D',
      56: '0x54edd846db17f43b6e43296134ecd96284671e81',
    },
    token: tokens.bch,
    quoteToken: tokens.wbnb,
  },
  {
    pid: 24,
    lpSymbol: 'YFI-BNB LP',
    lpAddresses: {
      97: '0xE66790075ad839978fEBa15D4d8bB2b415556a1D',
      56: '0x68Ff2ca47D27db5Ac0b5c46587645835dD51D3C1',
    },
    token: tokens.yfi,
    quoteToken: tokens.wbnb,
  },
  {
    pid: 25,
    lpSymbol: 'UNI-BNB LP',
    lpAddresses: {
      97: '0xE66790075ad839978fEBa15D4d8bB2b415556a1D',
      56: '0x4269e7F43A63CEA1aD7707Be565a94a9189967E9',
    },
    token: tokens.uni,
    quoteToken: tokens.wbnb,
  },
  {
    pid: 26,
    lpSymbol: 'FIL-BNB LP',
    lpAddresses: {
      97: '0xE66790075ad839978fEBa15D4d8bB2b415556a1D',
      56: '0x35fe9787f0ebf2a200bac413d3030cf62d312774',
    },
    token: tokens.fil,
    quoteToken: tokens.wbnb,
  },
  {
    pid: 27,
    lpSymbol: 'INJ-BNB LP',
    lpAddresses: {
      97: '0xE66790075ad839978fEBa15D4d8bB2b415556a1D',
      56: '0x7a34bd64d18e44CfdE3ef4B81b87BAf3EB3315B6',
    },
    token: tokens.inj,
    quoteToken: tokens.wbnb,
  },
  {
    pid: 29,
    lpSymbol: 'USDC-BNB LP',
    lpAddresses: {
      97: '0xE66790075ad839978fEBa15D4d8bB2b415556a1D',
      56: '0x30479874f9320a62bce3bc0e315c920e1d73e278',
    },
    token: tokens.usdc,
    quoteToken: tokens.wbnb,
  },
  {
    pid: 30,
    lpSymbol: 'SXP-BNB LP',
    lpAddresses: {
      97: '0xE66790075ad839978fEBa15D4d8bB2b415556a1D',
      56: '0x752E713fB70E3FA1Ac08bCF34485F14A986956c4',
    },
    token: tokens.sxp,
    quoteToken: tokens.wbnb,
  },
  {
    pid: 32,
    lpSymbol: 'CTK-BNB LP',
    lpAddresses: {
      97: '0xE66790075ad839978fEBa15D4d8bB2b415556a1D',
      56: '0x7793870484647a7278907498ec504879d6971EAb',
    },
    token: tokens.ctk,
    quoteToken: tokens.wbnb,
  },
  {
    pid: 34,
    lpSymbol: 'STAX-CAKE LP',
    lpAddresses: {
      97: '0xE66790075ad839978fEBa15D4d8bB2b415556a1D',
      56: '0x7cd05f8b960ba071fdf69c750c0e5a57c8366500',
    },
    token: tokens.stax,
    quoteToken: tokens.cake,
    isCommunity: true,
  },
  {
    pid: 35,
    lpSymbol: 'NAR-CAKE LP',
    lpAddresses: {
      97: '0xE66790075ad839978fEBa15D4d8bB2b415556a1D',
      56: '0x745c4fd226e169d6da959283275a8e0ecdd7f312',
    },
    token: tokens.nar,
    quoteToken: tokens.cake,
    isCommunity: true,
  },
  {
    pid: 36,
    lpSymbol: 'NYA-CAKE LP',
    lpAddresses: {
      97: '0xE66790075ad839978fEBa15D4d8bB2b415556a1D',
      56: '0x2730bf486d658838464a4ef077880998d944252d',
    },
    token: tokens.nya,
    quoteToken: tokens.cake,
    isCommunity: true,
  },
  {
    pid: 38,
    lpSymbol: 'bROOBEE-CAKE LP',
    lpAddresses: {
      97: '',
      56: '0x970858016C963b780E06f7DCfdEf8e809919BcE8',
    },
    token: tokens.broobee,
    quoteToken: tokens.cake,
    isCommunity: true,
  },
  {
    pid: 8,
    lpSymbol: 'BAKE-BNB Bakery LP',
    lpAddresses: {
      97: '0xE66790075ad839978fEBa15D4d8bB2b415556a1D',
      56: '0xc2eed0f5a0dc28cfa895084bc0a9b8b8279ae492',
    },
    token: tokens.bake,
    quoteToken: tokens.wbnb,
  },
  {
    pid: 9,
    lpSymbol: 'BURGER-BNB LP',
    lpAddresses: {
      97: '0xE66790075ad839978fEBa15D4d8bB2b415556a1D',
      56: '0xd937FB9E6e47F3805981453BFB277a49FFfE04D7',
    },
    token: tokens.burger,
    quoteToken: tokens.wbnb,
  },
  {
    pid: 10,
    lpSymbol: 'BAKE-BNB LP',
    lpAddresses: {
      97: '0xE66790075ad839978fEBa15D4d8bB2b415556a1D',
      56: '0x3Da30727ed0626b78C212e81B37B97A8eF8A25bB',
    },
    token: tokens.bake,
    quoteToken: tokens.wbnb,
  },
]

// export default farms

export const farmsNew: { [chainId: number]: FarmConfigNew[] } = {
  /**
   * These 3 farms (PID 0, 251, 252) should always be at the top of the file.
   */
  [ChainId.MAINNET_BSC]: [
    {
      pid: 0,
      lpSymbol: 'CAKE',
      lpAddress:  '0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82',
      token: tokens.syrup,
      quoteToken: tokens.wbnb,
    },
    {
      pid: 251,
      lpSymbol: 'CAKE-BNB LP',
      lpAddress: '0x0eD7e52944161450477ee417DE9Cd3a859b14fD0',
      token: tokens.cake,
      quoteToken: tokens.wbnb,
    },
    {
      pid: 252,
      lpSymbol: 'BUSD-BNB LP',
      lpAddress: '0x58F876857a02D6762E0101bb5C46A8c1ED44Dc16',
      token: tokens.busd,
      quoteToken: tokens.wbnb,
    },
  ],
  [ChainId.TESTNET_BSC]: [
    {
      pid: 0,
      lpSymbol: 'CAKE',
      lpAddress:'0x9C21123D94b93361a29B2C2EFB3d5CD8B17e0A9e',
      token: tokens.syrup,
      quoteToken: tokens.wbnb,
    },
    {
      pid: 251,
      lpSymbol: 'CAKE-BNB LP',
      lpAddress: '0x3ed8936cAFDF85cfDBa29Fbe5940A5b0524824F4',
      token: tokens.cake,
      quoteToken: tokens.wbnb,
    },
    {
      pid: 252,
      lpSymbol: 'BUSD-BNB LP',
      lpAddress: '0x58F876857a02D6762E0101bb5C46A8c1ED44Dc16',
      token: tokens.busd,
      quoteToken: tokens.wbnb,
    },
  ],
}
