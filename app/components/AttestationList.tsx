import { useReadContract } from "wagmi";

const CONTRACT_ADDRESS = "0x63B5546bc67d926992688D1B8277524C444660Fc";
const CONTRACT_ABI = [
  {
    type: "function",
    name: "getAttestationsOf",
    inputs: [{ name: "recipient", type: "address" }],
    outputs: [{ name: "", type: "uint256[]" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getAttestation",
    inputs: [{ name: "id", type: "uint256" }],
    outputs: [
      {
        components: [
          { name: "id", type: "uint256" },
          { name: "issuer", type: "address" },
          { name: "recipient", type: "address" },
          { name: "metadataURI", type: "string" },
          { name: "timestamp", type: "uint256" },
          { name: "revoked", type: "bool" },
        ],
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
  },
] as const;

function AttestationCard({ id }: { id: bigint }) {
  const { data: attestation } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "getAttestation",
    args: [id],
  });

  if (!attestation) {
    return (
      <div className="glass-panel p-6 animate-pulse">
        <div className="h-4 bg-white/10 rounded w-20 mb-4"></div>
        <div className="space-y-3">
          <div className="h-3 bg-white/10 rounded w-full"></div>
          <div className="h-3 bg-white/10 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-panel-hover p-6 card-shine fade-in group">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono px-2 py-1 bg-blue-500/20 text-blue-400 rounded-lg">
            #{attestation.id.toString()}
          </span>
        </div>
        {attestation.revoked ? (
          <span className="px-3 py-1 bg-red-500/20 text-red-400 text-xs font-semibold rounded-full border border-red-500/30">
            Revoked
          </span>
        ) : (
          <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs font-semibold rounded-full border border-green-500/30">
            Active
          </span>
        )}
      </div>

      <div className="space-y-4">
        <div className="p-3 bg-white/5 rounded-xl">
          <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
            <span>👤</span> Issuer
          </p>
          <p className="font-mono text-sm truncate text-blue-400">
            {attestation.issuer}
          </p>
        </div>

        <div className="p-3 bg-white/5 rounded-xl">
          <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
            <span>📄</span> Metadata
          </p>
          <p className="text-sm truncate text-purple-400 break-all">
            {attestation.metadataURI}
          </p>
        </div>

        <div className="flex justify-between items-center pt-3 border-t border-white/5">
          <div>
            <p className="text-xs text-gray-500 mb-1">Date Created</p>
            <p className="text-sm font-medium">
              {new Date(
                Number(attestation.timestamp) * 1000
              ).toLocaleDateString()}
            </p>
          </div>
          <div className="text-2xl group-hover:scale-110 transition-transform">
            🔗
          </div>
        </div>
      </div>
    </div>
  );
}

export function AttestationList({ address }: { address: `0x${string}` }) {
  const { data: attestationIds } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "getAttestationsOf",
    args: [address],
  });

  if (!address) return null;

  if (!attestationIds || attestationIds.length === 0) {
    return (
      <div className="text-center py-16 glass-panel">
        <div className="text-6xl mb-4">📭</div>
        <h3 className="text-xl font-bold text-gray-400 mb-2">
          No Attestations Yet
        </h3>
        <p className="text-gray-500">
          Issue your first attestation to get started!
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {attestationIds.map((id) => (
        <AttestationCard key={id.toString()} id={id} />
      ))}
    </div>
  );
}
