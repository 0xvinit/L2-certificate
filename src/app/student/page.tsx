"use client";
import { useState } from "react";
import AppShell from "@/components/AppShell";
import { sha256HexBytes } from "../../lib/sha256";
import CertificateTemplate from "@/components/CertificateTemplate";
import {
  generatePDFFromHTML,
  addQRCodeToElement,
} from "../../lib/pdfGenerator";
import { createRoot } from "react-dom/client";
import {
  Search,
  Download,
  ExternalLink,
  GraduationCap,
  Calendar,
  Hash,
  AlertCircle,
  FileText,
} from "lucide-react";

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
      const res = await fetch(
        `/api/certificates?studentId=${encodeURIComponent(studentId.trim())}`
      );
      const data = await res.json();
      if (!res.ok)
        throw new Error(data?.error || "Failed to load certificates");
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
        const cleanBase64 = c.pdfBase64.trim().replace(/\s/g, "");
        const pdfBytes = Uint8Array.from(atob(cleanBase64), (c) =>
          c.charCodeAt(0)
        );

        // Verify hash matches
        const computedHash = await sha256HexBytes(pdfBytes);
        console.log("Stored hash:", c.hash);
        console.log("Computed hash from PDF:", computedHash);
        console.log("PDF size:", pdfBytes.length, "bytes");

        if (computedHash.toLowerCase() !== c.hash.toLowerCase()) {
          console.warn(
            "Hash mismatch between stored PDF and on-chain hash. This is expected for certificates where the on-chain hash was computed before adding the QR code."
          );
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
      const gw = (
        process.env.NEXT_PUBLIC_IPFS_GATEWAY || "https://ipfs.io/ipfs/"
      ).replace(/\/?$/, "/");
      const toHttp = (uri: string) =>
        uri.startsWith("ipfs://") ? gw + uri.replace("ipfs://", "") : uri;

      const logoUrlHttp = c.programLogoUrl ? toHttp(c.programLogoUrl) : "";
      const signatureUrlHttp = c.programSignatureUrl
        ? toHttp(c.programSignatureUrl)
        : "";

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
          const certificateElement = tempContainer.querySelector(
            "#certificate-container"
          ) as HTMLElement;
          if (certificateElement) {
            resolve();
          } else {
            setTimeout(resolve, 500);
          }
        }, 1000);
      });

      const certificateElement = tempContainer.querySelector(
        "#certificate-container"
      ) as HTMLElement;
      if (!certificateElement)
        throw new Error("Failed to render certificate template");

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
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      // Generate PDF from HTML
      const pdfBlob = (await generatePDFFromHTML(certificateElement, {
        returnBlob: true,
      })) as Blob;

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
      {/* Background linear overlays */}
      <div className="absolute top-[10%] left-[5%] w-[300px] h-[300px] bg-sky-400/20 blur-3xl opacity-100 rounded-full z-0 pointer-events-none" />
      <div className="absolute bottom-[20%] right-[8%] w-[250px] h-[250px] bg-blue-400/25 blur-3xl opacity-100 rounded-full z-0 pointer-events-none" />

      <div className="mb-12 relative z-10">
        <div className="text-center">
          <h1 className="text-4xl lg:text-5xl font-bold tracking-tight text-gray-900 font-cairo uppercase">
            Student Certificates
          </h1>
          <p className="mt-4 text-lg text-gray-700 font-poppins max-w-2xl mx-auto">
            Enter your student ID to view and download your blockchain
            certificates
          </p>
        </div>
      </div>

      {/* Search Form */}
      <div className="rounded-3xl bg-white/60 backdrop-blur-xl border-2 border-sky-100 p-8 transition-all duration-500 hover:shadow-2xl hover:shadow-sky-200/30 relative z-10">
        <div className="flex items-center gap-4 mb-8">
          <div className="rounded-full bg-linear-to-br from-[#28aeec] to-sky-400 p-4 shadow-lg">
            <Search className="h-7 w-7 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 font-cairo uppercase">
              Search Certificates
            </h2>
            <p className="text-base text-gray-700 mt-1 font-poppins">
              Find your certificates by student ID
            </p>
          </div>
        </div>

        <form onSubmit={search} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 font-cairo uppercase">
              Student ID
            </label>
            <div className="flex gap-4">
              <div className="relative flex-1">
                <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  className="w-full h-14 pl-12 rounded-xl border-2 border-sky-100 bg-white px-4 text-base outline-none transition-all focus:border-[#28aeec] focus:ring-4 focus:ring-sky-100/50 font-poppins"
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
                className="h-14 px-8 rounded-xl bg-linear-to-r from-[#28aeec] to-sky-400 text-white font-bold transition-all duration-300 hover:shadow-xl hover:shadow-sky-200/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-poppins text-lg uppercase hover:scale-105"
                type="submit"
              >
                <Search className="h-6 w-6" />
                {loading ? "Searching..." : "Search"}
              </button>
            </div>
          </div>

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
        </form>
      </div>

      {/* Certificates List */}
      {certs.length > 0 && (
        <div className="mt-8 rounded-3xl bg-white/60 backdrop-blur-xl border-2 border-sky-100 p-8 transition-all duration-500 hover:shadow-2xl hover:shadow-sky-200/30 relative z-10">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 font-cairo uppercase">
              Your Certificates
            </h2>
            <p className="mt-2 text-base text-gray-700 font-poppins">
              Found {certs.length} certificate{certs.length !== 1 ? "s" : ""}
            </p>
          </div>

          <div className="grid gap-6">
            {certs.map((c) => (
              <div
                key={c._id}
                className="rounded-2xl border-2 border-sky-100 bg-white/70 backdrop-blur-sm p-6 transition-all duration-300 hover:shadow-xl hover:shadow-sky-200/30 hover:border-[#28aeec]"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div className="flex-1 space-y-4">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 font-cairo uppercase">
                        {c.studentName}
                      </h3>
                      <div className="flex items-center gap-3 mt-2">
                        <div className="rounded-full bg-sky-100 p-2">
                          <GraduationCap className="h-5 w-5 text-[#28aeec]" />
                        </div>
                        <span className="text-base font-semibold text-gray-800 font-poppins">
                          {c.programName}
                          {c.programCode && (
                            <span className="ml-2 text-sm font-normal text-gray-600">
                              ({c.programCode})
                            </span>
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-6">
                      {c.date && (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-5 w-5 text-gray-500" />
                          <span className="text-sm text-gray-700 font-poppins">
                            <span className="font-semibold">Issued:</span>{" "}
                            {c.date}
                          </span>
                        </div>
                      )}
                      {c.hash && (
                        <div className="flex items-center gap-2">
                          <Hash className="h-5 w-5 text-gray-500" />
                          <code className="text-sm font-mono text-gray-600">
                            {c.hash.slice(0, 10)}...{c.hash.slice(-8)}
                          </code>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    {c.verifyUrl && (
                      <a
                        href={c.verifyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-xl bg-linear-to-r from-sky-50 to-sky-100 text-[#28aeec] font-bold transition-all duration-300 hover:shadow-lg hover:shadow-sky-200/50 border-2 border-sky-200 hover:border-[#28aeec] font-poppins uppercase"
                      >
                        <ExternalLink className="h-5 w-5" />
                        Verify
                      </a>
                    )}
                    <button
                      onClick={() => downloadPdf(c)}
                      className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-xl bg-linear-to-r from-emerald-600 to-emerald-700 text-white font-bold transition-all duration-300 hover:shadow-xl hover:shadow-emerald-200/50 font-poppins uppercase hover:scale-105"
                    >
                      <Download className="h-5 w-5" />
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
        <div className="mt-8 rounded-2xl bg-linear-to-br from-amber-50 to-amber-50/40 p-6 border-2 border-amber-200/60 flex items-start gap-4 relative z-10">
          <div className="rounded-full bg-amber-100 p-2">
            <FileText className="h-6 w-6 text-amber-600 shrink-0" />
          </div>
          <div>
            <p className="font-bold text-amber-900 font-cairo text-lg uppercase">
              No Certificates Found
            </p>
            <p className="text-base text-amber-800 mt-2 font-poppins">
              No certificates found for student ID: {studentId}
            </p>
          </div>
        </div>
      )}
    </AppShell>
  );
}
