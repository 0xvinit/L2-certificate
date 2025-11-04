"use client";
import { useState } from "react";
import { ethers } from "ethers";
import { CERTIFICATE_REGISTRY_ABI, CERTIFICATE_REGISTRY_ADDRESS } from "../../lib/contract";
import { usePrivy, useWallets } from "@privy-io/react-auth";

export default function RevokePage() {
  const [hash, setHash] = useState("");
  const [account, setAccount] = useState<string>("");
  const { login, logout, authenticated } = usePrivy();
  const { wallets } = useWallets();
  const [txHash, setTxHash] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [chainId, setChainId] = useState<number | null>(null);

  const connect = async () => {
    await login();
    setTimeout(async () => {
      const w = wallets[0];
      if (w) {
        const eth = await w.getEthereumProvider();
        const provider = new ethers.BrowserProvider(eth as any);
        const signer = await provider.getSigner();
        setAccount(await signer.getAddress());
        const net = await provider.getNetwork();
        setChainId(Number(net.chainId));
      }
    }, 0);
  };

  const switchToAmoy = async () => {
    const w = wallets[0];
    if (!w) return;
    const eth = await w.getEthereumProvider();
    try {
      await (eth as any).request({ method: "wallet_switchEthereumChain", params: [{ chainId: "0x13882" }] });
    } catch (err: any) {
      if (err?.code === 4902 || (err?.data && String(err.data).includes("Unrecognized chain ID"))) {
        await (eth as any).request({
          method: "wallet_addEthereumChain",
          params: [{
            chainId: "0x13882",
            chainName: "Polygon Amoy",
            nativeCurrency: { name: "POL", symbol: "POL", decimals: 18 },
            rpcUrls: ["https://rpc-amoy.polygon.technology"],
            blockExplorerUrls: ["https://amoy.polygonscan.com"],
          }],
        });
      } else {
        throw err;
      }
    }
    const provider = new ethers.BrowserProvider(eth as any);
    const net = await provider.getNetwork();
    setChainId(Number(net.chainId));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTxHash("");
    try {
      if (!CERTIFICATE_REGISTRY_ADDRESS) throw new Error("Contract address missing");
      const w = wallets[0];
      if (!w) throw new Error("No wallet connected");
      const eth = await w.getEthereumProvider();
      const provider = new ethers.BrowserProvider(eth as any);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CERTIFICATE_REGISTRY_ADDRESS, CERTIFICATE_REGISTRY_ABI, signer);
      const tx = await contract.revoke(hash);
      const receipt = await tx.wait();
      setTxHash(receipt?.hash || "");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 640, margin: "24px auto", padding: 16 }}>
      <h1>Revoke Certificate</h1>
      <div style={{ marginBottom: 12 }}>
        {authenticated ? (
          <button type="button" onClick={logout}>Logout</button>
        ) : (
          <button type="button" onClick={connect}>Login / Connect Wallet</button>
        )}
        {account && <div>Connected: {account.slice(0,6)}...{account.slice(-4)}</div>}
        {chainId && <div>ChainId: {chainId}</div>}
        {chainId !== null && chainId !== 80002 && (
          <div style={{ marginTop: 8 }}>
            <button type="button" onClick={switchToAmoy}>Switch to Polygon Amoy</button>
          </div>
        )}
      </div>
      <form onSubmit={submit} style={{ display: "grid", gap: 12 }}>
        <input placeholder="Hash (0x...)" value={hash} onChange={(e) => setHash(e.target.value)} required />
        <button disabled={loading || !account} type="submit">{loading ? "Revoking..." : "Revoke"}</button>
      </form>
      {txHash && (
        <div style={{ marginTop: 16 }}>
          <b>Tx:</b> {txHash}
        </div>
      )}
    </div>
  );
}


