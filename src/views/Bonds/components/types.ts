export type TableProps = {
  data?: TableDataTypes[]
  selectedFilters?: string
  sortBy?: string
  sortDir?: string
  onSort?: (value: string) => void
}

export type ColumnsDefTypes = {
  id: number
  label: string
  name: string
  sortable: boolean
}

export type ScrollBarProps = {
  ref: string
  width: number
}

export type TableDataTypes = {
  POOL: string
  APR: string
  EARNED: string
  STAKED: string
  DETAILS: string
  LINKS: string
}

export const MobileColumnSchema: ColumnsDefTypes[] = [
  {
    id: 1,
    name: 'farm',
    sortable: true,
    label: '',
  },
  {
    id: 2,
    name: 'earned',
    sortable: true,
    label: 'Earned',
  },
  {
    id: 3,
    name: 'roi',
    sortable: true,
    label: 'ROI',
  },
  {
    id: 6,
    name: 'details',
    sortable: true,
    label: '',
  },
  {
    id: 5,
    name: 'term',
    sortable: true,
    label: '',
  },
]

export const DesktopColumnSchema: ColumnsDefTypes[] = [
  {
    id: 1,
    name: 'bond',
    sortable: true,
    label: '',
  },
  // {
  //   id: 3,
  //   name: 'multiplier',
  //   sortable: true,
  //   label: 'Multiplier',
  // },
  {
    id: 4,
    name: 'discount',
    sortable: true,
    label: '',
  },
  {
    id: 5,
    name: 'term',
    sortable: true,
    label: '',
  },
  {
    id: 6,
    name: 'price',
    sortable: true,
    label: '',
  },
  {
    id: 7,
    name: 'purchased',
    sortable: true,
    label: '',
  },
  {
    id: 8,
    name: 'roi',
    sortable: true,
    label: '',
  },
  {
    id: 9,
    name: 'details',
    sortable: true,
    label: '',
  },

]


export const DesktopColumnSchemaNew: ColumnsDefTypes[] = [
  {
    id: 1,
    name: 'bond',
    sortable: true,
    label: '',
  },
  {
    id: 2,
    name: 'price',
    sortable: true,
    label: 'Price',
  },
  {
    id: 3,
    name: 'roi',
    sortable: true,
    label: 'ROI',
  },
  {
    id: 4,
    name: 'purchased',
    sortable: true,
    label: 'Purchased',
  },
  {
    id: 5,
    name: 'details',
    sortable: true,
    label: '',
  },
  {
    id: 6,
    name: 'term',
    sortable: true,
    label: '',
  },
]

export enum ViewMode {
  'TABLE' = 'TABLE',
  'CARD' = 'CARD',
}
