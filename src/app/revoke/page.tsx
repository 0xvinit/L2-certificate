"use client";
import { useState } from "react";
import { ethers } from "ethers";
import { CERTIFICATE_REGISTRY_ABI, NEXT_PUBLIC_CERT_REGISTRY_ADDRESS } from "../../lib/contract";
import AppShell from "@/components/AppShell";
import WalletConnection from "@/components/WalletConnection";
import { useWallets } from "@privy-io/react-auth";
// @ts-ignore - provided by Alchemy Account Kit at runtime
import { useSendCalls } from "@account-kit/react";
import { RotateCcw, AlertCircle, CheckCircle2, Hash, ExternalLink, Search } from "lucide-react";

export default function RevokePage() {
  const [hash, setHash] = useState("");
  const [txHash, setTxHash] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [certificateData, setCertificateData] = useState<any>(null);
  const { wallets } = useWallets();
  const { sendCallsAsync } = useSendCalls({});

  const fetchCertificateDetails = async (hashValue: string) => {
    try {
      const res = await fetch(`/api/verify?h=${hashValue}`);
      const data = await res.json();
      if (data.certificate) {
        setCertificateData({ hash: hashValue, ...data });
      } else {
        setError("Certificate not found");
        setCertificateData(null);
      }
    } catch (err) {
      setError("Failed to fetch certificate details");
      setCertificateData(null);
    }
  };

  const handleVerifyHash = async () => {
    if (!hash.trim()) return;
    setError("");
    setLoading(true);
    try {
      await fetchCertificateDetails(hash);
    } catch (err: any) {
      setError(err?.message || "Failed to verify certificate");
    } finally {
      setLoading(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTxHash("");
    setError("");
    try {
      if (!NEXT_PUBLIC_CERT_REGISTRY_ADDRESS) throw new Error("Contract address missing");
      const w = wallets[0];
      if (!w) throw new Error("No wallet connected");
      const eth = await w.getEthereumProvider();
      let provider = new ethers.BrowserProvider(eth as any);
      
      // Check network - contract is deployed on Polygon Amoy (chainId: 421614 )
      let network = await provider.getNetwork();
      let chainId = Number(network.chainId);
      
      // Automatically switch to Polygon Amoy if on wrong network
      if (chainId !== 421614 ) {
        setError("Switching to Polygon Amoy network...");
        try {
          // Try to switch network
          await (eth as any).request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: "0x66EEE" }], // 421614  in hex
          });
          // Wait a bit for the switch to complete
          await new Promise(resolve => setTimeout(resolve, 1000));
          // Refresh provider and check again
          provider = new ethers.BrowserProvider(eth as any);
          network = await provider.getNetwork();
          chainId = Number(network.chainId);
          setError(""); // Clear error message after successful switch
        } catch (switchError: any) {
          // If chain doesn't exist in wallet, add it
          if (switchError?.code === 4902 || (switchError?.data && String(switchError.data).includes("Unrecognized chain ID"))) {
            setError("Adding Polygon Amoy network to wallet...");
            await (eth as any).request({
              method: "wallet_addEthereumChain",
              params: [{
                chainId: "0x66EEE",
                chainName: "Arbitrum Sepolia",
                nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
                rpcUrls: ["https://sepolia-rollup.arbitrum.io/rpc"],
                blockExplorerUrls: ["https://sepolia.arbiscan.io"],
              }],
            });
            // Wait for the chain to be added
            await new Promise(resolve => setTimeout(resolve, 1000));
            // Refresh provider
            provider = new ethers.BrowserProvider(eth as any);
            network = await provider.getNetwork();
            chainId = Number(network.chainId);
            setError(""); // Clear error message after successful add
          } else {
            throw new Error(`Failed to switch to Polygon Amoy. Please switch manually to chainId: 421614 `);
          }
        }
        
        // Double-check we're on the right network now
        if (chainId !== 421614 ) {
          throw new Error(`Still on wrong network. Please ensure you're connected to Polygon Amoy (chainId: 421614 )`);
        }
      }
      
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(NEXT_PUBLIC_CERT_REGISTRY_ADDRESS, CERTIFICATE_REGISTRY_ABI, signer);
      
      // Check if contract code exists at this address
      const code = await provider.getCode(NEXT_PUBLIC_CERT_REGISTRY_ADDRESS);
      if (!code || code === "0x") {
        throw new Error(`No contract found at address ${NEXT_PUBLIC_CERT_REGISTRY_ADDRESS} on Polygon Amoy. Please verify:\n1. You are connected to Polygon Amoy network\n2. The contract address is correct\n3. The contract is deployed on Polygon Amoy`);
      }
      
      // Ensure hash is in proper bytes32 format
      const hashBytes32 = hash.startsWith("0x") ? hash : `0x${hash.replace(/^0x/, "")}`;
      if (hashBytes32.length !== 66) {
        throw new Error(`Invalid hash format. Expected bytes32 (66 chars), got ${hashBytes32.length} chars`);
      }
      
      // Create contract interface for encoding transaction data
      const contractInterface = new ethers.Interface(CERTIFICATE_REGISTRY_ABI);
      const txData = contractInterface.encodeFunctionData("revoke", [hashBytes32]);

      // Send via Alchemy Account Kit (gas sponsorship policy configured at provider level)
      const policyId = process.env.NEXT_PUBLIC_ALCHEMY_GAS_POLICY_ID as string | undefined;
      const sendResult = await sendCallsAsync({
        ...(policyId ? { capabilities: { paymasterService: { policyId } } } : {}),
        calls: [
          {
            to: NEXT_PUBLIC_CERT_REGISTRY_ADDRESS,
            data: txData,
          } as any,
        ],
      });
      const opId = Array.isArray((sendResult as any)?.ids) ? (sendResult as any).ids[0] : String(sendResult);
      setTxHash(opId);
      // Fetch certificate details after successful revocation if not already loaded
      if (!certificateData) {
        await fetchCertificateDetails(hash);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to revoke certificate");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell>
      <div className="mb-12">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900">Revoke Certificate</h1>
          <p className="mt-2 text-slate-500">Permanently revoke a certificate on the blockchain</p>
        </div>
      </div>

      {/* Wallet Connection Card */}
      <div className="mb-8 rounded-2xl bg-gradient-to-br from-slate-50 via-white to-slate-50/40 p-6 transition-all duration-300 hover:shadow-lg border border-slate-100/40 backdrop-blur-sm">
        <WalletConnection showOnChainIssuer={true} showSwitchChain={true} />
      </div>

      {/* Revoke Form */}
      <div className="rounded-2xl bg-gradient-to-br from-slate-50 via-white to-slate-50/40 p-8 transition-all duration-300 hover:shadow-lg border border-slate-100/40 backdrop-blur-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="rounded-full bg-red-50 p-2.5">
            <RotateCcw className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Certificate Revocation</h2>
            <p className="text-sm text-slate-500 mt-0.5">Enter the certificate hash to revoke</p>
          </div>
        </div>

        <form onSubmit={submit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Certificate Hash
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  className="w-full h-11 pl-10 rounded-xl border border-slate-200/80 bg-white/50 px-4 font-mono text-sm outline-none transition-all focus:border-red-300 focus:ring-4 focus:ring-red-100/50"
                  placeholder="0x..."
                  value={hash}
                  onChange={(e) => setHash(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              <button
                type="button"
                onClick={handleVerifyHash}
                disabled={loading || !hash.trim()}
                className="h-11 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold transition-all duration-300 hover:shadow-lg hover:shadow-blue-200/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Search className="h-4 w-4" />
                Verify
              </button>
            </div>
          </div>

          {/* Certificate Details Before Revoking */}
          {certificateData?.certificate && !txHash && (
            <div className="rounded-xl border border-amber-200/60 bg-amber-50/40 p-4">
              <div className="flex items-start gap-3 mb-3">
                <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-amber-900">Certificate Found</p>
                  <p className="text-sm text-amber-800 mt-1">Review details below before revoking</p>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {certificateData.certificate.studentName && (
                  <div className="rounded-lg border border-amber-200/60 bg-white/50 p-3">
                    <div className="text-xs font-semibold uppercase tracking-wide text-amber-700 mb-1">Student Name</div>
                    <div className="text-sm font-semibold text-slate-900">{certificateData.certificate.studentName}</div>
                  </div>
                )}
                {certificateData.certificate.studentId && (
                  <div className="rounded-lg border border-amber-200/60 bg-white/50 p-3">
                    <div className="text-xs font-semibold uppercase tracking-wide text-amber-700 mb-1">Student ID</div>
                    <div className="text-sm font-mono text-slate-900">{certificateData.certificate.studentId}</div>
                  </div>
                )}
                {certificateData.certificate.programName && (
                  <div className="rounded-lg border border-amber-200/60 bg-white/50 p-3">
                    <div className="text-xs font-semibold uppercase tracking-wide text-amber-700 mb-1">Program</div>
                    <div className="text-sm font-semibold text-slate-900">
                      {certificateData.certificate.programName}
                      {certificateData.certificate.programCode && (
                        <span className="ml-2 text-xs font-normal text-slate-500">({certificateData.certificate.programCode})</span>
                      )}
                    </div>
                  </div>
                )}
                {certificateData.status === "revoked" && (
                  <div className="rounded-lg border border-red-200/60 bg-red-50/40 p-3">
                    <div className="text-xs font-semibold uppercase tracking-wide text-red-700 mb-1">Status</div>
                    <div className="text-sm font-semibold text-red-900">Already Revoked</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="rounded-xl bg-gradient-to-br from-red-50 to-red-50/40 p-4 border border-red-200/60 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-900">Error</p>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Success Message */}
          {txHash && (
            <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-50/40 p-5 border border-emerald-200/60">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-emerald-900">Certificate Revoked Successfully</p>
                  <div className="mt-3 rounded-lg bg-white/40 p-3">
                    <p className="text-xs text-slate-500 font-medium mb-1">Transaction Hash</p>
                    <div className="flex items-center gap-2">
                      <code className="text-xs text-slate-700 font-mono break-all">{txHash}</code>
                      <a
                        href={`https://amoy.polygonscan.com/tx/${txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-shrink-0"
                      >
                        <ExternalLink className="h-3 w-3 text-blue-600 hover:text-blue-700" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Certificate Details */}
          {certificateData?.certificate && (
            <div className="mt-6 rounded-xl border border-slate-200/60 bg-white/50 p-5">
              <div className="mb-4 flex items-center gap-2">
                <div className="rounded-full bg-red-100 p-2">
                  <RotateCcw className="h-4 w-4 text-red-600" />
                </div>
                <h3 className="text-base font-semibold text-slate-900">Revoked Certificate Details</h3>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 mb-4">
                {certificateData.certificate.studentName && (
                  <div className="rounded-lg border border-slate-200/60 bg-white/50 p-3">
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">Student Name</div>
                    <div className="text-sm font-semibold text-slate-900">{certificateData.certificate.studentName}</div>
                  </div>
                )}
                {certificateData.certificate.studentId && (
                  <div className="rounded-lg border border-slate-200/60 bg-white/50 p-3">
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">Student ID</div>
                    <div className="text-sm font-mono text-slate-900">{certificateData.certificate.studentId}</div>
                  </div>
                )}
                {certificateData.certificate.university && (
                  <div className="rounded-lg border border-slate-200/60 bg-white/50 p-3">
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">University</div>
                    <div className="text-sm font-semibold text-slate-900">{certificateData.certificate.university}</div>
                  </div>
                )}
                {certificateData.certificate.programName && (
                  <div className="rounded-lg border border-slate-200/60 bg-white/50 p-3">
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">Program</div>
                    <div className="text-sm font-semibold text-slate-900">
                      {certificateData.certificate.programName}
                      {certificateData.certificate.programCode && (
                        <span className="ml-2 text-xs font-normal text-slate-500">({certificateData.certificate.programCode})</span>
                      )}
                    </div>
                  </div>
                )}
                {certificateData.certificate.date && (
                  <div className="rounded-lg border border-slate-200/60 bg-white/50 p-3">
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">Issue Date</div>
                    <div className="text-sm font-semibold text-slate-900">{certificateData.certificate.date}</div>
                  </div>
                )}
              </div>

              <div className="rounded-lg border border-slate-200/60 bg-slate-50 p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Hash className="h-3 w-3 text-slate-500" />
                  <div className="text-xs font-semibold text-slate-700">Certificate Hash</div>
                </div>
                <code className="block font-mono text-xs break-all text-slate-900">
                  {hash || certificateData?.hash || "N/A"}
                </code>
                {certificateData.certificate.txHash && (
                  <div className="mt-2 flex items-center gap-2">
                    <ExternalLink className="h-3 w-3 text-slate-500" />
                    <a
                      className="text-xs text-blue-600 hover:text-blue-700 underline font-medium"
                      target="_blank"
                      rel="noopener noreferrer"
                      href={`https://amoy.polygonscan.com/tx/${certificateData.certificate.txHash}`}
                    >
                      View Original Issuance on Polygonscan
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            disabled={loading || !wallets.length || !hash.trim() || certificateData?.status === "revoked"}
            type="submit"
            className="w-full h-11 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold transition-all duration-300 hover:shadow-lg hover:shadow-red-200/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            {certificateData?.status === "revoked" ? "Already Revoked" : loading ? "Revoking..." : "Revoke Certificate"}
          </button>
        </form>
      </div>
    </AppShell>
  );
}


