/* eslint-disable camelcase */
import { BigNumber } from 'ethers'
import { Lock } from 'state/governance/reducer'
import { Action } from '../components/lockConfigurator'


const zero = BigNumber.from(0)
const ONE_18 = BigNumber.from('1000000000000000000')
const MAXDAYS = BigNumber.from(3 * 365)
const MAXTIME = 3 * 365 * 24 * 60 * 60
const REF_DATE = 1640991600


function voting_power_unlock_time(_value: BigNumber, _unlock_time: number) {
    const _now = Math.floor((new Date()).getTime() / 1000);
    if (_unlock_time <= _now) return 0;
    const _lockedSeconds = _unlock_time - _now;
    if (_lockedSeconds >= MAXTIME) {
        return _value;
    }
    return _value.mul(BigNumber.from(_lockedSeconds)).div(BigNumber.from(MAXTIME));
}


function voting_power_locked_days(_value: BigNumber, _days: number): BigNumber {
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


export function get_amount_minted(_value: BigNumber, _unlock_time: number) {
    return _value.mul(BigNumber.from(_unlock_time - REF_DATE)).div(MAXTIME);
}

export function get_multiplier_and_minted(action: Action, _amount: BigNumber, _newEnd: number, _now: number, _selectedLock: Lock, _locks: { [end: number]: Lock }): { minted: BigNumber, multiplier: BigNumber } {
    const _vp = BigNumber.from(_selectedLock.minted)
    const _vpNew = get_amount_minted(_amount, _newEnd);
    let multiplier: BigNumber
    // adjust multipliers
    if (_locks[_newEnd]) {
        // position exists
        multiplier = _calculate_adjusted_multiplier_position(
            _amount,
            _now,
            _newEnd,
            BigNumber.from(_selectedLock.amount),
            BigNumber.from(_selectedLock.multiplier)
        );

    } else {
        // position does not exist
        multiplier = _calculate_adjusted_multiplier_maturity(
            _now,
            _selectedLock.end,
            _newEnd,
            BigNumber.from(_selectedLock.multiplier)
        )
    }


    return { multiplier, minted: _vpNew.sub(_vp) }
}


export function _calculate_adjusted_multiplier_position(
    _amount: BigNumber,
    _ref: number,
    _end: number,
    _position: BigNumber,
    _oldMultiplier: BigNumber
) {
    return _position.mul(_oldMultiplier).add(
        _amount.mul(_calculate_multiplier(_ref, _end)
        )).div
        (_amount.add(_position)).div(ONE_18)
}


export function _calculate_adjusted_multiplier_maturity(
    _ref: number,
    _endOld: number,
    _end: number,
    _oldMultiplier: BigNumber
) {
    return BigNumber.from(_endOld).mul(_oldMultiplier).add(
        BigNumber.from(_end - _endOld).mul(
            _calculate_multiplier(_ref, _end))).div(BigNumber.from(
                _end)).div(ONE_18)
}


export function _calculate_multiplier(_ref: number, _end: number) {
    return BigNumber.from(_end - _ref).mul(ONE_18).div(BigNumber.from(_end - REF_DATE))
}


export function get_amount_and_multiplier(action: Action, _now: number, _amount: BigNumber, _newEnd: number, _selectedLock: Lock, _locks: { [end: number]: Lock }): { voting: BigNumber, multiplier: BigNumber } {
    let multiplier: BigNumber
    let voting: BigNumber

    if (action === Action.createLock) {
        multiplier = _calculate_multiplier(_now, _newEnd)
        voting = get_amount_minted(_amount, _newEnd);
    }
    if (action === Action.increaseAmount) {
        if (_selectedLock) {
            multiplier = _calculate_adjusted_multiplier_position(_amount, _now, _selectedLock.end, BigNumber.from(_selectedLock.amount), BigNumber.from(_selectedLock.multiplier))
            voting = get_amount_minted(_amount, _selectedLock.end)
        }
    }
    if (action === Action.increaseTime) {
        if (_selectedLock) {
            multiplier = _calculate_adjusted_multiplier_maturity(_now, _selectedLock.end, _newEnd, BigNumber.from(_selectedLock.multiplier))
            voting = get_amount_minted(_amount, _newEnd).sub(get_amount_minted(_amount, _selectedLock.end))
        }
    }

    return { voting, multiplier }
}

export function bn_maxer(bnArray: string[]) {
    const bns = bnArray.map(str => BigNumber.from(str))
    let max = zero
    for (let j = 0; j < bnArray.length; j++) {
        if (bns[j] > max) {
            max = bns[j]
        }
    }
    return max
}