import { useAccount } from "wagmi";
import { SendTransaction } from "./wagmi/sendTransaction";
import { Balance } from "./wagmi/getBalance";
import { SwitchChain } from "./wagmi/switchNetwork";
import React from "react";

function App() {
  const { address, connector } = useAccount();

  // Console log wallet data when available
  React.useEffect(() => {
    if (address) {
      console.log("=== WALLET DATA ===")
      console.log("Wallet Address:", address)
      console.log("Connector:", connector?.name)
      console.log("=== END WALLET DATA ===")
    }
  }, [address, connector])

  function uiConsole(...args: any[]): void {
    const el = document.querySelector("#console>p");
    if (el) {
      el.innerHTML = JSON.stringify(args || {}, null, 2);
      console.log(...args);
    }
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">UniVerify</h1>
      {address ? (
        <div className="space-y-4">
          <div className="p-4 bg-gray-100 rounded">
            <p>Connected Address: {address}</p>
            <p>Connector: {connector?.name}</p>
          </div>
          <Balance />
          <SendTransaction />
          <SwitchChain />
        </div>
      ) : (
        <p>Please connect your wallet to continue</p>
      )}
    </div>
  );
}

export default App;
