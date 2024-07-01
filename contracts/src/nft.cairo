use starknet::{ClassHash};

#[derive(Drop, Serde, starknet::Event)]
pub struct Settings {
    pub maxNFTs: u8, // 4 NFTs fix as of now
    // defined limit for eachNFT
    pub minEarnings: Array<u128>
}

#[starknet::interface]
pub trait IDeFiSpringNFT<TState> {
    fn name(self: @TState) -> ByteArray;
    fn symbol(self: @TState) -> ByteArray;
    fn mint(
        ref self: TState,
        nftId: u8,
        rewardEarned: u128, 
        hash: felt252, 
        signature: Array<felt252>
    );
    fn upgrade(ref self: TState, newClassHash: ClassHash);
    fn set_settings(ref self: TState, settings: Settings);
    fn get_settings(self: @TState) -> Settings;
    fn set_pubkey(ref self: TState, pubkey: felt252);
    fn get_pubkey(self: @TState) -> felt252;
}

#[starknet::contract]
mod DeFiSpringNFT {
    use openzeppelin::access::ownable::OwnableComponent;
    use openzeppelin::introspection::src5::SRC5Component;
    use openzeppelin::token::erc1155::ERC1155Component;
    use openzeppelin::upgrades::UpgradeableComponent;
    use openzeppelin::upgrades::interface::IUpgradeable;
    use starknet::{ContractAddress, ClassHash, get_caller_address};
    use core::pedersen::{pedersen};
    use core::num::traits::Zero;
    use super::{
        IDeFiSpringNFT, 
        IDeFiSpringNFTDispatcher, 
        IDeFiSpringNFTDispatcherTrait,
        Settings
    };
    use core::ecdsa::check_ecdsa_signature;

    component!(path: OwnableComponent, storage: ownable, event: OwnableEvent);
    component!(path: ERC1155Component, storage: erc1155, event: ERC1155Event);
    component!(path: SRC5Component, storage: src5, event: SRC5Event);
    component!(path: UpgradeableComponent, storage: upgradeable, event: UpgradeableEvent);
    
    // Ownable Impl
    #[abi(embed_v0)]
    impl OwnableImpl = OwnableComponent::OwnableImpl<ContractState>;
    impl OwnableInternalImpl = OwnableComponent::InternalImpl<ContractState>;

    // ERC1155 Impl
    #[abi(embed_v0)]
    impl ERC1155MixinImpl = ERC1155Component::ERC1155MixinImpl<ContractState>;
    impl ERC1155InternalImpl = ERC1155Component::InternalImpl<ContractState>;

    // Upgradeable
    impl UpgradeableInternalImpl = UpgradeableComponent::InternalImpl<ContractState>;

    #[storage]
    struct Storage {
        #[substorage(v0)]
        ownable: OwnableComponent::Storage,
        #[substorage(v0)]
        erc1155: ERC1155Component::Storage,
        #[substorage(v0)]
        src5: SRC5Component::Storage,
        #[substorage(v0)]
        upgradeable: UpgradeableComponent::Storage,

        name: ByteArray,
        symbol: ByteArray,
        maxNFTs: u8,
        minEarnings:  LegacyMap::<u8, u128>, // nftId to minEarning map

        // a pubkey for offchain signing to auth before NFT mint
        pubkey: felt252,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        OwnableEvent: OwnableComponent::Event,
        #[flat]
        ERC1155Event: ERC1155Component::Event,
        #[flat]
        SRC5Event: SRC5Component::Event,
        #[flat]
        UpgradeableEvent: UpgradeableComponent::Event
    }

    #[constructor]
    fn constructor(
        ref self: ContractState,
        name: ByteArray,
        symbol: ByteArray,
        base_uri: ByteArray,
        owner: ContractAddress,
        settings: Settings,
        pubkey: felt252
    ) {
        self.ownable.initializer(owner);
        self.erc1155.initializer(base_uri);

        assert(name.len() > 0, 'Invalid name');
        assert(symbol.len() > 0, 'Invalid symbol');
        assert(pubkey != 0, 'Invalid pubkey');

        self.name.write(name);
        self.symbol.write(symbol);
        self.pubkey.write(pubkey);
        self._set_settings(settings);
    }

    #[abi(embed_v0)]
    impl NFT of IDeFiSpringNFT<ContractState> {
        fn name(self: @ContractState) -> ByteArray {
            self.name.read()
        }

        fn symbol(self: @ContractState) -> ByteArray {
            self.symbol.read()
        }

        fn upgrade(ref self: ContractState, newClassHash: ClassHash) {
            self.ownable.assert_only_owner();
            self.upgradeable._upgrade(newClassHash);
        }

        fn set_settings(ref self: ContractState, settings: Settings) {
            self.ownable.assert_only_owner();
            self._set_settings(settings);
        }

        fn get_settings(self: @ContractState) -> Settings {
            let mut settings = Settings {
                maxNFTs: self.maxNFTs.read(),
                minEarnings: array![]
            };
            let mut count: u8 = 0;
            loop {
                settings.minEarnings.append(self.minEarnings.read(count));
                count += 1;
                if (count == settings.maxNFTs) {
                    break;
                }
            };
            settings
        }

        fn set_pubkey(ref self: ContractState, pubkey: felt252) {
            self.ownable.assert_only_owner();
            self._set_pubkey(pubkey);
        }

        fn get_pubkey(self: @ContractState) -> felt252 {
            self.pubkey.read()
        }

        fn mint(ref self: ContractState, nftId: u8, rewardEarned: u128, hash: felt252, signature: Array<felt252>) {
            assert(signature.len() == 2, 'Invalid signatures len');
            assert(nftId >= 1 && nftId <= self.maxNFTs.read(), 'Invalid nftId');
            self._verify_hash(hash, rewardEarned);

            let verified = check_ecdsa_signature(
                hash,
                self.pubkey.read(),
                *signature.at(0),
                *signature.at(1),
            );
            assert(verified, 'Invalid signature');

            let caller = get_caller_address();

            let minEarning = self.minEarnings.read(nftId - 1);
            let isMint = self._check_and_mint(
                nftId, 
                minEarning, 
                rewardEarned, 
                caller, 
                false
            );

            // ensures user doesnt call contract multiple times 
            // if they aren't eligible for a new NFT yet
            assert(isMint, 'Not eligible');
        }
    }

    #[generate_trait]
    impl Private of PrivateTrait {
        fn _set_pubkey(ref self: ContractState, pubkey: felt252) {
            assert(pubkey != 0, 'Invalid pubkey');
            self.pubkey.write(pubkey);
        }

        fn _set_settings(ref self: ContractState, settings: Settings) {
            assert(settings.maxNFTs == 4, 'Invalid maxNFTs');
            self.maxNFTs.write(settings.maxNFTs);
            let mut count: u8 = 0;
            loop {
                self.minEarnings.write(count, *settings.minEarnings.at(count.into()));
                count += 1;
                if (count == settings.maxNFTs) {
                    break;
                }
            };
        }

        fn _verify_hash(ref self: ContractState, hash: felt252, amount: u128) {
            let caller = get_caller_address();
            let computed_hash = pedersen(caller.into(), amount.into());

            assert(computed_hash == hash, 'Invalid hash');
        }

        // returns true if a mint happens now or already happened
        fn _check_and_mint(
            ref self: ContractState,
            nftId: u8,
            minReward: u128,
            rewardEarned: u128,
            caller: ContractAddress,
            isMint: bool
        ) -> bool {
            assert(minReward > 0, 'Invalid minReward');
            if (minReward > rewardEarned) {
                return isMint;
            }

            let balance = self.erc1155.balanceOf(caller, nftId.into());
            if (balance == 0) {
                // mint only if no prior balance
                let tokenIds: Array<u256> = array![nftId.into()];
                let values = array![1];
                self.erc1155.update(
                    Zero::zero(),
                    caller,
                    tokenIds.span(),
                    values.span()
                );

                return true;
            }

            return isMint;
        }
    }

}