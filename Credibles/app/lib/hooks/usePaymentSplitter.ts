"use client";

import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useAccount } from "wagmi";
import { CONTRACT_ADDRESSES, PAYMENT_SPLITTER_ABI } from "../contracts";

/**
 * Hook to interact with PaymentSplitter contract
 */
export function usePaymentSplitter() {
  const { address, isConnected } = useAccount();

  // Get student balance
  const { data: balance, refetch: refetchBalance } = useReadContract({
    address: CONTRACT_ADDRESSES.PAYMENT_SPLITTER,
    abi: PAYMENT_SPLITTER_ABI,
    functionName: "getStudentBalance",
    args: address ? [address] : undefined,
    query: {
      enabled: isConnected && !!address,
    },
  });

  // Withdraw student balance
  const {
    data: withdrawHash,
    writeContract: withdraw,
    isPending: isWithdrawing,
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash: withdrawHash,
    });

  const withdrawStudent = () => {
    if (!address) return;
    withdraw({
      address: CONTRACT_ADDRESSES.PAYMENT_SPLITTER,
      abi: PAYMENT_SPLITTER_ABI,
      functionName: "withdrawStudent",
    });
  };

  return {
    balance: balance ?? BigInt(0),
    withdrawStudent,
    isWithdrawing: isWithdrawing || isConfirming,
    isConfirmed,
    refetchBalance,
  };
}

