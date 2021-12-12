const ARCHIVED_BONDS_START_BOND_ID = 0
const ARCHIVED_BONDS_END_BOND_ID = 0

const isArchivedBondId = (bondId: number) => bondId >= ARCHIVED_BONDS_START_BOND_ID && bondId <= ARCHIVED_BONDS_END_BOND_ID

export default isArchivedBondId
