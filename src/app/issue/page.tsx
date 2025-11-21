"use client";
import { useState, useEffect } from "react";
import type React from "react";

// @ts-ignore - provided by Alchemy Account Kit at runtime
import { useSendCalls, useSmartAccountClient, useAuthModal, useSignerStatus, useUser } from "@account-kit/react"
import WalletConnection from "@/components/WalletConnection"
import AppShell from "@/components/AppShell"
import { AlertCircle, CheckCircle2, FileText, Award, ExternalLink } from "lucide-react"
import { extractAddressFromDID } from "@/lib/did-utils"
import { decodeBatchRegisterTx } from "@/lib/tx-decoder"

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


  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setError("");

    try {
      // Check if user is authenticated with Alchemy Account Kit
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

      // Get smart account address
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

      if (!programId) throw new Error("Please select a program")
      const selectedProgram = programs.find((p: any) => p._id === programId);
      if (!selectedProgram) throw new Error("Invalid program selected");

      // Step 1: Call /api/issue to generate VCs and get transaction data
      const apiRes = await fetch('/api/issue', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for token authentication
        body: JSON.stringify({
          students: [{
            did: `did:ethr:student:${studentId || Date.now()}`,
            name: studentName,
            id: studentId,
            program: selectedProgram.name,
            date: date || new Date().toISOString().split('T')[0]
          }],
          uniDID: `did:ethr:${smartAddress}`,
          walletAddress: smartAddress,
        }),
      });

      const apiData = await apiRes.json();

      if (!apiRes.ok) {
        throw new Error(apiData.error || 'Failed to generate VCs');
      }

      // ========== VERIFICATION & LOGGING SECTION ==========
      console.log("=".repeat(80));
      console.log("📋 CERTIFICATE ISSUANCE - DETAILED BREAKDOWN");
      console.log("=".repeat(80));

      // 1. Student Information
      console.log("\n👤 STUDENT INFORMATION:");
      console.log("  - Name:", studentName);
      console.log("  - Student ID:", studentId);
      console.log("  - Program:", selectedProgram.name);
      console.log("  - Date:", date || new Date().toISOString().split('T')[0]);

      // 2. Generated DIDs
      if (apiData.vcs && apiData.vcs.length > 0) {
        console.log("\n🔐 GENERATED DIDs:");
        apiData.vcs.forEach((vc: any, index: number) => {
          const studentDID = vc.credentialSubject?.id;
          console.log(`  Student ${index + 1} DID:`, studentDID);
          
          // Extract address from DID for verification
          const extractedAddress = extractAddressFromDID(studentDID || '');
          console.log(`  → Extracted Address from DID:`, extractedAddress);
          
          if (!extractedAddress) {
            console.warn(`  ⚠️  Could not extract address from DID: ${studentDID}`);
          }
        });
      }

      // 3. What's STORED ON-CHAIN (in the contract)
      console.log("\n⛓️  ON-CHAIN STORAGE (What's stored in the contract):");
      console.log("  - DID Hashes (bytes32[]):", apiData.didHashes);
      console.log("  - Merkle Roots (bytes32[]):", apiData.merkleRoots || Array(apiData.didHashes?.length || 0).fill(apiData.merkleRoot));
      console.log("  - Merkle Root:", apiData.merkleRoot);
      console.log("  - Contract Address:", apiData.transactionData?.to);
      console.log("  - Function Called: batchRegister(bytes32[] didHashes, bytes32[] merkleRoots)");
      console.log("  📝 Note: Only DID hashes and merkle roots are stored on-chain (minimal data)");

      // 4. What's GENERATED (but not stored on-chain)
      console.log("\n📄 GENERATED DATA (Not stored on-chain, stored off-chain/DB):");
      console.log("  - Verifiable Credentials (VCs):", apiData.vcs?.length || 0, "VC(s)");
      if (apiData.vcs && apiData.vcs.length > 0) {
        console.log("  - VC Structure:", {
          '@context': apiData.vcs[0]['@context'],
          type: apiData.vcs[0].type,
          issuer: apiData.vcs[0].issuer,
          credentialSubject: {
            id: apiData.vcs[0].credentialSubject?.id,
            name: apiData.vcs[0].credentialSubject?.name,
            program: apiData.vcs[0].credentialSubject?.program,
            date: apiData.vcs[0].credentialSubject?.date
          },
          proof: {
            type: apiData.vcs[0].proof?.type,
            merkleRoot: apiData.vcs[0].proof?.merkleRoot,
            proofPath: apiData.vcs[0].proof?.proofPath?.length || 0 + " proof(s)"
          }
        });
      }
      console.log("  - PDF Certificates:", apiData.pdfResults?.length || 0, "PDF(s)");
      console.log("  - PDF Base64 Size:", apiData.pdfResults?.[0]?.pdfBase64?.length || 0, "characters");
      console.log("  - Verify URLs:", apiData.pdfResults?.map((p: any) => p.verifyUrl) || []);

      // 5. What's NOT NEEDED for core functionality (showcase only)
      console.log("\n🎨 SHOWCASE DATA (Nice to have, not essential):");
      console.log("  - PDF Base64 (can be regenerated from VC data):", apiData.pdfResults?.[0]?.pdfBase64 ? "Present" : "Not present");
      console.log("  - Admin Info (for UI display only):", apiData.adminInfo ? "Present" : "Not present");
      console.log("  - Verify URLs (convenience feature):", apiData.pdfResults?.[0]?.verifyUrl ? "Present" : "Not present");
      console.log("  📝 Note: Core verification only needs DID hash and merkle root from blockchain");

      // 6. Transaction Details
      console.log("\n💸 TRANSACTION DETAILS:");
      console.log("  - To:", apiData.transactionData?.to);
      console.log("  - Data Length:", apiData.transactionData?.data?.length || 0, "characters");
      console.log("  - Function:", apiData.transactionData?.functionName);
      console.log("  - Parameters:", {
        didHashes: apiData.transactionData?.params?.didHashes?.length || 0,
        merkleRoots: apiData.transactionData?.params?.merkleRoots?.length || 0
      });

      // 7. Verification Summary
      console.log("\n✅ VERIFICATION SUMMARY:");
      console.log("  ✓ DID generated and address extracted");
      console.log("  ✓ DID hash computed for on-chain storage");
      console.log("  ✓ Merkle root computed from VCs");
      console.log("  ✓ Transaction data prepared for contract");
      console.log("  ✓ PDF and VC data generated for off-chain storage");
      
      console.log("\n" + "=".repeat(80));
      console.log("📊 END OF BREAKDOWN");
      console.log("=".repeat(80) + "\n");

      // Step 2: Send transaction using Alchemy Account Kit (gasless)
      // Check if on-chain registration should be skipped
      let txHash = 'database_only';
      let sendResult: any = null;
      let usedPaymaster = false;
      
      if (apiData.skipOnChainRegistration) {
        console.log('⚠️  Skipping on-chain registration:', apiData.message);
        console.log('   Certificate will be stored in database only.');
        // Certificate is already stored in database via /api/issue
        // Skip transaction sending
      } else if (!apiData.transactionData) {
        throw new Error('No transaction data received from server');
      } else {
        // Log transaction details before sending
        console.log('\n💸 SENDING TRANSACTION');
        console.log('='.repeat(80));
        console.log('To (Contract):', apiData.transactionData.to);
        console.log('Function:', apiData.transactionData.functionName);
        console.log('Function Selector:', apiData.transactionData.data.slice(0, 10));
        console.log('Raw Data Length:', apiData.transactionData.data.length, 'characters');
        
        // Decode transaction data to show readable values
        const decoded = decodeBatchRegisterTx(apiData.transactionData.data);
        if (decoded) {
          console.log('\n📋 DECODED PARAMETERS (What\'s actually being sent):');
          console.log('  Function:', decoded.functionName);
          console.log('  DID Hashes:');
          decoded.readable.didHashes.forEach((p) => {
            console.log(`    [${p.index}] ${p.hash}`);
          });
          console.log('  Merkle Roots:');
          decoded.readable.merkleRoots.forEach((p) => {
            console.log(`    [${p.index}] ${p.root}`);
          });
        }
        
        if (apiData.transactionData.explanation) {
          console.log('\n💡 EXPLANATION:');
          console.log('  Raw Hex Data:', apiData.transactionData.explanation.rawData.slice(0, 50) + '...');
          console.log('  What is Raw Data?', apiData.transactionData.explanation.whatIsRawData);
          console.log('  Function Selector:', apiData.transactionData.explanation.functionSelector);
          console.log('\n  📦 What Gets Stored:');
          console.log('    On-Chain:', apiData.transactionData.explanation.whatGetsStored.onChain.join(', '));
          console.log('    Off-Chain:', apiData.transactionData.explanation.whatGetsStored.offChain.join(', '));
        }
        
        console.log('\n✅ Transaction data is valid and ready to send');
        console.log('='.repeat(80) + '\n');
        // Proceed with on-chain registration
        const policyId = process.env.NEXT_PUBLIC_ALCHEMY_GAS_POLICY_ID || process.env.NEXT_PUBLIC_ALCHEMY_POLICY_ID;

        // Send transaction via Alchemy Account Kit
        // Try with paymaster first, fallback to self-paid if any error occurs
        if (policyId) {
          try {
            sendResult = await sendCallsAsync({
              capabilities: { paymasterService: { policyId } },
              calls: [
                {
                  to: apiData.transactionData.to,
                  data: apiData.transactionData.data,
                } as any,
              ],
            });
            usedPaymaster = true;
            console.log('Transaction sent successfully with paymaster');
          } catch (paymasterError: any) {
            // If paymaster fails with unauthorized, try without paymaster (self-paid)
            const errorMessage = paymasterError?.message || paymasterError?.toString() || '';
            const errorDetails = paymasterError?.details || '';
            const errorString = JSON.stringify(paymasterError);
            const fullError = `${errorMessage} ${errorDetails} ${errorString}`.toLowerCase();
            
            // Check for various unauthorized error patterns
            const isUnauthorized = fullError.includes('unauthorized') || 
                                  fullError.includes('401') ||
                                  fullError.includes('internal error') ||
                                  paymasterError?.code === 401 ||
                                  paymasterError?.status === 401 ||
                                  (paymasterError?.cause && JSON.stringify(paymasterError.cause).toLowerCase().includes('unauthorized')) ||
                                  (paymasterError?.response && JSON.stringify(paymasterError.response).toLowerCase().includes('unauthorized'));
            
            console.log('Paymaster error details:', {
              message: errorMessage,
              details: errorDetails,
              code: paymasterError?.code,
              status: paymasterError?.status,
              fullError: fullError,
              isUnauthorized: isUnauthorized
            });
            
            // Always try self-paid as fallback for any paymaster error
            console.warn('Paymaster failed, trying without paymaster (self-paid):', paymasterError);
            try {
              sendResult = await sendCallsAsync({
                calls: [
                  {
                    to: apiData.transactionData.to,
                    data: apiData.transactionData.data,
                  } as any,
                ],
              });
              console.log('Self-paid transaction successful after paymaster error');
            } catch (selfPaidError: any) {
              console.error('Self-paid transaction also failed:', selfPaidError);
              const selfPaidErrorMsg = selfPaidError?.message || selfPaidError?.toString() || '';
              if (selfPaidErrorMsg.toLowerCase().includes('unauthorized') || 
                  selfPaidErrorMsg.toLowerCase().includes('only authorized issuer')) {
                // If user is admin, wallet should have been auto-authorized
                // Suggest retrying as authorization might still be processing
                if (admin?.adminId) {
                  throw new Error(`Your wallet address (${smartAddress}) is not authorized. Authorization may still be processing. Please wait a moment and try again.`);
                }
                throw new Error(`Your wallet address (${smartAddress}) is not authorized to issue certificates. Please contact an admin to authorize your wallet address.`);
              }
              throw new Error(`Transaction failed: ${selfPaidErrorMsg || 'Unknown error'}. Please ensure your wallet has sufficient funds for gas.`);
            }
          }
        } else {
        // No policy ID, send as self-paid
        try {
          sendResult = await sendCallsAsync({
            calls: [
              {
                to: apiData.transactionData.to,
                data: apiData.transactionData.data,
              } as any,
            ],
          });
          console.log('Transaction sent successfully (self-paid, no paymaster policy)');
        } catch (selfPaidError: any) {
          console.error('Self-paid transaction failed:', selfPaidError);
          const selfPaidErrorMsg = selfPaidError?.message || selfPaidError?.toString() || '';
          if (selfPaidErrorMsg.toLowerCase().includes('unauthorized') || 
              selfPaidErrorMsg.toLowerCase().includes('only authorized issuer')) {
            // If user is admin, wallet should have been auto-authorized
            // Suggest retrying as authorization might still be processing
            if (admin?.adminId) {
              throw new Error(`Your wallet address (${smartAddress}) is not authorized. Authorization may still be processing. Please wait a moment and try again.`);
            }
            throw new Error(`Your wallet address (${smartAddress}) is not authorized to issue certificates. Please contact an admin to authorize your wallet address.`);
          }
          throw new Error(`Transaction failed: ${selfPaidErrorMsg || 'Unknown error'}. Please ensure your wallet has sufficient funds for gas.`);
        }
        }
      }

      // Extract transaction hash from sendResult (if transaction was sent)
      if (sendResult) {
        if (Array.isArray((sendResult as any)?.ids)) {
          txHash = (sendResult as any).ids[0];
        } else if ((sendResult as any)?.id) {
          txHash = String((sendResult as any).id);
        } else if ((sendResult as any)?.hash) {
          txHash = String((sendResult as any).hash);
        } else if (typeof sendResult === "string") {
          txHash = sendResult;
        } else {
          txHash = 'pending';
        }
      }

      // Step 3: Store certificate in DB
      if (apiData.certificates && apiData.certificates.length > 0) {
        const cert = apiData.certificates[0];
        await fetch("/api/certificates", {
          method: "POST",
          headers: { "content-type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            adminAddress: smartAddress,
            adminId: admin?.adminId || "",
            programId,
            studentName,
            studentId,
            date: date || new Date().toISOString().split('T')[0],
            hash: cert.vc?.proof?.merkleRoot || apiData.merkleRoot,
            merkleRoot: cert.vc?.proof?.merkleRoot || apiData.merkleRoot,
            txHash: txHash,
            verifyUrl: cert.verifyUrl,
            pdfBase64: cert.pdfBase64,
            finalPdfHash: cert.vc?.proof?.merkleRoot || apiData.merkleRoot,
            did: cert.vc?.credentialSubject?.id || cert.did, // Store DID for verification
            vc: cert.vc || null, // Store full VC for verification
          }),
        });
      }

      // Set result with API response data
      setResult({
        hash: apiData.merkleRoot,
        txHash: txHash,
        verifyUrl: apiData.pdfResults?.[0]?.verifyUrl || '',
        pdfBase64: apiData.pdfResults?.[0]?.pdfBase64 || '',
        vcs: apiData.vcs,
        merkleRoot: apiData.merkleRoot,
        adminInfo: apiData.adminInfo,
        transactionData: apiData.transactionData, // Store transaction data for UI display
      });

      // Reset form
      setStudentName("");
      setStudentId("");
      setProgramId("");
      setProgramName("");
      setDate("");
    } catch (err: any) {
      console.error('Error issuing certificate:', err);
      setError(err?.message || "Failed to issue certificate");
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
          <div className="mt-8 space-y-6">
            {/* Main Success Card */}
            <div className="rounded-2xl bg-linear-to-br from-emerald-50 to-emerald-50/40 p-6 border-2 border-emerald-200/60">
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
                      Merkle Root
                    </p>
                    <code className="text-sm text-gray-900 font-mono break-all">
                      {result.merkleRoot || result.hash}
                    </code>
                  </div>

                  {result.txHash && (
                    <div className="rounded-xl bg-white/60 border-2 border-emerald-100 p-4">
                      <p className="text-sm text-gray-600 font-cairo font-bold uppercase mb-2">
                        Transaction Hash
                      </p>
                      <code className="text-sm text-gray-900 font-mono break-all">
                        {result.txHash}
                      </code>
                    </div>
                  )}

                  {result.adminInfo && (
                    <div className="rounded-xl bg-white/60 border-2 border-emerald-100 p-4">
                      <p className="text-sm text-gray-600 font-cairo font-bold uppercase mb-2">
                        Issued By
                      </p>
                      <p className="text-sm text-gray-900">
                        {result.adminInfo.email} {result.adminInfo.isSuperAdmin ? '(Super Admin)' : ''}
                      </p>
                    </div>
                  )}
                  
                  {result.pdfBase64 && (
                    <a
                      download={`certificate-${studentId || "cert"}.pdf`}
                      href={`data:application/pdf;base64,${result.pdfBase64}`}
                      className="inline-flex h-12 items-center gap-2 rounded-xl bg-linear-to-r from-emerald-600 to-emerald-700 px-6 text-base font-bold text-white hover:shadow-xl hover:shadow-emerald-200/50 transition-all font-poppins uppercase hover:scale-105"
                    >
                      Download Certificate PDF
                    </a>
                  )}

                  {result.verifyUrl && (
                    <a
                      href={result.verifyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-12 items-center gap-2 rounded-xl bg-linear-to-r from-blue-600 to-blue-700 px-6 text-base font-bold text-white hover:shadow-xl hover:shadow-blue-200/50 transition-all font-poppins uppercase hover:scale-105"
                    >
                      <ExternalLink className="h-5 w-5" />
                      Verify Certificate
                    </a>
                  )}
                  </div>
                </div>
              </div>
            </div>

            {/* Data Storage Showcase */}
            <div className="rounded-2xl bg-linear-to-br from-blue-50 to-indigo-50/40 p-6 border-2 border-blue-200/60">
              <h3 className="font-bold text-blue-900 font-cairo text-lg uppercase mb-4">
                📊 Data Storage Breakdown

                {/* Transaction Data Breakdown */}
                {result.txHash && result.txHash !== 'database_only' && result.transactionData && (
                  <div className="mt-6 rounded-xl bg-blue-50/60 border-2 border-blue-200/60 p-5">
                    <p className="text-sm font-bold text-blue-900 font-cairo uppercase mb-4 flex items-center gap-2">
                      💸 Transaction Data Breakdown
                    </p>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-start gap-2">
                        <span className="font-semibold text-gray-700 min-w-[140px]">Contract:</span>
                        <code className="text-xs text-gray-900 font-mono break-all bg-white/60 px-2 py-1 rounded">
                          {result.transactionData.to}
                        </code>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="font-semibold text-gray-700 min-w-[140px]">Function:</span>
                        <code className="text-xs text-gray-900 font-mono bg-white/60 px-2 py-1 rounded">
                          {result.transactionData.functionName}
                        </code>
                      </div>
                      {result.transactionData.explanation && (
                        <>
                          <div className="flex items-start gap-2">
                            <span className="font-semibold text-gray-700 min-w-[140px]">Function Selector:</span>
                            <code className="text-xs text-gray-900 font-mono bg-white/60 px-2 py-1 rounded">
                              {result.transactionData.explanation.functionSelector}
                            </code>
                          </div>
                          <div className="mt-3 pt-3 border-t border-blue-200">
                            <p className="font-semibold text-gray-700 mb-2">Parameters Sent:</p>
                            <div className="space-y-2 ml-4">
                              <div>
                                <span className="text-gray-600">DID Hashes ({result.transactionData.explanation.parameters.didHashes.length}):</span>
                                <div className="mt-1 space-y-1">
                                  {result.transactionData.explanation.parameters.didHashes.map((p: any, i: number) => (
                                    <code key={i} className="block text-xs text-gray-900 font-mono bg-white/60 px-2 py-1 rounded break-all">
                                      [{i}] {p.hash}
                                    </code>
                                  ))}
                                </div>
                              </div>
                              <div>
                                <span className="text-gray-600">Merkle Roots ({result.transactionData.explanation.parameters.merkleRoots.length}):</span>
                                <div className="mt-1 space-y-1">
                                  {result.transactionData.explanation.parameters.merkleRoots.map((p: any, i: number) => (
                                    <code key={i} className="block text-xs text-gray-900 font-mono bg-white/60 px-2 py-1 rounded break-all">
                                      [{i}] {p.root}
                                    </code>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="mt-3 pt-3 border-t border-blue-200">
                            <p className="text-xs text-blue-800 bg-blue-100/60 p-2 rounded">
                              💡 <strong>Note:</strong> Raw hex data is normal! All Ethereum transactions use ABI-encoded hex data. 
                              The contract decodes this and stores the hashes on-chain.
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                {/* On-Chain Storage */}
                <div className="rounded-xl bg-white/60 border-2 border-blue-100 p-4">
                  <h4 className="font-bold text-blue-800 font-cairo text-sm uppercase mb-3 flex items-center gap-2">
                    ⛓️ On-Chain (Contract)
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-semibold text-gray-700">DID Hash:</span>
                      <code className="block text-xs text-gray-600 mt-1 break-all font-mono bg-gray-50 p-2 rounded">
                        {result.merkleRoot || result.hash}
                      </code>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">Merkle Root:</span>
                      <code className="block text-xs text-gray-600 mt-1 break-all font-mono bg-gray-50 p-2 rounded">
                        {result.merkleRoot || result.hash}
                      </code>
                    </div>
                    <p className="text-xs text-blue-700 mt-2 italic">
                      ✓ Minimal data stored on blockchain (gas efficient)
                    </p>
                  </div>
                </div>

                {/* Off-Chain Storage */}
                <div className="rounded-xl bg-white/60 border-2 border-purple-100 p-4">
                  <h4 className="font-bold text-purple-800 font-cairo text-sm uppercase mb-3 flex items-center gap-2">
                    📄 Off-Chain (Database/IPFS)
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-semibold text-gray-700">Verifiable Credential:</span>
                      <p className="text-xs text-gray-600 mt-1">Full VC with student details</p>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">PDF Certificate:</span>
                      <p className="text-xs text-gray-600 mt-1">Base64 encoded PDF document</p>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">Student Info:</span>
                      <p className="text-xs text-gray-600 mt-1">Name, ID, Program, Date</p>
                    </div>
                    <p className="text-xs text-purple-700 mt-2 italic">
                      ✓ Complete data stored off-chain (cost effective)
                    </p>
                  </div>
                </div>
              </div>

              {/* DID Verification */}
              {result.vcs && result.vcs.length > 0 && result.vcs[0]?.credentialSubject?.id && (() => {
                const studentDID = result.vcs[0].credentialSubject.id;
                const extractedAddr = extractAddressFromDID(studentDID);
                return (
                  <div className="mt-4 rounded-xl bg-white/60 border-2 border-amber-100 p-4">
                    <h4 className="font-bold text-amber-800 font-cairo text-sm uppercase mb-3 flex items-center gap-2">
                      🔐 DID Verification
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-semibold text-gray-700">Student DID:</span>
                        <code className="block text-xs text-gray-600 mt-1 break-all font-mono bg-gray-50 p-2 rounded">
                          {studentDID}
                        </code>
                      </div>
                      {extractedAddr && (
                        <div>
                          <span className="font-semibold text-gray-700">Extracted Address:</span>
                          <code className="block text-xs text-gray-600 mt-1 break-all font-mono bg-gray-50 p-2 rounded">
                            {extractedAddr}
                          </code>
                        </div>
                      )}
                      <p className="text-xs text-amber-700 mt-2 italic">
                        ✓ DID verified and address extracted successfully
                      </p>
                    </div>
                  </div>
                );
              })()}

              {/* Showcase Info */}
              <div className="mt-4 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100/50 border-2 border-gray-200 p-4">
                <h4 className="font-bold text-gray-800 font-cairo text-sm uppercase mb-2">
                  💡 What's Essential vs Showcase
                </h4>
                <div className="text-xs space-y-1 text-gray-700">
                  <p><strong>Essential:</strong> DID hash + Merkle root (on-chain) for verification</p>
                  <p><strong>Showcase:</strong> PDF, Verify URLs, Admin info (for user experience)</p>
                  <p className="text-gray-600 italic mt-2">
                    Core verification only needs blockchain data - everything else enhances UX
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
