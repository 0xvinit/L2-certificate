"use client";
import { useEffect, useState } from "react";
import { sha256HexBytes } from "../../lib/sha256";

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

  const verifyFromBytes = async (bytes: ArrayBuffer) => {
    setVerifying(true);
    try {
      const h = await sha256HexBytes(bytes);
      setHash(h);
      await verifyHash(h);
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
    <div style={{ 
      minHeight: "100vh", 
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      padding: "24px"
    }}>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        {/* Header */}
        <div style={{
          background: "white",
          borderRadius: "20px",
          padding: "48px 32px",
          marginBottom: "32px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
          textAlign: "center"
        }}>
          <div style={{
            width: "80px",
            height: "80px",
            margin: "0 auto 24px",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "40px"
          }}>
            🎓
          </div>
          <h1 style={{ 
            margin: "0 0 12px 0", 
            fontSize: "42px", 
            fontWeight: 800, 
            color: "#1a202c",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent"
          }}>
            Certificate Verification
          </h1>
          <p style={{ 
            margin: 0, 
            color: "#718096", 
            fontSize: "18px",
            maxWidth: "600px",
            marginLeft: "auto",
            marginRight: "auto"
          }}>
            Verify the authenticity of your certificate on the blockchain. Enter a hash, upload a PDF, or provide a URL.
          </p>
        </div>

        {/* Verification Result */}
        {(data || fileResult) && (
          <div style={{
            background: "white",
            borderRadius: "20px",
            padding: "32px",
            marginBottom: "32px",
            boxShadow: "0 10px 40px rgba(0,0,0,0.2)"
          }}>
            {statusInfo && (
              <div style={{
                padding: "32px",
                background: statusInfo.bg,
                borderRadius: "16px",
                marginBottom: "32px",
                textAlign: "center",
                border: `3px solid ${statusInfo.borderColor}`
              }}>
                <div style={{
                  width: "100px",
                  height: "100px",
                  margin: "0 auto 20px",
                  background: statusInfo.iconBg,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "48px",
                  color: "white",
                  fontWeight: "bold",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.2)"
                }}>
                  {statusInfo.icon}
                </div>
                <h2 style={{ 
                  margin: "0 0 12px 0", 
                  fontSize: "32px", 
                  fontWeight: 700, 
                  color: statusInfo.color 
                }}>
                  {statusInfo.text}
                </h2>
                <p style={{ margin: 0, color: "#1a202c", fontSize: "16px", fontWeight: 500 }}>
                  {statusInfo.desc}
                </p>
              </div>
            )}

            {data?.certificate && (
              <div style={{
                padding: "24px",
                background: "linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%)",
                borderRadius: "16px",
                marginBottom: "24px",
                border: "2px solid #e2e8f0"
              }}>
                <h3 style={{ 
                  margin: "0 0 20px 0", 
                  fontSize: "22px", 
                  fontWeight: 700, 
                  color: "#1a202c",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px"
                }}>
                  <span style={{ fontSize: "28px" }}>📜</span>
                  Certificate Details
                </h3>
                <div style={{ 
                  display: "grid", 
                  gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", 
                  gap: "20px" 
                }}>
                  {data.certificate.studentName && (
                    <div style={{
                      padding: "16px",
                      background: "white",
                      borderRadius: "12px",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
                    }}>
                      <div style={{ fontSize: "12px", color: "#718096", marginBottom: "6px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>Student Name</div>
                      <div style={{ fontSize: "18px", fontWeight: 700, color: "#1a202c" }}>{data.certificate.studentName}</div>
                    </div>
                  )}
                  {data.certificate.studentId && (
                    <div style={{
                      padding: "16px",
                      background: "white",
                      borderRadius: "12px",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
                    }}>
                      <div style={{ fontSize: "12px", color: "#718096", marginBottom: "6px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>Student ID</div>
                      <div style={{ fontSize: "18px", fontWeight: 700, color: "#1a202c" }}>{data.certificate.studentId}</div>
                    </div>
                  )}
                  {data.certificate.university && (
                    <div style={{
                      padding: "16px",
                      background: "white",
                      borderRadius: "12px",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
                    }}>
                      <div style={{ fontSize: "12px", color: "#718096", marginBottom: "6px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>University</div>
                      <div style={{ fontSize: "18px", fontWeight: 700, color: "#1a202c" }}>{data.certificate.university}</div>
                    </div>
                  )}
                  {data.certificate.programName && (
                    <div style={{
                      padding: "16px",
                      background: "white",
                      borderRadius: "12px",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
                    }}>
                      <div style={{ fontSize: "12px", color: "#718096", marginBottom: "6px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>Program</div>
                      <div style={{ fontSize: "18px", fontWeight: 700, color: "#1a202c" }}>
                        {data.certificate.programName}
                        {data.certificate.programCode && <span style={{ fontSize: "14px", color: "#718096", fontWeight: 500 }}> ({data.certificate.programCode})</span>}
                      </div>
                    </div>
                  )}
                  {data.certificate.date && (
                    <div style={{
                      padding: "16px",
                      background: "white",
                      borderRadius: "12px",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
                    }}>
                      <div style={{ fontSize: "12px", color: "#718096", marginBottom: "6px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>Issue Date</div>
                      <div style={{ fontSize: "18px", fontWeight: 700, color: "#1a202c" }}>{data.certificate.date}</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div style={{
              padding: "20px",
              background: "#f7fafc",
              borderRadius: "12px",
              fontSize: "14px",
              color: "#1a202c",
              border: "1px solid #e2e8f0"
            }}>
              <div style={{ marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "18px" }}>🔐</span>
                <strong style={{ fontSize: "16px" }}>Certificate Hash:</strong>
              </div>
              <code style={{ 
                display: "block",
                background: "white", 
                padding: "12px 16px", 
                borderRadius: "8px",
                fontFamily: "monospace",
                fontSize: "13px",
                color: "#1a202c",
                wordBreak: "break-all",
                border: "1px solid #e2e8f0"
              }}>
                {hash || data?.hash || "N/A"}
              </code>
              {data?.issuanceTimestamp && (
                <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px solid #e2e8f0" }}>
                  <strong>Issued On:</strong> {new Date(data.issuanceTimestamp * 1000).toLocaleString()}
                </div>
              )}
              {data?.certificate?.txHash && (
                <div style={{ marginTop: "12px" }}>
                  <strong>Transaction:</strong>{" "}
                  <a 
                    href={`https://amoy.polygonscan.com/tx/${data.certificate.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ 
                      color: "#667eea", 
                      textDecoration: "underline",
                      fontWeight: 600
                    }}
                  >
                    View on Polygonscan
                  </a>
                  <span style={{ marginLeft: "8px", color: "#718096", fontFamily: "monospace", fontSize: "12px" }}>
                    ({data.certificate.txHash.slice(0, 10)}...{data.certificate.txHash.slice(-8)})
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Verification Methods */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "24px", marginBottom: "32px" }}>
          {/* Hash Input */}
          <div style={{
            background: "white",
            borderRadius: "20px",
            padding: "28px",
            boxShadow: "0 10px 40px rgba(0,0,0,0.2)"
          }}>
            <div style={{ fontSize: "32px", marginBottom: "16px" }}>🔑</div>
            <h2 style={{ margin: "0 0 16px 0", fontSize: "20px", fontWeight: 700, color: "#1a202c" }}>
              Verify by Hash
            </h2>
            <p style={{ margin: "0 0 20px 0", fontSize: "14px", color: "#718096", lineHeight: "1.6" }}>
              Enter the certificate hash directly
            </p>
            <form onSubmit={onVerifyHash} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <input 
                placeholder="Enter 64-character hash" 
                value={hashInput} 
                onChange={(e) => setHashInput(e.target.value)}
                style={{ 
                  width: "100%",
                  padding: "14px 16px", 
                  borderRadius: "10px", 
                  border: "2px solid #e2e8f0",
                  fontSize: "14px",
                  color: "#1a202c",
                  fontFamily: "monospace",
                  boxSizing: "border-box"
                }}
              />
              <button 
                type="submit"
                disabled={loading || !hashInput.trim()}
                style={{
                  padding: "14px 24px",
                  background: (loading || !hashInput.trim()) ? "#cbd5e0" : "#667eea",
                  color: "white",
                  border: "none",
                  borderRadius: "10px",
                  fontWeight: 600,
                  cursor: (loading || !hashInput.trim()) ? "not-allowed" : "pointer",
                  fontSize: "15px",
                  transition: "all 0.2s"
                }}
              >
                {loading ? "Verifying..." : "Verify Hash"}
              </button>
            </form>
          </div>

          {/* PDF Upload */}
          <div style={{
            background: "white",
            borderRadius: "20px",
            padding: "28px",
            boxShadow: "0 10px 40px rgba(0,0,0,0.2)"
          }}>
            <div style={{ fontSize: "32px", marginBottom: "16px" }}>📄</div>
            <h2 style={{ margin: "0 0 16px 0", fontSize: "20px", fontWeight: 700, color: "#1a202c" }}>
              Upload PDF
            </h2>
            <p style={{ margin: "0 0 20px 0", fontSize: "14px", color: "#718096", lineHeight: "1.6" }}>
              Upload your certificate PDF file
            </p>
            <form onSubmit={onVerifyFile} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={{ 
                  display: "block", 
                  marginBottom: "8px", 
                  fontSize: "14px", 
                  fontWeight: 600,
                  color: "#1a202c"
                }}>
                  Select PDF File
                </label>
                <input 
                  type="file" 
                  accept="application/pdf" 
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  style={{ 
                    width: "100%",
                    padding: "12px", 
                    borderRadius: "10px", 
                    border: "2px solid #e2e8f0",
                    fontSize: "14px",
                    color: "#1a202c",
                    boxSizing: "border-box"
                  }}
                />
              </div>
              <button 
                type="submit" 
                disabled={!file || verifying}
                style={{
                  padding: "14px 24px",
                  background: (!file || verifying) ? "#cbd5e0" : "#667eea",
                  color: "white",
                  border: "none",
                  borderRadius: "10px",
                  fontWeight: 600,
                  cursor: (!file || verifying) ? "not-allowed" : "pointer",
                  fontSize: "15px",
                  transition: "all 0.2s"
                }}
              >
                {verifying ? "Verifying..." : "Verify PDF"}
              </button>
            </form>
          </div>

          {/* PDF URL */}
          <div style={{
            background: "white",
            borderRadius: "20px",
            padding: "28px",
            boxShadow: "0 10px 40px rgba(0,0,0,0.2)"
          }}>
            <div style={{ fontSize: "32px", marginBottom: "16px" }}>🔗</div>
            <h2 style={{ margin: "0 0 16px 0", fontSize: "20px", fontWeight: 700, color: "#1a202c" }}>
              Verify by URL
            </h2>
            <p style={{ margin: "0 0 20px 0", fontSize: "14px", color: "#718096", lineHeight: "1.6" }}>
              Provide PDF URL or IPFS link
            </p>
            <form onSubmit={onVerifyUrl} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <input 
                placeholder="https://example.com/cert.pdf or ipfs://Qm..." 
                value={url} 
                onChange={(e) => setUrl(e.target.value)}
                style={{ 
                  width: "100%",
                  padding: "14px 16px", 
                  borderRadius: "10px", 
                  border: "2px solid #e2e8f0",
                  fontSize: "14px",
                  color: "#1a202c",
                  boxSizing: "border-box"
                }}
              />
              <button 
                type="submit"
                disabled={!url.trim() || verifying}
                style={{
                  padding: "14px 24px",
                  background: (!url.trim() || verifying) ? "#cbd5e0" : "#667eea",
                  color: "white",
                  border: "none",
                  borderRadius: "10px",
                  fontWeight: 600,
                  cursor: (!url.trim() || verifying) ? "not-allowed" : "pointer",
                  fontSize: "15px",
                  transition: "all 0.2s"
                }}
              >
                {verifying ? "Verifying..." : "Verify from URL"}
              </button>
            </form>
          </div>
        </div>

        {/* Error Display */}
        {(data?.error || fileResult?.error) && (
          <div style={{
            padding: "20px",
            background: "#fee2e2",
            borderRadius: "16px",
            color: "#991b1b",
            border: "2px solid #ef4444",
            fontSize: "15px"
          }}>
            <strong>Error:</strong> {data?.error || fileResult?.error}
          </div>
        )}
      </div>
    </div>
  );
}
