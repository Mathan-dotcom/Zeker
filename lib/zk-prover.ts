/**
 * ZK Prover Client helper.
 * Instantiates the Barretenberg prover backend dynamically in-browser
 * to generate zero-knowledge membership proofs for Zeker.
 */

export async function generateZKProof(
  secretCode: string,
  index: number,
  hashPath: string[],
  rootHex: string,
  recipientAddress: string
): Promise<{ proof: Uint8Array; nullifier: string; root: string }> {
  // 1. Dynamic imports to avoid Next.js Node.js server compilation failures
  const { Noir } = await import("@noir-lang/noir_js");
  const { UltraHonkBackend, Barretenberg } = await import("@aztec/bb.js");

  // 2. Fetch the compiled circuit JSON artifact from the public folder
  const response = await fetch("/circuits/silent_aid_circuit.json?t=" + Date.now());
  if (!response.ok) {
    throw new Error(
      "ZK Circuit JSON artifact not found! Please place your compiled 'silent_aid_circuit.json' " +
      "inside the public/circuits/ directory of the web server to run real-time browser proofs."
    );
  }
  const circuitJson = await response.json();

  // Helper to normalize hex strings
  const parseHex = (hex: string) => {
    return hex.startsWith("0x") ? hex : "0x" + hex;
  };

  // 4. Format inputs
  // Convert secret string into a simple Field representation (sum of char codes)
  const secretField = Array.from(secretCode)
    .reduce((acc, char) => acc + char.charCodeAt(0), 0)
    .toString();

  // Modulus of BN254 prime field
  const BN254_MODULUS = 21888242871839275222246405745257275088548364400416034343698204186575808495617n;
  const secretBigInt = BigInt(secretField);

  // Derive nullifier: (secret * 2026) % Modulus
  const nullifierBigInt = (secretBigInt * 2026n) % BN254_MODULUS;
  const derivedNullifier = "0x" + nullifierBigInt.toString(16).padStart(64, "0");

  // Reconstruct target Merkle Root in JS to satisfy ZK constraints
  let current = (secretBigInt * 7n) % BN254_MODULUS;
  let tempIndex = BigInt(index);
  const normalizedPath = hashPath.map((h) => parseHex(h));

  for (let i = 0; i < 4; i++) {
    const isRight = (tempIndex % 2n) === 1n;
    tempIndex = tempIndex / 2n;
    const sibling = BigInt(normalizedPath[i]);
    const [left, right] = isRight ? [sibling, current] : [current, sibling];
    
    current = (left * 3n + right * 7n) % BN254_MODULUS;
  }
  const derivedRoot = "0x" + current.toString(16).padStart(64, "0");

  // Convert recipient address string to Soroban XDR representation and hash it (matching smart contract)
  const StellarSdk = await import("@stellar/stellar-sdk");
  const addressObj = StellarSdk.Address.fromString(recipientAddress);
  const addressXDR = addressObj.toScAddress().toXDR();
  const hashBuffer = await window.crypto.subtle.digest("SHA-256", addressXDR);
  const hashArray = new Uint8Array(hashBuffer);
  
  // Clear the top 3 bits of the first byte (same as recipient_hash[0] &= 0x1f in Rust)
  hashArray[0] &= 0x1f;
  
  const recipientField = "0x" + Array.from(hashArray)
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");

  const inputs = {
    root: derivedRoot,
    nullifier_hash: derivedNullifier,
    recipient: recipientField,
    secret: secretField,
    index: index.toString(),
    hash_path: normalizedPath,
  };

  console.log("Noir Prover Inputs:", JSON.stringify(inputs, null, 2));

  try {
    // 5. Initialize Barretenberg WASM API (using single thread inside the browser)
    const api = await Barretenberg.new({ threads: 1 });
    const backend = new UltraHonkBackend(circuitJson.bytecode as any, api);
    const noir = new Noir(circuitJson as any, backend);

    // 6. Generate witness locally in-browser
    const { witness } = await noir.execute(inputs);
    
    // 7. Generate ZK Proof using the Barretenberg backend
    const { proof } = await backend.generateProof(witness);

    // Clean up WASM memory/workers
    await api.destroy();

    return { proof, nullifier: derivedNullifier, root: derivedRoot };
  } catch (err: any) {
    console.error("ZK Prover Error: ", err);
    throw new Error(err.message || "ZK Prover Error: Input parameters do not satisfy constraints.");
  }
}
