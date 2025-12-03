import {
  ConnectWallet,
  Wallet,
  WalletDropdown,
  WalletDropdownDisconnect,
} from "@coinbase/onchainkit/wallet";
import {
  Address,
  Avatar,
  Name,
  Identity,
  EthBalance,
} from "@coinbase/onchainkit/identity";

export function Navbar() {
  return (
    <nav className="w-full flex justify-between items-center px-6 py-4 glass-panel mb-8 sticky top-0 z-50 backdrop-blur-2xl min-h-[80px]">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 hover:scale-105 transition-all duration-300">
          <span className="text-white font-bold text-2xl">W</span>
        </div>
        <div>
          <h1 className="text-2xl font-bold gradient-text">WorkProof</h1>
          <p className="text-xs text-gray-500">Verifiable Identity</p>
        </div>
      </div>

      <div className="flex justify-end">
        <Wallet>
          <ConnectWallet>
            <Avatar className="h-6 w-6" />
            <Name />
          </ConnectWallet>
          <WalletDropdown>
            <Identity className="px-4 pt-3 pb-2" hasCopyAddressOnClick>
              <Avatar />
              <Name />
              <Address />
              <EthBalance />
            </Identity>
            <WalletDropdownDisconnect />
          </WalletDropdown>
        </Wallet>
      </div>
    </nav>
  );
}
