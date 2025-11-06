"use client";
import { useState, useEffect } from "react";
import type React from "react";

import { ethers } from "ethers";
import {
  CERTIFICATE_REGISTRY_ABI,
  CERTIFICATE_REGISTRY_ADDRESS,
} from "../../lib/contract";
import { sha256HexBytes } from "../../lib/sha256";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import WalletConnection from "@/components/WalletConnection";
import AppShell from "@/components/AppShell";
import CertificateTemplate from "@/components/CertificateTemplate";
import {
  generatePDFFromHTML,
  addQRCodeToElement,
} from "../../lib/pdfGenerator";
import { createRoot } from "react-dom/client";
import { AlertCircle, CheckCircle2, FileText, Award } from "lucide-react";

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

  const loadPrograms = async (addr: string) => {
    try {
      const res = await fetch(`/api/programs?admin=${addr.toLowerCase()}`, {
        credentials: "include",
      });
      const data = await res.json();
      setPrograms(data || []);
    } catch {}
  };

  const loadProgramsByAdminId = async (adminIdVal: string) => {
    try {
      const res = await fetch(
        `/api/programs?adminId=${adminIdVal.toLowerCase()}`,
        { credentials: "include" }
      );
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
      if (!CERTIFICATE_REGISTRY_ADDRESS)
        throw new Error("Contract address missing");
      if (!programId) throw new Error("Please select a program");

      const selectedProgram = programs.find((p: any) => p._id === programId);
      if (!selectedProgram) throw new Error("Invalid program selected");

      const universityName = admin?.university || "";

      const gw = (
        process.env.NEXT_PUBLIC_IPFS_GATEWAY || "https://ipfs.io/ipfs/"
      ).replace(/\/?$/, "/");
      const logoUrlHttp = selectedProgram.logoUrl?.startsWith("ipfs://")
        ? gw + selectedProgram.logoUrl.replace("ipfs://", "")
        : selectedProgram.logoUrl || "";
      const signatureUrlHttp = selectedProgram.signatureUrl?.startsWith(
        "ipfs://"
      )
        ? gw + selectedProgram.signatureUrl.replace("ipfs://", "")
        : selectedProgram.signatureUrl || "";

      const tempContainer = document.createElement("div");
      tempContainer.style.position = "absolute";
      tempContainer.style.left = "-9999px";
      tempContainer.style.top = "0";
      document.body.appendChild(tempContainer);

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
        setTimeout(resolve, 3000);
      });

      const baseUrl =
        process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

      const tempPdfBlob = (await generatePDFFromHTML(certificateElement, {
        returnBlob: true,
      })) as Blob;
      const tempPdfBytes = new Uint8Array(await tempPdfBlob.arrayBuffer());
      const tempHash = await sha256HexBytes(tempPdfBytes);

      const verifyUrl = `${baseUrl}/verify?h=${tempHash}`;
      await addQRCodeToElement(certificateElement, verifyUrl);

      await new Promise((resolve) => setTimeout(resolve, 500));

      const finalPdfBlob = (await generatePDFFromHTML(certificateElement, {
        returnBlob: true,
      })) as Blob;
      const finalPdfBytes = new Uint8Array(await finalPdfBlob.arrayBuffer());
      const finalPdfHash = await sha256HexBytes(finalPdfBytes);

      const hash = tempHash;

      const w = wallets[0];
      const eth = await w.getEthereumProvider();
      const provider = new ethers.BrowserProvider(eth as any);
      const signer = await provider.getSigner();
      const contractRO = new ethers.Contract(
        CERTIFICATE_REGISTRY_ADDRESS,
        CERTIFICATE_REGISTRY_ABI,
        provider
      );
      const contract = new ethers.Contract(
        CERTIFICATE_REGISTRY_ADDRESS,
        CERTIFICATE_REGISTRY_ABI,
        signer
      );

      const iss: string = await contractRO.issuer();
      const from = await signer.getAddress();
      if (iss.toLowerCase() !== from.toLowerCase()) {
        throw new Error(`Connected wallet is not issuer. Issuer: ${iss}`);
      }

      const existing = await contractRO.getCertificate(hash);
      if (existing && existing.metadataURI && existing.metadataURI.length > 0) {
        throw new Error("Certificate already registered for this hash");
      }

      const metadataURI = verifyUrl;
      const tx = await contract.register(hash, metadataURI);
      const receipt = await tx.wait();

      const uint8ArrayToBase64 = (bytes: Uint8Array): string => {
        let binary = "";
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
      };

      const pdfBase64String = uint8ArrayToBase64(finalPdfBytes);

      const decodedBytes = Uint8Array.from(atob(pdfBase64String), (c) =>
        c.charCodeAt(0)
      );
      if (decodedBytes.length !== finalPdfBytes.length) {
        throw new Error("PDF base64 encoding verification failed.");
      }

      await fetch("/api/certificates", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
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
          finalPdfHash,
        }),
      });

      setResult({
        hash,
        txHash: receipt?.hash,
        verifyUrl,
        pdfBase64: pdfBase64String,
        finalPdfHash,
      });

      document.body.removeChild(tempContainer);

      setStudentName("");
      setStudentId("");
      setProgramId("");
      setProgramName("");
      setDate("");
    } catch (err: any) {
      setError(err?.message || "Failed to issue certificate");
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
      {/* Background linear overlays */}
      <div className="absolute top-[10%] left-[5%] w-[300px] h-[300px] bg-sky-400/20 blur-3xl opacity-100 rounded-full z-0 pointer-events-none" />
      <div className="absolute bottom-[20%] right-[8%] w-[250px] h-[250px] bg-blue-400/25 blur-3xl opacity-100 rounded-full z-0 pointer-events-none" />

      <div className="mb-12 relative z-10">
        <div className="text-center">
          <h1 className="text-4xl lg:text-5xl font-bold tracking-tight text-gray-900 font-cairo uppercase">
            Issue Certificate
          </h1>
          <p className="mt-4 text-lg text-gray-700 font-poppins max-w-2xl mx-auto">
            Create and issue new blockchain certificates to students
          </p>
        </div>
      </div>

      {/* Wallet Connection Card */}
      <div className="mb-8 rounded-3xl bg-white/60 backdrop-blur-xl border-2 border-sky-100 p-6 transition-all duration-500 hover:shadow-2xl hover:shadow-sky-200/30 relative z-10">
        <WalletConnection showOnChainIssuer={true} showSwitchChain={true} />
      </div>

      {programs.length === 0 && wallets.length > 0 && (
        <div className="mb-8 rounded-2xl bg-linear-to-br from-amber-50 to-amber-50/40 p-5 border-2 border-amber-200/60 flex items-start gap-4 relative z-10">
          <div className="rounded-full bg-amber-100 p-2">
            <AlertCircle className="h-6 w-6 text-amber-600 shrink-0" />
          </div>
          <div>
            <p className="font-bold text-amber-900 font-cairo text-lg uppercase">
              No Programs Found
            </p>
            <p className="text-base text-amber-800 mt-2 font-poppins">
              Please create a program first from the Programs page
            </p>
          </div>
        </div>
      )}

      {/* Certificate Details Form */}
      <div className="rounded-3xl bg-white/60 backdrop-blur-xl border-2 border-sky-100 p-8 transition-all duration-500 hover:shadow-2xl hover:shadow-sky-200/30 relative z-10">
        <div className="flex items-center gap-4 mb-8">
          <div className="rounded-full bg-linear-to-br from-[#28aeec] to-sky-400 p-4 shadow-lg">
            <FileText className="h-7 w-7 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 font-cairo uppercase">
              Certificate Details
            </h2>
            <p className="text-base text-gray-700 mt-1 font-poppins">
              Fill in the student and program information
            </p>
          </div>
        </div>

        <form onSubmit={submit} className="space-y-6">
          <div className="grid sm:grid-cols-2 gap-6">
            {/* Student Name */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 font-cairo uppercase">
                Student Name
              </label>
              <input
                className="w-full h-14 rounded-xl border-2 border-sky-100 bg-white px-4 text-base outline-none transition-all focus:border-[#28aeec] focus:ring-4 focus:ring-sky-100/50 font-poppins"
                placeholder="Enter student name"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            {/* Student ID */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 font-cairo uppercase">
                Student ID
              </label>
              <input
                className="w-full h-14 rounded-xl border-2 border-sky-100 bg-white px-4 text-base outline-none transition-all focus:border-[#28aeec] focus:ring-4 focus:ring-sky-100/50 font-poppins"
                placeholder="Enter student ID"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            {/* Program */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 font-cairo uppercase">
                Program
              </label>
              {programs.length > 0 ? (
                <select
                  className="w-full h-14 rounded-xl border-2 border-sky-100 bg-white px-4 text-base outline-none transition-all focus:border-[#28aeec] focus:ring-4 focus:ring-sky-100/50 font-poppins"
                  value={programId}
                  onChange={(e) => {
                    setProgramId(e.target.value);
                    const found = programs.find(
                      (p: any) => p._id === e.target.value
                    );
                    setProgramName(
                      found ? `${found.name} (${found.code})` : ""
                    );
                  }}
                  required
                  disabled={loading}
                >
                  <option value="">Select a program</option>
                  {programs.map((p: any) => (
                    <option key={p._id} value={p._id}>
                      {p.name} ({p.code})
                    </option>
                  ))}
                </select>
              ) : (
                <div className="rounded-xl border-2 border-amber-200/60 bg-amber-50/40 px-4 py-4 text-base text-amber-800 font-poppins">
                  No programs available
                </div>
              )}
            </div>

            {/* Issue Date */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 font-cairo uppercase">
                Issue Date
              </label>
              <input
                type="date"
                className="w-full h-14 rounded-xl border-2 border-sky-100 bg-white px-4 text-base outline-none transition-all focus:border-[#28aeec] focus:ring-4 focus:ring-sky-100/50 font-poppins"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                disabled={loading}
              />
            </div>
          </div>

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

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !wallets.length || !programId}
            className="w-full h-14 rounded-xl bg-linear-to-r from-[#28aeec] to-sky-400 text-white font-bold transition-all duration-300 hover:shadow-xl hover:shadow-sky-200/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-poppins text-lg uppercase hover:scale-105"
          >
            <Award className="h-6 w-6" />
            {loading ? "Issuing Certificate..." : "Issue Certificate"}
          </button>
        </form>

        {/* Success Message */}
        {result && (
          <div className="mt-8 rounded-2xl bg-linear-to-br from-emerald-50 to-emerald-50/40 p-6 border-2 border-emerald-200/60">
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-emerald-100 p-2">
                <CheckCircle2 className="h-7 w-7 text-emerald-600 shrink-0" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-emerald-900 font-cairo text-xl uppercase">
                  Certificate Issued Successfully
                </p>
                <div className="mt-5 space-y-4">
                  <div className="rounded-xl bg-white/60 border-2 border-emerald-100 p-4">
                    <p className="text-sm text-gray-600 font-cairo font-bold uppercase mb-2">
                      Hash
                    </p>
                    <code className="text-sm text-gray-900 font-mono break-all">
                      {result.hash}
                    </code>
                  </div>
                  <div className="rounded-xl bg-white/60 border-2 border-emerald-100 p-4">
                    <p className="text-sm text-gray-600 font-cairo font-bold uppercase mb-2">
                      Transaction
                    </p>
                    <code className="text-sm text-gray-900 font-mono break-all">
                      {result.txHash}
                    </code>
                  </div>
                  {result.pdfBase64 && (
                    <a
                      download={`certificate-${studentId || "cert"}.pdf`}
                      href={`data:application/pdf;base64,${result.pdfBase64}`}
                      className="inline-flex h-12 items-center gap-2 rounded-xl bg-linear-to-r from-emerald-600 to-emerald-700 px-6 text-base font-bold text-white hover:shadow-xl hover:shadow-emerald-200/50 transition-all font-poppins uppercase hover:scale-105"
                    >
                      Download Certificate PDF
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
