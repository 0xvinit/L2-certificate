"use client";
import { useEffect, useState } from "react";
import { sha256HexBytes } from "../../lib/sha256";
import AppShell from "@/components/AppShell";

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
        icon: "✓",
        text: "Certificate Verified",
        color: "#059669",
        bg: "linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)",
        borderColor: "#10b981",
        desc: "This certificate is valid and verified on the blockchain",
        iconBg: "#10b981"
      };
    } else if (status === "revoked") {
      return {
        icon: "✗",
        text: "Certificate Revoked",
        color: "#dc2626",
        bg: "linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)",
        borderColor: "#ef4444",
        desc: "This certificate has been revoked and is no longer valid",
        iconBg: "#ef4444"
      };
    } else {
      return {
        icon: "⚠",
        text: "Certificate Not Found",
        color: "#d97706",
        bg: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
        borderColor: "#f59e0b",
        desc: "Certificate not found on the blockchain",
        iconBg: "#f59e0b"
      };
    }
  };

  const statusInfo = data?.status ? getStatusDisplay(data.status) : null;

  return (
    <AppShell>
    <div className="max-w-4xl py-2">
      <h1 className="text-3xl font-semibold tracking-tight">Verify Certificate</h1>
      <p className="mt-2 text-sm text-muted-foreground">Enter a hash, upload a PDF, or provide a URL.</p>

      {(data || fileResult) && (
        <div className="mt-6 rounded-md border p-4">
          {statusInfo && (
            <div className="mb-4">
              <div className="text-base font-semibold" style={{ color: statusInfo.color }}>{statusInfo.text}</div>
              <div className="text-sm" style={{ color: statusInfo.color }}>{statusInfo.desc}</div>
            </div>
          )}
          {data?.certificate && (
            <div className="mb-3 grid gap-2 sm:grid-cols-2">
              {data.certificate.studentName && (
                <div className="rounded-md border p-3">
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Student Name</div>
                  <div className="mt-1 text-sm font-semibold">{data.certificate.studentName}</div>
                </div>
              )}
              {data.certificate.studentId && (
                <div className="rounded-md border p-3">
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Student ID</div>
                  <div className="mt-1 font-mono text-xs">{data.certificate.studentId}</div>
                </div>
              )}
              {data.certificate.university && (
                <div className="rounded-md border p-3">
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">University</div>
                  <div className="mt-1 text-sm font-semibold">{data.certificate.university}</div>
                </div>
              )}
              {data.certificate.programName && (
                <div className="rounded-md border p-3">
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Program</div>
                  <div className="mt-1 text-sm font-semibold">
                    {data.certificate.programName}
                    {data.certificate.programCode && (
                      <span className="ml-1 text-xs font-normal text-muted-foreground">({data.certificate.programCode})</span>
                    )}
                  </div>
                </div>
              )}
              {data.certificate.date && (
                <div className="rounded-md border p-3">
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Issue Date</div>
                  <div className="mt-1 text-sm font-semibold">{data.certificate.date}</div>
                </div>
              )}
            </div>
          )}
          <div className="rounded-md border p-3 text-sm">
            <div className="mb-1 font-semibold">Certificate Hash</div>
            <code className="block rounded border bg-white p-2 font-mono text-[12px] dark:bg-slate-900">
              {hash || data?.hash || "N/A"}
            </code>
            {data?.issuanceTimestamp && (
              <div className="mt-2 text-xs"><strong>Issued On:</strong> {new Date(data.issuanceTimestamp * 1000).toLocaleString()}</div>
            )}
            {data?.certificate?.txHash && (
              <div className="mt-1 text-xs">
                <strong>Tx:</strong>{" "}
                <a className="text-primary underline" target="_blank" rel="noopener noreferrer" href={`https://amoy.polygonscan.com/tx/${data.certificate.txHash}`}>
                  Polygonscan
                </a>
                <span className="ml-2 font-mono text-muted-foreground">({data.certificate.txHash.slice(0, 10)}...{data.certificate.txHash.slice(-8)})</span>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="mt-8 grid gap-6 sm:grid-cols-3">
        <div>
          <h2 className="text-sm font-semibold">Verify by Hash</h2>
          <p className="mt-1 text-xs text-muted-foreground">Enter the certificate hash</p>
          <form onSubmit={onVerifyHash} className="mt-3 grid gap-2">
            <input className="h-10 rounded-md border px-3 font-mono text-sm outline-none focus:ring-2" placeholder="64-char hash" value={hashInput} onChange={(e) => setHashInput(e.target.value)} />
            <button type="submit" disabled={loading || !hashInput.trim()} className="btn btn-primary h-10">{loading ? "Verifying..." : "Verify Hash"}</button>
          </form>
        </div>
        <div>
          <h2 className="text-sm font-semibold">Upload PDF</h2>
          <p className="mt-1 text-xs text-muted-foreground">Upload your certificate file</p>
          <form onSubmit={onVerifyFile} className="mt-3 grid gap-2">
            <input type="file" accept="application/pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} className="h-10 rounded-md border bg-white px-3 text-sm file:mr-3 file:rounded file:border-0 file:bg-muted file:px-3 file:py-2 file:text-xs file:font-medium" />
            <button type="submit" disabled={!file || verifying} className="btn btn-primary h-10">{verifying ? "Verifying..." : "Verify PDF"}</button>
          </form>
        </div>
        <div>
          <h2 className="text-sm font-semibold">Verify by URL</h2>
          <p className="mt-1 text-xs text-muted-foreground">Enter a PDF or IPFS URL</p>
          <form onSubmit={onVerifyUrl} className="mt-3 grid gap-2">
            <input className="h-10 rounded-md border px-3 text-sm outline-none focus:ring-2" placeholder="https://... or ipfs://..." value={url} onChange={(e) => setUrl(e.target.value)} />
            <button type="submit" disabled={!url.trim() || verifying} className="btn btn-primary h-10">{verifying ? "Verifying..." : "Verify URL"}</button>
          </form>
        </div>
      </div>

      {(data?.error || fileResult?.error) && (
        <div className="mt-6 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          <strong>Error:</strong> {data?.error || fileResult?.error}
        </div>
      )}
    </div>
    </AppShell>
  );
}
