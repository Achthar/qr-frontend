/* eslint-disable camelcase */
import { BigNumber } from 'ethers'


const zero = BigNumber.from(0)
const MAXDAYS = BigNumber.from(3 * 365)
const MAXTIME = 3 * 365 * 24 * 60 * 60

function voting_power_unlock_time(_value: BigNumber, _unlock_time: number) {
    const _now = Math.floor((new Date()).getTime() / 1000);
    console.log("GOV in", _unlock_time, _now)
    if (_unlock_time <= _now) return 0;
    const _lockedSeconds = _unlock_time - _now;
    console.log("GOV in1", _lockedSeconds, MAXTIME)
    if (_lockedSeconds >= MAXTIME) {
        return _value;
    }
    return _value.mul(BigNumber.from(_lockedSeconds)).div(BigNumber.from(MAXTIME));
}


function voting_power_locked_days(_value: BigNumber, _days: number): BigNumber {
    // console.log("GOV in 2", _value.toString(), _days)
    if (BigNumber.from(_days).gte(MAXDAYS)) {
        return _value;
    }
    return _value.mul(BigNumber.from(_days)).div(MAXDAYS);
}

export function deposit_for_value(
    _value: BigNumber,
    _days: number,
    _lockedAmount: BigNumber,
    _lockedEnd: number

): BigNumber {
    const _amount = _lockedAmount
    let _vp;
    if (_amount.eq(zero)) {
        _vp = voting_power_locked_days(_value, _days);
    } else if (_days === 0) {
        _vp = voting_power_unlock_time(_value, _lockedEnd);
    } else {
        _vp = voting_power_locked_days(_amount, _days);
    }
    return _vp
}