import HomePage from "@/components/HomePage/HomePage";
import KeyBenefits from "@/components/HomePage/KeyBenefits";
import Technology from "@/components/HomePage/Technology";
import WhatIs from "@/components/HomePage/WhatIs";
import WhyUs from "@/components/HomePage/WhyUs";
import Link from "next/link";

export default function Home() {
  return (
    <>
      <HomePage />
      <WhatIs />
      <KeyBenefits />
      <Technology />
      <WhyUs />
    </>
  );
}
