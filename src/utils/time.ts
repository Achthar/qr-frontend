
const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];


const monthNamesShort = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];


function getNextFriday(date = new Date()) {
    const dateCopy = new Date(date.getTime());

    const nextFriday = new Date(
        dateCopy.setDate(
            dateCopy.getDate() + ((7 - dateCopy.getDay() + 5) % 7 || 7),
        ),
    );

    return nextFriday;
}


const maxMonths = 12 * 3

const maxFridays = 52 * 2

export interface DateEntry {
    date: Date
    unix: number
    month: string // yyyymm
    year: number
    aod: string
}

export const toUnix = (dateString: Date) => {
    return Math.floor(dateString.getTime() / 1000)
}

const formatDoubleDigit = (num: number) => {
    const numStr = String(num)
    return `${numStr.length === 1 ? '0' : ''}${numStr}`
}

const getAOD = (year: number, month: number) => {
    const monthStr = String(month)
    return `${String(year)}${formatDoubleDigit(month)}`
}

export const eomsUnix = (): DateEntry[] => {
    const now = new Date()
    const current = new Date(now.getFullYear(), now.getMonth(), 1)
    current.setUTCHours(0, 0, 0, 0)
    const dates = []

    for (let month = 1; month <= maxMonths; month++) {
        current.setMonth(current.getMonth() + 1)
        current.setUTCHours(0, 0, 0, 0)
        dates.push({
            date: current.getDay(),
            unix: toUnix(current),
            month: monthNamesShort[current.getMonth()],
            year: current.getFullYear(),
            aod: getAOD(current.getFullYear(), current.getMonth() + 1)
        })
    }
    return dates
}

export const fridaysUnix = (): DateEntry[] => {
    const now = new Date()
    const current = getNextFriday(now)
    current.setUTCHours(0, 0, 0, 0)
    const dates = []
    dates.push({
        date: current.getDate(),
        unix: toUnix(current),
        month: monthNamesShort[current.getMonth()],
        year: current.getFullYear(),
        aod: getAOD(current.getFullYear(), current.getMonth() + 1)

    })
    for (let friday = 1; friday <= maxFridays; friday++) {
        current.setDate(current.getDate() + 7)
        dates.push({
            date: current.getDate(),
            unix: toUnix(current),
            month: monthNamesShort[current.getMonth()],
            year: current.getFullYear(),
            aod: getAOD(current.getFullYear(), current.getMonth() + 1)

        })
    }
    return dates
}

export const getStartDate = (): number => {
    const start = new Date()
    start.setDate(start.getDate() + 1)
    start.setUTCHours(0, 0, 0, 0)
    return toUnix(start)
}

export function timeConverter(unixTimestamp) {
    const a = new Date(unixTimestamp * 1000);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const year = a.getFullYear();
    const month = months[a.getMonth()];
    const date = a.getDate();
    const hour = a.getHours();
    const min = a.getMinutes();
    const sec = a.getSeconds();
    const time = `${date} ${month} ${year} ${formatDoubleDigit(hour)}:${formatDoubleDigit(min)}:${formatDoubleDigit(sec)}`;
    return time;
}

export function timeConverterNoMinutes(unixTimestamp) {
    const a = new Date(unixTimestamp * 1000);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const year = a.getFullYear();
    const month = months[a.getMonth()];
    const date = a.getDate();
    const hour = a.getHours();
    const min = a.getMinutes();
    const time = `${date} ${month} '${String(year).slice(-2)} ${formatDoubleDigit(hour)}h`;
    return time;
}

export function timeConverterNoYear(unixTimestamp) {
    const a = new Date(unixTimestamp * 1000);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[a.getMonth()];
    const date = a.getDate();
    const hour = a.getHours();
    const min = a.getMinutes();
    const time = `${date} ${month} ${formatDoubleDigit(hour)}:${formatDoubleDigit(min)}`;
    return time;
}