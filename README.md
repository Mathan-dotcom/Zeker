# Zeker

Zeker is a privacy-first, zero-knowledge (ZK) cash-aid disbursement platform built on the Stellar blockchain using Soroban smart contracts. It enables NGOs and humanitarian organizations to disburse financial relief (like USDC) to beneficiaries while guaranteeing **100% recipient anonymity** and cryptographically **preventing double-claiming** (fraud).

---

## 🌟 Key Features

*   **100% Beneficiary Anonymity**: Zero-knowledge proofs (ZK-SNARKs) ensure that when a beneficiary claims their cash aid, their public key is never linked to the pre-vetted list of eligible recipients.
*   **Double-Spend Prevention (Sybil Resistance)**: Utilizes ZK Nullifiers registered on-chain to guarantee that each eligible beneficiary can only claim cash-aid exactly once per epoch.
*   **Protocol 25/26 Native ZK Verification**: Powered by Soroban's native `verify_bn254_proof` host function on Stellar, bringing lightning-fast, gas-efficient on-chain verifications.
*   **Client-Side In-Browser Prover**: Generates cryptographic membership proofs directly inside the claimant's browser using `@aztec/bb.js` and Noir.
*   **Freighter Wallet Integration**: Connects with Freighter for seamless, secure transaction signing on Stellar Testnet.

---

## 🛠️ Tech Stack

*   **Frontend**: Next.js (App Router), Tailwind CSS, Framer Motion, Radix UI.
*   **ZK Circuits**: [Noir Crate](https://noir-lang.org) (v0.32.0).
*   **Smart Contracts**: Rust, Soroban SDK (v21.0.1).
*   **Prover Engine**: `@aztec/bb.js@prerelease` (v5.x / Honk proving system).

---

## 🚀 How it Works

1.  **Vetting & Merkle Commits**: The NGO vets eligible beneficiaries and hashes their credentials into a Merkle Tree, publishing the Merkle Root on-chain.
2.  **Secret Code Allocation**: Beneficiaries receive a secure offline code.
3.  **Client-Side Proving**: When claiming, the beneficiary enters their secret code. The browser-side prover downloads the circuit, generates a membership proof (demonstrating their secret is part of the Merkle Tree), and derives a unique, unlinkable Nullifier.
4.  **Soroban Verification**: The beneficiary submits the proof, Merkle root, nullifier, and an anonymous payout address. The Zeker smart contract verifies the proof, checks that the nullifier hasn't been spent, saves the nullifier, and releases $100.00 USDC.

---

## 💻 Local Development

### 1. Running the Frontend

First, install dependencies:
```bash
npm install
# or
pnpm install
```

Start the development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 2. Testing the ZK Circuit

Navigate to the `circuits/` folder and compile/check constraints:
```bash
cd circuits
nargo check
nargo prove
```

### 3. Compiling the Soroban Contract

Navigate to the contract directory and build the WebAssembly binary:
```bash
cd contracts/silent-aid
cargo build --target wasm32-unknown-unknown --release
```

---

## 🌍 Production Deployment

### 1. HTTP Security Headers (Mandatory)
Because browser-side ZK-SNARK proving runs multi-threaded WebAssembly, your hosting server **must** send cross-origin isolation headers to enable `SharedArrayBuffer` support. 
We have preconfigured these headers out-of-the-box for:
*   **Vercel** (`vercel.json`)
*   **Netlify** (`netlify.toml`)
*   **Next.js** (`next.config.mjs`)

```http
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

### 2. Environment Variables
Inject the following variables during deployment:
*   `NEXT_PUBLIC_STELLAR_CONTRACT_ID`: The ID of your deployed Soroban verifier smart contract.
*   `NEXT_PUBLIC_STELLAR_HORIZON_URL`: Horizon Testnet endpoint (defaults to `https://horizon-testnet.stellar.org`).
*   `NEXT_PUBLIC_STELLAR_RPC_URL`: Soroban RPC endpoint (defaults to `https://soroban-testnet.stellar.org`).
