"use client";
import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { CERTIFICATE_REGISTRY_ABI, CERTIFICATE_REGISTRY_ADDRESS } from "../../lib/contract";
import { sha256HexBytes } from "../../lib/sha256";
import QRCode from "qrcode";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import Link from "next/link";
import WalletConnection from "@/components/WalletConnection";

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
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      if (wallets.length > 0) {
        const w = wallets[0];
        const addr = w.address;
        
        try {
          // Load programs for this wallet address
          await loadPrograms(addr);
        } catch {}
      }
    })();
  }, [wallets]);

  const loadPrograms = async (addr: string) => {
    try {
      const res = await fetch(`/api/programs?admin=${addr.toLowerCase()}`);
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

      // 1) Generate PDF
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([595.28, 841.89]);
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const titleSize = 24;
      const textSize = 12;
      
      page.drawText("Certificate of Completion", { x: 160, y: 780, size: titleSize, font, color: rgb(0, 0, 0) });
      page.drawText(`Name: ${studentName}`, { x: 80, y: 720, size: textSize, font });
      page.drawText(`ID: ${studentId}`, { x: 80, y: 700, size: textSize, font });
      page.drawText(`Program: ${programName}`, { x: 80, y: 680, size: textSize, font });
      page.drawText(`Date: ${date}`, { x: 80, y: 660, size: textSize, font });

      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
      const verifyUrlForQR = `${baseUrl}/verify`;
      const qrDataUrl = await QRCode.toDataURL(verifyUrlForQR, { margin: 1, width: 160 });
      const qrBase64 = qrDataUrl.split(",")[1];
      const qrImage = await pdfDoc.embedPng(Buffer.from(qrBase64, "base64"));
      const { width, height } = qrImage.size();
      page.drawImage(qrImage, { x: 400, y: 640, width, height });
      
      const pdfBytes = await pdfDoc.save();

      // 2) Compute hash from PDF bytes
      const hash = await sha256HexBytes(pdfBytes);
      const verifyUrl = `${baseUrl}/verify?h=${hash}`;

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
          verifyUrl
        })
      });

      setResult({
        hash,
        txHash: receipt?.hash,
        verifyUrl,
        pdfBase64: Buffer.from(pdfBytes).toString("base64")
      });
      
      // Reset form
      setStudentName("");
      setStudentId("");
      setProgramId("");
      setProgramName("");
      setDate("");
    } catch (err: any) {
      setError(err?.message || "Failed to issue certificate");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: "100vh", 
      background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
      padding: "24px"
    }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <div style={{
          background: "white",
          borderRadius: "16px",
          padding: "24px",
          marginBottom: "24px",
          boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <h1 style={{ margin: 0, fontSize: "28px", fontWeight: 700, color: "#1a202c" }}>Issue Certificate</h1>
            <Link href="/admin/dashboard" style={{
              padding: "8px 16px",
              background: "#667eea",
              color: "white",
              textDecoration: "none",
              borderRadius: "8px",
              fontWeight: 600,
              fontSize: "14px"
            }}>← Back to Dashboard</Link>
          </div>

          <WalletConnection showOnChainIssuer={true} showSwitchChain={true} />

          {programs.length === 0 && wallets.length > 0 && (
            <div style={{
              padding: "12px",
              background: "#fef3c7",
              borderRadius: "8px",
              marginTop: "16px",
              fontSize: "14px",
              color: "#92400e"
            }}>
              ⚠️ No programs found. Please create a program first from the Programs page.
            </div>
          )}
        </div>

        <div style={{
          background: "white",
          borderRadius: "16px",
          padding: "24px",
          boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
        }}>
          <h2 style={{ margin: "0 0 24px 0", fontSize: "20px", fontWeight: 600, color: "#1a202c" }}>Certificate Details</h2>
          
          <form onSubmit={submit} style={{ display: "grid", gap: "20px" }}>
            <div>
              <label style={{ 
                display: "block", 
                marginBottom: "8px", 
                fontSize: "14px", 
                fontWeight: 600,
                color: "#1a202c"
              }}>
                Student Name *
              </label>
              <input 
                placeholder="Enter student name" 
                value={studentName} 
                onChange={(e) => setStudentName(e.target.value)} 
                required
                disabled={loading}
                style={{ 
                  width: "100%",
                  padding: "12px 16px", 
                  borderRadius: "8px", 
                  border: "2px solid #e2e8f0",
                  fontSize: "14px",
                  color: "#1a202c",
                  boxSizing: "border-box"
                }}
              />
            </div>

            <div>
              <label style={{ 
                display: "block", 
                marginBottom: "8px", 
                fontSize: "14px", 
                fontWeight: 600,
                color: "#1a202c"
              }}>
                Student ID *
              </label>
              <input 
                placeholder="Enter student ID" 
                value={studentId} 
                onChange={(e) => setStudentId(e.target.value)} 
                required
                disabled={loading}
                style={{ 
                  width: "100%",
                  padding: "12px 16px", 
                  borderRadius: "8px", 
                  border: "2px solid #e2e8f0",
                  fontSize: "14px",
                  color: "#1a202c",
                  boxSizing: "border-box"
                }}
              />
            </div>

            <div>
              <label style={{ 
                display: "block", 
                marginBottom: "8px", 
                fontSize: "14px", 
                fontWeight: 600,
                color: "#1a202c"
              }}>
                Program *
              </label>
              {programs.length > 0 ? (
                <select 
                  value={programId} 
                  onChange={(e) => {
                    setProgramId(e.target.value);
                    const found = programs.find((p: any) => p._id === e.target.value);
                    setProgramName(found ? `${found.name} (${found.code})` : "");
                  }} 
                  required
                  disabled={loading}
                  style={{ 
                    width: "100%",
                    padding: "12px 16px", 
                    borderRadius: "8px", 
                    border: "2px solid #e2e8f0",
                    fontSize: "14px",
                    color: "#1a202c",
                    boxSizing: "border-box",
                    background: "white"
                  }}
                >
                  <option value="">Select a program</option>
                  {programs.map((p: any) => (
                    <option key={p._id} value={p._id}>{p.name} ({p.code})</option>
                  ))}
                </select>
              ) : (
                <div style={{ 
                  padding: "12px", 
                  background: "#fef3c7", 
                  color: "#92400e", 
                  borderRadius: "8px",
                  fontSize: "14px"
                }}>
                  No programs found. Please create a program first.
                </div>
              )}
            </div>

            <div>
              <label style={{ 
                display: "block", 
                marginBottom: "8px", 
                fontSize: "14px", 
                fontWeight: 600,
                color: "#1a202c"
              }}>
                Issue Date *
              </label>
              <input 
                type="date"
                value={date} 
                onChange={(e) => setDate(e.target.value)} 
                required
                disabled={loading}
                style={{ 
                  width: "100%",
                  padding: "12px 16px", 
                  borderRadius: "8px", 
                  border: "2px solid #e2e8f0",
                  fontSize: "14px",
                  color: "#1a202c",
                  boxSizing: "border-box"
                }}
              />
            </div>

            {error && (
              <div style={{ 
                padding: "12px",
                background: "#fee2e2",
                color: "#991b1b",
                borderRadius: "8px",
                fontSize: "14px"
              }}>
                {error}
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading || !wallets.length || !programId}
              style={{
                padding: "14px 24px",
                background: (loading || !wallets.length || !programId) ? "#cbd5e0" : "#667eea",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontWeight: 600,
                fontSize: "16px",
                cursor: (loading || !wallets.length || !programId) ? "not-allowed" : "pointer",
                transition: "background 0.2s"
              }}
            >
              {loading ? "Issuing Certificate..." : "Issue Certificate"}
            </button>
          </form>

          {result && (
            <div style={{
              marginTop: "24px",
              padding: "20px",
              background: "#d1fae5",
              borderRadius: "12px",
              border: "2px solid #10b981"
            }}>
              <h3 style={{ margin: "0 0 16px 0", fontSize: "18px", fontWeight: 600, color: "#065f46" }}>
                ✓ Certificate Issued Successfully!
              </h3>
              <div style={{ display: "grid", gap: "12px", fontSize: "14px", color: "#065f46" }}>
                <div><strong>Hash:</strong> <code style={{ background: "white", padding: "2px 6px", borderRadius: "4px" }}>{result.hash}</code></div>
                <div><strong>Transaction:</strong> <code style={{ background: "white", padding: "2px 6px", borderRadius: "4px" }}>{result.txHash}</code></div>
                <div><strong>Verify URL:</strong> <a href={result.verifyUrl} target="_blank" rel="noopener noreferrer" style={{ color: "#059669", textDecoration: "underline" }}>{result.verifyUrl}</a></div>
                {result.pdfBase64 && (
                  <div style={{ marginTop: "8px" }}>
                    <a
                      download={`certificate-${studentId || "cert"}.pdf`}
                      href={`data:application/pdf;base64,${result.pdfBase64}`}
                      style={{
                        display: "inline-block",
                        padding: "10px 20px",
                        background: "#10b981",
                        color: "white",
                        textDecoration: "none",
                        borderRadius: "8px",
                        fontWeight: 600,
                        fontSize: "14px"
                      }}
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
    </div>
  );
}
