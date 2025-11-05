"use client";
import { useState, useEffect, useRef } from "react";
import { ethers } from "ethers";
import { CERTIFICATE_REGISTRY_ABI, CERTIFICATE_REGISTRY_ADDRESS } from "../../lib/contract";
import { sha256HexBytes } from "../../lib/sha256";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import WalletConnection from "@/components/WalletConnection";
import AppShell from "@/components/AppShell";
import CertificateTemplate from "@/components/CertificateTemplate";
import { generatePDFFromHTML, addQRCodeToElement } from "../../lib/pdfGenerator";
import { createRoot } from "react-dom/client";

export default function IssuePage() {
  const [studentName, setStudentName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [programId, setProgramId] = useState("");
  const [programName, setProgramName] = useState("");
  const [date, setDate] = useState("");
  const [programs, setPrograms] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string>("");
  const [admin, setAdmin] = useState<any>(null);
  
  const { authenticated } = usePrivy();
  const { wallets } = useWallets();

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setAdmin(data);
        if (data?.adminId) {
          await loadProgramsByAdminId(data.adminId);
        }
      }
    })();
  }, []);

  // Remove wallet-based program loading; use adminId-based loading only

  const loadPrograms = async (addr: string) => {
    try {
      const res = await fetch(`/api/programs?admin=${addr.toLowerCase()}` , { credentials: 'include' });
      const data = await res.json();
      setPrograms(data || []);
    } catch {}
  };

  const loadProgramsByAdminId = async (adminIdVal: string) => {
    try {
      const res = await fetch(`/api/programs?adminId=${adminIdVal.toLowerCase()}`, { credentials: 'include' });
      const data = await res.json();
      setPrograms(data || []);
    } catch {}
  };

const submit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  setResult(null);
  setError("");
  
  try {
    if (!wallets.length) throw new Error("Please connect your wallet");
    if (!CERTIFICATE_REGISTRY_ADDRESS) throw new Error("Contract address missing");
    if (!programId) throw new Error("Please select a program");

    const selectedProgram = programs.find((p: any) => p._id === programId);
    if (!selectedProgram) throw new Error("Invalid program selected");

    // Get university name from admin
    const universityName = admin?.university || "";

    // Prepare logo and signature URLs
    const gw = (process.env.NEXT_PUBLIC_IPFS_GATEWAY || 'https://ipfs.io/ipfs/').replace(/\/?$/, '/');
    const logoUrlHttp = selectedProgram.logoUrl?.startsWith('ipfs://')
      ? (gw + selectedProgram.logoUrl.replace('ipfs://',''))
      : selectedProgram.logoUrl || "";
    const signatureUrlHttp = selectedProgram.signatureUrl?.startsWith('ipfs://')
      ? (gw + selectedProgram.signatureUrl.replace('ipfs://',''))
      : selectedProgram.signatureUrl || "";

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
          studentName={studentName || ""}
          studentId={studentId || ""}
          programName={selectedProgram.name || programName || ""}
          programCode={selectedProgram.code || ""}
          date={date || ""}
          universityName={universityName || ""}
          logoUrl={logoUrlHttp || ""}
          signatureUrl={signatureUrlHttp || ""}
          signatoryName={selectedProgram.signatoryName || ""}
          signatoryTitle={selectedProgram.signatoryTitle || ""}
        />
      );
      // Wait for images to load
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

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    
    // Generate PDF without QR code first to get a base hash
    // We'll add QR code after computing hash
    const tempPdfBlob = await generatePDFFromHTML(certificateElement, { returnBlob: true }) as Blob;
    const tempPdfBytes = new Uint8Array(await tempPdfBlob.arrayBuffer());
    const tempHash = await sha256HexBytes(tempPdfBytes);
    
    // Now add QR code with verify URL
    const verifyUrl = `${baseUrl}/verify?h=${tempHash}`;
    await addQRCodeToElement(certificateElement, verifyUrl);

    // Wait for QR code to render
    await new Promise(resolve => setTimeout(resolve, 500));

    // Generate final PDF with QR code - this is what we'll store
    const finalPdfBlob = await generatePDFFromHTML(certificateElement, { returnBlob: true }) as Blob;
    const finalPdfBytes = new Uint8Array(await finalPdfBlob.arrayBuffer());
    const finalPdfHash = await sha256HexBytes(finalPdfBytes);
    
    // Hash should match the stored PDF (with QR code)
    // However, since QR code contains the hash, we use the temp hash for blockchain
    // The stored PDF will have QR code pointing to that hash
    const hash = tempHash;

    // 3) Preflight checks
    const w = wallets[0];
    const eth = await w.getEthereumProvider();
    const provider = new ethers.BrowserProvider(eth as any);
    const signer = await provider.getSigner();
    const contractRO = new ethers.Contract(CERTIFICATE_REGISTRY_ADDRESS, CERTIFICATE_REGISTRY_ABI, provider);
    const contract = new ethers.Contract(CERTIFICATE_REGISTRY_ADDRESS, CERTIFICATE_REGISTRY_ABI, signer);

    const iss: string = await contractRO.issuer();
    const from = await signer.getAddress();
    if (iss.toLowerCase() !== from.toLowerCase()) {
      throw new Error(`Connected wallet is not issuer. Issuer: ${iss}`);
    }
    
    const existing = await contractRO.getCertificate(hash);
    if (existing && existing.metadataURI && existing.metadataURI.length > 0) {
      throw new Error("Certificate already registered for this hash");
    }

    // 4) Onchain register
    const metadataURI = verifyUrl;
    const tx = await contract.register(hash, metadataURI);
    const receipt = await tx.wait();

    // Convert Uint8Array to base64
    const uint8ArrayToBase64 = (bytes: Uint8Array): string => {
      let binary = '';
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      return btoa(binary);
    };

    const pdfBase64String = uint8ArrayToBase64(finalPdfBytes);
    
    // Verify base64 encoding works correctly (decode and check size matches)
    const decodedBytes = Uint8Array.from(atob(pdfBase64String), c => c.charCodeAt(0));
    if (decodedBytes.length !== finalPdfBytes.length) {
      console.error("Base64 encoding error! Original size:", finalPdfBytes.length, "Decoded size:", decodedBytes.length);
      throw new Error("PDF base64 encoding verification failed.");
    }
    console.log("PDF base64 encoding verified. Size matches:", finalPdfBytes.length, "bytes");
    console.log("Hash for blockchain:", hash);
    console.log("Note: Hash is computed from PDF without QR code. Final PDF includes QR code for verification.");
    console.log("Final PDF hash (with QR):", finalPdfHash);

    // 5) Save to DB
    await fetch('/api/certificates', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        adminAddress: from,
        adminId: admin?.adminId || "",
        programId,
        studentName,
        studentId,
        date,
        hash,
        txHash: receipt?.hash,
        verifyUrl,
        pdfBase64: pdfBase64String,
        finalPdfHash
      })
    });

    setResult({
      hash,
      txHash: receipt?.hash,
      verifyUrl,
      pdfBase64: pdfBase64String,
      finalPdfHash
    });
    
    // Clean up
    document.body.removeChild(tempContainer);
    
    // Reset form
    setStudentName("");
    setStudentId("");
    setProgramId("");
    setProgramName("");
    setDate("");
  } catch (err: any) {
    setError(err?.message || "Failed to issue certificate");
    // Clean up temp container if it exists
    const tempContainer = document.querySelector('div[style*="-9999px"]');
    if (tempContainer) {
      document.body.removeChild(tempContainer);
    }
  } finally {
    setLoading(false);
  }
};

  return (
    <AppShell>
      <div className="max-w-3xl">
      <div className="rounded-md border p-5">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Issue Certificate</h1>
        </div>
        <div className="mt-4">
          <WalletConnection showOnChainIssuer={true} showSwitchChain={true} />
        </div>
        {programs.length === 0 && wallets.length > 0 && (
          <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            No programs found. Please create a program first from the Programs page.
          </div>
        )}
      </div>

      <div className="mt-6 rounded-md border p-5">
        <h2 className="text-base font-semibold">Certificate Details</h2>
        <form onSubmit={submit} className="mt-4 grid gap-4">
            <div>
            <label className="mb-1 block text-sm font-medium">Student Name *</label>
            <input
              className="h-11 w-full rounded-md border px-3 text-sm outline-none focus:ring-2"
              placeholder="Enter student name"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              required
              disabled={loading}
            />
            </div>

            <div>
            <label className="mb-1 block text-sm font-medium">Student ID *</label>
            <input
              className="h-11 w-full rounded-md border px-3 text-sm outline-none focus:ring-2"
              placeholder="Enter student ID"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              required
              disabled={loading}
            />
            </div>

            <div>
            <label className="mb-1 block text-sm font-medium">Program *</label>
            {programs.length > 0 ? (
              <select
                className="h-11 w-full rounded-md border bg-white px-3 text-sm"
                value={programId}
                onChange={(e) => {
                  setProgramId(e.target.value);
                  const found = programs.find((p: any) => p._id === e.target.value);
                  setProgramName(found ? `${found.name} (${found.code})` : "");
                }}
                required
                disabled={loading}
              >
                <option value="">Select a program</option>
                {programs.map((p: any) => (
                  <option key={p._id} value={p._id}>{p.name} ({p.code})</option>
                ))}
              </select>
            ) : (
              <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                No programs found. Please create a program first.
              </div>
            )}
            </div>

            <div>
            <label className="mb-1 block text-sm font-medium">Issue Date *</label>
            <input
              type="date"
              className="h-11 w-full rounded-md border px-3 text-sm outline-none focus:ring-2"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              disabled={loading}
            />
            </div>

          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
          )}

          <button type="submit" disabled={loading || !wallets.length || !programId} className="btn btn-primary h-11">
            {loading ? "Issuing Certificate..." : "Issue Certificate"}
          </button>
          </form>

          {result && (
            <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
              <div className="font-semibold">Certificate Issued Successfully</div>
              <div className="mt-2 grid gap-1">
                <div>
                  <strong>Hash:</strong> <code className="rounded bg-white px-1 py-0.5">{result.hash}</code>
                </div>
                <div>
                  <strong>Transaction:</strong> <code className="rounded bg-white px-1 py-0.5">{result.txHash}</code>
                </div>
                <div>
                  <strong>Verify URL:</strong>{" "}
                  <a className="text-emerald-700 underline" href={result.verifyUrl} target="_blank" rel="noopener noreferrer">{result.verifyUrl}</a>
                </div>
                {result.pdfBase64 && (
                  <div className="mt-1">
                    <a
                      download={`certificate-${studentId || "cert"}.pdf`}
                      href={`data:application/pdf;base64,${result.pdfBase64}`}
                      className="btn btn-ghost h-9 px-3"
                    >
                      Download PDF Certificate
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
} 
