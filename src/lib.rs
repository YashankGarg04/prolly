use near_sdk::{env, near, AccountId, Promise, PanicOnDefault, NearToken};
use near_sdk::json_types::U128;
use std::collections::HashMap;

// 1. The Strict State Machine
#[near(serializers = [borsh, json])]
#[derive(Clone, PartialEq)]
pub enum GameState {
    Active,
    Drawing,
    Concluded,
    Complete,
    Refunded,
}

// 2. The Game Structure (Allows multiple simultaneous games)
#[near(serializers = [borsh, json])]
#[derive(Clone)]
pub struct Game {
    pub id: u64,
    pub state: GameState,
    pub entry_fee: NearToken,
    pub processing_fee: NearToken,
    pub n_variable: u64, 
    pub max_multiplier: u8,
    pub participants: Vec<AccountId>,
    pub multipliers: HashMap<AccountId, u8>, 
    pub total_tickets: u64, 
}

#[near(contract_state)]
#[derive(PanicOnDefault)]
pub struct ProllyFactory {
    pub owner_id: AccountId,
    pub stakeholders: Vec<AccountId>,
    pub games: HashMap<u64, Game>,
    pub next_game_id: u64,
    pub banned_users: Vec<AccountId>, // NEW: Global ban list
}

#[near]
impl ProllyFactory {
    #[init]
    pub fn new(stakeholders: Vec<AccountId>) -> Self {
        assert!(!env::state_exists(), "Already initialized");
        Self {
            owner_id: env::predecessor_account_id(),
            stakeholders,
            games: HashMap::new(),
            next_game_id: 1,
            banned_users: Vec::new(), // NEW: Initialize the ban list
        }
    }

    // ==========================================
    // --- SECURITY & ADMIN CONTROLS ---
    // ==========================================

    pub fn add_stakeholder(&mut self, account_id: AccountId) {
        assert_eq!(env::predecessor_account_id(), self.owner_id, "Only owner can manage stakeholders");
        assert!(!self.stakeholders.contains(&account_id), "User is already a stakeholder");
        self.stakeholders.push(account_id);
    }

    pub fn remove_stakeholder(&mut self, account_id: AccountId) {
        assert_eq!(env::predecessor_account_id(), self.owner_id, "Only owner can manage stakeholders");
        self.stakeholders.retain(|x| x != &account_id);
    }

    pub fn ban_user(&mut self, account_id: AccountId) {
        assert_eq!(env::predecessor_account_id(), self.owner_id, "Only owner can ban users");
        assert!(account_id != self.owner_id, "Admin cannot ban themselves");
        assert!(!self.banned_users.contains(&account_id), "User is already banned");
        self.banned_users.push(account_id);
    }

    pub fn unban_user(&mut self, account_id: AccountId) {
        assert_eq!(env::predecessor_account_id(), self.owner_id, "Only owner can unban users");
        self.banned_users.retain(|x| x != &account_id);
    }


    // ==========================================
    // --- GAME MANAGEMENT FUNCTIONS ---
    // ==========================================

    // Admin creates a new game with specific rules
    pub fn create_game(&mut self, entry_fee_yocto: U128, processing_fee_yocto: U128, n_variable: u64, max_multiplier: u8) -> u64 {
        assert_eq!(env::predecessor_account_id(), self.owner_id, "Only owner can create games");
        assert!(n_variable > max_multiplier as u64, "N must be larger than the max multiplier");

        let game_id = self.next_game_id;
        let new_game = Game {
            id: game_id,
            state: GameState::Active,
            entry_fee: NearToken::from_yoctonear(entry_fee_yocto.0),
            processing_fee: NearToken::from_yoctonear(processing_fee_yocto.0),
            n_variable,
            max_multiplier,
            participants: Vec::new(),
            multipliers: HashMap::new(),
            total_tickets: 0,
        };

        self.games.insert(game_id, new_game);
        self.next_game_id += 1;
        game_id
    }

    // Stakeholders trigger the draw (Locks state to prevent new entries or refunds)
    pub fn trigger_conclude(&mut self, game_id: u64) {
        let caller = env::predecessor_account_id();
        assert!(self.stakeholders.contains(&caller) || caller == self.owner_id, "Unauthorized");
        
        let game = self.games.get_mut(&game_id).expect("Game not found");
        assert!(game.state == GameState::Active, "Game must be Active to conclude");
        assert!(game.participants.len() > 0, "No players joined. Use refund instead.");

        // Lock the game state to Drawing!
        game.state = GameState::Drawing;

        // NOTE: In the final Mainnet version, this is where you call the NEAR Randomness Beacon.
        // For this architecture test, we will simulate the callback succeeding immediately.
        self.internal_resolve_winners(game_id);
    }

    // Admin emergency force closure
    pub fn refund_game(&mut self, game_id: u64) {
        let caller = env::predecessor_account_id();
        assert!(self.stakeholders.contains(&caller) || caller == self.owner_id, "Unauthorized");

        let game = self.games.get_mut(&game_id).expect("Game not found");
        // Strict State Overlap Protection
        assert!(game.state == GameState::Active, "Can only refund an Active game");

        game.state = GameState::Refunded;

        for player in &game.participants {
            let mult = *game.multipliers.get(player).unwrap() as u128;
            let refund_amount = game.entry_fee.saturating_mul(mult);
            Promise::new(player.clone()).transfer(refund_amount).detach();
        }
    }

    // Admin cleans up the database after frontend saves it
    pub fn complete_game_cleanup(&mut self, game_id: u64) {
        assert_eq!(env::predecessor_account_id(), self.owner_id, "Only owner can cleanup");
        let game = self.games.get_mut(&game_id).expect("Game not found");
        assert!(game.state == GameState::Concluded, "Game must be Concluded to cleanup");

        // Delete the heavy arrays to get our storage deposit back!
        game.participants.clear();
        game.multipliers.clear();
        game.state = GameState::Complete;
    }


    // ==========================================
    // --- PLAYER FUNCTIONS ---
    // ==========================================

    #[payable]
    pub fn join_game(&mut self, game_id: u64, multiplier: u8) {
        let player = env::predecessor_account_id();
        
        // NEW SECURITY CHECKS: Ban list and House block
        assert!(!self.banned_users.contains(&player), "You are banned from participating in Prolly");
        assert!(!self.stakeholders.contains(&player) && player != self.owner_id, "Stakeholders and the Admin cannot participate in games");

        let game = self.games.get_mut(&game_id).expect("Game not found");
        assert!(game.state == GameState::Active, "This game is not Active");
        assert!(multiplier >= 1 && multiplier <= game.max_multiplier, "Invalid multiplier");
        assert!(!game.multipliers.contains_key(&player), "You can only join once per game");

        // Math: (Entry Fee * Multiplier) + Processing Fee
        let required_entry = game.entry_fee.saturating_mul(multiplier as u128);
        let total_required = required_entry.saturating_add(game.processing_fee);
        
        assert_eq!(env::attached_deposit(), total_required, "Incorrect deposit attached");

        // Send processing fee directly to House (Admin) immediately
        Promise::new(self.owner_id.clone()).transfer(game.processing_fee).detach();

        game.participants.push(player.clone());
        game.multipliers.insert(player, multiplier);
        game.total_tickets += multiplier as u64;
    }


    // ==========================================
    // --- INTERNAL LOGIC ---
    // ==========================================

    // This simulates the callback from the Randomness Beacon
    fn internal_resolve_winners(&mut self, game_id: u64) {
        let game = self.games.get_mut(&game_id).unwrap();
        
        // 1 <= Winners <= Total / N
        let calculated_winners = game.total_tickets / game.n_variable;
        let num_winners = std::cmp::max(1, calculated_winners);

        let total_prize_pool = game.entry_fee.saturating_mul(game.total_tickets as u128);
        let reward_per_winner = total_prize_pool.saturating_div(num_winners as u128);

        // Simulated Randomness
        let random_seed = env::random_seed();
        let mut rand_val = u64::from_le_bytes(random_seed[0..8].try_into().unwrap());
        
        let mut winners_paid = 0;
        
        // Simple weighted selection based on tickets (multipliers)
        while winners_paid < num_winners {
            let winning_ticket = rand_val % game.total_tickets;
            let mut current_ticket = 0;

            for player in &game.participants {
                current_ticket += *game.multipliers.get(player).unwrap() as u64;
                if current_ticket > winning_ticket {
                    Promise::new(player.clone()).transfer(reward_per_winner).detach();
                    winners_paid += 1;
                    break;
                }
            }
            rand_val = rand_val.wrapping_add(1337); 
        }

        // Shift to Concluded so frontend can read it, but data is NOT deleted yet
        game.state = GameState::Concluded;
    }

    // ==========================================
    // --- VIEW FUNCTIONS ---
    // ==========================================

    pub fn get_game_state(&self, game_id: u64) -> Option<&Game> {
        self.games.get(&game_id)
    }
}