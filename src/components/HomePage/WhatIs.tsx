"use client";
import React from "react";
import { motion } from "framer-motion";
import Header from "../UI/Header";
import { HiShieldExclamation, HiShieldCheck } from "react-icons/hi";
import { FaArrowRight } from "react-icons/fa";
import { MdVerified } from "react-icons/md";

const WhatIs = () => {
  return (
    <section className="py-20 bg-white relative overflow-hidden">
      {/* Background linear blobs */}
      <div className="absolute top-[15%] left-[8%] w-[250px] h-[250px] bg-sky-400/30 blur-3xl opacity-60 rounded-full z-0" />
      <div className="absolute bottom-[15%] right-[10%] w-[200px] h-[200px] bg-sky-500/40 blur-3xl opacity-60 rounded-full z-0" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <Header
          icon={MdVerified}
          label="What is ChainGrad?"
          title="Verified Certificates, Powered by Blockchain"
        />

        {/* Description */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-16 "
        >
          <p className="text-lg sm:text-xl lg:text-2xl text-gray-700 leading-relaxed font-poppins">
            ChainGrad is a blockchain-powered certification platform that
            enables institutes, universities, and training organizations to
            issue{" "}
            <span className="text-[#28aeec] font-semibold">
              tamper-proof, verifiable digital certificates
            </span>{" "}
            on-chain. Every credential is authentic, permanent, and instantly
            verifiable by employers or institutions anywhere in the world —{" "}
            <span className="text-[#28aeec] font-semibold">
              building trust and transparency
            </span>{" "}
            in academic and professional verification.
          </p>
        </motion.div>

        {/* Issue → Solution Section */}
        <div className="relative">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-8 lg:gap-0 items-stretch">
            {/* Issue Card */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="relative group"
            >
              <div className="h-full bg-linear-to-br from-red-50/80 to-orange-50/80 backdrop-blur-xl border-2 border-red-200/50 rounded-3xl p-8 lg:p-10 hover:border-red-300/70 hover:shadow-2xl hover:shadow-red-200/30 transition-all duration-500 shadow-lg">
                {/* Icon */}
                <div className="mb-6 flex justify-start">
                  <div className="w-16 h-16 rounded-full bg-red-100/80 backdrop-blur-sm p-4 transition-all duration-300 group-hover:scale-110 group-hover:rotate-6">
                    <HiShieldExclamation className="w-full h-full text-red-500" />
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6 font-cairo uppercase">
                  The Issue
                </h3>

                {/* Problems List */}
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <span className="text-red-500 text-xl mt-1">✗</span>
                    <p className="text-gray-700 text-lg font-poppins leading-relaxed">
                      <strong className="text-gray-900">
                        Certificate Forgery:
                      </strong>{" "}
                      Traditional digital certificates can be easily forged or
                      altered, leading to credential fraud.
                    </p>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-red-500 text-xl mt-1">✗</span>
                    <p className="text-gray-700 text-lg font-poppins leading-relaxed">
                      <strong className="text-gray-900">
                        Slow Verification:
                      </strong>{" "}
                      Manual verification processes take weeks or even months,
                      delaying hiring and admissions.
                    </p>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-red-500 text-xl mt-1">✗</span>
                    <p className="text-gray-700 text-lg font-poppins leading-relaxed">
                      <strong className="text-gray-900">High Costs:</strong>{" "}
                      Institutions spend significant resources on verification
                      systems and anti-fraud measures.
                    </p>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-red-500 text-xl mt-1">✗</span>
                    <p className="text-gray-700 text-lg font-poppins leading-relaxed">
                      <strong className="text-gray-900">No Ownership:</strong>{" "}
                      Graduates don't truly own their credentials — they depend
                      on institutions to verify them.
                    </p>
                  </li>
                </ul>

                {/* Bottom accent */}
                <div className="absolute bottom-0 left-8 right-8 h-1 bg-linear-to-r from-transparent via-red-400/40 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
              </div>
            </motion.div>

            {/* Animated Arrow */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="hidden lg:flex items-center justify-center px-6 relative"
            >
              <div className="relative">
                {/* Animated flowing particles */}
                <motion.div
                  animate={{
                    x: [0, 60, 0],
                    opacity: [0, 1, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="absolute top-1/2 left-0 w-3 h-3 rounded-full bg-[#28aeec] blur-sm"
                />
                <motion.div
                  animate={{
                    x: [0, 60, 0],
                    opacity: [0, 1, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.3,
                  }}
                  className="absolute top-1/2 left-0 w-2 h-2 rounded-full bg-sky-400 blur-sm"
                />
                <motion.div
                  animate={{
                    x: [0, 60, 0],
                    opacity: [0, 1, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.6,
                  }}
                  className="absolute top-1/2 left-0 w-2.5 h-2.5 rounded-full bg-[#28aeec]/70 blur-sm"
                />

                {/* Main Arrow */}
                <FaArrowRight className="text-[#28aeec] text-5xl drop-shadow-lg relative z-10" />
              </div>
            </motion.div>

            {/* Solution Card */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.4 }}
              className="relative group"
            >
              <div className="h-full bg-linear-to-br from-sky-50/80 to-blue-50/80 backdrop-blur-xl border-2 border-[#28aeec]/30 rounded-3xl p-8 lg:p-10 hover:border-[#28aeec]/60 hover:shadow-2xl hover:shadow-sky-200/40 transition-all duration-500 shadow-lg">
                {/* Icon */}
                <div className="mb-6 flex justify-start">
                  <div className="w-16 h-16 rounded-full bg-sky-100/80 backdrop-blur-sm p-4 transition-all duration-300 group-hover:scale-110 group-hover:-rotate-6">
                    <HiShieldCheck className="w-full h-full text-[#28aeec]" />
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6 font-cairo uppercase">
                  The Solution
                </h3>

                {/* Solutions List */}
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <span className="text-[#28aeec] text-xl mt-1">✓</span>
                    <p className="text-gray-700 text-lg font-poppins leading-relaxed">
                      <strong className="text-gray-900">
                        Tamper-Proof Certificates:
                      </strong>{" "}
                      Blockchain immutability ensures certificates cannot be
                      forged or altered — anchored as cryptographic hashes
                      on-chain.
                    </p>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-[#28aeec] text-xl mt-1">✓</span>
                    <p className="text-gray-700 text-lg font-poppins leading-relaxed">
                      <strong className="text-gray-900">
                        Instant Verification:
                      </strong>{" "}
                      Verify credentials in seconds through QR code scan or
                      document upload — no manual checks required.
                    </p>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-[#28aeec] text-xl mt-1">✓</span>
                    <p className="text-gray-700 text-lg font-poppins leading-relaxed">
                      <strong className="text-gray-900">
                        80% Cost Reduction:
                      </strong>{" "}
                      Powered by Polygon Layer-2 for minimal gas fees, making
                      large-scale issuance affordable.
                    </p>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-[#28aeec] text-xl mt-1">✓</span>
                    <p className="text-gray-700 text-lg font-poppins leading-relaxed">
                      <strong className="text-gray-900">True Ownership:</strong>{" "}
                      Graduates own their credentials in digital wallets and can
                      share them globally without institutional dependency.
                    </p>
                  </li>
                </ul>

                {/* Bottom accent */}
                <div className="absolute bottom-0 left-8 right-8 h-1 bg-linear-to-r from-transparent via-[#28aeec]/40 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
              </div>
            </motion.div>
          </div>

          {/* Mobile Arrow */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="lg:hidden flex justify-center my-6"
          >
            <div className="relative">
              <motion.div
                animate={{
                  y: [0, 20, 0],
                  opacity: [0, 1, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute top-0 left-1/2 w-3 h-3 rounded-full bg-[#28aeec] blur-sm"
              />
              <FaArrowRight className="text-[#28aeec] text-4xl drop-shadow-lg rotate-90" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default WhatIs;
