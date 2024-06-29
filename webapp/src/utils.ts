import { Level, UserData } from './state.atoms'
import NFT1 from '@public/nfts/nft1.png'
import NFT2 from '@public/nfts/nft2.png'
import NFT3 from '@public/nfts/nft3.png'
import NFT4 from '@public/nfts/nft4.png'
import {Connection} from 'postgresql-client';

export const LEVELS = [{
    id: 1,
    amountSTRK: 100,
    nftSrc: NFT1.src,
}, {
    id: 2,
    amountSTRK: 1000,
    nftSrc: NFT2.src,
}, {
    id: 3,
    amountSTRK: 7500,
    nftSrc: NFT3.src,
}, {
    id: 4,
    amountSTRK: 20000,
    nftSrc: NFT4.src,
}]

export function isIneligible(userSTRK: number, levels: Level[]) {
    return userSTRK < levels[0].amountSTRK
}

export function isIntractUser(userData: UserData, userSTRK: number, levels: Level[]) {
    return userData.isIntractUser
}

export function isClaimable(address: string | undefined, strkEarned: number, level: Level, levels: Level[], data: UserData | null | undefined) {
    return (!address && level.id == 1) ||
        (address != undefined && level.amountSTRK <= strkEarned) ||
        (!!data && isIntractUser(data, strkEarned, levels) && level.id <= 2)
}

export function LearnMoreLink() {
    return "https://google.com"
}

