"use client";

import { Wallet } from "@coinbase/onchainkit/wallet";
import { SkillPetDisplay } from "../components/SkillPetDisplay";
import { SkillTree } from "../components/SkillTree";
import { AttestationList } from "../components/AttestationList";
import { usePaymentSplitter } from "../lib/hooks/usePaymentSplitter";
import { formatUnits } from "viem";

export default function DashboardPage() {
  const { balance, withdrawStudent, isWithdrawing, isConfirmed, refetchBalance } =
    usePaymentSplitter();

  const usdcBalance = formatUnits(balance, 6); // USDC has 6 decimals

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Credibles Dashboard</h1>
            <Wallet />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Payment Balance Section */}
        {Number(balance) > 0 && (
          <div className="mb-8 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-green-800 font-medium">
                  Earnings Available
                </p>
                <p className="text-2xl font-bold text-green-900">
                  {Number(usdcBalance).toFixed(2)} USDC
                </p>
              </div>
              <button
                onClick={() => {
                  withdrawStudent();
                  setTimeout(() => refetchBalance(), 3000);
                }}
                disabled={isWithdrawing}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isWithdrawing
                  ? "Withdrawing..."
                  : isConfirmed
                  ? "Withdrawn!"
                  : "Withdraw"}
              </button>
            </div>
          </div>
        )}

        {/* SkillPet Display */}
        <section className="mb-12">
          <SkillPetDisplay />
        </section>

        {/* Skill Tree */}
        <section className="mb-12">
          <SkillTree />
        </section>

        {/* Attestations */}
        <section className="mb-12">
          <AttestationList />
        </section>

        {/* Quick Actions */}
        <section className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition text-left">
              <h3 className="font-semibold mb-1">Verify University</h3>
              <p className="text-sm opacity-90">
                Verify your .edu email with ZK Email
              </p>
            </button>
            <button className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition text-left">
              <h3 className="font-semibold mb-1">Complete Course</h3>
              <p className="text-sm opacity-90">
                Complete a course to earn attestations
              </p>
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}

