"use client"

import { motion } from "framer-motion"
import { Compass, Calendar, Sparkles, Map } from "lucide-react"

const ease = [0.22, 1, 0.36, 1] as const

const ROADMAP_ITEMS = [
  {
    phase: "PHASE_01",
    title: "Off-chain Secret Recovery",
    desc: "Design and implement a secure, multi-party threshold decryption layout for recovering or revoking secrets in case of loss, preventing permanent lockout of aid.",
    status: "PLANNING",
  },
  {
    phase: "PHASE_02",
    title: "SMS Relay Proving Networks",
    desc: "Build lightweight prover proxies that allow refugees with basic feature phones to submit secrets via SMS, generating ZK proofs on secure edge provers.",
    status: "PROTOTYPING",
  },
  {
    phase: "PHASE_03",
    title: "Multi-round Epoch Cycles",
    desc: "Extend the Soroban contract structure to handle consecutive payout epochs (e.g. monthly distributions) with dynamic, append-only Merkle tree roots.",
    status: "RESEARCHING",
  },
  {
    phase: "PHASE_04",
    title: "Sybil Resistance Hooks",
    desc: "Provide optional plugs for decentralized identity layers (e.g. World ID or decentralized biometrics) to verify 'one-person-one-claim' at the initial vetting step.",
    status: "FUTURE",
  },
]

export function Roadmap() {
  return (
    <section id="roadmap" className="w-full px-6 py-16 lg:px-12 bg-background">
      {/* Section label */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.5, ease }}
        className="flex items-center gap-4 mb-8"
      >
        <span className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-mono">
          {"// SECTION: DEVELOPMENT_ROADMAP"}
        </span>
        <div className="flex-1 border-t border-border" />
        <span className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-mono">004</span>
      </motion.div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-0 border-2 border-foreground bg-card">
        {ROADMAP_ITEMS.map((item, idx) => (
          <div
            key={idx}
            className="flex flex-col border-b-2 last:border-b-0 md:border-b-0 md:border-r-2 last:border-r-0 border-foreground p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-[9px] font-mono tracking-widest text-[#ea580c] bg-[#ea580c]/10 px-2 py-0.5 font-bold uppercase">
                {item.phase}
              </span>
              <span className="text-[9px] font-mono tracking-widest text-muted-foreground uppercase">
                {item.status}
              </span>
            </div>
            <h3 className="text-sm font-mono font-bold uppercase tracking-wider mb-2">
              {item.title}
            </h3>
            <p className="text-xs font-mono text-muted-foreground leading-relaxed">
              {item.desc}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
