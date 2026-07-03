# Product Requirements Document: Silent Aid

**Anonymous, Fraud-Proof Humanitarian Cash Disbursement on Stellar**

| | |
|---|---|
| **Hackathon** | Stellar Hacks: Real-World ZK |
| **Status** | Draft v1.0 |
| **Owner** | [Mathan_360] |
| **Last updated** | June 27, 2026 |

---

## 1. Problem Statement

Humanitarian cash-aid programs (UNHCR, WFP, NGOs, disaster relief funds) face a structural tradeoff:

- **Identity-based verification** (biometrics, ID cards, photo registries) prevents fraud and double-claiming, but creates a centralized list of "who is receiving aid." In conflict zones or under repressive regimes, that list can be leaked, seized, or subpoenaed — putting refugees, displaced persons, or persecuted groups at risk of targeting.
- **Identity-light verification** protects recipients but is exploited at scale: duplicate claims, ghost beneficiaries, and intermediary skimming routinely divert a significant share of aid budgets away from real recipients.

There is currently no widely deployed mechanism that gives **both** strong fraud prevention **and** recipient anonymity at the same time.

## 2. Proposed Solution

Silent Aid uses zero-knowledge proofs to let a vetted beneficiary prove two things to a smart contract, without revealing their identity:

1. **Membership** — "I am one of the people this NGO approved," verified against a single on-chain commitment (a Merkle root), with no names, photos, or personal data ever stored on-chain.
2. **Uniqueness** — "I have not claimed this payment before," enforced via a one-time cryptographic nullifier, with no link back to who the claimant is.

The contract verifies the proof and releases funds (XLM or a stablecoin) to a fresh wallet address controlled only by the recipient. Optionally, the NGO holds an auditor key that can decrypt **aggregate** statistics (total disbursed, claim counts, anomaly flags) for compliance reporting, without exposing individual identities.

This directly targets the hackathon's "identity and compliance proofs" and "private payments" tracks, and is built to use Stellar Protocol 25/26's native BN254 curve operations and Poseidon hashing for cheap on-chain proof verification.

## 3. Goals

| Goal | Description |
|---|---|
| G1 | Prevent double-claiming of aid without collecting recipient identity on-chain |
| G2 | Keep individual recipients fully unlinkable to their claims, on-chain and off |
| G3 | Allow an NGO/auditor to verify aggregate program integrity (totals, no double-spend) without re-identifying recipients |
| G4 | Demonstrate genuine, load-bearing use of ZK on Stellar (not cosmetic) using Noir + Soroban verifier contracts |
| G5 | Ship a working demo within the hackathon window |

### Non-Goals (out of scope for MVP)

- Building the NGO's offline vetting/eligibility process itself (we assume a trusted vetting step happens off-chain; we only need the final list of approved identities/commitments).
- On/off ramp to physical cash or local currency (assume stablecoin/XLM payout is the end state for the demo).
- Full KYC/AML system — we build the *primitive* (selective disclosure), not a complete compliance suite.
- Mobile app / SMS interface for low-connectivity recipients (noted as future work).

## 4. Users & Personas

| Persona | Description | Needs |
|---|---|---|
| **Beneficiary (Amina)** | A refugee approved for aid by an NGO. May have no government ID, limited connectivity, and real safety concerns if identified as an aid recipient. | Claim aid reliably, prove eligibility, stay anonymous, avoid double-claim errors locking her out. |
| **NGO Program Admin (Tomas)** | Runs the vetting process and funds the program. | Easy way to commit a list of approved beneficiaries; confidence that funds aren't double-claimed or stolen; reportable totals for donors/regulators. |
| **Auditor / Regulator (Dana)** | Needs to confirm the program isn't being used for money laundering or large-scale fraud. | Aggregate visibility (totals, flagged anomalies) without needing personal data on each recipient. |
| **Hackathon Judge** | Evaluating technical depth and real-world relevance. | Clear problem framing, genuine on-chain ZK verification, working demo, not just a slide concept. |

## 5. User Stories

1. *As an NGO admin*, I can upload/generate a list of approved beneficiary commitments and publish a single Merkle root on-chain, so the full list is never exposed.
2. *As a beneficiary*, I can generate a proof from my secret credential that I'm on the approved list, without revealing which entry is mine.
3. *As a beneficiary*, I can submit that proof to claim my payout exactly once; a second attempt with the same credential is automatically rejected by the contract.
4. *As a beneficiary*, my claim transaction does not reveal my identity or link to other claims I might make in future rounds (per-round nullifiers).
5. *As an auditor*, I can view total funds disbursed, number of unique claims, and any failed double-claim attempts, without seeing who made any individual claim.
6. *As a judge/demo viewer*, I can watch an end-to-end flow: NGO commits root → beneficiary proves + claims → funds move → double-claim attempt fails → auditor dashboard shows aggregate stats.

## 6. Functional Requirements

### 6.1 Eligibility Commitment (NGO side)
- FR1: Generate a Poseidon-hashed leaf for each approved beneficiary from a secret value (provided to the beneficiary out-of-band, e.g. printed code, SMS, or local partner handoff).
- FR2: Build a Merkle tree from all leaves; publish only the root to a Soroban contract.
- FR3: Support adding new beneficiaries via tree updates/new root versions (append-only or epoch-based roots for MVP simplicity).

### 6.2 Proof Generation (Beneficiary side)
- FR4: Beneficiary-side tool (CLI or simple web app) takes the beneficiary's secret + Merkle path and generates a Noir proof of:
  - Membership in the published Merkle root, **and**
  - A nullifier derived deterministically from the secret + claim epoch (so it's the same every time for that beneficiary/epoch, preventing replay, but unlinkable to the secret itself).
- FR5: Output a proof + public inputs (root, nullifier, payout address) ready to submit to the contract.

### 6.3 On-Chain Verification & Payout (Soroban contract)
- FR6: Verify the ZK proof using native BN254 host functions (Protocol 25/26).
- FR7: Check the nullifier hasn't been used before for the current epoch/root; reject if it has.
- FR8: On success, record the nullifier as spent and transfer the payout amount (XLM or stablecoin) to the address supplied in the proof's public inputs.
- FR9: Emit a minimal event (amount, epoch, success/fail) — no identity data — for indexing/dashboards.

### 6.4 Compliance / Audit Layer
- FR10: Maintain an encrypted log (off-chain or in an auditor-only on-chain structure) that lets a holder of the auditor key decrypt aggregate statistics: total disbursed per epoch, number of unique claims, flagged anomalies (e.g., claim volume spikes).
- FR11: Auditor key must **not** be able to reverse a nullifier back to an individual beneficiary identity (selective disclosure of aggregates only, for MVP).

### 6.5 Demo / UX
- FR12: Simple web UI for the "beneficiary" role to paste/scan a secret code and trigger proof generation + claim in one flow.
- FR13: Simple dashboard for the "NGO/auditor" role showing: current root, total disbursed, claims this epoch, and a live "double-claim attempt rejected" demonstration.

## 7. Non-Functional Requirements

| Category | Requirement |
|---|---|
| Privacy | No PII (name, photo, ID number, location) ever stored on-chain or in any public log. |
| Performance | Proof generation should complete in a demo-acceptable time (target: under ~10s on a laptop/phone-class device for MVP). |
| Cost | On-chain verification should be cheap enough for real microgrant amounts — this is the explicit reason to use Protocol 25/26's native BN254/Poseidon support rather than a general-purpose verifier. |
| Auditability | Aggregate disbursement totals must be independently verifiable by the auditor without trusting the NGO's own dashboard. |
| Resilience | A lost/forgotten secret should have a documented (even if manual, off-chain) re-issuance path — losing your secret shouldn't permanently lock you out of aid with no recourse. |

## 8. Technical Architecture (proposed)

```
Off-chain (NGO)                On-chain (Soroban / Stellar)         Off-chain (Beneficiary)
─────────────────              ──────────────────────────          ───────────────────────
Vet beneficiaries      ──▶     EligibilityRegistry contract
Generate Poseidon              stores: current Merkle root(s)
leaves + Merkle tree    ──▶    
Issue secrets to                                                   Holds: secret + Merkle path
beneficiaries (offline)                                             Generates Noir proof of:
                                                                      - membership
                                                                      - nullifier (epoch-bound)
                                                                              │
                                                                              ▼
                               PayoutVerifier contract  ◀───── submits proof + public inputs
                               - verifies proof (BN254 ops)
                               - checks nullifier unused
                               - records nullifier
                               - transfers funds to claim address
                               - emits anonymized event
                                       │
                                       ▼
                               AuditLog (encrypted aggregates) ──▶ Auditor key holder
                                                                     views totals only
```

**Key components to build during the hackathon:**
1. Noir circuit: Merkle membership + nullifier derivation.
2. Soroban contract: proof verifier + nullifier registry + payout logic.
3. Minimal beneficiary web client: secret input → proof generation → submit.
4. Minimal NGO/auditor dashboard: root publishing + aggregate stats display.

## 9. Success Metrics (for hackathon demo, and for a real pilot)

**Hackathon demo:**
- End-to-end flow runs live: commit root → valid claim succeeds → repeat claim with same secret fails → dashboard reflects correct totals.
- On-chain proof verification cost is shown/measured (to highlight Protocol 25/26 efficiency gains).
- Zero PII visible anywhere in the on-chain data or logs shown to judges.

**Real-world pilot (future):**
- Reduction in duplicate/fraudulent claims vs. a comparable identity-light baseline program.
- Zero recipient identities recoverable from on-chain data even under subpoena/leak scenarios.
- NGO/auditor satisfaction that aggregate reporting meets donor and regulatory requirements.

## 10. MVP Scope for the Hackathon (48-hour cut)

**In scope:**
- Single NGO, single Merkle root, single claim epoch (no multi-round complexity).
- Fixed payout amount per beneficiary (no variable amounts/tiers).
- Noir circuit for membership + nullifier; Soroban verifier contract on testnet.
- Minimal but functional UI for both beneficiary claim flow and NGO/auditor dashboard.
- Manual/offline secret-issuance flow (simulate "NGO hands out codes" with a simple script/printable list).

**Explicitly deferred:**
- Multi-epoch/recurring aid rounds.
- Variable payout tiers based on household size, etc.
- Full encrypted on-chain audit trail (a simplified/off-chain version is acceptable for demo).
- Production-grade key management/secret distribution (SMS, local partner apps, etc.).

## 11. Risks & Open Questions

| Risk / Question | Notes |
|---|---|
| Secret distribution in the real world | How does an NGO securely hand a "secret code" to someone with no smartphone or literacy? Needs a real-world delivery mechanism (paper, local partner-assisted, voice/SMS) — flagged as future work, not solved in MVP. |
| Lost secrets | Without a recovery mechanism, a lost secret = lost aid access. Needs a re-issuance/revocation design before any real pilot. |
| Circuit/contract security | Noir circuit and Soroban verifier need careful auditing before any real funds are at stake — MVP is a proof of concept, not production-ready. |
| Regulatory acceptance | Selective-disclosure compliance is a novel pattern; real regulators/donors would need to be convinced the aggregate-only audit model satisfies their requirements. |
| Sybil resistance of the vetting step itself | The system only prevents double-claiming *given* an honest initial vetting list — it does not solve fraud introduced at the vetting stage itself. |

## 12. Why This Wins (Judging Narrative)

- **Real, documented problem**: large-scale aid fraud/leakage vs. recipient endangerment is a genuine, unresolved tension in humanitarian work today — not a hypothetical use case.
- **ZK is load-bearing, not decorative**: membership + nullifier proofs are the entire mechanism that makes the product work; remove the ZK and the product breaks.
- **Built for this protocol moment**: directly exploits Stellar's new native BN254/Poseidon support (Protocol 25/26), which is exactly what the hackathon brief calls out.
- **Counterintuitive hook**: normally privacy and fraud-prevention trade off against each other; this flips that assumption, which is memorable and demo-able in under two minutes.

---

*End of PRD.*
