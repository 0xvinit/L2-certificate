"use client";
import { useEffect, useState } from "react";
import { sha256HexBytes } from "../../lib/sha256";
import AppShell from "@/components/AppShell";
import { CheckCircle2, AlertCircle, XCircle, FileText, Search, Upload, Hash, ExternalLink } from "lucide-react";

export default function VerifyPage() {
  const [hash, setHash] = useState<string | null>(null);
  const [hashInput, setHashInput] = useState("");
  const [data, setData] = useState<any>(null);
  const [fileResult, setFileResult] = useState<any>(null);
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    const urlObj = new URL(window.location.href);
    const h = urlObj.searchParams.get("h");
    if (h) {
      setHash(h);
      verifyHash(h);
    }
  }, []);

  const verifyHash = async (h: string) => {
    setLoading(true);
    setData(null);
    try {
      const res = await fetch(`/api/verify?h=${h}`);
      const d = await res.json();
      setData({ hash: h, ...d });
    } catch (err: any) {
      setData({ error: err?.message || "Failed to verify" });
    } finally {
      setLoading(false);
    }
  };

  const ipfsToHttp = (u: string) => {
    if (u.startsWith("ipfs://")) {
      const cid = u.replace("ipfs://", "");
      const gateway = process.env.NEXT_PUBLIC_IPFS_GATEWAY || "https://ipfs.io/ipfs/";
      return `${gateway}${cid}`;
    }
    return u;
  };

  const extractEmbeddedHash = (bytes: ArrayBuffer): string | null => {
    try {
      const text = new TextDecoder("latin1").decode(new Uint8Array(bytes));
      const m = text.match(/verify\?h=(0x[0-9a-fA-F]{64})/);
      return m ? m[1] : null;
    } catch {
      return null;
    }
  };

  const verifyFromBytes = async (bytes: ArrayBuffer) => {
    setVerifying(true);
    try {
      const h = await sha256HexBytes(bytes);
      setHash(h);
      await verifyHash(h);
      // If not found, try to read the embedded verify URL hash (from QR caption)
      // Wait a tick for data to update
      await new Promise((r) => setTimeout(r, 100));
      if (!data || data?.status === "not_found") {
        const embedded = extractEmbeddedHash(bytes);
        if (embedded && embedded !== h) {
          setHash(embedded);
          await verifyHash(embedded);
        }
      }
      setFileResult({ hash: h });
    } catch (err: any) {
      setFileResult({ error: String(err) });
    } finally {
      setVerifying(false);
    }
  };

  const onVerifyHash = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hashInput.trim()) return;
    setHash(hashInput.trim());
    await verifyHash(hashInput.trim());
  };

  const onVerifyUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    setVerifying(true);
    try {
      const target = ipfsToHttp(url.trim());
      const resp = await fetch(target);
      const arr = await resp.arrayBuffer();
      await verifyFromBytes(arr);
    } catch (err: any) {
      setFileResult({ error: String(err) || "Failed to fetch PDF" });
    } finally {
      setVerifying(false);
    }
  };

  const onVerifyFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setVerifying(true);
    try {
      const arr = await file.arrayBuffer();
      await verifyFromBytes(arr);
    } catch (err: any) {
      setFileResult({ error: String(err) || "Failed to process PDF" });
    } finally {
      setVerifying(false);
    }
  };

  const getStatusDisplay = (status: string) => {
    if (status === "verified") {
      return {
        icon: CheckCircle2,
        text: "Certificate Verified",
        color: "emerald",
        desc: "This certificate is valid and verified on the blockchain",
      };
    } else if (status === "revoked") {
      return {
        icon: XCircle,
        text: "Certificate Revoked",
        color: "red",
        desc: "This certificate has been revoked and is no longer valid",
      };
    } else {
      return {
        icon: AlertCircle,
        text: "Certificate Not Found",
        color: "amber",
        desc: "Certificate not found on the blockchain",
      };
    }
  };

  const statusInfo = data?.status ? getStatusDisplay(data.status) : null;

  return (
    <AppShell>
      {/* Background gradient overlays */}
      <div className="absolute top-[10%] left-[5%] w-[300px] h-[300px] bg-sky-400/20 blur-3xl opacity-100 rounded-full z-0 pointer-events-none" />
      <div className="absolute bottom-[20%] right-[8%] w-[250px] h-[250px] bg-blue-400/25 blur-3xl opacity-100 rounded-full z-0 pointer-events-none" />

      <div className="mb-12 relative z-10">
        <div className="text-center">
          <h1 className="text-4xl lg:text-5xl font-bold tracking-tight text-gray-900 font-cairo uppercase">
            Verify Certificate
          </h1>
          <p className="mt-4 text-lg text-gray-700 font-poppins max-w-2xl mx-auto">
            Enter a hash, upload a PDF, or provide a URL to verify your blockchain certificate
          </p>
        </div>
      </div>

      {/* Verification Result Card */}
      {(data || fileResult) && (
        <div className="mb-8 rounded-3xl bg-white/60 backdrop-blur-xl border-2 border-sky-100 p-8 transition-all duration-500 hover:shadow-2xl hover:shadow-sky-200/30 relative z-10">
          {statusInfo && (
            <div className={`mb-6 rounded-2xl p-6 border-2 flex items-start gap-4 ${
              statusInfo.color === "emerald"
                ? "bg-gradient-to-br from-emerald-50 to-emerald-50/40 border-emerald-200/60"
                : statusInfo.color === "red"
                ? "bg-gradient-to-br from-red-50 to-red-50/40 border-red-200/60"
                : "bg-gradient-to-br from-amber-50 to-amber-50/40 border-amber-200/60"
            }`}>
              <div className={`rounded-full p-3 flex-shrink-0 ${
                statusInfo.color === "emerald"
                  ? "bg-emerald-100"
                  : statusInfo.color === "red"
                  ? "bg-red-100"
                  : "bg-amber-100"
              }`}>
                <statusInfo.icon className={`h-7 w-7 ${
                  statusInfo.color === "emerald"
                    ? "text-emerald-600"
                    : statusInfo.color === "red"
                    ? "text-red-600"
                    : "text-amber-600"
                }`} />
              </div>
              <div className="flex-1">
                <h3 className={`text-xl font-bold font-cairo uppercase ${
                  statusInfo.color === "emerald"
                    ? "text-emerald-900"
                    : statusInfo.color === "red"
                    ? "text-red-900"
                    : "text-amber-900"
                }`}>{statusInfo.text}</h3>
                <p className={`mt-2 text-base font-poppins ${
                  statusInfo.color === "emerald"
                    ? "text-emerald-800"
                    : statusInfo.color === "red"
                    ? "text-red-800"
                    : "text-amber-800"
                }`}>{statusInfo.desc}</p>
              </div>
            </div>
          )}

          {data?.certificate && (
            <div className="mb-6 grid gap-4 sm:grid-cols-2">
              {data.certificate.studentName && (
                <div className="rounded-2xl border-2 border-sky-100 bg-white/70 backdrop-blur-sm p-5 transition-all hover:border-[#28aeec] hover:shadow-lg">
                  <div className="text-xs font-bold uppercase tracking-wide text-gray-600 mb-2 font-cairo">Student Name</div>
                  <div className="text-lg font-semibold text-gray-900 font-poppins">{data.certificate.studentName}</div>
                </div>
              )}
              {data.certificate.studentId && (
                <div className="rounded-2xl border-2 border-sky-100 bg-white/70 backdrop-blur-sm p-5 transition-all hover:border-[#28aeec] hover:shadow-lg">
                  <div className="text-xs font-bold uppercase tracking-wide text-gray-600 mb-2 font-cairo">Student ID</div>
                  <div className="text-base font-mono text-gray-900">{data.certificate.studentId}</div>
                </div>
              )}
              {data.certificate.university && (
                <div className="rounded-2xl border-2 border-sky-100 bg-white/70 backdrop-blur-sm p-5 transition-all hover:border-[#28aeec] hover:shadow-lg">
                  <div className="text-xs font-bold uppercase tracking-wide text-gray-600 mb-2 font-cairo">University</div>
                  <div className="text-lg font-semibold text-gray-900 font-poppins">{data.certificate.university}</div>
                </div>
              )}
              {data.certificate.programName && (
                <div className="rounded-2xl border-2 border-sky-100 bg-white/70 backdrop-blur-sm p-5 transition-all hover:border-[#28aeec] hover:shadow-lg">
                  <div className="text-xs font-bold uppercase tracking-wide text-gray-600 mb-2 font-cairo">Program</div>
                  <div className="text-lg font-semibold text-gray-900 font-poppins">
                    {data.certificate.programName}
                    {data.certificate.programCode && (
                      <span className="ml-2 text-sm font-normal text-gray-600">({data.certificate.programCode})</span>
                    )}
                  </div>
                </div>
              )}
              {data.certificate.date && (
                <div className="rounded-2xl border-2 border-sky-100 bg-white/70 backdrop-blur-sm p-5 transition-all hover:border-[#28aeec] hover:shadow-lg">
                  <div className="text-xs font-bold uppercase tracking-wide text-gray-600 mb-2 font-cairo">Issue Date</div>
                  <div className="text-lg font-semibold text-gray-900 font-poppins">{data.certificate.date}</div>
                </div>
              )}
            </div>
          )}

          <div className="rounded-2xl border-2 border-sky-100 bg-white/70 backdrop-blur-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="rounded-full bg-sky-100 p-2">
                <Hash className="h-5 w-5 text-[#28aeec]" />
              </div>
              <div className="text-base font-bold text-gray-900 font-cairo uppercase">Certificate Hash</div>
            </div>
            <code className="block rounded-xl border-2 border-sky-100 bg-gradient-to-br from-sky-50/50 to-white p-4 font-mono text-sm break-all text-gray-900">
              {hash || data?.hash || "N/A"}
            </code>
            {data?.issuanceTimestamp && (
              <div className="mt-4 text-sm text-gray-700 font-poppins">
                <strong className="font-semibold">Issued On:</strong> {new Date(data.issuanceTimestamp * 1000).toLocaleString()}
              </div>
            )}
            {data?.certificate?.txHash && (
              <div className="mt-4 flex items-center gap-2 flex-wrap">
                <ExternalLink className="h-4 w-4 text-[#28aeec]" />
                <a
                  className="text-sm text-[#28aeec] hover:text-sky-600 underline font-semibold font-poppins"
                  target="_blank"
                  rel="noopener noreferrer"
                  href={`https://amoy.polygonscan.com/tx/${data.certificate.txHash}`}
                >
                  View on Polygonscan
                </a>
                <span className="text-sm font-mono text-gray-600">
                  ({data.certificate.txHash.slice(0, 10)}...{data.certificate.txHash.slice(-8)})
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Verification Methods */}
      <div className="space-y-8 relative z-10">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 font-cairo uppercase">Choose Verification Method</h2>
          <p className="mt-3 text-lg text-gray-700 font-poppins">Select one of the methods below to verify your certificate</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-center lg:items-stretch">
          {/* Verify by Hash */}
          <div className="flex-1 rounded-3xl bg-white/60 backdrop-blur-xl border-2 border-sky-100 p-8 transition-all duration-500 hover:shadow-2xl hover:shadow-sky-200/30 hover:border-[#28aeec]">
            <div className="flex items-center gap-4 mb-6">
              <div className="rounded-full bg-gradient-to-br from-[#28aeec] to-sky-400 p-4 shadow-lg">
                <Hash className="h-7 w-7 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 font-cairo uppercase">Verify by Hash</h2>
                <p className="text-base text-gray-700 mt-1 font-poppins">Enter the certificate hash directly</p>
              </div>
            </div>
            <form onSubmit={onVerifyHash} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 font-cairo uppercase">Certificate Hash</label>
                <input
                  className="w-full h-14 rounded-xl border-2 border-sky-100 bg-white px-4 font-mono text-sm outline-none transition-all focus:border-[#28aeec] focus:ring-4 focus:ring-sky-100/50"
                  placeholder="0x..."
                  value={hashInput}
                  onChange={(e) => setHashInput(e.target.value)}
                  disabled={verifying}
                />
              </div>
              <button
                type="submit"
                disabled={loading || !hashInput.trim()}
                className="w-full h-14 rounded-xl bg-gradient-to-r from-[#28aeec] to-sky-400 text-white font-bold transition-all duration-300 hover:shadow-xl hover:shadow-sky-200/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-poppins text-lg uppercase hover:scale-105"
              >
                <Search className="h-6 w-6" />
                {loading ? "Verifying..." : "Verify Hash"}
              </button>
            </form>
          </div>

          {/* Divider */}
          <div className="flex items-center justify-center w-full lg:w-auto">
            <div className="flex lg:flex-col items-center gap-4 w-full lg:w-auto py-4 lg:py-0 lg:px-4">
              <div className="flex-1 lg:flex-none lg:w-px lg:h-24 h-px bg-gradient-to-r lg:bg-gradient-to-b from-transparent via-sky-300 to-sky-300"></div>
              <div className="px-5 py-2 rounded-full bg-gradient-to-r from-[#28aeec] to-sky-400 border-2 border-white shadow-lg shrink-0">
                <span className="text-sm font-bold text-white font-cairo">OR</span>
              </div>
              <div className="flex-1 lg:flex-none lg:w-px lg:h-24 h-px bg-gradient-to-l lg:bg-gradient-to-t from-transparent via-sky-300 to-sky-300"></div>
            </div>
          </div>

          {/* Upload PDF */}
          <div className="flex-1 rounded-3xl bg-white/60 backdrop-blur-xl border-2 border-sky-100 p-8 transition-all duration-500 hover:shadow-2xl hover:shadow-sky-200/30 hover:border-[#28aeec]">
            <div className="flex items-center gap-4 mb-6">
              <div className="rounded-full bg-gradient-to-br from-[#28aeec] to-sky-400 p-4 shadow-lg">
                <Upload className="h-7 w-7 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 font-cairo uppercase">Upload PDF</h2>
                <p className="text-base text-gray-700 mt-1 font-poppins">Upload your certificate file to verify</p>
              </div>
            </div>
            <form onSubmit={onVerifyFile} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 font-cairo uppercase">Certificate File</label>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="w-full h-14 rounded-xl border-2 border-sky-100 bg-white px-3 text-sm file:mr-4 file:rounded-lg file:border-0 file:bg-gradient-to-r file:from-[#28aeec] file:to-sky-400 file:px-5 file:py-2.5 file:text-xs file:font-semibold file:text-white hover:file:shadow-lg transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={!file || verifying}
                className="w-full h-14 rounded-xl bg-gradient-to-r from-[#28aeec] to-sky-400 text-white font-bold transition-all duration-300 hover:shadow-xl hover:shadow-sky-200/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-poppins text-lg uppercase hover:scale-105"
              >
                <FileText className="h-6 w-6" />
                {verifying ? "Verifying..." : "Verify PDF"}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {(data?.error || fileResult?.error) && (
        <div className="mt-8 rounded-2xl bg-gradient-to-br from-red-50 to-red-50/40 p-6 border-2 border-red-200/60 flex items-start gap-4 relative z-10">
          <div className="rounded-full bg-red-100 p-2">
            <AlertCircle className="h-6 w-6 text-red-600 flex-shrink-0" />
          </div>
          <div>
            <p className="font-bold text-red-900 font-cairo text-lg uppercase">Error</p>
            <p className="text-base text-red-700 mt-2 font-poppins">{data?.error || fileResult?.error}</p>
          </div>
        </div>
      )}
    </AppShell>
  );
}
