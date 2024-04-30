import { atom } from 'jotai';
import NFT1 from '@public/nft1.png'
import NFT2 from '@public/nft2.png'
import NFT3 from '@public/nft3.png'
import NFT4 from '@public/nft4.png'
import { atomWithQuery } from 'jotai-tanstack-query';

export interface Level {
    amountSTRK: number;
    id: number;
    nftSrc: string,
}

export const levelsAtom = atom<Level[]>([{
    id: 1,
    amountSTRK: 10,
    nftSrc: NFT1.src,
}, {
    id: 2,
    amountSTRK: 100,
    nftSrc: NFT2.src,
}, {
    id: 3,
    amountSTRK: 1000,
    nftSrc: NFT3.src,
}, {
    id: 4,
    amountSTRK: 10000,
    nftSrc: NFT4.src,
}])

export const accountAtom = atom<string | undefined>(undefined);

export interface UserData {
    address: string,
    isIntractUser: boolean,
    strkEarned: string
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

export const userSTRKEarnedAtom = atom((get) => {
    let result = get(userDataAtom);
    console.log('result', result)
    if (result.data && result.data.strkEarned) {
        const strkWei = result.data.strkEarned;
        return parseInt(strkWei) / 10**18
    }

    return 0; 
});
