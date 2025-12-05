"use client";

import { useSkillPet } from "../lib/hooks/useSkillPet";
import Image from "next/image";

export function SkillPetDisplay() {
  const { tokenId, level, stats, tokenURI, exists, isLoading } = useSkillPet();

  if (isLoading) {
    return (
      <div className="w-full max-w-md mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-6 animate-pulse">
          <div className="h-64 bg-gray-200 rounded-lg mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
        </div>
      </div>
    );
  }

  if (!exists) {
    return (
      <div className="w-full max-w-md mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-6 text-center">
          <div className="h-64 bg-gray-100 rounded-lg mb-4 flex items-center justify-center">
            <span className="text-gray-400 text-4xl">🥚</span>
          </div>
          <h3 className="text-xl font-bold mb-2">No SkillPet Yet</h3>
          <p className="text-gray-600 mb-4">
            Mint your SkillPet NFT to start your journey!
          </p>
          <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition">
            Mint SkillPet
          </button>
        </div>
      </div>
    );
  }

  const totalXP =
    stats &&
    Number(stats.dev) + Number(stats.defi) + Number(stats.gov) + Number(stats.social);

  return (
    <div className="w-full max-w-md mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="relative h-64 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
          {tokenURI ? (
            <Image
              src={tokenURI}
              alt="SkillPet"
              fill
              className="object-contain"
              unoptimized
            />
          ) : (
            <span className="text-6xl">
              {level && Number(level) >= 5 ? "🐉" : level && Number(level) >= 3 ? "🐲" : "🥚"}
            </span>
          )}
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold">SkillPet #{tokenId}</h3>
            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
              Level {level ? Number(level) : 1}
            </span>
          </div>
          
          <div className="pt-4 border-t">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Dev XP</span>
                <p className="font-semibold text-blue-600">
                  {stats ? Number(stats.dev) : 0}
                </p>
              </div>
              <div>
                <span className="text-gray-600">DeFi XP</span>
                <p className="font-semibold text-green-600">
                  {stats ? Number(stats.defi) : 0}
                </p>
              </div>
              <div>
                <span className="text-gray-600">Gov XP</span>
                <p className="font-semibold text-purple-600">
                  {stats ? Number(stats.gov) : 0}
                </p>
              </div>
              <div>
                <span className="text-gray-600">Social XP</span>
                <p className="font-semibold text-pink-600">
                  {stats ? Number(stats.social) : 0}
                </p>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t">
              <div className="flex justify-between">
                <span className="text-gray-600">Total XP</span>
                <span className="font-bold text-lg">{totalXP || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

