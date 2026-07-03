"use client"

import { motion } from "framer-motion"
import { ShieldCheck, Fingerprint, Coins, Eye } from "lucide-react"

const ease = [0.22, 1, 0.36, 1] as const

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease },
  }),
}

const FEATURES = [
  {
    icon: ShieldCheck,
    title: "100% Recipient Anonymity",
    desc: "Approved recipient records are stored in a private Merkle tree off-chain. Only a single 32-byte root commitment is published to the Soroban contract, ensuring zero PII enters the public ledger.",
  },
  {
    icon: Fingerprint,
    title: "Double-Claim Nullification",
    desc: "A cryptographic nullifier is generated deterministically from the user's secret key and current epoch. Soroban prevents duplicates by registering spent nullifiers, with no way to reverse them back to the recipient.",
  },
  {
    icon: Coins,
    title: "Protocol 25/26 native ZK",
    desc: "Built to utilize Stellar's native host functions for BN254 elliptic curve pairing and Poseidon hashing. Sub-cent verification fees enable microgrants and small-scale cash assistance programs.",
  },
  {
    icon: Eye,
    title: "Selective Compliance Keys",
    desc: "Allows NGO admins to generate encrypted logs of aggregated values. Auditors decrypt program integrity stats (e.g. claim speed anomalies, total amounts) without matching keys to individuals.",
  },
]

export function Features() {
  return (
    <section id="overview" className="w-full px-6 py-16 lg:px-12">
      {/* Section label */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.5, ease }}
        className="flex items-center gap-4 mb-8"
      >
        <span className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-mono">
          {"// SECTION: CORE_CAPABILITIES"}
        </span>
        <div className="flex-1 border-t border-border" />
        <span className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-mono">002</span>
      </motion.div>

      {/* Grid */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-40px" }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-0 border-2 border-foreground"
      >
        {FEATURES.map((feat, i) => {
          const Icon = feat.icon
          return (
            <motion.div
              custom={i}
              variants={cardVariants}
              key={feat.title}
              className="flex flex-col border-b-2 last:border-b-0 md:border-b-0 md:border-r-2 last:border-r-0 border-foreground p-6 bg-card"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-mono">
                  {`FEAT_0${i + 1}`}
                </span>
                <Icon size={18} strokeWidth={1.5} className="text-[#ea580c]" />
              </div>
              <h3 className="text-sm font-mono font-bold uppercase tracking-wider mb-3">
                {feat.title}
              </h3>
              <p className="text-xs font-mono text-muted-foreground leading-relaxed mt-auto">
                {feat.desc}
              </p>
            </motion.div>
          )
        })}
      </motion.div>
    </section>
  )
}
