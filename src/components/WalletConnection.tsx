"use client";
import { useEffect, useState, useRef } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { ethers } from "ethers";
import {
  CERTIFICATE_REGISTRY_ABI,
  CERTIFICATE_REGISTRY_ADDRESS,
} from "../lib/contract";

interface WalletConnectionProps {
  showOnChainIssuer?: boolean;
  showSwitchChain?: boolean;
}

export default function WalletConnection({
  showOnChainIssuer = false,
  showSwitchChain = false,
}: WalletConnectionProps = {}) {
  const { login, logout, authenticated, ready } = usePrivy();
  const { wallets } = useWallets();
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [chainId, setChainId] = useState<number | null>(null);
  const [onchainIssuer, setOnchainIssuer] = useState<string>("");
  const [isPrivyWallet, setIsPrivyWallet] = useState<boolean>(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const savedRef = useRef<string>(""); // Track which wallet address we've saved

  const switchToAmoy = async () => {
    const w = wallets[0];
    if (!w) return;
    const eth = await w.getEthereumProvider();
    try {
      await (eth as any).request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x13882" }], // 80002
      });
    } catch (switchError: any) {
      if (
        switchError?.code === 4902 ||
        (switchError?.data &&
          String(switchError.data).includes("Unrecognized chain ID"))
      ) {
        await (eth as any).request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: "0x13882",
              chainName: "Polygon Amoy",
              nativeCurrency: { name: "POL", symbol: "POL", decimals: 18 },
              rpcUrls: ["https://rpc-amoy.polygon.technology"],
              blockExplorerUrls: ["https://amoy.polygonscan.com"],
            },
          ],
        });
      }
    }
    const provider = new ethers.BrowserProvider(eth as any);
    const net = await provider.getNetwork();
    setChainId(Number(net.chainId));
  };

  useEffect(() => {
    (async () => {
      if (!ready) {
        setLoading(true);
        return;
      }

      setLoading(false);

      if (authenticated && wallets.length > 0) {
        const w = wallets[0];
        const addr = w.address;
        setWalletAddress(addr);
        // Detect wallet type; only treat as Privy embedded if client reports so
        const clientType =
          (w as any)?.walletClientType || (w as any)?.type || "";
        setIsPrivyWallet(String(clientType).toLowerCase() === "privy");

        try {
          const eth = await w.getEthereumProvider();
          const provider = new ethers.BrowserProvider(eth as any);
          const network = await provider.getNetwork();
          const chain = Number(network.chainId);
          setChainId(chain);

          // Get on-chain issuer if needed
          if (
            showOnChainIssuer &&
            CERTIFICATE_REGISTRY_ADDRESS &&
            String(clientType).toLowerCase() === "privy"
          ) {
            try {
              const contractRO = new ethers.Contract(
                CERTIFICATE_REGISTRY_ADDRESS,
                CERTIFICATE_REGISTRY_ABI,
                provider
              );
              const iss: string = await contractRO.issuer();
              setOnchainIssuer(iss);
            } catch {}
          } else {
            setOnchainIssuer("");
          }

          // Auto-save wallet connection (only if not already saved for this address)
          if (savedRef.current !== addr && !saving) {
            setSaving(true);
            try {
              await fetch("/api/admin/wallet", {
                method: "POST",
                headers: { "content-type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                  walletAddress: addr,
                  chainId: chain,
                  walletType: "privy",
                }),
              });
              savedRef.current = addr;
              setSaved(true);
              setTimeout(() => setSaved(false), 3000);
            } catch {}
            setSaving(false);
          }
        } catch (err) {
          console.error("Error loading wallet:", err);
        }
      } else if (authenticated && wallets.length === 0) {
        // Authenticated but no wallet yet - wait a bit for wallets to load
        setTimeout(() => {
          if (wallets.length === 0) {
            setWalletAddress("");
            setChainId(null);
            setOnchainIssuer("");
          }
        }, 1000);
      } else if (!authenticated) {
        // Reset when not authenticated
        savedRef.current = "";
        setWalletAddress("");
        setChainId(null);
        setOnchainIssuer("");
      }
    })();
  }, [authenticated, wallets, ready, saving, showOnChainIssuer]);

  const handleConnect = async () => {
    await login();
  };

  if (!ready) {
    return (
      <div className="p-6 bg-linear-to-br from-sky-50 to-sky-100/60 rounded-2xl border-2 border-sky-200">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-sky-100 p-3 animate-pulse">
            <svg
              className="w-6 h-6 text-[#28aeec]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 font-cairo uppercase">
              Loading Wallet...
            </h3>
            <p className="text-sm text-gray-700 mt-1 font-poppins">
              Checking wallet connection status
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main Wallet Connection Card */}
      {/* {!authenticated ? (
        <div className="rounded-2xl bg-linear-to-br from-sky-50 to-sky-100/60 border-2 border-sky-200 p-6">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="rounded-full bg-linear-to-br from-[#28aeec] to-sky-400 p-4 shadow-lg">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h3 className="text-xl font-bold text-gray-900 font-cairo uppercase">
                Connect Your Wallet
              </h3>
              <p className="text-sm text-gray-700 mt-1 font-poppins">
                Connect your wallet to access admin features
              </p>
            </div>
            <button
              onClick={handleConnect}
              className="px-6 py-3 rounded-xl bg-linear-to-r from-[#28aeec] to-sky-400 text-white font-bold transition-all duration-300 hover:shadow-xl hover:shadow-sky-200/50 font-poppins text-base uppercase hover:scale-105"
            >
              Connect Wallet
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl bg-linear-to-br from-emerald-50 to-emerald-100/60 border-2 border-emerald-200 p-6">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="rounded-full bg-linear-to-br from-emerald-400 to-emerald-500 p-4 shadow-lg">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h3 className="text-xl font-bold text-emerald-900 font-cairo uppercase">
                Wallet Connected
              </h3>
              <div className="flex items-center gap-2 mt-2 justify-center sm:justify-start">
                <code className="text-sm font-mono text-emerald-800 bg-white/60 px-3 py-1.5 rounded-lg">
                  {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                </code>
                {chainId && (
                  <span className="text-xs font-semibold text-emerald-700 bg-white/60 px-3 py-1.5 rounded-lg font-poppins">
                    Chain: {chainId}
                  </span>
                )}
              </div>
              {saved && (
                <p className="text-xs text-emerald-700 mt-2 font-poppins">
                  ✓ Connection saved
                </p>
              )}
            </div>
            <button
              onClick={logout}
              className="px-6 py-3 rounded-xl bg-linear-to-r from-red-500 to-red-600 text-white font-bold transition-all duration-300 hover:shadow-xl hover:shadow-red-200/50 font-poppins text-base uppercase hover:scale-105"
            >
              Disconnect
            </button>
          </div>
        </div>
      )} */}

      {/* Additional Features */}
      {(showOnChainIssuer || showSwitchChain) && (
        <div className="space-y-4">
          {showOnChainIssuer && onchainIssuer && (
            <div className="rounded-2xl bg-linear-to-br from-sky-50 to-sky-100/60 border-2 border-sky-200 p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-sky-100 p-2">
                  <svg
                    className="w-5 h-5 text-[#28aeec]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-gray-700 font-cairo uppercase">
                    On-chain Issuer
                  </p>
                  <code className="text-base font-mono text-gray-900 mt-1 block">
                    {onchainIssuer.slice(0, 8)}...{onchainIssuer.slice(-6)}
                  </code>
                </div>
              </div>
            </div>
          )}

          {showSwitchChain && chainId !== null && chainId !== 80002 && (
            <div className="rounded-2xl bg-linear-to-br from-amber-50 to-amber-100/60 border-2 border-amber-200 p-5">
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-amber-100 p-2">
                  <svg
                    className="w-6 h-6 text-amber-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-base font-bold text-amber-900 font-cairo uppercase mb-2">
                    Wrong Network
                  </p>
                  <p className="text-sm text-amber-800 font-poppins mb-3">
                    Please switch to Polygon Amoy network to continue
                  </p>
                  <button
                    onClick={switchToAmoy}
                    className="px-6 py-2.5 rounded-xl bg-linear-to-r from-[#28aeec] to-sky-400 text-white font-bold transition-all duration-300 hover:shadow-lg hover:shadow-sky-200/50 font-poppins text-sm uppercase hover:scale-105"
                  >
                    Switch to Polygon Amoy
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* {showSwitchChain && chainId === 80002 && (
            <div className="rounded-2xl bg-linear-to-br from-emerald-50 to-emerald-100/60 border-2 border-emerald-200 p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-emerald-100 p-2">
                  <svg
                    className="w-6 h-6 text-emerald-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-base font-bold text-emerald-900 font-cairo uppercase">
                    Connected to Polygon Amoy
                  </p>
                  <p className="text-sm text-emerald-800 font-poppins mt-1">
                    Chain ID: {chainId}
                  </p>
                </div>
              </div>
            </div>
          )} */}
        </div>
      )}
    </div>
  );
}
