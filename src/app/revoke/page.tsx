"use client";
import { useState } from "react";
import { ethers } from "ethers";
import { CERTIFICATE_REGISTRY_ABI, CERTIFICATE_REGISTRY_ADDRESS } from "../../lib/contract";
import AppShell from "@/components/AppShell";
import WalletConnection from "@/components/WalletConnection";
import { useWallets } from "@privy-io/react-auth";
import { RotateCcw, AlertCircle, CheckCircle2, Hash, ExternalLink, Search } from "lucide-react";

export default function RevokePage() {
  const [hash, setHash] = useState("");
  const [txHash, setTxHash] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [certificateData, setCertificateData] = useState<any>(null);
  const { wallets } = useWallets();

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


