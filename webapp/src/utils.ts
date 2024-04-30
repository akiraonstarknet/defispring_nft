import { Level, UserData } from './state.atoms'

export function isIneligible(userSTRK: number, levels: Level[]) {
    return userSTRK < levels[0].amountSTRK
}

export function isIntractUser(userData: UserData, userSTRK: number, levels: Level[]) {
    return userData.isIntractUser && userSTRK < levels[1].amountSTRK
}