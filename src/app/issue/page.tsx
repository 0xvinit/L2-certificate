"use client";
import { useState, useEffect } from "react";
import type React from "react";

import { ethers } from "ethers"
import { CERTIFICATE_REGISTRY_ABI, NEXT_PUBLIC_CERT_REGISTRY_ADDRESS } from "../../lib/contract"
import { sha256HexBytes } from "../../lib/sha256"
// @ts-ignore - provided by Alchemy Account Kit at runtime
import { useSendCalls, useSmartAccountClient, useAuthModal, useSignerStatus, useUser } from "@account-kit/react"
import WalletConnection from "@/components/WalletConnection"
import AppShell from "@/components/AppShell"
import CertificateTemplate from "@/components/CertificateTemplate"
import { generatePDFFromHTML, addQRCodeToElement } from "../../lib/pdfGenerator"
import { createRoot } from "react-dom/client"
import { AlertCircle, CheckCircle2, FileText, Award, ExternalLink } from "lucide-react"

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

  const { client } = useSmartAccountClient({})
  const { sendCallsAsync } = useSendCalls({ client })
  const { openAuthModal } = useAuthModal()
  const signerStatus = useSignerStatus()
  const user = useUser()

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

  // Monitor Alchemy Account Kit status and show helpful message if needed
  useEffect(() => {
    if (admin?.adminId && !signerStatus.isInitializing) {
      if (!user || !user.email) {
        // User has app session but Alchemy Account Kit isn't connected
        // Don't set error here, just log for debugging
        console.log("App session exists but Alchemy Account Kit not connected")
      }
    }
  }, [admin, signerStatus.isInitializing, user])

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

  // Helper function to normalize hash to exactly bytes32 format (0x + 64 hex chars)
  const normalizeHashToBytes32 = (hash: string): string => {
    let normalized = hash.trim();
    
    // Remove 0x prefix if present
    if (normalized.startsWith("0x")) {
      normalized = normalized.slice(2);
    }
    
    // Ensure exactly 64 hex characters (32 bytes)
    if (normalized.length > 64) {
      // If too long, truncate to 64 chars
      normalized = normalized.slice(0, 64);
    } else if (normalized.length < 64) {
      // If too short, pad with zeros
      normalized = normalized.padStart(64, '0');
    }
    
    // Validate it's valid hex
    if (!/^[0-9a-fA-F]{64}$/.test(normalized)) {
      throw new Error(`Invalid hex string: ${normalized}`);
    }
    
    return `0x${normalized}`;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setError("");

    try {
      // Verify admin is authenticated via app session first
      if (!admin || !admin.adminId) {
        throw new Error(`You must be logged in as an admin to issue certificates`)
      }

      // Check if Alchemy Account Kit is initializing - wait a bit if user has app session
      if (signerStatus.isInitializing) {
        // Wait up to 5 seconds for initialization if user has app session
        let waited = 0
        while (signerStatus.isInitializing && waited < 5000) {
          await new Promise(resolve => setTimeout(resolve, 500))
          waited += 500
        }
        if (signerStatus.isInitializing) {
          setError("Smart wallet is still initializing. Please wait a moment and try again.")
          setLoading(false)
          return
        }
      }

      // Check if user is authenticated with Alchemy Account Kit
      // Prefer checking user object over signerStatus.isAuthenticated as it's more reliable for email login
      if (!user || !user.email) {
        setError("Please connect your smart wallet to continue")
        try { 
          openAuthModal() 
        } catch (err) {
          console.error("Failed to open auth modal:", err)
        }
        setLoading(false)
        return
      }

      // Get smart account address - wait a bit if not ready but user is authenticated
      let smartAddress = (client as any)?.account?.address as string | undefined
      if (!smartAddress && user) {
        // Wait up to 5 seconds for smart wallet to be ready
        let waited = 0
        while (!smartAddress && waited < 5000) {
          await new Promise(resolve => setTimeout(resolve, 500))
          smartAddress = (client as any)?.account?.address as string | undefined
          waited += 500
        }
      }

      if (!smartAddress) {
        setError("Smart wallet not ready. Please refresh the page and try again.")
        try { 
          openAuthModal() 
        } catch (err) {
          console.error("Failed to open auth modal:", err)
        }
        setLoading(false)
        return
      }
      if (!NEXT_PUBLIC_CERT_REGISTRY_ADDRESS) throw new Error("Contract address missing")
      if (!programId) throw new Error("Please select a program")

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
      let tempHash = await sha256HexBytes(tempPdfBytes);
      
      // Normalize hash to ensure exactly 64 hex characters (32 bytes)
      tempHash = normalizeHashToBytes32(tempHash);

      const verifyUrl = `${baseUrl}/verify?h=${tempHash}`;
      await addQRCodeToElement(certificateElement, verifyUrl);

      await new Promise((resolve) => setTimeout(resolve, 500));

      const finalPdfBlob = (await generatePDFFromHTML(certificateElement, {
        returnBlob: true,
      })) as Blob;
      const finalPdfBytes = new Uint8Array(await finalPdfBlob.arrayBuffer());
      const finalPdfHash = await sha256HexBytes(finalPdfBytes);

      const hash = tempHash;

      // Use read-only provider for contract reads
      const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || "https://sepolia-rollup.arbitrum.io/rpc"
      const roProvider = new ethers.JsonRpcProvider(rpcUrl)
      const contractRO = new ethers.Contract(NEXT_PUBLIC_CERT_REGISTRY_ADDRESS, CERTIFICATE_REGISTRY_ABI, roProvider)

      // Check if contract code exists at this address
      const code = await roProvider.getCode(NEXT_PUBLIC_CERT_REGISTRY_ADDRESS)
      if (!code || code === "0x") {
        throw new Error(`No contract found at address ${NEXT_PUBLIC_CERT_REGISTRY_ADDRESS} on Polygon Amoy. Please verify:\n1. You are connected to Polygon Amoy network\n2. The contract address is correct\n3. The contract is deployed on Polygon Amoy`)
      }

      // Verify admin is authenticated (already checked via /api/auth/me, but verify again for safety)
      if (!admin || !admin.adminId) {
        throw new Error(`You must be logged in as an admin to issue certificates`)
      }

      // Ensure hash is in proper bytes32 format (0x + 64 hex chars)
      // Use the normalize function to ensure exactly 64 hex characters
      let hashBytes32: string;
      try {
        hashBytes32 = normalizeHashToBytes32(hash);
        console.log("Normalized hashBytes32:", hashBytes32, "length:", hashBytes32.length);
        
        // Validate using ethers to ensure it's a proper hex string
        hashBytes32 = ethers.hexlify(hashBytes32);
        
        // Final validation - must be exactly 66 characters (0x + 64 hex)
        if (hashBytes32.length !== 66) {
          throw new Error(`Hash must be exactly 66 characters (0x + 64 hex), got ${hashBytes32.length}: ${hashBytes32}`)
        }
      } catch (err: any) {
        throw new Error(`Invalid hash format: ${err?.message || err}. Original hash: ${hash}`)
      }

      const existing = await contractRO.getCertificate(hashBytes32)
      if (existing && existing.metadataURI && existing.metadataURI.length > 0) {
        throw new Error("Certificate already registered for this hash");
      }

      const metadataURI = verifyUrl
      
      // Final check: Ensure account is still ready before sending transaction
      // Wait for client to be ready with retries
      let finalSmartAddress = (client as any)?.account?.address as string | undefined
      let clientReady = false
      let retries = 0
      const maxRetries = 10
      
      while (!clientReady && retries < maxRetries) {
        if (client && (client as any).account && (client as any).account.address) {
          finalSmartAddress = (client as any).account.address
          // Verify account is actually ready
          if (finalSmartAddress) {
            clientReady = true
            break
          }
        }
        if (!clientReady) {
          await new Promise(resolve => setTimeout(resolve, 500))
          retries++
        }
      }
      
      if (!client) {
        throw new Error("Smart account client not available. Please refresh and try again.")
      }
      
      if (!finalSmartAddress || !user || !user.email) {
        throw new Error("Smart wallet session expired. Please refresh and try again.")
      }
      
      if (!clientReady) {
        throw new Error("Smart account client not ready. Please wait a moment and try again.")
      }

      console.log("Client ready, finalSmartAddress:", finalSmartAddress)
      console.log("Client account:", (client as any)?.account)
      console.log("Client object:", client)

      const checkAuthorizationOnChain = async (): Promise<boolean> => {
        try {
          if (typeof (contractRO as any).isAuthorizedIssuer === "function") {
            return await (contractRO as any).isAuthorizedIssuer(finalSmartAddress)
          }
          if (typeof (contractRO as any).authorizedIssuers === "function") {
            return await (contractRO as any).authorizedIssuers(finalSmartAddress)
          }
        } catch (authCheckErr) {
          console.warn("Failed to read authorization status", authCheckErr)
          // Fall through and allow flow to continue; we'll rely on backend for gating
        }
        return true
      }

      let isAuthorized = await checkAuthorizationOnChain()

      if (!isAuthorized) {
        try {
          const response = await fetch("/api/admin/authorize-wallet", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ walletAddress: finalSmartAddress })
          })

          const responseBody = await response.json().catch(() => ({}))

          if (!response.ok) {
            const message = responseBody?.error || "Your account is awaiting approval by the super admin. Please try again later."
            throw new Error(message)
          }

          let attempts = 0
          const maxAttempts = 5
          const delayMs = 1500

          while (attempts < maxAttempts) {
            isAuthorized = await checkAuthorizationOnChain()
            if (isAuthorized) {
              break
            }
            attempts += 1
            await new Promise(resolve => setTimeout(resolve, delayMs))
          }

          if (!isAuthorized) {
            throw new Error("Authorization request submitted. Please try again in a few seconds once it is confirmed on-chain.")
          }
        } catch (authErr: any) {
          const message = authErr?.message || "Your account is awaiting approval by the super admin. Please try again later."
          throw new Error(message)
        }
      }

      // Create contract interface for encoding transaction data
      const contractInterface = new ethers.Interface(CERTIFICATE_REGISTRY_ABI)
      console.log("contractInterface", contractInterface)
      console.log("hashBytes32 before encoding:", hashBytes32, "length:", hashBytes32.length)
      console.log("metadataURI:", metadataURI)
      
      // Ensure hashBytes32 is exactly bytes32 format for encoding
      // Double-check it's exactly 66 characters
      if (hashBytes32.length !== 66) {
        throw new Error(`Hash must be exactly 66 characters before encoding, got ${hashBytes32.length}: ${hashBytes32}`)
      }
      
      const txData = contractInterface.encodeFunctionData("register", [hashBytes32, metadataURI])
      console.log("txData", txData, NEXT_PUBLIC_CERT_REGISTRY_ADDRESS)
      
      // Send via Alchemy Account Kit (gas sponsorship policy configured at provider level)
      // Try both environment variable names for compatibility
      const policyId = process.env.NEXT_PUBLIC_ALCHEMY_GAS_POLICY_ID || process.env.NEXT_PUBLIC_ALCHEMY_POLICY_ID
      console.log("policyId", policyId)
      console.log("Sending transaction with smart address:", finalSmartAddress)
      console.log("Client available:", !!client)
      console.log("Client account available:", !!(client as any)?.account)
      
      let sendResult: any
      try {
        // Ensure we're using the client's account context
        if (!(client as any)?.account) {
          throw new Error("Account not found in client. Please reconnect your wallet.")
        }
        
        sendResult = await sendCallsAsync({
          ...(policyId ? { capabilities: { paymasterService: { policyId } } } : {}),
          calls: [
            {
              to: NEXT_PUBLIC_CERT_REGISTRY_ADDRESS,
              data: txData,
            } as any,
          ],
        })
        console.log("sendResult", sendResult)
        console.log("sendResult type:", typeof sendResult)
        console.log("sendResult keys:", sendResult ? Object.keys(sendResult) : "null/undefined")
        
        // Log UserOperation request details if available
        if (sendResult?.request) {
          console.log("=== UserOperation Request Details ===")
          console.log("Sender (Smart Account):", sendResult.request.sender)
          console.log("Paymaster:", sendResult.request.paymaster || "None (self-paid)")
          console.log("Call Data Length:", sendResult.request.callData?.length || 0)
          console.log("Gas Limits:", {
            callGasLimit: sendResult.request.callGasLimit,
            verificationGasLimit: sendResult.request.verificationGasLimit,
            preVerificationGas: sendResult.request.preVerificationGas,
          })
          console.log("Gas Prices:", {
            maxFeePerGas: sendResult.request.maxFeePerGas,
            maxPriorityFeePerGas: sendResult.request.maxPriorityFeePerGas,
          })
          console.log("=== End Request Details ===")
        }
      } catch (sendError: any) {
        console.error("Error sending transaction:", sendError)
        console.error("Error details:", {
          name: sendError?.name,
          message: sendError?.message,
          stack: sendError?.stack,
          client: !!client,
          account: !!(client as any)?.account,
        })
        throw new Error(`Failed to send transaction: ${sendError?.message || String(sendError)}`)
      }
      
      // Handle different possible return structures from sendCallsAsync
      let opId: string
      if (!sendResult) {
        throw new Error("sendCallsAsync returned null or undefined")
      } else if (Array.isArray((sendResult as any)?.ids)) {
        opId = (sendResult as any).ids[0]
      } else if ((sendResult as any)?.id) {
        opId = String((sendResult as any).id)
      } else if ((sendResult as any)?.hash) {
        opId = String((sendResult as any).hash)
      } else if (typeof sendResult === "string") {
        opId = sendResult
      } else {
        // Try to stringify and extract any ID-like field
        const resultStr = JSON.stringify(sendResult)
        console.warn("Unexpected sendResult structure:", resultStr)
        throw new Error(`Unexpected sendResult structure. Received: ${resultStr}`)
      }
      
      console.log("opId extracted:", opId)
      
      if (!opId || opId === "undefined" || opId === "null") {
        throw new Error("Failed to extract transaction ID from sendResult")
      }

      // Wait for UserOperation receipt and get the actual transaction hash
      let txHash = opId // Fallback to UserOperation hash if we can't get tx hash
      let receipt: any = null // Declare receipt outside try block for use later
      try {
        console.log("Waiting for UserOperation receipt for:", opId)
        
        // Use Alchemy's bundler endpoint for UserOperation receipts
        // For Arbitrum Sepolia, use the appropriate bundler URL
        const alchemyApiKey = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY
        if (!alchemyApiKey) {
          console.warn("Alchemy API key not found. Cannot fetch UserOperation receipt.")
          txHash = opId
        } else {
          // Alchemy bundler endpoint format: https://{network}.g.alchemy.com/v2/{apiKey}
          // For Arbitrum Sepolia, we need to construct the bundler URL
          const bundlerUrl = `https://arb-sepolia.g.alchemy.com/v2/${alchemyApiKey}`
          
          // Wait for UserOperation receipt with polling
          let attempts = 0
          const maxAttempts = 3 // Wait up to 60 seconds (1 second intervals)
          
          while (!receipt && attempts < maxAttempts) {
            try {
              // Use eth_getUserOperationReceipt RPC method on bundler endpoint
              const response = await fetch(bundlerUrl, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  jsonrpc: "2.0",
                  id: 1,
                  method: "eth_getUserOperationReceipt",
                  params: [opId],
                }),
              })
              
              const data = await response.json()
              if (data.result) {
                receipt = data.result
                // Extract transaction hash from receipt - check multiple possible locations
                const possibleTxHash = receipt.receipt?.transactionHash || 
                                      receipt.transactionHash || 
                                      receipt.receipt?.hash ||
                                      receipt.logs?.[0]?.transactionHash ||
                                      null
                
                if (possibleTxHash && possibleTxHash !== opId && possibleTxHash.startsWith('0x') && possibleTxHash.length === 66) {
                  txHash = possibleTxHash
                } else {
                  console.warn("Could not extract valid transaction hash from receipt, structure:", Object.keys(receipt))
                }
                
                // Log detailed UserOperation information
                console.log("=== UserOperation Receipt Details ===")
                console.log("UserOperation Hash:", opId)
                console.log("Sender (Smart Account):", receipt.sender || receipt.userOp?.sender)
                console.log("Paymaster Address:", receipt.paymaster || receipt.userOp?.paymaster || "None (self-paid)")
                console.log("Beneficiary (Bundler):", receipt.receipt?.from || receipt.beneficiary || "N/A")
                console.log("Receipt Structure:", Object.keys(receipt))
                console.log("Receipt.receipt Structure:", receipt.receipt ? Object.keys(receipt.receipt) : "N/A")
                console.log("Extracted Transaction Hash:", txHash)
                console.log("Gas Used:", receipt.actualGasUsed || receipt.receipt?.gasUsed)
                console.log("Success:", receipt.success !== false)
                
                console.log("\n📋 EXPLANATION:")
                console.log("  • Sender: Your smart account that initiated the transaction")
                console.log("  • Paymaster: The contract that PAID for your gas fees (Alchemy's paymaster)")
                console.log("  • Beneficiary: The bundler address that RECEIVED the transaction fees")
                console.log("  • Transaction Hash: The actual on-chain transaction")
                
                if (receipt.userOp) {
                  console.log("UserOperation Details:", {
                    sender: receipt.userOp.sender,
                    nonce: receipt.userOp.nonce,
                    callData: receipt.userOp.callData,
                    callGasLimit: receipt.userOp.callGasLimit,
                    verificationGasLimit: receipt.userOp.verificationGasLimit,
                    preVerificationGas: receipt.userOp.preVerificationGas,
                    maxFeePerGas: receipt.userOp.maxFeePerGas,
                    maxPriorityFeePerGas: receipt.userOp.maxPriorityFeePerGas,
                    paymaster: receipt.userOp.paymaster,
                    paymasterData: receipt.userOp.paymasterData,
                  })
                }
                
                console.log("Full Receipt:", JSON.stringify(receipt, null, 2))
                console.log("=== End UserOperation Details ===")
                break
              } else if (data.error && data.error.code !== -32000) {
                // -32000 is "not found" which is expected while waiting
                console.warn("RPC error:", data.error)
              }
            } catch (err) {
              console.log(`Attempt ${attempts + 1}/${maxAttempts}: Waiting for receipt...`)
            }
            
            if (!receipt) {
              await new Promise(resolve => setTimeout(resolve, 1000))
              attempts++
            }
          }
          
          if (!receipt) {
            console.warn("Could not get UserOperation receipt within timeout. Using UserOperation hash.")
            txHash = opId
          }
        }
      } catch (err: any) {
        console.warn("Error getting UserOperation receipt:", err)
        console.warn("Using UserOperation hash as transaction identifier")
        txHash = opId
      }

      console.log("Final transaction hash:", txHash)
      
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

      // Store UserOperation details for display
      const userOpDetails = receipt ? {
        sender: receipt.sender || receipt.userOp?.sender || finalSmartAddress,
        paymaster: receipt.paymaster || receipt.userOp?.paymaster || null,
        beneficiary: receipt.receipt?.from || receipt.beneficiary || null,
        gasUsed: receipt.actualGasUsed || receipt.receipt?.gasUsed || null,
        success: receipt.success !== false,
      } : {
        sender: finalSmartAddress,
        paymaster: sendResult?.request?.paymaster || null,
        beneficiary: null,
        gasUsed: null,
        success: true,
      }

      await fetch("/api/certificates", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          adminAddress: finalSmartAddress,
          adminId: admin?.adminId || "",
          programId,
          studentName,
          studentId,
          date,
          hash,
          txHash: txHash,
          verifyUrl,
          pdfBase64: pdfBase64String,
          finalPdfHash,
        }),
      });

      setResult({
        hash,
        txHash: txHash,
        userOpHash: opId,
        verifyUrl,
        pdfBase64: pdfBase64String,
        finalPdfHash,
        userOpDetails,
      })

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
      {/* <div className="mb-8 rounded-3xl bg-white/60 backdrop-blur-xl border-2 border-sky-100 p-6 transition-all duration-500 hover:shadow-2xl hover:shadow-sky-200/30 relative z-10"> */}
      <div className="mb-8 ">
        <WalletConnection showOnChainIssuer={true} showSwitchChain={true} />
      </div>

      {programs.length === 0  && (
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
            disabled={loading  || !programId}
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
                      Certificate Hash
                    </p>
                    <code className="text-sm text-gray-900 font-mono break-all">
                      {result.hash}
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
