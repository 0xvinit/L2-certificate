import HomePage from "@/components/HomePage/HomePage";
import KeyBenefits from "@/components/HomePage/KeyBenefits";
import Technology from "@/components/HomePage/Technology";
import WhatIs from "@/components/HomePage/WhatIs";
import WhyUs from "@/components/HomePage/WhyUs";
import Link from "next/link";

export default function Home() {
  return (
    <>
      {/* <section className="container max-w-4xl py-16">
        <h1 className="text-4xl font-semibold tracking-tight">PramanaX — L2-Verifiable Certificates</h1>
        <p className="mt-3 max-w-2xl text-base text-muted-foreground">
          On L2, low-fee, onchain proofs with verifiable storage. Issue, verify, and manage academic
          credentials with transparent, cryptographic guarantees.
        </p>
        <div className="mt-6 flex gap-3">
          <Link href="/admin/dashboard" className="btn btn-primary h-11 px-6">Open App</Link>
          <Link href="/verify" className="btn btn-ghost h-11 px-6">Verify a Certificate</Link>
        </div>
        <div className="mt-10 grid sm:grid-cols-3 gap-4">
          <div className="rounded-md border p-4">
            <div className="text-sm font-semibold">L2 Transactions</div>
            <p className="mt-1 text-sm text-muted-foreground">Fast, affordable onchain actions</p>
          </div>
          <div className="rounded-md border p-4">
            <div className="text-sm font-semibold">Verifiable Storage</div>
            <p className="mt-1 text-sm text-muted-foreground">IPFS-backed document proofs</p>
          </div>
          <div className="rounded-md border p-4">
            <div className="text-sm font-semibold">Audit Friendly</div>
            <p className="mt-1 text-sm text-muted-foreground">Clear history and revocations</p>
          </div>
        </div>
      </section> */}
      <HomePage />
      <WhatIs />
      <KeyBenefits />
      <Technology />
      <WhyUs />
    </>
  );
}
