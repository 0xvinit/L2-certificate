"use client";
import { useEffect, useState, useRef } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { ethers } from "ethers";
import { CERTIFICATE_REGISTRY_ABI, CERTIFICATE_REGISTRY_ADDRESS } from "../lib/contract";

interface WalletConnectionProps {
  showOnChainIssuer?: boolean;
  showSwitchChain?: boolean;
}

export default function WalletConnection({ showOnChainIssuer = false, showSwitchChain = false }: WalletConnectionProps = {}) {
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
      if (switchError?.code === 4902 || (switchError?.data && String(switchError.data).includes("Unrecognized chain ID"))) {
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
        const clientType = (w as any)?.walletClientType || (w as any)?.type || "";
        setIsPrivyWallet(String(clientType).toLowerCase() === "privy");
        
        try {
          const eth = await w.getEthereumProvider();
          const provider = new ethers.BrowserProvider(eth as any);
          const network = await provider.getNetwork();
          const chain = Number(network.chainId);
          setChainId(chain);
          
          // Get on-chain issuer if needed
          if (showOnChainIssuer && CERTIFICATE_REGISTRY_ADDRESS && (String(clientType).toLowerCase() === "privy")) {
            try {
              const contractRO = new ethers.Contract(CERTIFICATE_REGISTRY_ADDRESS, CERTIFICATE_REGISTRY_ABI, provider);
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
                  walletType: "privy"
                })
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
      <div style={{ 
        padding: "16px", 
        background: "linear-gradient(135deg, #e2e8f0 0%, #cbd5e0 100%)",
        borderRadius: "12px",
        color: "#1a202c",
        marginBottom: "20px"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 600 }}>Loading Wallet...</h3>
            <p style={{ margin: "8px 0 0 0", fontSize: "14px", opacity: 0.8 }}>
              Checking wallet connection status
            </p>
          </div>
        </div>
      </div>
    );
  }


  return (
    <div style={{
    }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {/* <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 600 }}>Wallet Connected</h3>
            <p style={{ margin: "8px 0 0 0", fontSize: "14px", opacity: 0.9 }}>
              {walletAddress ? (
                <>
                  {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                  {chainId && <span style={{ marginLeft: "8px" }}>• Chain: {chainId}</span>}
                </>
              ) : (
                "Loading wallet..."
              )}
            </p>
            {saved && <p style={{ margin: "4px 0 0 0", fontSize: "12px" }}>✓ Wallet saved</p>}
          </div>
          <button
            onClick={logout}
            style={{
              padding: "8px 16px",
              background: "rgba(255,255,255,0.2)",
              color: "white",
              border: "1px solid rgba(255,255,255,0.3)",
              borderRadius: "8px",
              fontWeight: 500,
              cursor: "pointer",
              fontSize: "14px"
            }}
          >
            Disconnect
          </button>
        </div> */}
        
        {(showOnChainIssuer || showSwitchChain) && (
          <div style={{
            padding: "12px",
            background: "rgba(255,255,255,0.15)",
            borderRadius: "8px",
            fontSize: "13px"
          }}>
            {showOnChainIssuer && onchainIssuer && (
              <div style={{ marginBottom: showSwitchChain && chainId !== 80002 ? "8px" : "0" }}>
                <strong>On-chain Issuer:</strong> {onchainIssuer.slice(0, 6)}...{onchainIssuer.slice(-4)}
              </div>
            )}
            {showSwitchChain && chainId !== null && chainId !== 80002 && (
              <button
                onClick={switchToAmoy}
                style={{
                  padding: "6px 12px",
                  background: "rgba(255,255,255,0.3)",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "12px",
                  fontWeight: 600
                }}
              >
                Switch to Polygon Amoy
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

