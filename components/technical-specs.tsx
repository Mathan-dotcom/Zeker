"use client"

import { useState } from "react"
import { motion } from "framer-motion"

const ease = [0.22, 1, 0.36, 1] as const

const NOIR_CODE = `// main.nr - Noir Zero-Knowledge Membership & Nullifier Circuit

fn main(
    nullifier_hash: pub Field,
    recipient: pub Field,
    secret: Field,
    index: u32,
    hash_path: [Field; 4] // 4-level Merkle tree (up to 16 leaves)
) -> pub Field {
    // 1. Derive epoch-bound nullifier deterministically: Pedersen(secret, 2026)
    let calculated_nullifier = pedersen_hash([secret, 2026]);
    assert(calculated_nullifier == nullifier_hash);

    // 2. Derive the commitment leaf: Pedersen(secret, 0)
    let leaf = pedersen_hash([secret, 0]);

    // 3. Reconstruct the Merkle root manually from the path
    let mut current = leaf;
    let mut temp_index = index;

    for i in 0..4 {
        let is_right = (temp_index % 2) == 1;
        temp_index = temp_index / 2;

        let (left, right) = if is_right {
            (hash_path[i], current)
        } else {
            (current, hash_path[i])
        };

        current = pedersen_hash([left, right]);
    }

    // 4. Bind payout address to the proof to prevent front-running hijacking
    let _recipient_binding = recipient;

    current
}`;

const SOROBAN_CODE = `// verifier.rs - Soroban Smart Contract with Protocol 25/26 BN254 Verifier
use soroban_sdk::{contract, contractimpl, contracttype, symbol_short, Address, Bytes, BytesN, Env, Val};

#[contracttype]
pub enum DataKey {
    Root,
    Nullifier(BytesN<32>),
    USDCAddress,
}

#[contract]
pub struct ZekerVerifier;

#[contractimpl]
impl ZekerVerifier {
    pub fn claim(env: Env, proof: Bytes, root: Val, nullifier: BytesN<32>, recipient: Address) {
        // 1. Check if nullifier has already been claimed (double-spend protection)
        let key = DataKey::Nullifier(nullifier.clone());
        if env.storage().persistent().has(&key) {
            panic!("Nullifier has already been spent!");
        }

        // 2. Verify that claimant verified against current active root
        let active_root: Val = env.storage().persistent().get(&DataKey::Root).unwrap();
        assert!(root == active_root, "Merkle root out of date");

        // 3. Verify ZK-proof using native Protocol 25/26 BN254 host function
        let public_inputs = vec![&env, root, nullifier.into_val(&env), recipient.into_val(&env)];
        let is_valid = env.crypto().verify_bn254_proof(&proof, &public_inputs);
        assert!(is_valid, "Zero-knowledge proof verification failed");

        // 4. Record nullifier as spent in contract storage
        env.storage().persistent().set(&key, &true);

        // 5. Transfer USDC cash-aid to the verified recipient address
        let usdc_asset: Address = env.storage().instance().get(&DataKey::USDCAddress).unwrap();
        let client = token::Client::new(&env, &usdc_asset);
        client.transfer(&env.current_contract_address(), &recipient, &100_0000000); // $100.00 USDC

        // 6. Emit anonymized log event
        env.events().publish((symbol_short!("disburse"), nullifier), 100_0000000);
    }
}`;

export function TechnicalSpecs() {
  const [activeTab, setActiveTab] = useState<"noir" | "soroban">("noir")

  return (
    <section id="specs" className="w-full px-6 py-16 lg:px-12 bg-background">
      {/* Section label */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.5, ease }}
        className="flex items-center gap-4 mb-8"
      >
        <span className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-mono">
          {"// SECTION: CRYPTO_SPECIFICATIONS"}
        </span>
        <div className="flex-1 border-t border-border" />
        <span className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-mono">003</span>
      </motion.div>

      <div className="flex flex-col border-2 border-foreground">
        {/* Tab triggers */}
        <div className="flex border-b-2 border-foreground bg-muted/20">
          <button
            onClick={() => setActiveTab("noir")}
            className={`px-6 py-3 font-mono text-xs tracking-widest uppercase border-r-2 border-foreground transition-colors duration-200 ${
              activeTab === "noir"
                ? "bg-foreground text-background font-bold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Noir Circuit (main.nr)
          </button>
          <button
            onClick={() => setActiveTab("soroban")}
            className={`px-6 py-3 font-mono text-xs tracking-widest uppercase border-r-2 border-foreground transition-colors duration-200 ${
              activeTab === "soroban"
                ? "bg-foreground text-background font-bold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Soroban Contract (verifier.rs)
          </button>
          <div className="ml-auto px-4 py-3 hidden sm:flex items-center text-[10px] text-muted-foreground font-mono uppercase tracking-[0.1em]">
            PROVING SYSTEM: BN254 PLONK
          </div>
        </div>

        {/* Code window */}
        <div className="p-4 bg-black/95 text-green-400 font-mono text-xs overflow-x-auto leading-relaxed select-text min-h-[360px]">
          <pre className="whitespace-pre">
            <code>{activeTab === "noir" ? NOIR_CODE : SOROBAN_CODE}</code>
          </pre>
        </div>

        {/* Bottom bar */}
        <div className="flex items-center justify-between border-t-2 border-foreground px-4 py-2 bg-muted/40 font-mono text-[9px] text-muted-foreground uppercase tracking-widest">
          <span>{activeTab === "noir" ? "LANG: Noir v0.32.0" : "LANG: Rust / Soroban SDK v21.0"}</span>
          <span>STELLAR PROTOCOL 26 COMPATIBLE</span>
        </div>
      </div>
    </section>
  )
}
