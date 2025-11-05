"use client";
import { useState } from "react";
import AppShell from "@/components/AppShell";
import { sha256HexBytes } from "../../lib/sha256";
import CertificateTemplate from "@/components/CertificateTemplate";
import { generatePDFFromHTML, addQRCodeToElement } from "../../lib/pdfGenerator";
import { createRoot } from "react-dom/client";
import { Search, Download, ExternalLink, GraduationCap, Calendar, Hash, AlertCircle, FileText } from "lucide-react";

type Cert = {
  _id: string;
  adminId: string;
  programId: string;
  studentName: string;
  studentId: string;
  date: string;
  hash: string;
  txHash?: string;
  verifyUrl?: string;
  programName?: string;
  programCode?: string;
  programLogoUrl?: string;
  programSignatureUrl?: string;
  universityName?: string;
  signatoryName?: string;
  signatoryTitle?: string;
  pdfBase64?: string;
};

export default function StudentCertificatesPage() {
  const [studentId, setStudentId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [certs, setCerts] = useState<Cert[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const search = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    setHasSearched(true);
    try {
      const res = await fetch(`/api/certificates?studentId=${encodeURIComponent(studentId.trim())}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to load certificates");
      setCerts(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err?.message || "Failed to load certificates");
      setCerts([]);
    } finally {
      setLoading(false);
    }
  };

  const downloadPdf = async (c: Cert) => {
    // Use stored PDF if available (ensures hash matches original)
    if (c.pdfBase64) {
      try {
        // Clean base64 string (remove any whitespace/newlines)
        const cleanBase64 = c.pdfBase64.trim().replace(/\s/g, '');
        const pdfBytes = Uint8Array.from(atob(cleanBase64), c => c.charCodeAt(0));
        
        // Verify hash matches
        const computedHash = await sha256HexBytes(pdfBytes);
        console.log("Stored hash:", c.hash);
        console.log("Computed hash from PDF:", computedHash);
        console.log("PDF size:", pdfBytes.length, "bytes");
        
        if (computedHash.toLowerCase() !== c.hash.toLowerCase()) {
          console.warn("Hash mismatch between stored PDF and on-chain hash. This is expected for certificates where the on-chain hash was computed before adding the QR code.");
          console.warn("Expected hash:", c.hash);
          console.warn("Got hash:", computedHash);
        } else {
          console.log("✓ Hash verified! PDF matches original.");
        }
        
        const blob = new Blob([pdfBytes], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `certificate-${c.studentId}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        return;
      } catch (err: any) {
        console.error("Error decoding PDF:", err);
        alert(`Error: Failed to decode PDF. ${err.message}`);
        // Fall through to regeneration
      }
    }

    // Fallback: regenerate PDF using HTML template (for old certificates without stored PDF)
    try {
      const gw = (process.env.NEXT_PUBLIC_IPFS_GATEWAY || 'https://ipfs.io/ipfs/').replace(/\/?$/, '/');
      const toHttp = (uri: string) => uri.startsWith('ipfs://') ? (gw + uri.replace('ipfs://','')) : uri;
      
      const logoUrlHttp = c.programLogoUrl ? toHttp(c.programLogoUrl) : "";
      const signatureUrlHttp = c.programSignatureUrl ? toHttp(c.programSignatureUrl) : "";

      // Create a temporary container for the certificate
      const tempContainer = document.createElement("div");
      tempContainer.style.position = "absolute";
      tempContainer.style.left = "-9999px";
      tempContainer.style.top = "0";
      document.body.appendChild(tempContainer);

      // Render certificate template
      const root = createRoot(tempContainer);
      await new Promise<void>((resolve) => {
        root.render(
          <CertificateTemplate
            studentName={c.studentName || ""}
            studentId={c.studentId || ""}
            programName={c.programName || ""}
            programCode={c.programCode || ""}
            date={c.date || ""}
            universityName={c.universityName || ""}
            logoUrl={logoUrlHttp}
            signatureUrl={signatureUrlHttp}
            signatoryName={c.signatoryName || ""}
            signatoryTitle={c.signatoryTitle || ""}
            verifyUrl={c.verifyUrl || ""}
            hash={c.hash}
          />
        );
        // Wait for template to render
        setTimeout(() => {
          const certificateElement = tempContainer.querySelector("#certificate-container") as HTMLElement;
          if (certificateElement) {
            resolve();
          } else {
            setTimeout(resolve, 500);
          }
        }, 1000);
      });

      const certificateElement = tempContainer.querySelector("#certificate-container") as HTMLElement;
      if (!certificateElement) throw new Error("Failed to render certificate template");

      // Wait for all images to load
      await new Promise<void>((resolve) => {
        const images = certificateElement.querySelectorAll("img");
        let loaded = 0;
        const total = images.length;
        if (total === 0) {
          resolve();
          return;
        }
        images.forEach((img) => {
          if (img.complete) {
            loaded++;
            if (loaded === total) resolve();
          } else {
            img.onload = () => {
              loaded++;
              if (loaded === total) resolve();
            };
            img.onerror = () => {
              loaded++;
              if (loaded === total) resolve();
            };
          }
        });
        setTimeout(resolve, 3000); // Max wait time
      });

      // Add QR code if verify URL is available
      if (c.verifyUrl) {
        await addQRCodeToElement(certificateElement, c.verifyUrl);
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Generate PDF from HTML
      const pdfBlob = await generatePDFFromHTML(certificateElement, { returnBlob: true }) as Blob;
      
      // Clean up
      document.body.removeChild(tempContainer);

      // Download PDF
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `certificate-${c.studentId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error("Error regenerating PDF:", err);
      alert(`Error: Failed to generate PDF. ${err.message}`);
    }
  };

  return (
    <AppShell>
      <div className="mb-12">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900">Student Certificates</h1>
          <p className="mt-2 text-slate-500">Enter your student ID to view and download your certificates</p>
        </div>
      </div>

      {/* Search Form */}
      <div className="rounded-2xl bg-gradient-to-br from-slate-50 via-white to-slate-50/40 p-8 transition-all duration-300 hover:shadow-lg border border-slate-100/40 backdrop-blur-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="rounded-full bg-blue-50 p-2.5">
            <Search className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Search Certificates</h2>
            <p className="text-sm text-slate-500 mt-0.5">Find your certificates by student ID</p>
          </div>
        </div>
        
        <form onSubmit={search} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Student ID</label>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  className="w-full h-12 pl-10 rounded-xl border border-slate-200/80 bg-white/50 px-4 text-sm outline-none transition-all focus:border-blue-300 focus:ring-4 focus:ring-blue-100/50"
                  placeholder="Enter your Student ID"
                  value={studentId}
                  onChange={(e) => {
                    setStudentId(e.target.value);
                    if (hasSearched) setHasSearched(false);
                  }}
                  required
                  disabled={loading}
                />
              </div>
              <button
                disabled={loading}
                className="h-12 px-6 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold transition-all duration-300 hover:shadow-lg hover:shadow-blue-200/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                type="submit"
              >
                <Search className="h-4 w-4" />
                {loading ? "Searching..." : "Search"}
              </button>
            </div>
          </div>
          
          {error && (
            <div className="rounded-xl bg-gradient-to-br from-red-50 to-red-50/40 p-4 border border-red-200/60 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-900">Error</p>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          )}
        </form>
      </div>

      {/* Certificates List */}
      {certs.length > 0 && (
        <div className="mt-8 rounded-2xl bg-gradient-to-br from-slate-50 via-white to-slate-50/40 p-8 transition-all duration-300 hover:shadow-lg border border-slate-100/40 backdrop-blur-sm">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900">Your Certificates</h2>
            <p className="mt-1 text-sm text-slate-500">Found {certs.length} certificate{certs.length !== 1 ? 's' : ''}</p>
          </div>
          
          <div className="grid gap-4">
            {certs.map((c) => (
              <div
                key={c._id}
                className="rounded-xl border border-slate-200/60 bg-white/50 p-6 transition-all duration-200 hover:shadow-md hover:border-blue-200/60"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">{c.studentName}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <GraduationCap className="h-4 w-4 text-slate-500" />
                        <span className="text-sm font-semibold text-slate-700">
                          {c.programName}
                          {c.programCode && (
                            <span className="ml-2 text-xs font-normal text-slate-500">({c.programCode})</span>
                          )}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm">
                      {c.date && (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-slate-400" />
                          <span className="text-slate-600">
                            <span className="font-semibold">Issued:</span> {c.date}
                          </span>
                        </div>
                      )}
                      {c.hash && (
                        <div className="flex items-center gap-2">
                          <Hash className="h-4 w-4 text-slate-400" />
                          <code className="text-xs font-mono text-slate-500">
                            {c.hash.slice(0, 10)}...{c.hash.slice(-8)}
                          </code>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 sm:flex-col sm:items-stretch">
                    {c.verifyUrl && (
                      <a
                        href={c.verifyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl bg-gradient-to-r from-blue-50 to-blue-50/40 text-blue-700 font-semibold transition-all duration-200 hover:shadow-md hover:from-blue-100 hover:to-blue-100/40 border border-blue-200/60"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Verify
                      </a>
                    )}
                    <button
                      onClick={() => downloadPdf(c)}
                      className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-semibold transition-all duration-300 hover:shadow-lg hover:shadow-emerald-200/50"
                    >
                      <Download className="h-4 w-4" />
                      Download PDF
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {certs.length === 0 && !loading && hasSearched && (
        <div className="mt-8 rounded-xl bg-gradient-to-br from-amber-50 to-amber-50/40 p-6 border border-amber-200/60 flex items-start gap-3">
          <FileText className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-900">No Certificates Found</p>
            <p className="text-sm text-amber-800 mt-1">No certificates found for student ID: {studentId}</p>
          </div>
        </div>
      )}
    </AppShell>
  );
}


