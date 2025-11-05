"use client"
import { useState, useEffect } from "react"
import type React from "react"

import { ethers } from "ethers"
import { CERTIFICATE_REGISTRY_ABI, CERTIFICATE_REGISTRY_ADDRESS } from "../../lib/contract"
import { sha256HexBytes } from "../../lib/sha256"
import { usePrivy, useWallets } from "@privy-io/react-auth"
import WalletConnection from "@/components/WalletConnection"
import AppShell from "@/components/AppShell"
import CertificateTemplate from "@/components/CertificateTemplate"
import { generatePDFFromHTML, addQRCodeToElement } from "../../lib/pdfGenerator"
import { createRoot } from "react-dom/client"
import { AlertCircle, CheckCircle2, FileText, Award } from "lucide-react"

export default function IssuePage() {
  const [studentName, setStudentName] = useState("")
  const [studentId, setStudentId] = useState("")
  const [programId, setProgramId] = useState("")
  const [programName, setProgramName] = useState("")
  const [date, setDate] = useState("")
  const [programs, setPrograms] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string>("")
  const [admin, setAdmin] = useState<any>(null)

  const { authenticated } = usePrivy()
  const { wallets } = useWallets()

  useEffect(() => {
    ;(async () => {
      const res = await fetch("/api/auth/me", { credentials: "include" })
      if (res.ok) {
        const data = await res.json()
        setAdmin(data)
        if (data?.adminId) {
          await loadProgramsByAdminId(data.adminId)
        }
      }
    })()
  }, [])

  const loadPrograms = async (addr: string) => {
    try {
      const res = await fetch(`/api/programs?admin=${addr.toLowerCase()}`, { credentials: "include" })
      const data = await res.json()
      setPrograms(data || [])
    } catch {}
  }

  const loadProgramsByAdminId = async (adminIdVal: string) => {
    try {
      const res = await fetch(`/api/programs?adminId=${adminIdVal.toLowerCase()}`, { credentials: "include" })
      const data = await res.json()
      setPrograms(data || [])
    } catch {}
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setResult(null)
    setError("")

    try {
      if (!wallets.length) throw new Error("Please connect your wallet")
      if (!CERTIFICATE_REGISTRY_ADDRESS) throw new Error("Contract address missing")
      if (!programId) throw new Error("Please select a program")

      const selectedProgram = programs.find((p: any) => p._id === programId)
      if (!selectedProgram) throw new Error("Invalid program selected")

      const universityName = admin?.university || ""

      const gw = (process.env.NEXT_PUBLIC_IPFS_GATEWAY || "https://ipfs.io/ipfs/").replace(/\/?$/, "/")
      const logoUrlHttp = selectedProgram.logoUrl?.startsWith("ipfs://")
        ? gw + selectedProgram.logoUrl.replace("ipfs://", "")
        : selectedProgram.logoUrl || ""
      const signatureUrlHttp = selectedProgram.signatureUrl?.startsWith("ipfs://")
        ? gw + selectedProgram.signatureUrl.replace("ipfs://", "")
        : selectedProgram.signatureUrl || ""

      const tempContainer = document.createElement("div")
      tempContainer.style.position = "absolute"
      tempContainer.style.left = "-9999px"
      tempContainer.style.top = "0"
      document.body.appendChild(tempContainer)

      const root = createRoot(tempContainer)
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
          />,
        )
        setTimeout(() => {
          const certificateElement = tempContainer.querySelector("#certificate-container") as HTMLElement
          if (certificateElement) {
            resolve()
          } else {
            setTimeout(resolve, 500)
          }
        }, 1000)
      })

      const certificateElement = tempContainer.querySelector("#certificate-container") as HTMLElement
      if (!certificateElement) throw new Error("Failed to render certificate template")

      await new Promise<void>((resolve) => {
        const images = certificateElement.querySelectorAll("img")
        let loaded = 0
        const total = images.length
        if (total === 0) {
          resolve()
          return
        }
        images.forEach((img) => {
          if (img.complete) {
            loaded++
            if (loaded === total) resolve()
          } else {
            img.onload = () => {
              loaded++
              if (loaded === total) resolve()
            }
            img.onerror = () => {
              loaded++
              if (loaded === total) resolve()
            }
          }
        })
        setTimeout(resolve, 3000)
      })

      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"

      const tempPdfBlob = (await generatePDFFromHTML(certificateElement, { returnBlob: true })) as Blob
      const tempPdfBytes = new Uint8Array(await tempPdfBlob.arrayBuffer())
      const tempHash = await sha256HexBytes(tempPdfBytes)

      const verifyUrl = `${baseUrl}/verify?h=${tempHash}`
      await addQRCodeToElement(certificateElement, verifyUrl)

      await new Promise((resolve) => setTimeout(resolve, 500))

      const finalPdfBlob = (await generatePDFFromHTML(certificateElement, { returnBlob: true })) as Blob
      const finalPdfBytes = new Uint8Array(await finalPdfBlob.arrayBuffer())
      const finalPdfHash = await sha256HexBytes(finalPdfBytes)

      const hash = tempHash

      const w = wallets[0]
      const eth = await w.getEthereumProvider()
      const provider = new ethers.BrowserProvider(eth as any)
      const signer = await provider.getSigner()
      const contractRO = new ethers.Contract(CERTIFICATE_REGISTRY_ADDRESS, CERTIFICATE_REGISTRY_ABI, provider)
      const contract = new ethers.Contract(CERTIFICATE_REGISTRY_ADDRESS, CERTIFICATE_REGISTRY_ABI, signer)

      const iss: string = await contractRO.issuer()
      const from = await signer.getAddress()
      if (iss.toLowerCase() !== from.toLowerCase()) {
        throw new Error(`Connected wallet is not issuer. Issuer: ${iss}`)
      }

      const existing = await contractRO.getCertificate(hash)
      if (existing && existing.metadataURI && existing.metadataURI.length > 0) {
        throw new Error("Certificate already registered for this hash")
      }

      const metadataURI = verifyUrl
      const tx = await contract.register(hash, metadataURI)
      const receipt = await tx.wait()

      const uint8ArrayToBase64 = (bytes: Uint8Array): string => {
        let binary = ""
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i])
        }
        return btoa(binary)
      }

      const pdfBase64String = uint8ArrayToBase64(finalPdfBytes)

      const decodedBytes = Uint8Array.from(atob(pdfBase64String), (c) => c.charCodeAt(0))
      if (decodedBytes.length !== finalPdfBytes.length) {
        throw new Error("PDF base64 encoding verification failed.")
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
      })

      setResult({
        hash,
        txHash: receipt?.hash,
        verifyUrl,
        pdfBase64: pdfBase64String,
        finalPdfHash,
      })

      document.body.removeChild(tempContainer)

      setStudentName("")
      setStudentId("")
      setProgramId("")
      setProgramName("")
      setDate("")
    } catch (err: any) {
      setError(err?.message || "Failed to issue certificate")
      const tempContainer = document.querySelector('div[style*="-9999px"]')
      if (tempContainer) {
        document.body.removeChild(tempContainer)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <AppShell>
      <div className="mb-12">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900">Issue Certificate</h1>
          <p className="mt-2 text-slate-500">Create and issue new certificates to students</p>
        </div>
      </div>

      {/* Wallet Connection Card */}
      <div className="mb-8 rounded-2xl bg-gradient-to-br from-slate-50 via-white to-slate-50/40 p-6 transition-all duration-300 hover:shadow-lg border border-slate-100/40 backdrop-blur-sm">
        <WalletConnection showOnChainIssuer={true} showSwitchChain={true} />
      </div>

      {programs.length === 0 && wallets.length > 0 && (
        <div className="mb-8 rounded-2xl bg-gradient-to-br from-amber-50 to-amber-50/40 p-4 border border-amber-200/60 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-900">No programs found</p>
            <p className="text-sm text-amber-800 mt-1">Please create a program first from the Programs page</p>
          </div>
        </div>
      )}

      {/* Certificate Details Form */}
      <div className="rounded-2xl bg-gradient-to-br from-slate-50 via-white to-slate-50/40 p-8 transition-all duration-300 hover:shadow-lg border border-slate-100/40 backdrop-blur-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="rounded-full bg-blue-50 p-2.5">
            <FileText className="h-5 w-5 text-blue-600" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900">Certificate Details</h2>
        </div>

        <form onSubmit={submit} className="space-y-5">
          <div className="grid sm:grid-cols-2 gap-5">
            {/* Student Name */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Student Name</label>
              <input
                className="w-full h-11 rounded-xl border border-slate-200/80 bg-white/50 px-4 text-sm outline-none transition-all focus:border-blue-300 focus:ring-4 focus:ring-blue-100/50"
                placeholder="Enter student name"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            {/* Student ID */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Student ID</label>
              <input
                className="w-full h-11 rounded-xl border border-slate-200/80 bg-white/50 px-4 text-sm outline-none transition-all focus:border-blue-300 focus:ring-4 focus:ring-blue-100/50"
                placeholder="Enter student ID"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            {/* Program */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Program</label>
              {programs.length > 0 ? (
                <select
                  className="w-full h-11 rounded-xl border border-slate-200/80 bg-white/50 px-4 text-sm outline-none transition-all focus:border-blue-300 focus:ring-4 focus:ring-blue-100/50"
                  value={programId}
                  onChange={(e) => {
                    setProgramId(e.target.value)
                    const found = programs.find((p: any) => p._id === e.target.value)
                    setProgramName(found ? `${found.name} (${found.code})` : "")
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
                <div className="rounded-xl border border-amber-200/60 bg-amber-50/40 px-4 py-3 text-sm text-amber-800">
                  No programs available
                </div>
              )}
            </div>

            {/* Issue Date */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Issue Date</label>
              <input
                type="date"
                className="w-full h-11 rounded-xl border border-slate-200/80 bg-white/50 px-4 text-sm outline-none transition-all focus:border-blue-300 focus:ring-4 focus:ring-blue-100/50"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                disabled={loading}
              />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-xl bg-gradient-to-br from-red-50 to-red-50/40 p-4 border border-red-200/60 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 font-medium">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !wallets.length || !programId}
            className="w-full h-11 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold transition-all duration-300 hover:shadow-lg hover:shadow-blue-200/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Award className="h-4 w-4" />
            {loading ? "Issuing Certificate..." : "Issue Certificate"}
          </button>
        </form>

        {/* Success Message */}
        {result && (
          <div className="mt-6 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-50/40 p-5 border border-emerald-200/60">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-emerald-900">Certificate Issued Successfully</p>
                <div className="mt-4 space-y-3">
                  <div className="rounded-lg bg-white/40 p-3">
                    <p className="text-xs text-slate-500 font-medium">Hash</p>
                    <code className="text-xs text-slate-700 font-mono break-all">{result.hash}</code>
                  </div>
                  <div className="rounded-lg bg-white/40 p-3">
                    <p className="text-xs text-slate-500 font-medium">Transaction</p>
                    <code className="text-xs text-slate-700 font-mono break-all">{result.txHash}</code>
                  </div>
                  {result.pdfBase64 && (
                    <a
                      download={`certificate-${studentId || "cert"}.pdf`}
                      href={`data:application/pdf;base64,${result.pdfBase64}`}
                      className="inline-flex h-10 items-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white hover:shadow-lg transition-all"
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
  )
}
