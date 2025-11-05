"use client";
import { useState } from "react";
import AppShell from "@/components/AppShell";
import { sha256HexBytes } from "../../lib/sha256";
import CertificateTemplate from "@/components/CertificateTemplate";
import { generatePDFFromHTML, addQRCodeToElement } from "../../lib/pdfGenerator";
import { createRoot } from "react-dom/client";

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

  const search = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/certificates?studentId=${encodeURIComponent(studentId.trim())}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to load certificates");
      setCerts(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err?.message || "Failed to load certificates");
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
      <div className="card p-6">
        <h1 className="text-xl font-semibold">Student Certificates</h1>
        <p className="mt-1 text-sm text-muted-foreground">Enter your student ID to view and download your certificates.</p>
        <form onSubmit={search} className="mt-4 flex flex-wrap items-center gap-3">
          <input
            className="h-11 w-full max-w-xs rounded-md border px-3 text-sm outline-none focus:ring-2"
            placeholder="Enter Student ID"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            required
          />
          <button disabled={loading} className="btn btn-primary h-11 px-5" type="submit">
            {loading ? "Searching..." : "Search"}
          </button>
        </form>
        {error && (
          <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
        )}
      </div>

      {certs.length > 0 && (
        <div className="mt-6 card p-6">
          <h2 className="text-base font-semibold">Results</h2>
          <div className="mt-4 grid gap-3">
            {certs.map((c) => (
              <div key={c._id} className="flex flex-wrap items-center justify-between rounded-md border bg-muted px-3 py-3">
                <div>
                  <div className="font-semibold">{c.studentName}</div>
                  <div className="text-xs text-muted-foreground">{c.programName} {c.programCode && `(${c.programCode})`}</div>
                  <div className="mt-1 text-xs text-muted-foreground">Issued: {c.date}</div>
                </div>
                <div className="flex items-center gap-2">
                  {c.verifyUrl && (
                    <a className="btn btn-ghost h-9 px-3" href={c.verifyUrl} target="_blank" rel="noopener noreferrer">Verify</a>
                  )}
                  <button className="btn btn-primary h-9 px-3" onClick={() => downloadPdf(c)}>Download PDF</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </AppShell>
  );
}


