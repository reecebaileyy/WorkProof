'use client'

import { useState } from "react";
import {
  Transaction,
  TransactionButton,
  TransactionStatus,
  TransactionStatusLabel,
  TransactionStatusAction,
  TransactionToast,
  TransactionToastIcon,
  TransactionToastLabel,
  TransactionToastAction,
} from "@coinbase/onchainkit/transaction";
import type { TransactionProps } from "@coinbase/onchainkit/transaction";
import { baseSepolia } from "wagmi/chains";
import type { Abi } from "viem";

const CONTRACT_ADDRESS = "0x63B5546bc67d926992688D1B8277524C444660Fc";
const CONTRACT_ABI = [
  {
    type: "function",
    name: "issueAttestation",
    inputs: [
      { name: "recipient", type: "address" },
      { name: "metadataURI", type: "string" },
    ],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "nonpayable",
  },
] as const;

export function AttestationForm() {
  const [recipient, setRecipient] = useState("");
  const [metadataURI, setMetadataURI] = useState("");

  const calls: TransactionProps["calls"] = [
    {
      address: CONTRACT_ADDRESS,
      // CONTRACT_ABI is a const typed ABI; narrow to any for the library call if necessary
      abi: CONTRACT_ABI as Abi,
      functionName: "issueAttestation",
      args: [recipient as `0x${string}`, metadataURI],
    },
  ];

  return (
    <div className="glass-panel p-8 w-full max-w-2xl mx-auto fade-in card-shine">
      <div className="mb-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 mb-4 shadow-lg">
          <span className="text-3xl">🎯</span>
        </div>
        <h2 className="text-3xl font-bold gradient-text mb-2">
          Issue New Attestation
        </h2>
        <p className="text-gray-400">
          Create a verifiable proof on Base Sepolia
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-semibold mb-3 text-gray-300 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold">
              1
            </span>
            Recipient Address
          </label>
          <input
            type="text"
            placeholder="0x..."
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            className="input-field"
          />
          <p className="text-xs text-gray-500 mt-2">
            The wallet address that will receive this attestation
          </p>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-3 text-gray-300 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-xs font-bold">
              2
            </span>
            Metadata URI
          </label>
          <textarea
            placeholder="ipfs://... or https://..."
            value={metadataURI}
            onChange={(e) => setMetadataURI(e.target.value)}
            rows={3}
            className="input-field resize-none"
          />
          <p className="text-xs text-gray-500 mt-2">
            Link to attestation details (IPFS, JSON, or any URI)
          </p>
        </div>

        <Transaction
          chainId={baseSepolia.id}
          calls={calls}
          onStatus={(status) => console.log(status)}
        >
          <TransactionButton
            className="w-full mt-6 btn-primary text-lg py-4"
            text="Issue Attestation"
          />
          <TransactionStatus>
            <TransactionStatusLabel />
            <TransactionStatusAction />
          </TransactionStatus>
          <TransactionToast>
            <TransactionToastIcon />
            <TransactionToastLabel />
            <TransactionToastAction />
          </TransactionToast>
        </Transaction>
      </div>

      <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
        <p className="text-sm text-blue-300 flex items-start gap-2">
          <span className="text-lg">💡</span>
          <span>
            Tip: Add your recipient address and metadata link to create a
            permanent on-chain record.
          </span>
        </p>
      </div>
    </div>
  );
}
