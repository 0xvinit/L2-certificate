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
      <div className="mb-12">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900">Verify Certificate</h1>
          <p className="mt-2 text-slate-500">Enter a hash, upload a PDF, or provide a URL to verify</p>
        </div>
      </div>

      {/* Verification Result Card */}
      {(data || fileResult) && (
        <div className="mb-8 rounded-2xl bg-gradient-to-br from-slate-50 via-white to-slate-50/40 p-8 transition-all duration-300 hover:shadow-lg border border-slate-100/40 backdrop-blur-sm">
          {statusInfo && (
            <div className={`mb-6 rounded-xl p-5 border flex items-start gap-4 ${
              statusInfo.color === "emerald" 
                ? "bg-gradient-to-br from-emerald-50 to-emerald-50/40 border-emerald-200/60"
                : statusInfo.color === "red"
                ? "bg-gradient-to-br from-red-50 to-red-50/40 border-red-200/60"
                : "bg-gradient-to-br from-amber-50 to-amber-50/40 border-amber-200/60"
            }`}>
              <div className={`rounded-full p-2.5 flex-shrink-0 ${
                statusInfo.color === "emerald" 
                  ? "bg-emerald-100"
                  : statusInfo.color === "red"
                  ? "bg-red-100"
                  : "bg-amber-100"
              }`}>
                <statusInfo.icon className={`h-6 w-6 ${
                  statusInfo.color === "emerald" 
                    ? "text-emerald-600"
                    : statusInfo.color === "red"
                    ? "text-red-600"
                    : "text-amber-600"
                }`} />
              </div>
              <div className="flex-1">
                <h3 className={`text-lg font-semibold ${
                  statusInfo.color === "emerald" 
                    ? "text-emerald-900"
                    : statusInfo.color === "red"
                    ? "text-red-900"
                    : "text-amber-900"
                }`}>{statusInfo.text}</h3>
                <p className={`mt-1 text-sm ${
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
                <div className="rounded-xl border border-slate-200/60 bg-white/50 p-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">Student Name</div>
                  <div className="text-base font-semibold text-slate-900">{data.certificate.studentName}</div>
                </div>
              )}
              {data.certificate.studentId && (
                <div className="rounded-xl border border-slate-200/60 bg-white/50 p-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">Student ID</div>
                  <div className="text-base font-mono text-sm text-slate-900">{data.certificate.studentId}</div>
                </div>
              )}
              {data.certificate.university && (
                <div className="rounded-xl border border-slate-200/60 bg-white/50 p-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">University</div>
                  <div className="text-base font-semibold text-slate-900">{data.certificate.university}</div>
                </div>
              )}
              {data.certificate.programName && (
                <div className="rounded-xl border border-slate-200/60 bg-white/50 p-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">Program</div>
                  <div className="text-base font-semibold text-slate-900">
                    {data.certificate.programName}
                    {data.certificate.programCode && (
                      <span className="ml-2 text-sm font-normal text-slate-500">({data.certificate.programCode})</span>
                    )}
                  </div>
                </div>
              )}
              {data.certificate.date && (
                <div className="rounded-xl border border-slate-200/60 bg-white/50 p-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">Issue Date</div>
                  <div className="text-base font-semibold text-slate-900">{data.certificate.date}</div>
                </div>
              )}
            </div>
          )}

          <div className="rounded-xl border border-slate-200/60 bg-white/50 p-5">
            <div className="flex items-center gap-2 mb-3">
              <Hash className="h-4 w-4 text-slate-500" />
              <div className="text-sm font-semibold text-slate-700">Certificate Hash</div>
            </div>
            <code className="block rounded-lg border border-slate-200/60 bg-slate-50 p-3 font-mono text-xs break-all text-slate-900">
              {hash || data?.hash || "N/A"}
            </code>
            {data?.issuanceTimestamp && (
              <div className="mt-3 text-xs text-slate-600">
                <strong>Issued On:</strong> {new Date(data.issuanceTimestamp * 1000).toLocaleString()}
              </div>
            )}
            {data?.certificate?.txHash && (
              <div className="mt-3 flex items-center gap-2">
                <ExternalLink className="h-3 w-3 text-slate-500" />
                <a
                  className="text-xs text-blue-600 hover:text-blue-700 underline font-medium"
                  target="_blank"
                  rel="noopener noreferrer"
                  href={`https://amoy.polygonscan.com/tx/${data.certificate.txHash}`}
                >
                  View on Polygonscan
                </a>
                <span className="text-xs font-mono text-slate-500">
                  ({data.certificate.txHash.slice(0, 10)}...{data.certificate.txHash.slice(-8)})
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Verification Methods */}
      <div className="space-y-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900">Choose Verification Method</h2>
          <p className="mt-2 text-sm text-slate-500">Select one of the methods below to verify your certificate</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-center lg:items-stretch">
          {/* Verify by Hash */}
          <div className="flex-1 rounded-2xl bg-gradient-to-br from-blue-50 via-white to-blue-50/40 p-8 transition-all duration-300 hover:shadow-xl border-2 border-blue-200/60 backdrop-blur-sm">
            <div className="flex items-center gap-4 mb-6">
              <div className="rounded-full bg-blue-100 p-3">
                <Hash className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Verify by Hash</h2>
                <p className="text-sm text-slate-600 mt-0.5">Enter the certificate hash directly</p>
              </div>
            </div>
            <form onSubmit={onVerifyHash} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Certificate Hash</label>
                <input
                  className="w-full h-12 rounded-xl border-2 border-blue-200/60 bg-white px-4 font-mono text-sm outline-none transition-all focus:border-blue-400 focus:ring-4 focus:ring-blue-100/50"
                  placeholder="0x..."
                  value={hashInput}
                  onChange={(e) => setHashInput(e.target.value)}
                  disabled={verifying}
                />
              </div>
              <button
                type="submit"
                disabled={loading || !hashInput.trim()}
                className="w-full h-12 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold transition-all duration-300 hover:shadow-lg hover:shadow-blue-200/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Search className="h-5 w-5" />
                {loading ? "Verifying..." : "Verify Hash"}
              </button>
            </form>
          </div>

          {/* Divider */}
          <div className="flex items-center justify-center w-full lg:w-auto">
            <div className="flex lg:flex-col items-center gap-4 w-full lg:w-auto py-4 lg:py-0 lg:px-4">
              <div className="flex-1 lg:flex-none lg:w-px lg:h-24 h-px bg-gradient-to-r lg:bg-gradient-to-b from-transparent via-slate-300 to-slate-300"></div>
              <div className="px-4 py-2 rounded-full bg-slate-100 border-2 border-slate-200 shrink-0">
                <span className="text-sm font-bold text-slate-600">OR</span>
              </div>
              <div className="flex-1 lg:flex-none lg:w-px lg:h-24 h-px bg-gradient-to-l lg:bg-gradient-to-t from-transparent via-slate-300 to-slate-300"></div>
            </div>
          </div>

          {/* Upload PDF */}
          <div className="flex-1 rounded-2xl bg-gradient-to-br from-purple-50 via-white to-purple-50/40 p-8 transition-all duration-300 hover:shadow-xl border-2 border-purple-200/60 backdrop-blur-sm">
            <div className="flex items-center gap-4 mb-6">
              <div className="rounded-full bg-purple-100 p-3">
                <Upload className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Upload PDF</h2>
                <p className="text-sm text-slate-600 mt-0.5">Upload your certificate file to verify</p>
              </div>
            </div>
            <form onSubmit={onVerifyFile} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Certificate File</label>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="w-full h-12 rounded-xl border-2 border-purple-200/60 bg-white px-3 text-sm file:mr-4 file:rounded-lg file:border-0 file:bg-purple-100 file:px-4 file:py-2 file:text-xs file:font-semibold file:text-purple-700 hover:file:bg-purple-200 transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={!file || verifying}
                className="w-full h-12 rounded-xl bg-gradient-to-r from-purple-600 to-purple-700 text-white font-semibold transition-all duration-300 hover:shadow-lg hover:shadow-purple-200/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <FileText className="h-5 w-5" />
                {verifying ? "Verifying..." : "Verify PDF"}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {(data?.error || fileResult?.error) && (
        <div className="mt-6 rounded-xl bg-gradient-to-br from-red-50 to-red-50/40 p-4 border border-red-200/60 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-900">Error</p>
            <p className="text-sm text-red-700 mt-1">{data?.error || fileResult?.error}</p>
          </div>
        </div>
      )}
    </AppShell>
  );
}
