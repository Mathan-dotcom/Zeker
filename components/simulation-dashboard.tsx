"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Users, 
  UserCheck, 
  ShieldAlert, 
  KeyRound, 
  Terminal, 
  Lock, 
  CheckCircle2, 
  AlertTriangle,
  Cpu,
  RefreshCw,
  Copy,
  Plus,
  Coins,
  History,
  Activity,
  FileCode
} from "lucide-react"

// Types
interface Beneficiary {
  id: number
  name: string
  secret: string
  leaf: string
  status: "unclaimed" | "claimed"
}

interface SpentNullifier {
  nullifier: string
  timestamp: string
  amount: number
  wallet: string
}

const ease = [0.22, 1, 0.36, 1] as const

const INITIAL_BENEFICIARIES: Beneficiary[] = [
  { 
    id: 1, 
    name: "Amina Al-Jamil", 
    secret: "SA-9X2F-77B1-Amina", 
    leaf: "0x2e8f197b4c3e80df9a2c3a506173cf1d09e3a9a756ff78acbd9e723901bcfa7b", 
    status: "unclaimed" 
  },
  { 
    id: 2, 
    name: "Tomas Kovacs", 
    secret: "SA-1C4D-88E2-Tomas", 
    leaf: "0x7a3e9d8b1c2f42daef98453cf1d09e30a9e756ff783a6288b8cc58eef7236bb1", 
    status: "unclaimed" 
  },
  { 
    id: 3, 
    name: "Leyla Demir", 
    secret: "SA-5D2B-44A9-Leyla", 
    leaf: "0x9c3f2d5e7a9b1c2f42daef98453cf1d09e30a9e756ff783a6288b8cc58eef723", 
    status: "unclaimed" 
  },
]

export function SimulationDashboard() {
  const [activeTab, setActiveTab] = useState<"ngo" | "beneficiary" | "auditor">("ngo")
  
  // Shared state
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>(INITIAL_BENEFICIARIES)
  const [merkleRoot, setMerkleRoot] = useState("0x1831e8dd9b42e3825eb2a7ab74b1e1316f1d1f392975c20f5ecc0889cb291728")
  const [isRootPublished, setIsRootPublished] = useState(true)
  const [claimsCount, setClaimsCount] = useState(0)
  const [totalDisbursed, setTotalDisbursed] = useState(0)
  const [doubleClaimsBlocked, setDoubleClaimsBlocked] = useState(0)
  const [spentNullifiers, setSpentNullifiers] = useState<SpentNullifier[]>([])
  
  // Simulator console/logs
  const [consoleLogs, setConsoleLogs] = useState<string[]>([
    "[info] Zeker Sandbox initialized.",
    "[info] Pre-published Merkle root active on Soroban: 0x1831...b291728"
  ])
  const terminalContainerRef = useRef<HTMLDivElement>(null)

  // Beneficiary inputs
  const [enteredSecret, setEnteredSecret] = useState("")
  const [payoutAddress, setPayoutAddress] = useState("GD5T57Q2T3H5UUXJ26AEX7LPTTNSD73X3GMD7HNSD38L62ASDFG4017")
  const [claimingState, setClaimingState] = useState<
    "idle" | "deriving_hash" | "retrieving_merkle_proof" | "generating_nullifier" | "compiling_noir" | "synthesizing_proof" | "submitting_tx" | "success" | "error"
  >("idle")
  const [claimError, setClaimError] = useState("")
  const [activeNullifier, setActiveNullifier] = useState("")
  
  // Auditor decryption keys
  const [isAuditorDecrypted, setIsAuditorDecrypted] = useState(false)
  const [newBeneficiaryName, setNewBeneficiaryName] = useState("")
  
  // Network Mode states
  const [networkMode, setNetworkMode] = useState<"sandbox" | "testnet">("sandbox")
  const [testnetContractId, setTestnetContractId] = useState(process.env.NEXT_PUBLIC_STELLAR_CONTRACT_ID || "CCQ7EOD4POLCSNKLLJXE6ZLMPS4NH3FCS63M3VAOLJHDUHE3ISUFDCV2")
  const [transactionLink, setTransactionLink] = useState("")

  // Auto scroll console (restrained to container viewport)
  useEffect(() => {
    if (terminalContainerRef.current) {
      terminalContainerRef.current.scrollTop = terminalContainerRef.current.scrollHeight
    }
  }, [consoleLogs])

  const appendLog = (log: string) => {
    setConsoleLogs((prev) => [...prev, log])
  }

  // NGO adding beneficiary
  const handleAddBeneficiary = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newBeneficiaryName.trim()) return

    const sanitizedName = newBeneficiaryName.trim()
    const nameSlug = sanitizedName.replace(/\s+/g, "")
    const randomHex = Math.random().toString(16).substring(2, 6).toUpperCase()
    const secretCode = `SA-${randomHex}-${Math.random().toString(16).substring(2, 6).toUpperCase()}-${nameSlug}`
    
    // Simulate poseidon hash
    const leafHash = "0x" + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")
    
    const newBen: Beneficiary = {
      id: beneficiaries.length + 1,
      name: sanitizedName,
      secret: secretCode,
      leaf: leafHash,
      status: "unclaimed"
    }

    setBeneficiaries((prev) => [...prev, newBen])
    setIsRootPublished(false)
    setNewBeneficiaryName("")
    appendLog(`[ngo] registered beneficiary: ${sanitizedName}. Secret code generated.`)
    appendLog(`[ngo] derived Poseidon leaf hash: ${leafHash.substring(0, 10)}...`)
  }

  // NGO publishing Merkle Root
  const handlePublishRoot = () => {
    appendLog("[ngo] rebuilding Merkle tree from registered leaf hashes...")
    setTimeout(() => {
      const newRoot = "0x" + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")
      setMerkleRoot(newRoot)
      setIsRootPublished(true)
      appendLog(`[ngo] computed new Merkle root: ${newRoot}`)
      appendLog("[stellar-tx] submitting EligibilityRegistry::update_root transaction...")
      setTimeout(() => {
        appendLog(`[stellar-tx] transaction confirmed. TxHash: Stellar_Tx_${Math.random().toString(16).substring(2, 8)}`)
        appendLog(`[stellar-tx] Root updated to ${newRoot.substring(0, 10)}... on-chain.`)
      }, 800)
    }, 600)
  }

  // Beneficiary proof claiming flow
  const handleClaimAid = async () => {
    if (!enteredSecret.trim()) {
      setClaimError("Secret code is required.")
      setClaimingState("error")
      return
    }

    setClaimError("")
    setTransactionLink("")

    if (networkMode === "testnet") {
      try {
        appendLog("[client-zk] Loading dynamic client libraries for Stellar & Freighter...");
        const Freighter = await import("@stellar/freighter-api");
        const StellarSdk = await import("@stellar/stellar-sdk");
        
        // Step 1: Detect wallet
        setClaimingState("deriving_hash");
        appendLog("[client-zk] checking Freighter wallet installation...");
        const connection = await Freighter.isConnected();
        const isInstalled = typeof connection === "boolean" ? connection : (connection && connection.isConnected);
        if (!isInstalled) {
          throw new Error("Freighter wallet extension not detected in browser. Please install the Freighter extension.");
        }
        
        // Step 2: Fetch public key
        setClaimingState("retrieving_merkle_proof");
        appendLog("[client-zk] requesting Freighter public account address...");
        const accessResult = await Freighter.requestAccess();
        if (!accessResult || !accessResult.address) {
          throw new Error("Could not retrieve public key. Please unlock your Freighter wallet and allow access.");
        }
        const userPublicKey = accessResult.address;
        appendLog(`[client-zk] connected to Freighter: ${userPublicKey.slice(0, 8)}...${userPublicKey.slice(-8)}`);
        
        // Auto-add USDC token trustline to Freighter
        try {
          appendLog("[client-zk] requesting Freighter to register USDC trustline...");
          await Freighter.addToken({
            contractId: "CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA",
            networkPassphrase: "Test SDF Network ; September 2015"
          });
        } catch (tokenErr) {
          console.warn("Add token request ignored or failed:", tokenErr);
        }
        
        // Step 3: Check Nullifier
        setClaimingState("generating_nullifier");
        appendLog("[client-zk] calculating nullifier hash...");
        
        const secretFieldVal = Array.from(enteredSecret).reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const BN254_MODULUS = 2188824287183927522224640575257275088548364400416034343698204186575808495617n;
        const derivedNullifierVal = (BigInt(secretFieldVal) * 2026n) % BN254_MODULUS;
        const derivedNullifier = "0x" + derivedNullifierVal.toString(16).padStart(64, "0");
        setActiveNullifier(derivedNullifier);
        
        // Step 4 & 5: Load circuit and compile ZK-SNARK proof locally in-browser
        setClaimingState("synthesizing_proof");
        appendLog("[client-zk] executing local witness solver and compiling PLONK proof...");
        
        const { generateZKProof } = await import("@/lib/zk-prover");
        const indexInTree = beneficiaries.findIndex(b => b.secret.trim() === enteredSecret.trim());
        const treeIndex = indexInTree >= 0 ? indexInTree : 0;
        
        const siblingPath = [
          "0x0f2e3d4c5b6a7f8e9d0c1b2a3f4e5d6c7b8a9f0e1d2c3b4a5f6e7d8c9b0a1f2e",
          "0x1f2e3d4c5b6a7f8e9d0c1b2a3f4e5d6c7b8a9f0e1d2c3b4a5f6e7d8c9b0a1f2e",
          "0x0d4c5b6a7f8e9d0c1b2a3f4e5d6c7b8a9f0e1d2c3b4a5f6e7d8c9b0a1f2e3d4",
          "0x1c5b6a7f8e9d0c1b2a3f4e5d6c7b8a9f0e1d2c3b4a5f6e7d8c9b0a1f2e3d4c5"
        ];

        const { proof: zkProofBytes, nullifier: finalNullifier, root: finalRoot } = await generateZKProof(
          enteredSecret.trim(),
          treeIndex,
          siblingPath,
          merkleRoot,
          userPublicKey
        );
        
        appendLog(`[client-zk] ZK-SNARK proof bytes successfully compiled (${zkProofBytes.length} bytes).`);
        
        // Step 6: Submit to Stellar
        setClaimingState("submitting_tx");
        appendLog(`[stellar-tx] connecting to Testnet Horizon RPC node: https://horizon-testnet.stellar.org`);
        
        const horizonServer = new StellarSdk.Horizon.Server(process.env.NEXT_PUBLIC_STELLAR_HORIZON_URL || "https://horizon-testnet.stellar.org");
        const rpcServer = new StellarSdk.rpc.Server(process.env.NEXT_PUBLIC_STELLAR_RPC_URL || "https://soroban-testnet.stellar.org");
        appendLog(`[stellar-tx] loading network parameters for account ${userPublicKey.slice(0, 10)}...`);
        
        let accountDetail;
        try {
          accountDetail = await horizonServer.loadAccount(userPublicKey);
        } catch (err) {
          throw new Error(`Stellar account ${userPublicKey.slice(0, 12)}... not found or funded on Testnet. Fund it using Friendbot.`);
        }
        
        appendLog("[stellar-tx] building Soroban transaction envelope...");
        
        // Utility to parse hex to Uint8Array
        const hexToBytes = (hex: string) => {
          const clean = hex.startsWith("0x") ? hex.slice(2) : hex;
          const bytes = new Uint8Array(clean.length / 2);
          for (let i = 0; i < clean.length; i += 2) {
            bytes[i / 2] = parseInt(clean.substring(i, i + 2), 16);
          }
          return bytes;
        };

        const rootBytes = hexToBytes(finalRoot);
        const nullifierBytes = hexToBytes(finalNullifier);

        // Build Soroban contract call using standard invokeContractFunction
        let transaction = new StellarSdk.TransactionBuilder(accountDetail, {
          fee: "100000",
          networkPassphrase: "Test SDF Network ; September 2015"
        })
        .addOperation(
          StellarSdk.Operation.invokeContractFunction({
            contract: testnetContractId,
            function: "claim",
            args: [
              StellarSdk.xdr.ScVal.scvBytes(zkProofBytes),
              StellarSdk.xdr.ScVal.scvBytes(rootBytes),
              StellarSdk.xdr.ScVal.scvBytes(nullifierBytes),
              StellarSdk.Address.fromString(userPublicKey).toScVal()
            ]
          })
        )
        .setTimeout(30)
        .build();

        appendLog("[stellar-tx] simulating and preparing Soroban transaction resources...");
        try {
          transaction = await rpcServer.prepareTransaction(transaction);
        } catch (simErr: any) {
          console.error("Soroban simulation failed:", simErr);
          throw new Error(`Soroban simulation failed: ${simErr.message || simErr}`);
        }

        appendLog("[stellar-tx] request signing from Freighter wallet popup...");
        const signResult = await Freighter.signTransaction(transaction.toXDR(), {
          networkPassphrase: "Test SDF Network ; September 2015"
        });
        
        let signedXDR: string;
        if (typeof signResult === "string") {
          signedXDR = signResult;
        } else if (signResult && typeof signResult === "object") {
          if (signResult.error) {
            throw new Error(signResult.error.message || signResult.error);
          }
          signedXDR = signResult.signedTxXdr;
        } else {
          throw new Error("Failed to sign transaction with Freighter.");
        }
        
        appendLog("[stellar-tx] signed transaction XDR received.");
        appendLog("[stellar-tx] submitting signed transaction to Stellar Testnet RPC validators...");
        
        const txSubmitResponse = await horizonServer.submitTransaction(
          StellarSdk.TransactionBuilder.fromXDR(signedXDR, "Test SDF Network ; September 2015")
        );

        appendLog(`[stellar-tx] smart contract verification: SUCCESS.`);
        appendLog(`[stellar-tx] nullifier registered on-chain.`);
        appendLog(`[stellar-tx] released $100.00 USDC to ${userPublicKey.slice(0, 8)}...`);
        appendLog(`[EVENT] payout_disbursed { tx: ${txSubmitResponse.hash.slice(0, 10)}... }`);

        setTransactionLink(`https://stellar.expert/explorer/testnet/tx/${txSubmitResponse.hash}`);
        setClaimingState("success");
        
        // Update dashboard metrics
        setClaimsCount(prev => prev + 1);
        setTotalDisbursed(prev => prev + 100);
        
        const newNullifier: SpentNullifier = {
          nullifier: derivedNullifier,
          timestamp: new Date().toLocaleTimeString(),
          amount: 100,
          wallet: userPublicKey.substring(0, 6) + "..." + userPublicKey.substring(userPublicKey.length - 6)
        };
        setSpentNullifiers(prev => [newNullifier, ...prev]);

      } catch (err: any) {
        console.error(err);
        const errMessage = err.message || "Failed to submit transaction to Stellar Testnet";
        setClaimError(errMessage);
        setClaimingState("error");
        appendLog(`[stellar-tx] [error] transaction failed: ${errMessage}`);
      }
      return;
    }

    // Step 1: Derive leaf hash
    setClaimingState("deriving_hash")
    appendLog("[client-zk] loading secret code...")
    await new Promise((r) => setTimeout(r, 600))
    
    // Check if the secret matches any beneficiary
    const match = beneficiaries.find(b => b.secret.trim() === enteredSecret.trim())
    if (!match) {
      setClaimingState("error")
      setClaimError("INVALID CREDENTIAL: The secret key does not match any approved leaf in the Merkle Root.")
      appendLog("[client-zk] [error] no leaf matching secret found.")
      return
    }

    appendLog(`[client-zk] matching leaf found for ${match.name}.`)
    appendLog(`[client-zk] derived Poseidon leaf: ${match.leaf.substring(0, 12)}...`)
    
    // Step 2: Retrieve Merkle Proof
    setClaimingState("retrieving_merkle_proof")
    appendLog("[client-zk] fetching Merkle path membership details...")
    await new Promise((r) => setTimeout(r, 600))
    appendLog("[client-zk] generated membership proof path: [depth=4]")
    appendLog(`[client-zk] verified path leads to root: ${merkleRoot.substring(0, 12)}...`)

    // Step 3: Compute Nullifier hash
    setClaimingState("generating_nullifier")
    appendLog("[client-zk] computing epoch nullifier: Poseidon(secret, 2026)")
    await new Promise((r) => setTimeout(r, 600))
    // Deterministic mock nullifier based on secret
    const derivedNullifier = "0x" + Array.from(enteredSecret).map(c => c.charCodeAt(0).toString(16)).join("").substring(0, 64).padEnd(64, "f")
    setActiveNullifier(derivedNullifier)
    appendLog(`[client-zk] nullifier derived: ${derivedNullifier.substring(0, 12)}...`)

    // Step 4: Compiling Noir circuit
    setClaimingState("compiling_noir")
    appendLog("[client-zk] loading Noir constraint system...")
    appendLog("[client-zk] compiling circuit (constraints: 2,342 gates)...")
    await new Promise((r) => setTimeout(r, 800))

    // Step 5: Synthesizing ZK proof bytes
    setClaimingState("synthesizing_proof")
    appendLog("[client-zk] compiling witness parameters...")
    appendLog("[client-zk] synthesizing PLONK proof (BN254 curve)...")
    await new Promise((r) => setTimeout(r, 800))
    appendLog("[client-zk] SNARK proof successfully generated (340 bytes).")

    // Step 6: Submit claim to Soroban
    setClaimingState("submitting_tx")
    appendLog("[stellar-tx] calling verifier contract: payout_verifier::claim...")
    appendLog(`[stellar-tx] params: root=${merkleRoot.substring(0, 8)}..., nullifier=${derivedNullifier.substring(0, 8)}...`)
    await new Promise((r) => setTimeout(r, 1000))

    // Soroban Contract execution logic
    // 1. check nullifier spent
    const isAlreadySpent = spentNullifiers.some(sn => sn.nullifier === derivedNullifier)
    
    if (isAlreadySpent) {
      setClaimingState("error")
      setClaimError("REPLAY ERROR: This nullifier has already been claimed! Double-claim rejected.")
      setDoubleClaimsBlocked(prev => prev + 1)
      appendLog(`[stellar-tx] [error] contract assertion failed: Nullifier ${derivedNullifier.substring(0, 10)}... already spent.`)
      appendLog(`[EVENT] duplicate_claim_detected { nullifier: "${derivedNullifier.substring(0, 16)}...", epoch: 2026 }`)
      return
    }

    // 2. Success path
    setClaimingState("success")
    setClaimsCount(prev => prev + 1)
    setTotalDisbursed(prev => prev + 100)
    
    // Update beneficiary status
    setBeneficiaries(prev => prev.map(b => b.secret === enteredSecret ? { ...b, status: "claimed" } : b))
    
    // Add to spent nullifiers
    const newNullifier: SpentNullifier = {
      nullifier: derivedNullifier,
      timestamp: new Date().toLocaleTimeString(),
      amount: 100,
      wallet: payoutAddress.substring(0, 6) + "..." + payoutAddress.substring(payoutAddress.length - 6)
    }
    setSpentNullifiers(prev => [newNullifier, ...prev])
    
    appendLog("[stellar-tx] Smart contract verified ZK-proof successfully using Protocol 26 native curves.")
    appendLog(`[stellar-tx] nullifier recorded as spent: ${derivedNullifier.substring(0, 12)}...`)
    appendLog(`[stellar-tx] released $100.00 USDC to ${payoutAddress.substring(0, 8)}...`)
    appendLog(`[EVENT] payout_disbursed { nullifier: "${derivedNullifier.substring(0, 12)}...", amount: 100.00, destination: "${payoutAddress.substring(0, 6)}..." }`)
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <section id="simulator" className="w-full px-6 py-12 lg:px-12 bg-background">
      {/* Section label */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.5, ease }}
        className="flex items-center gap-4 mb-8"
      >
        <span className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-mono">
          {"// SECTION: INTERACTIVE_SANDBOX"}
        </span>
        <div className="flex-1 border-t border-border" />
        <span className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-mono">003</span>
      </motion.div>

      {/* Network Mode Status Banner */}
      <div className="w-full border-2 border-foreground border-b-0 p-4 bg-muted/10 font-mono flex flex-col md:flex-row justify-between items-center gap-4 mb-0">
        <div className="flex items-center gap-3">
          <Activity size={14} className={networkMode === "testnet" ? "text-green-600 animate-pulse" : "text-amber-600 animate-pulse"} />
          <span className="text-xs uppercase tracking-widest text-muted-foreground">
            Current Network:
          </span>
          <span className={`text-xs font-bold uppercase tracking-widest px-2 py-0.5 border border-foreground ${
            networkMode === "testnet" ? "bg-green-600 text-white" : "bg-amber-600 text-black"
          }`}>
            {networkMode === "testnet" ? "Stellar Testnet (Live)" : "Local Sandbox (Mock)"}
          </span>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto">
          {networkMode === "testnet" && (
            <div className="flex items-center gap-2 flex-1 md:flex-initial">
              <span className="text-[10px] uppercase text-muted-foreground">Contract ID:</span>
              <input
                type="text"
                value={testnetContractId}
                onChange={(e) => setTestnetContractId(e.target.value)}
                className="bg-background text-foreground border border-foreground text-[10px] px-2 py-1 focus:outline-none w-full md:w-[260px]"
              />
            </div>
          )}
          <div className="flex border border-foreground select-none shrink-0">
            <button
              onClick={() => {
                setNetworkMode("sandbox");
                appendLog("[info] Switched sandbox to Local Offline mode.");
              }}
              className={`px-3 py-1 text-[10px] uppercase tracking-wider transition-colors duration-150 ${
                networkMode === "sandbox" ? "bg-foreground text-background font-bold" : "hover:bg-muted/20"
              }`}
            >
              Local Sandbox
            </button>
            <button
              onClick={() => {
                setNetworkMode("testnet");
                appendLog("[info] Switched sandbox to live Stellar Testnet client mode.");
                appendLog("[info] Freighter Wallet extension is required for Testnet claims.");
              }}
              className={`px-3 py-1 text-[10px] uppercase tracking-wider transition-colors duration-150 border-l border-foreground ${
                networkMode === "testnet" ? "bg-foreground text-background font-bold" : "hover:bg-muted/20"
              }`}
            >
              Stellar Testnet
            </button>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 border-2 border-foreground gap-0 bg-card overflow-hidden">
        {/* Left: Role Navigation & System Metrics */}
        <div className="col-span-1 lg:col-span-3 border-b-2 lg:border-b-0 lg:border-r-2 border-foreground flex flex-col justify-between">
          <div>
            <div className="border-b-2 border-foreground px-4 py-3 bg-muted/20">
              <span className="text-[10px] tracking-widest text-muted-foreground font-mono uppercase">
                role_selection
              </span>
            </div>
            
            <nav className="flex flex-col gap-0">
              {[
                { id: "ngo", label: "NGO Program Admin", icon: Users },
                { id: "beneficiary", label: "Beneficiary Claimant", icon: KeyRound },
                { id: "auditor", label: "Auditor Compliance", icon: Lock },
              ].map((role) => {
                const Icon = role.icon
                return (
                  <button
                    key={role.id}
                    onClick={() => {
                      setActiveTab(role.id as any)
                      setClaimError("")
                      if (claimingState === "success" || claimingState === "error") {
                        setClaimingState("idle")
                      }
                    }}
                    className={`flex items-center gap-3 px-4 py-4 text-xs font-mono tracking-widest uppercase border-b border-foreground text-left transition-all ${
                      activeTab === role.id
                        ? "bg-foreground text-background font-bold"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/10"
                    }`}
                  >
                    <Icon size={14} />
                    <span>{role.label}</span>
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Sandbox Metrics Panel */}
          <div className="p-4 border-t border-foreground bg-muted/10 flex flex-col gap-3">
            <span className="text-[9px] tracking-[0.15em] uppercase text-muted-foreground font-mono">
              On-Chain Soroban Registry
            </span>
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-muted-foreground">Active Root:</span>
                <span className="text-foreground font-bold">{merkleRoot.substring(0, 10)}...</span>
              </div>
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-muted-foreground">Vetted Count:</span>
                <span className="text-foreground font-bold">{beneficiaries.length}</span>
              </div>
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-muted-foreground">Claims Verified:</span>
                <span className="text-[#ea580c] font-bold">{claimsCount}</span>
              </div>
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-muted-foreground">Replays Blocked:</span>
                <span className="text-red-500 font-bold">{doubleClaimsBlocked}</span>
              </div>
            </div>
            
            <div className="h-1.5 w-full border border-foreground mt-2 relative overflow-hidden bg-background">
              <div 
                className="h-full bg-[#ea580c] transition-all duration-500" 
                style={{ width: `${(claimsCount / beneficiaries.length) * 100}%` }}
              />
            </div>
            <div className="flex justify-between text-[8px] text-muted-foreground font-mono">
              <span>DISBURSED: {claimsCount * 100} USDC</span>
              <span>{Math.round((claimsCount / beneficiaries.length) * 100)}% CLAIMED</span>
            </div>
          </div>
        </div>

        {/* Center: Main Role view workspace */}
        <div className="col-span-1 lg:col-span-6 border-b-2 lg:border-b-0 lg:border-r-2 border-foreground p-6 flex flex-col justify-between min-h-[460px]">
          
          <AnimatePresence mode="wait">
            {/* NGO View */}
            {activeTab === "ngo" && (
              <motion.div
                key="ngo-view"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col h-full gap-5"
              >
                <div>
                  <h3 className="text-md font-mono font-bold uppercase tracking-wider text-foreground mb-1">
                    Vetting & Leaf Registration
                  </h3>
                  <p className="text-xs font-mono text-muted-foreground leading-relaxed">
                    Vet offline beneficiaries and derive Poseidon commitment leaves. Once done, compile them into a Merkle tree and commit the root hash to Stellar.
                  </p>
                </div>

                {/* Register new beneficiary form */}
                <form onSubmit={handleAddBeneficiary} className="flex gap-0 border-2 border-foreground">
                  <input
                    type="text"
                    placeholder="Enter Recipient Name (e.g. Amina Al-Jamil)"
                    value={newBeneficiaryName}
                    onChange={(e) => setNewBeneficiaryName(e.target.value)}
                    className="flex-1 bg-background text-foreground px-4 py-2 font-mono text-xs focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="bg-foreground text-background border-l-2 border-foreground px-4 py-2 font-mono text-xs font-bold hover:bg-muted-foreground hover:text-background transition-colors"
                  >
                    <Plus size={14} className="inline mr-1" /> Add
                  </button>
                </form>

                {/* Registry Table */}
                <div className="flex-1 flex flex-col gap-2 overflow-y-auto max-h-[220px] border border-foreground p-2 bg-background/50">
                  <div className="grid grid-cols-12 gap-1 border-b border-foreground pb-1 text-[9px] font-mono uppercase text-muted-foreground">
                    <span className="col-span-4">Recipient Name</span>
                    <span className="col-span-5">Secret Code (Copy)</span>
                    <span className="col-span-3 text-right">Status</span>
                  </div>
                  
                  {beneficiaries.map((ben) => (
                    <div key={ben.id} className="grid grid-cols-12 gap-1 py-1.5 border-b border-border last:border-none text-xs font-mono items-center">
                      <span className="col-span-4 font-semibold text-foreground truncate">{ben.name}</span>
                      <div className="col-span-5 flex items-center gap-1.5">
                        <span className="text-[10px] text-muted-foreground truncate font-mono select-all max-w-[120px]">{ben.secret}</span>
                        <button
                          onClick={() => {
                            handleCopy(ben.secret)
                            appendLog(`[client-zk] copied secret key: ${ben.secret}`)
                          }}
                          title="Copy Secret Code"
                          className="hover:text-[#ea580c] transition-colors p-0.5"
                        >
                          <Copy size={11} />
                        </button>
                      </div>
                      <span className={`col-span-3 text-right text-[10px] uppercase font-bold ${
                        ben.status === "claimed" ? "text-green-600" : "text-amber-600 animate-pulse"
                      }`}>
                        {ben.status === "claimed" ? "CLAIMED" : "UNCLAIMED"}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Publish Root button */}
                <div className="mt-auto pt-4 flex items-center justify-between border-t border-border">
                  <div className="flex flex-col">
                    <span className="text-[9px] text-muted-foreground font-mono uppercase">Local Tree Changes</span>
                    <span className="text-xs font-mono font-bold">
                      {isRootPublished ? "✓ All changes synced on-chain" : "✗ Changes pending publish"}
                    </span>
                  </div>
                  <button
                    onClick={handlePublishRoot}
                    disabled={isRootPublished}
                    className={`px-4 py-2 font-mono text-xs font-bold uppercase transition-all flex items-center gap-2 border-2 ${
                      isRootPublished 
                        ? "border-muted text-muted-foreground bg-muted/10 cursor-not-allowed"
                        : "border-foreground bg-foreground text-background hover:bg-background hover:text-foreground"
                    }`}
                  >
                    <RefreshCw size={12} className={isRootPublished ? "" : "animate-spin"} />
                    Publish Root to Stellar
                  </button>
                </div>
              </motion.div>
            )}

            {/* Beneficiary View */}
            {activeTab === "beneficiary" && (
              <motion.div
                key="beneficiary-view"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col h-full gap-4"
              >
                <div>
                  <h3 className="text-md font-mono font-bold uppercase tracking-wider text-foreground mb-1">
                    Anonymously Claim Payout
                  </h3>
                  <p className="text-xs font-mono text-muted-foreground leading-relaxed">
                    Paste your secret code below. The system will compile the Noir ZK proof client-side, derive a deterministic epoch-bound nullifier, and submit it to Stellar.
                  </p>
                </div>

                {/* Secret Key Input */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground">
                    Secret Aid Token Key
                  </label>
                  <input
                    type="password"
                    placeholder="Paste Secret Code (e.g. SA-9X2F-77B1-Amina)"
                    value={enteredSecret}
                    onChange={(e) => setEnteredSecret(e.target.value)}
                    disabled={claimingState !== "idle" && claimingState !== "success" && claimingState !== "error"}
                    className="w-full bg-background border-2 border-foreground px-3 py-2 font-mono text-xs focus:outline-none"
                  />
                  <div className="flex items-center justify-between text-[9px] text-muted-foreground font-mono">
                    <span>This key is hashed locally, never sent to the network.</span>
                    <button 
                      onClick={() => {
                        // Quick helper to fill in first unclaimed secret
                        const firstUnclaimed = beneficiaries.find(b => b.status === "unclaimed")
                        if (firstUnclaimed) {
                          setEnteredSecret(firstUnclaimed.secret)
                          appendLog(`[client-zk] autofilled credential from sandbox list: ${firstUnclaimed.secret}`)
                        }
                      }}
                      className="text-[#ea580c] hover:underline"
                    >
                      Autofill Unclaimed
                    </button>
                  </div>
                </div>

                {/* Recipient Wallet Address */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground">
                    Destination Stellar Wallet Address
                  </label>
                  <input
                    type="text"
                    value={payoutAddress}
                    onChange={(e) => setPayoutAddress(e.target.value)}
                    disabled={claimingState !== "idle" && claimingState !== "success" && claimingState !== "error"}
                    className="w-full bg-background border-2 border-foreground px-3 py-2 font-mono text-xs focus:outline-none"
                  />
                </div>

                {/* Proof builder states */}
                {claimingState !== "idle" && (
                  <div className="border border-foreground bg-muted/15 p-3 flex items-center gap-3">
                    {claimingState === "success" && (
                      <>
                        <CheckCircle2 className="text-green-600 flex-shrink-0" size={24} />
                        <div className="flex flex-col gap-1">
                          <span className="text-xs font-mono font-bold uppercase text-green-700">Claim Completed</span>
                          <span className="text-[9px] font-mono text-muted-foreground">
                            100 USDC payout transferred. ZK Nullifier marked.
                          </span>
                          {transactionLink && (
                            <a
                              href={transactionLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[9px] font-mono text-[#ea580c] hover:underline uppercase tracking-wider font-bold mt-0.5 inline-flex items-center gap-1"
                            >
                              View Ledger Transaction ➔
                            </a>
                          )}
                        </div>
                      </>
                    )}
                    {claimingState === "error" && (
                      <>
                        <AlertTriangle className="text-red-500 flex-shrink-0" size={24} />
                        <div className="flex flex-col">
                          <span className="text-xs font-mono font-bold uppercase text-red-600">Verification Blocked</span>
                          <span className="text-[9px] font-mono text-red-500 leading-tight">
                            {claimError}
                          </span>
                        </div>
                      </>
                    )}
                    {claimingState !== "success" && claimingState !== "error" && (
                      <>
                        <Cpu className="text-[#ea580c] animate-spin flex-shrink-0" size={24} />
                        <div className="flex flex-col">
                          <span className="text-xs font-mono font-bold uppercase text-foreground">
                            {claimingState === "deriving_hash" && "1/6 Hashing secret locally"}
                            {claimingState === "retrieving_merkle_proof" && "2/6 Assembling path proof"}
                            {claimingState === "generating_nullifier" && "3/6 Generating nullifier hash"}
                            {claimingState === "compiling_noir" && "4/6 Verifying Noir constraints"}
                            {claimingState === "synthesizing_proof" && "5/6 Generating BN254 SNARK proof"}
                            {claimingState === "submitting_tx" && "6/6 Submitting proof to Stellar"}
                          </span>
                          <span className="text-[9px] font-mono text-muted-foreground animate-pulse">
                            Please wait while cryptographic execution completes...
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Submitting Buttons */}
                <div className="mt-auto pt-4 flex gap-4">
                  {(claimingState === "success" || claimingState === "error") && (
                    <button
                      onClick={() => {
                        setClaimingState("idle")
                        setEnteredSecret("")
                      }}
                      className="px-4 py-2 border-2 border-foreground bg-background text-foreground font-mono text-xs uppercase font-bold hover:bg-muted/10 transition-colors flex-1"
                    >
                      Reset Portal
                    </button>
                  )}
                  <button
                    onClick={handleClaimAid}
                    disabled={claimingState !== "idle" && claimingState !== "success" && claimingState !== "error"}
                    className={`px-4 py-3 font-mono text-xs font-bold uppercase transition-all flex items-center justify-center gap-2 border-2 flex-1 ${
                      claimingState !== "idle" && claimingState !== "success" && claimingState !== "error"
                        ? "border-muted text-muted-foreground bg-muted/10 cursor-not-allowed"
                        : "border-foreground bg-foreground text-background hover:bg-background hover:text-foreground"
                    }`}
                  >
                    <Lock size={12} />
                    Prove Identity & Claim Cash
                  </button>
                </div>
              </motion.div>
            )}

            {/* Auditor View */}
            {activeTab === "auditor" && (
              <motion.div
                key="auditor-view"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col h-full gap-4"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-md font-mono font-bold uppercase tracking-wider text-foreground mb-1">
                      Compliance Audit Panel
                    </h3>
                    <p className="text-xs font-mono text-muted-foreground leading-relaxed">
                      Verify program legitimacy and total disbursements. Spent nullifiers are publicly registered, but recipient identities are encrypted.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsAuditorDecrypted(!isAuditorDecrypted)}
                    className={`px-3 py-1 font-mono text-[9px] font-bold uppercase border border-foreground transition-all flex items-center gap-1.5 ${
                      isAuditorDecrypted 
                        ? "bg-[#ea580c] text-background"
                        : "bg-transparent text-foreground hover:bg-muted/10"
                    }`}
                  >
                    <KeyRound size={10} />
                    {isAuditorDecrypted ? "Decrypted" : "Unlock Logs"}
                  </button>
                </div>

                {/* Audit Key Decrypted overlay */}
                <div className="flex-1 border border-foreground p-3 bg-background/50 flex flex-col gap-2 overflow-y-auto max-h-[220px]">
                  <div className="flex items-center justify-between border-b border-foreground pb-1 text-[9px] font-mono uppercase text-muted-foreground">
                    <span>Spent Nullifier</span>
                    <span>Epoch</span>
                    <span className="text-right">Decrypted Recipient</span>
                  </div>

                  {spentNullifiers.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-6 gap-2">
                      <History className="text-muted-foreground" size={20} />
                      <span className="text-xs font-mono text-muted-foreground uppercase">
                        No transactions registered yet.
                      </span>
                    </div>
                  ) : (
                    spentNullifiers.map((sn, idx) => {
                      // Attempt to reverse match nullifier to beneficiary secret
                      const matchingBen = beneficiaries.find(
                        b => "0x" + Array.from(b.secret).map(c => c.charCodeAt(0).toString(16)).join("").substring(0, 64).padEnd(64, "f") === sn.nullifier
                      )
                      return (
                        <div key={idx} className="flex justify-between items-center py-2 border-b border-border last:border-none text-xs font-mono">
                          <span className="font-semibold text-foreground truncate max-w-[120px]" title={sn.nullifier}>
                            {sn.nullifier.substring(0, 14)}...
                          </span>
                          <span className="text-muted-foreground">2026</span>
                          <span className="text-right font-bold">
                            {isAuditorDecrypted 
                              ? (matchingBen ? matchingBen.name : "Unknown Beneficiary") 
                              : "[🔒 ENCRYPTED_PII]"
                            }
                          </span>
                        </div>
                      )
                    })
                  )}
                </div>

                <div className="border border-foreground bg-muted/10 p-3 flex flex-col gap-1.5 font-mono text-[10px]">
                  <span className="font-bold text-foreground flex items-center gap-1.5 uppercase">
                    <ShieldAlert size={12} className="text-[#ea580c]" /> compliance verification statement:
                  </span>
                  <p className="text-muted-foreground leading-relaxed text-[9px]">
                    The spent nullifiers demonstrate 100% uniqueness of claimants. Total disbursed: <strong>{totalDisbursed} USDC</strong> across <strong>{claimsCount} claims</strong>. Zero double-claims were validated.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>

        {/* Right: Stellar Soroban event log stream */}
        <div className="col-span-1 lg:col-span-3 flex flex-col justify-between min-h-[460px] bg-black text-green-400 font-mono">
          <div>
            <div className="border-b border-green-800/80 px-4 py-3 bg-black flex items-center justify-between">
              <span className="text-[10px] tracking-widest text-green-500 uppercase flex items-center gap-1.5">
                <Terminal size={10} /> soroban_node.log
              </span>
              <span className="inline-flex h-1.5 w-1.5 bg-green-500 rounded-full animate-ping" />
            </div>

            {/* Scrolling terminal stream */}
            <div 
              ref={terminalContainerRef}
              className="p-4 flex flex-col gap-2 overflow-y-auto max-h-[360px] text-[10px] leading-relaxed select-text font-mono select-none"
            >
              {consoleLogs.map((log, idx) => (
                <div 
                  key={idx} 
                  className={`${
                    log.includes("[error]") 
                      ? "text-red-500" 
                      : log.includes("[EVENT]") 
                        ? "text-amber-500 font-bold" 
                        : log.includes("[ngo]") 
                          ? "text-blue-400" 
                          : log.includes("[stellar-tx]") 
                            ? "text-cyan-400" 
                            : "text-green-400"
                  }`}
                >
                  {log}
                </div>
              ))}
            </div>
          </div>

          {/* Action to reset sandbox */}
          <div className="p-3 border-t border-green-800/80 bg-black flex justify-between items-center text-[10px]">
            <span className="text-green-600">STELLAR TESTNET</span>
            <button
              onClick={() => {
                setBeneficiaries(INITIAL_BENEFICIARIES)
                setClaimsCount(0)
                setTotalDisbursed(0)
                setDoubleClaimsBlocked(0)
                setSpentNullifiers([])
                setConsoleLogs([
                  "[info] Sandbox reset completed.",
                  "[info] Active Merkle root reset to: 0x8df2...ef723"
                ])
                setClaimingState("idle")
                setEnteredSecret("")
              }}
              className="text-green-400 hover:text-green-300 font-bold uppercase tracking-wider flex items-center gap-1.5 bg-green-950 px-2.5 py-1.5 hover:bg-green-900 border border-green-700 transition-colors"
            >
              Reset Sandbox
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
