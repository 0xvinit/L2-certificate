"use client";
import React from "react";
import { motion } from "framer-motion";
import Header from "../UI/Header";
import { HiShieldExclamation, HiShieldCheck } from "react-icons/hi";
import { FaArrowRight } from "react-icons/fa";
import { MdVerified } from "react-icons/md";

const WhatIs = () => {
  return (
    <section className="py-32 bg-white relative overflow-hidden">
      {/* Background linear blobs */}
      <div className="absolute top-[15%] left-[8%] w-[250px] h-[250px] bg-sky-400/30 blur-3xl opacity-60 rounded-full z-0" />
      <div className="absolute bottom-[15%] right-[10%] w-[200px] h-[200px] bg-sky-500/40 blur-3xl opacity-60 rounded-full z-0" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <Header
          icon={MdVerified}
          label="What is PramanaX?"
          title="Decentralized Certificate Verification, Secured by Blockchain"
        />

        {/* Description */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-16"
        >
          <p className="text-lg sm:text-xl lg:text-2xl text-gray-700 leading-relaxed font-poppins">
            PramanaX is a{" "}
            <span className="text-[#28aeec] font-semibold">
              decentralized certificate issuance and verification platform
            </span>{" "}
            that ensures authenticity and transparency using blockchain
            technology. Admins can create academic or training programs and
            issue certificates to students upon successful completion. Each
            certificate is stored on a{" "}
            <span className="text-[#28aeec] font-semibold">Layer-2 chain</span>{" "}
            with a unique hash acting as its{" "}
            <span className="text-[#28aeec] font-semibold">
              digital fingerprint
            </span>
            , making every credential verifiable, tamper-proof, and permanent.
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
                      <strong>Forgery and Duplication:</strong> Traditional
                      digital certificates can be copied, edited, or faked,
                      leading to serious credential fraud.
                    </p>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-red-500 text-xl mt-1">✗</span>
                    <p className="text-gray-700 text-lg font-poppins leading-relaxed">
                      <strong>No Transparency:</strong> There’s no reliable way
                      to confirm the authenticity of a certificate without
                      contacting the issuer.
                    </p>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-red-500 text-xl mt-1">✗</span>
                    <p className="text-gray-700 text-lg font-poppins leading-relaxed">
                      <strong>Manual Verification Delays:</strong> Checking each
                      certificate takes time and effort, slowing down hiring and
                      admissions processes.
                    </p>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-red-500 text-xl mt-1">✗</span>
                    <p className="text-gray-700 text-lg font-poppins leading-relaxed">
                      <strong>Lack of Ownership:</strong> Students depend on
                      institutions to verify their certificates, with no direct
                      control over their credentials.
                    </p>
                  </li>
                </ul>

                <div className="absolute bottom-0 left-8 right-8 h-1 bg-linear-to-r from-transparent via-red-400/40 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
              </div>
            </motion.div>

            {/* Animated Arrow */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="flex items-center justify-center px-6 relative"
            >
              <div className="relative">
                <motion.div
                  animate={{ x: [0, 60, 0], opacity: [0, 1, 0] }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="absolute top-1/2 left-0 w-3 h-3 rounded-full bg-[#28aeec] blur-sm"
                />
                <motion.div
                  animate={{ x: [0, 60, 0], opacity: [0, 1, 0] }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.3,
                  }}
                  className="absolute top-1/2 left-0 w-2 h-2 rounded-full bg-sky-400 blur-sm"
                />
                <FaArrowRight className="text-[#28aeec] text-5xl drop-shadow-lg relative z-10 rotate-90 lg:rotate-0" />
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
                <div className="mb-6 flex justify-start">
                  <div className="w-16 h-16 rounded-full bg-sky-100/80 backdrop-blur-sm p-4 transition-all duration-300 group-hover:scale-110 group-hover:-rotate-6">
                    <HiShieldCheck className="w-full h-full text-[#28aeec]" />
                  </div>
                </div>

                <h3 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6 font-cairo uppercase">
                  The Solution
                </h3>

                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <span className="text-[#28aeec] text-xl mt-1">✓</span>
                    <p className="text-gray-700 text-lg font-poppins leading-relaxed">
                      <strong>Blockchain-Backed Certificates:</strong> Each
                      certificate is stored on a{" "}
                      <span className="text-[#28aeec] font-semibold">
                        Layer-2 blockchain
                      </span>{" "}
                      for cost efficiency, immutability, and transparency.
                    </p>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-[#28aeec] text-xl mt-1">✓</span>
                    <p className="text-gray-700 text-lg font-poppins leading-relaxed">
                      <strong>Unique Hash Verification:</strong> Every
                      certificate generates a unique{" "}
                      <span className="text-[#28aeec] font-semibold">
                        cryptographic hash
                      </span>{" "}
                      — its digital fingerprint — ensuring tamper-proof records.
                    </p>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-[#28aeec] text-xl mt-1">✓</span>
                    <p className="text-gray-700 text-lg font-poppins leading-relaxed">
                      <strong>Instant Public Validation:</strong> Anyone can
                      verify certificate authenticity by entering its hash or
                      scanning a QR code on the platform.
                    </p>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-[#28aeec] text-xl mt-1">✓</span>
                    <p className="text-gray-700 text-lg font-poppins leading-relaxed">
                      <strong>Admin Dashboard:</strong> Admins can create
                      programs, manage students, and issue certificates with a
                      user-friendly, secure interface.
                    </p>
                  </li>
                </ul>

                <div className="absolute bottom-0 left-8 right-8 h-1 bg-linear-to-r from-transparent via-[#28aeec]/40 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
              </div>
            </motion.div>
          </div>

          {/* Mobile Arrow */}
          {/* <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="lg:hidden flex justify-center my-6"
          >
            <div className="relative">
              <motion.div
                animate={{ y: [0, 20, 0], opacity: [0, 1, 0] }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute top-0 left-1/2 w-3 h-3 rounded-full bg-[#28aeec] blur-sm"
              />
              <FaArrowRight className="text-[#28aeec] text-4xl drop-shadow-lg rotate-90" />
            </div>
          </motion.div> */}
        </div>
      </div>
    </section>
  );
};

export default WhatIs;
