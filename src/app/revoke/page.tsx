"use client";
import { useState } from "react";
import { ethers } from "ethers";
import {
  CERTIFICATE_REGISTRY_ABI,
  CERTIFICATE_REGISTRY_ADDRESS,
} from "../../lib/contract";
import AppShell from "@/components/AppShell";
import WalletConnection from "@/components/WalletConnection";
import { useWallets } from "@privy-io/react-auth";
import {
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  Hash,
  ExternalLink,
  Search,
} from "lucide-react";

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
      if (!CERTIFICATE_REGISTRY_ADDRESS)
        throw new Error("Contract address missing");
      const w = wallets[0];
      if (!w) throw new Error("No wallet connected");
      const eth = await w.getEthereumProvider();
      const provider = new ethers.BrowserProvider(eth as any);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        CERTIFICATE_REGISTRY_ADDRESS,
        CERTIFICATE_REGISTRY_ABI,
        signer
      );
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
      {/* Background linear overlays */}
      <div className="absolute top-[10%] left-[5%] w-[300px] h-[300px] bg-sky-400/20 blur-3xl opacity-100 rounded-full z-0 pointer-events-none" />
      <div className="absolute bottom-[20%] right-[8%] w-[250px] h-[250px] bg-blue-400/25 blur-3xl opacity-100 rounded-full z-0 pointer-events-none" />

      <div className="mb-12 relative z-10">
        <div className="text-center">
          <h1 className="text-4xl lg:text-5xl font-bold tracking-tight text-gray-900 font-cairo uppercase">
            Revoke Certificate
          </h1>
          <p className="mt-4 text-lg text-gray-700 font-poppins max-w-2xl mx-auto">
            Permanently revoke a certificate on the blockchain
          </p>
        </div>
      </div>

      {/* Wallet Connection Card */}
      <div className="mb-8 rounded-3xl bg-white/60 backdrop-blur-xl border-2 border-sky-100 p-6 transition-all duration-500 hover:shadow-2xl hover:shadow-sky-200/30 relative z-10">
        <WalletConnection showOnChainIssuer={true} showSwitchChain={true} />
      </div>

      {/* Revoke Form */}
      <div className="rounded-3xl bg-white/60 backdrop-blur-xl border-2 border-sky-100 p-8 transition-all duration-500 hover:shadow-2xl hover:shadow-sky-200/30 relative z-10">
        <div className="flex items-center gap-4 mb-8">
          <div className="rounded-full bg-linear-to-br from-red-500 to-red-600 p-4 shadow-lg">
            <RotateCcw className="h-7 w-7 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 font-cairo uppercase">
              Certificate Revocation
            </h2>
            <p className="text-base text-gray-700 mt-1 font-poppins">
              Enter the certificate hash to revoke
            </p>
          </div>
        </div>

        <form onSubmit={submit} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 font-cairo uppercase">
              Certificate Hash
            </label>
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Hash className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  className="w-full h-14 pl-12 rounded-xl border-2 border-sky-100 bg-white px-4 font-mono text-base outline-none transition-all focus:border-[#28aeec] focus:ring-4 focus:ring-sky-100/50"
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
                className="h-14 px-6 rounded-xl bg-linear-to-r from-[#28aeec] to-sky-400 text-white font-bold transition-all duration-300 hover:shadow-xl hover:shadow-sky-200/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-poppins uppercase hover:scale-105"
              >
                <Search className="h-5 w-5" />
                Verify
              </button>
            </div>
          </div>

          {/* Certificate Details Before Revoking */}
          {certificateData?.certificate && !txHash && (
            <div className="rounded-2xl border-2 border-amber-200/60 bg-amber-50/40 p-6">
              <div className="flex items-start gap-4 mb-5">
                <div className="rounded-full bg-amber-100 p-2">
                  <AlertCircle className="h-6 w-6 text-amber-600 shrink-0" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-amber-900 font-cairo text-lg uppercase">
                    Certificate Found
                  </p>
                  <p className="text-base text-amber-800 mt-2 font-poppins">
                    Review details below before revoking
                  </p>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {certificateData.certificate.studentName && (
                  <div className="rounded-xl border-2 border-amber-200/60 bg-white/60 p-4">
                    <div className="text-sm font-bold uppercase tracking-wide text-amber-700 mb-2 font-cairo">
                      Student Name
                    </div>
                    <div className="text-base font-semibold text-gray-900 font-poppins">
                      {certificateData.certificate.studentName}
                    </div>
                  </div>
                )}
                {certificateData.certificate.studentId && (
                  <div className="rounded-xl border-2 border-amber-200/60 bg-white/60 p-4">
                    <div className="text-sm font-bold uppercase tracking-wide text-amber-700 mb-2 font-cairo">
                      Student ID
                    </div>
                    <div className="text-base font-mono text-gray-900">
                      {certificateData.certificate.studentId}
                    </div>
                  </div>
                )}
                {certificateData.certificate.programName && (
                  <div className="rounded-xl border-2 border-amber-200/60 bg-white/60 p-4">
                    <div className="text-sm font-bold uppercase tracking-wide text-amber-700 mb-2 font-cairo">
                      Program
                    </div>
                    <div className="text-base font-semibold text-gray-900 font-poppins">
                      {certificateData.certificate.programName}
                      {certificateData.certificate.programCode && (
                        <span className="ml-2 text-sm font-normal text-gray-600">
                          ({certificateData.certificate.programCode})
                        </span>
                      )}
                    </div>
                  </div>
                )}
                {certificateData.status === "revoked" && (
                  <div className="rounded-xl border-2 border-red-200/60 bg-red-50/40 p-4">
                    <div className="text-sm font-bold uppercase tracking-wide text-red-700 mb-2 font-cairo">
                      Status
                    </div>
                    <div className="text-base font-semibold text-red-900 font-poppins">
                      Already Revoked
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="rounded-2xl bg-linear-to-br from-red-50 to-red-50/40 p-6 border-2 border-red-200/60 flex items-start gap-4">
              <div className="rounded-full bg-red-100 p-2">
                <AlertCircle className="h-6 w-6 text-red-600 shrink-0" />
              </div>
              <div>
                <p className="font-bold text-red-900 font-cairo text-lg uppercase">
                  Error
                </p>
                <p className="text-base text-red-700 mt-2 font-poppins">
                  {error}
                </p>
              </div>
            </div>
          )}

          {/* Success Message */}
          {txHash && (
            <div className="rounded-2xl bg-linear-to-br from-emerald-50 to-emerald-50/40 p-6 border-2 border-emerald-200/60">
              <div className="flex items-start gap-4">
                <div className="rounded-full bg-emerald-100 p-2">
                  <CheckCircle2 className="h-7 w-7 text-emerald-600 shrink-0" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-emerald-900 font-cairo text-xl uppercase">
                    Certificate Revoked Successfully
                  </p>
                  <div className="mt-5 rounded-xl bg-white/60 border-2 border-emerald-100 p-4">
                    <p className="text-sm text-gray-600 font-cairo font-bold uppercase mb-2">
                      Transaction Hash
                    </p>
                    <div className="flex items-center gap-3">
                      <code className="text-sm text-gray-900 font-mono break-all flex-1">
                        {txHash}
                      </code>
                      <a
                        href={`https://amoy.polygonscan.com/tx/${txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0"
                      >
                        <ExternalLink className="h-5 w-5 text-[#28aeec] hover:text-sky-600" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Certificate Details */}
          {certificateData?.certificate && (
            <div className="mt-6 rounded-2xl border-2 border-sky-100 bg-white/70 backdrop-blur-sm p-6">
              <div className="mb-6 flex items-center gap-3">
                <div className="rounded-full bg-red-100 p-3">
                  <RotateCcw className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 font-cairo uppercase">
                  Revoked Certificate Details
                </h3>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 mb-5">
                {certificateData.certificate.studentName && (
                  <div className="rounded-xl border-2 border-sky-100 bg-white/70 p-4">
                    <div className="text-sm font-bold uppercase tracking-wide text-gray-600 mb-2 font-cairo">
                      Student Name
                    </div>
                    <div className="text-base font-semibold text-gray-900 font-poppins">
                      {certificateData.certificate.studentName}
                    </div>
                  </div>
                )}
                {certificateData.certificate.studentId && (
                  <div className="rounded-xl border-2 border-sky-100 bg-white/70 p-4">
                    <div className="text-sm font-bold uppercase tracking-wide text-gray-600 mb-2 font-cairo">
                      Student ID
                    </div>
                    <div className="text-base font-mono text-gray-900">
                      {certificateData.certificate.studentId}
                    </div>
                  </div>
                )}
                {certificateData.certificate.university && (
                  <div className="rounded-xl border-2 border-sky-100 bg-white/70 p-4">
                    <div className="text-sm font-bold uppercase tracking-wide text-gray-600 mb-2 font-cairo">
                      University
                    </div>
                    <div className="text-base font-semibold text-gray-900 font-poppins">
                      {certificateData.certificate.university}
                    </div>
                  </div>
                )}
                {certificateData.certificate.programName && (
                  <div className="rounded-xl border-2 border-sky-100 bg-white/70 p-4">
                    <div className="text-sm font-bold uppercase tracking-wide text-gray-600 mb-2 font-cairo">
                      Program
                    </div>
                    <div className="text-base font-semibold text-gray-900 font-poppins">
                      {certificateData.certificate.programName}
                      {certificateData.certificate.programCode && (
                        <span className="ml-2 text-sm font-normal text-gray-600">
                          ({certificateData.certificate.programCode})
                        </span>
                      )}
                    </div>
                  </div>
                )}
                {certificateData.certificate.date && (
                  <div className="rounded-xl border-2 border-sky-100 bg-white/70 p-4">
                    <div className="text-sm font-bold uppercase tracking-wide text-gray-600 mb-2 font-cairo">
                      Issue Date
                    </div>
                    <div className="text-base font-semibold text-gray-900 font-poppins">
                      {certificateData.certificate.date}
                    </div>
                  </div>
                )}
              </div>

              <div className="rounded-xl border-2 border-sky-100 bg-linear-to-br from-sky-50/50 to-white p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="rounded-full bg-sky-100 p-2">
                    <Hash className="h-5 w-5 text-[#28aeec]" />
                  </div>
                  <div className="text-base font-bold text-gray-900 font-cairo uppercase">
                    Certificate Hash
                  </div>
                </div>
                <code className="block font-mono text-sm break-all text-gray-900">
                  {hash || certificateData?.hash || "N/A"}
                </code>
                {certificateData.certificate.txHash && (
                  <div className="mt-4 flex items-center gap-2">
                    <ExternalLink className="h-4 w-4 text-[#28aeec]" />
                    <a
                      className="text-sm text-[#28aeec] hover:text-sky-600 underline font-semibold font-poppins"
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
            disabled={
              loading ||
              !wallets.length ||
              !hash.trim() ||
              certificateData?.status === "revoked"
            }
            type="submit"
            className="w-full h-14 rounded-xl bg-linear-to-r from-red-600 to-red-700 text-white font-bold transition-all duration-300 hover:shadow-xl hover:shadow-red-200/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-poppins text-lg uppercase hover:scale-105"
          >
            <RotateCcw className="h-6 w-6" />
            {certificateData?.status === "revoked"
              ? "Already Revoked"
              : loading
              ? "Revoking..."
              : "Revoke Certificate"}
          </button>
        </form>
      </div>
    </AppShell>
  );
}
