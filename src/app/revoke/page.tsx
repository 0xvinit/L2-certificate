"use client";
import { useState } from "react";
import { ethers } from "ethers";
import { CERTIFICATE_REGISTRY_ABI, CERTIFICATE_REGISTRY_ADDRESS } from "../../lib/contract";
import AppShell from "@/components/AppShell";
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
    <AppShell>
    <div className="max-w-xl py-2">
      <div className="card p-6">
        <h1 className="text-xl font-semibold">Revoke Certificate</h1>
        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
          {account && <div className="text-muted-foreground">Connected: {account.slice(0,6)}...{account.slice(-4)}</div>}
          {chainId && <div className="text-muted-foreground">ChainId: {chainId}</div>}
          {chainId !== null && chainId !== 80002 && (
            <button type="button" onClick={switchToAmoy} className="btn btn-ghost h-9 px-4">Switch to Polygon Amoy</button>
          )}
        </div>
        <form onSubmit={submit} className="mt-6 grid gap-3">
          <input
            className="h-11 rounded-lg border border-border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-color-ring font-mono"
            placeholder="Hash (0x...)"
            value={hash}
            onChange={(e) => setHash(e.target.value)}
            required
          />
          <button disabled={loading || !account} type="submit" className="btn btn-primary h-11">
            {loading ? "Revoking..." : "Revoke"}
          </button>
        </form>
        {txHash && (
          <div className="mt-4 text-sm">
            <b>Tx:</b> <span className="font-mono">{txHash}</span>
          </div>
        )}
      </div>
    </div>
    </AppShell>
  );
}


