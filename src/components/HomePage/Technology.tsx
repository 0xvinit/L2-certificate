"use client";
import React from "react";
import { motion } from "framer-motion";
import Header from "../UI/Header";
import { HiCpuChip } from "react-icons/hi2";
import { FaFileAlt, FaLink, FaCheckCircle } from "react-icons/fa";
import { IoArrowForward } from "react-icons/io5";

const Technology = () => {
  const steps = [
    {
      icon: FaFileAlt,
      title: "Create Hash",
      description: "Document is converted into a unique cryptographic hash — a digital fingerprint that represents the entire content.",
      color: "from-[#28aeec] to-sky-400",
      delay: 0.3,
    },
    {
      icon: FaLink,
      title: "Store on Blockchain",
      description: "Hash is uploaded to the distributed public ledger (Polygon blockchain) — permanent and immutable storage.",
      color: "from-sky-400 to-blue-500",
      delay: 0.4,
    },
    {
      icon: FaCheckCircle,
      title: "Verify Document",
      description: "Verification recreates the hash and matches it with blockchain — any tampering makes the document unverifiable.",
      color: "from-blue-500 to-[#28aeec]",
      delay: 0.5,
    },
  ];

  return (
    <section className="py-20 bg-white relative overflow-hidden">
      {/* Background linear blobs */}
      <div className="absolute top-[20%] right-[5%] w-[280px] h-[280px] bg-sky-400/30 blur-3xl opacity-60 rounded-full z-0" />
      <div className="absolute bottom-[20%] left-[8%] w-[250px] h-[250px] bg-sky-500/40 blur-3xl opacity-60 rounded-full z-0" />
      <div className="absolute top-[50%] right-[20%] w-[180px] h-[180px] bg-blue-400/35 blur-3xl opacity-60 rounded-full z-0" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <Header
          icon={HiCpuChip}
          label="Technology"
          title="Powered by Blockchain"
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
            At the heart of ChainGrad is{" "}
            <span className="text-[#28aeec] font-semibold">
              Blockchain Technology
            </span>{" "}
            — a distributed public ledger that allows institutions to create tamper-proof
            certificates by uploading cryptographic hashes on-chain. When any authority
            wants to verify a document, they simply initiate verification. The system
            recreates the document's hash and matches it with the hash stored on the
            blockchain. If the hash matches, the document is confirmed{" "}
            <span className="text-[#28aeec] font-semibold">authentic</span>. Any
            addition, deletion, or editing makes the document{" "}
            <span className="text-red-500 font-semibold">unverifiable</span>.
          </p>
        </motion.div>

        {/* Technology Flow */}
        <div className="relative">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr_auto_1fr] gap-8 lg:gap-0 items-stretch">
            {steps.map((step, index) => {
              const IconComponent = step.icon;
              return (
                <React.Fragment key={step.title}>
                  {/* Step Card */}
                  <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.7, delay: step.delay }}
                    className="relative group"
                  >
                    <div className="h-full bg-linear-to-br from-sky-50/80 to-blue-50/80 backdrop-blur-xl border-2 border-[#28aeec]/30 rounded-3xl p-8 lg:p-10 hover:border-[#28aeec]/60 hover:shadow-2xl hover:shadow-sky-200/40 transition-all duration-500 shadow-lg">
                      {/* Number Badge */}
                      <div className="absolute -top-4 -right-4 w-12 h-12 rounded-full bg-linear-to-r from-[#28aeec] to-sky-400 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                        {index + 1}
                      </div>

                      {/* Icon */}
                      <div className="mb-6 flex justify-center">
                        <div
                          className={`w-20 h-20 rounded-full bg-linear-to-r ${step.color} p-5 transition-all duration-300 group-hover:scale-110 group-hover:rotate-6 shadow-lg`}
                        >
                          <IconComponent className="w-full h-full text-white" />
                        </div>
                      </div>

                      {/* Title */}
                      <h3 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-4 font-cairo uppercase text-center">
                        {step.title}
                      </h3>

                      {/* Description */}
                      <p className="text-gray-700 text-base lg:text-lg font-poppins leading-relaxed text-center">
                        {step.description}
                      </p>

                      {/* Bottom accent */}
                      <div className="absolute bottom-0 left-8 right-8 h-1 bg-linear-to-r from-transparent via-[#28aeec]/40 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
                    </div>
                  </motion.div>

                  {/* Animated Arrow (between cards, not after last card) */}
                  {index < steps.length - 1 && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.6, delay: step.delay + 0.2 }}
                      className="hidden lg:flex items-center justify-center px-6 relative"
                    >
                      <div className="relative">
                        {/* Animated flowing particles */}
                        <motion.div
                          animate={{
                            x: [0, 50, 0],
                            opacity: [0, 1, 0],
                          }}
                          transition={{
                            duration: 2.5,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: index * 0.3,
                          }}
                          className="absolute top-1/2 left-0 w-2.5 h-2.5 rounded-full bg-[#28aeec] blur-sm"
                        />
                        <motion.div
                          animate={{
                            x: [0, 50, 0],
                            opacity: [0, 1, 0],
                          }}
                          transition={{
                            duration: 2.5,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: index * 0.3 + 0.4,
                          }}
                          className="absolute top-1/2 left-0 w-2 h-2 rounded-full bg-sky-400 blur-sm"
                        />

                        {/* Main Arrow */}
                        <IoArrowForward className="text-[#28aeec] text-5xl drop-shadow-lg relative z-10" />
                      </div>
                    </motion.div>
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* Mobile Arrows */}
          <div className="lg:hidden flex flex-col items-center gap-8 mt-8">
            {steps.slice(0, -1).map((_, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.5 + index * 0.1 }}
                className="relative"
              >
                <motion.div
                  animate={{
                    y: [0, 20, 0],
                    opacity: [0, 1, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: index * 0.3,
                  }}
                  className="absolute top-0 left-1/2 w-2.5 h-2.5 rounded-full bg-[#28aeec] blur-sm"
                />
                <IoArrowForward className="text-[#28aeec] text-4xl drop-shadow-lg rotate-90" />
              </motion.div>
            ))}
          </div>
        </div>

        {/* Bottom Info Box */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.6 }}
          className="mt-16 bg-linear-to-r from-[#28aeec]/10 via-sky-100/50 to-blue-100/40 backdrop-blur-xl border-2 border-[#28aeec]/30 rounded-3xl p-8 lg:p-10 shadow-xl"
        >
          <div className="flex items-start gap-4">
            <div className="shrink-0">
              <div className="w-12 h-12 rounded-full bg-linear-to-r from-[#28aeec] to-sky-400 flex items-center justify-center">
                <HiCpuChip className="text-white text-2xl" />
              </div>
            </div>
            <div>
              <h4 className="text-2xl font-bold text-gray-900 mb-3 font-cairo uppercase">
                Built on Polygon (Ethereum Layer-2)
              </h4>
              <p className="text-gray-700 text-lg font-poppins leading-relaxed">
                ChainGrad leverages{" "}
                <span className="text-[#28aeec] font-semibold">Polygon blockchain</span> for
                its infrastructure — ensuring{" "}
                <span className="font-semibold">low transaction fees</span>,{" "}
                <span className="font-semibold">high speed</span>, and{" "}
                <span className="font-semibold">global accessibility</span>. The platform is
                fully compliant with{" "}
                <span className="text-[#28aeec] font-semibold">
                  W3C Verifiable Credentials
                </span>{" "}
                and can integrate with systems like DigiLocker and National Academic
                Depository (NAD) for seamless verification.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Technology;
