import { atom } from 'jotai';
import { atomWithQuery } from 'jotai-tanstack-query';
import { LEVELS } from './utils';

export interface Level {
    amountSTRK: number;
    id: number;
    nftSrc: string,
}

export const levelsAtom = atom<Level[]>(LEVELS)

export const accountAtom = atom<string | undefined>(undefined);

export interface UserData {
    address: string,
    isIntractUser: boolean,
    strkEarned: string,
    signStrkAmount: string,
    hash: string,
    sig: string[]
}

export const userDataAtom = atomWithQuery<UserData | null>((get) => ({
    queryKey: ['users', get(accountAtom)],
    queryFn: async ({ queryKey}: any) => {
        const [_, addr] = queryKey;
        if (!addr) {
            return null;
        }
        const res = await fetch(`/api/users/${addr}`)
        return res.json()
    }
}))

export interface StatsData {
    totalParticipants: number,
    tvl: string,
}
export const statsAtom = atomWithQuery<StatsData | null>((get) => ({
    queryKey: ['stats'],
    queryFn: async ({ queryKey}: any) => {
        const res = await fetch(`/api/stats`)
        return res.json()
    }
}))

export const userSTRKEarnedAtom = atom((get) => {
    let result = get(userDataAtom);
    console.log('result', result)
    if (result.data && result.data.strkEarned) {
        const strkWei = result.data.strkEarned;
        return parseInt(strkWei) / 10**18
    }
    return 0; 
});
