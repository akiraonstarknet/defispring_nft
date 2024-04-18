use starknet::{ClassHash};

#[derive(Drop, Serde, starknet::Store, starknet::Event)]
pub struct Settings {
    pub maxNFTs: u8, // 4 NFTs fix as of now
    // defined limit for eachNFT
    pub minEarning1: u128,
    pub minEarning2: u128,
    pub minEarning3: u128,
    pub minEarning4: u128,
}

#[starknet::interface]
pub trait IDeFiSpringNFT<TState> {
    fn name(self: @TState) -> ByteArray;
    fn symbol(self: @TState) -> ByteArray;
    fn mint(
        ref self: TState,
        rewardEarned: u128, 
        hash: felt252, 
        signature: Array<felt252>
    );
    fn upgrade(ref self: TState, newClassHash: ClassHash);
    fn set_settings(ref self: TState, settings: Settings);
    fn set_pubkey(ref self: TState, pubkey: felt252);
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
    impl ERC1155CamelImpl = ERC1155Component::ERC1155CamelImpl<ContractState>;
    impl ERC1155MetadataURIImpl = ERC1155Component::ERC1155MetadataURIImpl<ContractState>;
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
        settings: Settings,

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

        fn set_pubkey(ref self: ContractState, pubkey: felt252) {
            self.ownable.assert_only_owner();
            self._set_pubkey(pubkey);
        }

        fn mint(ref self: ContractState, rewardEarned: u128, hash: felt252, signature: Array<felt252>) {
            assert(signature.len() == 2, 'Invalid signatures len');

            self._verify_hash(hash, rewardEarned);

            let verified = check_ecdsa_signature(
                hash,
                self.pubkey.read(),
                *signature.at(0),
                *signature.at(1),
            );
            assert(verified, 'Invalid signature');

            let settings = self.settings.read();
            let caller = get_caller_address();

            let isMint = self._check_and_mint(1, settings.minEarning1, rewardEarned, caller, false);
            let isMint = self._check_and_mint(2, settings.minEarning1, rewardEarned, caller, isMint);
            let isMint = self._check_and_mint(3, settings.minEarning1, rewardEarned, caller, isMint);
            let isMint = self._check_and_mint(4, settings.minEarning1, rewardEarned, caller, isMint);

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
            self.settings.write(settings);
        }

        fn _verify_hash(ref self: ContractState, hash: felt252, amount: u128) {
            let caller = get_caller_address();
            let computed_hash = pedersen(caller.into(), amount.into());

            assert(computed_hash == hash, 'Invalid hash');
        }

        // returns true if a mint happens now or already happened
        fn _check_and_mint(
            ref self: ContractState,
            nftId: u256,
            minReward: u128,
            rewardEarned: u128,
            caller: ContractAddress,
            isMint: bool
        ) -> bool {
            if (minReward > rewardEarned) {
                return isMint;
            }

            let balance = self.erc1155.balanceOf(caller, nftId);
            if (balance == 0) {
                // mint only if no prior balance
                let tokenIds = array![nftId];
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