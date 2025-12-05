"use client";

import { useAccount } from "wagmi";
import { useState, useEffect } from "react";

// EAS GraphQL endpoint for Base Sepolia
const EAS_GRAPHQL_URL = "https://base-sepolia.easscan.org/graphql";

export interface Attestation {
  id: string;
  attester: string;
  recipient: string;
  data: string;
  schemaId: string;
  timeCreated: number;
}

/**
 * Hook to fetch user's EAS attestations
 * Filters by schema UID if provided
 */
export function useAttestations(schemaUID?: string) {
  const { address, isConnected } = useAccount();
  const [attestations, setAttestations] = useState<Attestation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!isConnected || !address) {
      setAttestations([]);
      return;
    }

    const fetchAttestations = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // GraphQL query to fetch attestations
        const query = `
          query GetAttestations($recipient: String!, $schemaId: String) {
            attestations(
              where: {
                recipient: { equals: $recipient }
                ${schemaUID ? `schemaId: { equals: $schemaId }` : ""}
              }
              orderBy: { timeCreated: desc }
            ) {
              id
              attester
              recipient
              data
              schemaId
              timeCreated
            }
          }
        `;

        const variables = {
          recipient: address.toLowerCase(),
          schemaId: schemaUID,
        };

        const response = await fetch(EAS_GRAPHQL_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query,
            variables,
          }),
        });

        if (!response.ok) {
          throw new Error(`GraphQL request failed: ${response.statusText}`);
        }

        const result = await response.json();

        if (result.errors) {
          throw new Error(result.errors[0].message);
        }

        setAttestations(result.data?.attestations || []);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Unknown error"));
        setAttestations([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAttestations();
  }, [address, isConnected, schemaUID]);

  return {
    attestations,
    isLoading,
    error,
  };
}

