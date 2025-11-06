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
      title: "Generate Unique Hash",
      description:
        "Each issued certificate is converted into a unique cryptographic hash — a digital fingerprint that ensures authenticity and prevents duplication.",
      color: "from-[#28aeec] to-sky-400",
      delay: 0.3,
    },
    {
      icon: FaLink,
      title: "Store on L2 Blockchain",
      description:
        "The generated hash is stored securely on a Layer-2 blockchain — providing immutable and transparent record-keeping at low cost and high speed.",
      color: "from-sky-400 to-blue-500",
      delay: 0.4,
    },
    {
      icon: FaCheckCircle,
      title: "Verify Certificate",
      description:
        "Anyone can verify a certificate by entering its hash. The system checks the on-chain record, confirming whether the certificate is valid or tampered.",
      color: "from-blue-500 to-[#28aeec]",
      delay: 0.5,
    },
  ];

  return (
    <section className="py-32 bg-white relative overflow-hidden">
      {/* Background linear blobs */}
      <div className="absolute top-[20%] right-[5%] w-[280px] h-[280px] bg-sky-400/30 blur-3xl opacity-60 rounded-full z-0" />
      <div className="absolute bottom-[20%] left-[8%] w-[250px] h-[250px] bg-sky-500/40 blur-3xl opacity-60 rounded-full z-0" />
      <div className="absolute top-[50%] right-[20%] w-[180px] h-[180px] bg-blue-400/35 blur-3xl opacity-60 rounded-full z-0" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <Header
          icon={HiCpuChip}
          label="Technology"
          title="Blockchain-Powered Verification"
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
            This platform leverages{" "}
            <span className="text-[#28aeec] font-semibold">
              blockchain technology
            </span>{" "}
            to bring transparency and trust to certificate management. Admins
            can create academic or training programs and issue certificates upon
            completion. Each certificate is converted into a{" "}
            <span className="text-[#28aeec] font-semibold">
              unique blockchain hash
            </span>
            , securely stored on an{" "}
            <span className="font-semibold">L2 chain</span> to ensure cost
            efficiency and immutability. Anyone can verify a certificate’s
            authenticity simply by entering its hash — instantly confirming
            whether it’s{" "}
            <span className="text-[#28aeec] font-semibold">valid</span> or{" "}
            <span className="text-red-500 font-semibold">tampered</span>.
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

                  {/* Animated Arrow */}
                  {index < steps.length - 1 && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.6, delay: step.delay + 0.2 }}
                      className="flex items-center justify-center px-6 relative"
                    >
                      <div className="relative">
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
                        <IoArrowForward className="text-[#28aeec] text-5xl drop-shadow-lg relative z-10 rotate-90 lg:rotate-0" />
                      </div>
                    </motion.div>
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* Mobile Arrows */}
          {/* <div className="lg:hidden flex flex-col items-center gap-8 mt-8">
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
          </div> */}
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
                Built on Layer-2 Blockchain Infrastructure
              </h4>
              <p className="text-gray-700 text-lg font-poppins leading-relaxed">
                The platform uses a{" "}
                <span className="text-[#28aeec] font-semibold">Layer-2</span>{" "}
                blockchain network to deliver{" "}
                <span className="font-semibold">low-cost</span>,{" "}
                <span className="font-semibold">fast</span>, and{" "}
                <span className="font-semibold">secure</span> certificate
                storage and verification. By leveraging decentralized
                technology, it ensures{" "}
                <span className="text-[#28aeec] font-semibold">
                  transparency, immutability,
                </span>{" "}
                and{" "}
                <span className="text-[#28aeec] font-semibold">
                  global accessibility
                </span>
                . This provides institutions, students, and verifiers with a
                trusted and permanent record of achievements.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Technology;
