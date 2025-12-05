"use client";

import { useAttestations } from "../lib/hooks/useAttestations";

interface AttestationListProps {
  schemaUID?: string;
}

export function AttestationList({ schemaUID }: AttestationListProps) {
  const { attestations, isLoading, error } = useAttestations(schemaUID);

  if (isLoading) {
    return (
      <div className="w-full max-w-2xl mx-auto p-6">
        <h2 className="text-2xl font-bold mb-6">Attestations</h2>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-20 bg-gray-200 rounded-lg"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-2xl mx-auto p-6">
        <h2 className="text-2xl font-bold mb-6">Attestations</h2>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Error loading attestations: {error.message}</p>
        </div>
      </div>
    );
  }

  if (attestations.length === 0) {
    return (
      <div className="w-full max-w-2xl mx-auto p-6">
        <h2 className="text-2xl font-bold mb-6">Attestations</h2>
        <div className="text-center py-12 text-gray-500">
          <p>No attestations found. Complete courses to earn attestations!</p>
        </div>
      </div>
    );
  }

  // Decode attestation data
  const decodeAttestation = (data: string) => {
    try {
      // Data is ABI-encoded: (uint256 studentId, string category, uint256 xpValue)
      // For display purposes, we'll show the raw data or decode if possible
      return {
        raw: data,
        // In production, you'd decode this properly using ethers/viem
      };
    } catch {
      return { raw: data };
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Attestations ({attestations.length})</h2>
      <div className="space-y-4">
        {attestations.map((attestation) => {
          const decoded = decodeAttestation(attestation.data);
          const date = new Date(attestation.timeCreated * 1000);

          return (
            <div
              key={attestation.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-semibold text-gray-900">
                    Attestation #{attestation.id.slice(0, 8)}...
                  </p>
                  <p className="text-sm text-gray-500">
                    {date.toLocaleDateString()} {date.toLocaleTimeString()}
                  </p>
                </div>
                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                  Verified
                </span>
              </div>
              
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-500 mb-1">Attester</p>
                <p className="text-sm font-mono text-gray-700 break-all">
                  {attestation.attester}
                </p>
              </div>
              
              <div className="mt-2">
                <p className="text-xs text-gray-500 mb-1">Data</p>
                <p className="text-sm font-mono text-gray-700 break-all">
                  {decoded.raw.slice(0, 66)}...
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

