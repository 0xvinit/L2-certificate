"use client";
import React from "react";
import { motion, Variants } from "framer-motion";
import Header from "../UI/Header";
import { HiSparkles } from "react-icons/hi2";
import {
  FaShieldAlt,
  FaFingerprint,
  FaGlobe,
  FaServer,
  FaSearch,
  FaUserShield,
} from "react-icons/fa";

const KeyBenefits = () => {
  const benefits = [
    {
      icon: FaShieldAlt,
      title: "Tamper-Proof Certificates",
      description:
        "Each certificate is permanently stored on an Arbitrum blockchain, secured with cryptographic hashing to prevent forgery or alteration.",
      iconColor: "text-[#28aeec]",
      delay: 0.2,
    },
    {
      icon: FaFingerprint,
      title: "Unique Digital Fingerprint",
      description:
        "Every certificate generates a unique blockchain hash — a digital fingerprint — ensuring authenticity and traceability at all times.",
      iconColor: "text-[#28aeec]",
      delay: 0.3,
    },
    {
      icon: FaSearch,
      title: "Seamless Verification",
      description:
        "Anyone can verify a certificate by entering its hash on the portal — instantly confirming its validity from the blockchain record.",
      iconColor: "text-[#28aeec]",
      delay: 0.4,
    },
    {
      icon: FaServer,
      title: "Arbitrum Blockchain Efficiency",
      description:
        "Built on a Arbitrum blockchain for scalability and cost efficiency — enabling large-scale certificate issuance with minimal gas fees.",
      iconColor: "text-[#28aeec]",
      delay: 0.5,
    },
    {
      icon: FaUserShield,
      title: "Admin Control Panel",
      description:
        "Admins can easily create academic or training programs and issue certificates to students in a secure, decentralized environment.",
      iconColor: "text-[#28aeec]",
      delay: 0.6,
    },
    {
      icon: FaGlobe,
      title: "Global Transparency",
      description:
        "Certificates can be verified anywhere in the world — ensuring trust, transparency, and credibility for institutions and learners alike.",
      iconColor: "text-[#28aeec]",
      delay: 0.7,
    },
  ];

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1,
      },
    },
  };

  const cardVariants: Variants = {
    hidden: {
      opacity: 0,
      y: 30,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut",
      },
    },
  };

  return (
    <section className="py-32 bg-white relative overflow-hidden">
      {/* Sky blue linear overlays */}
      {/* <div className="absolute top-[5%] right-[8%] w-[220px] h-[220px] bg-sky-400/35 blur-3xl opacity-100 rounded-full z-0" /> */}
      <div className="absolute bottom-[12%] left-[6%] w-[200px] h-[200px] bg-sky-500/50 blur-3xl opacity-100 rounded-full z-0" />
      <div className="absolute top-[40%] left-[10%] w-[150px] h-[150px] bg-sky-200/40 blur-3xl opacity-100 rounded-full z-0" />
      <div className="absolute bottom-[30%] right-[15%] w-[180px] h-[180px] bg-sky-300/45 blur-3xl opacity-100 rounded-full z-0" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <Header
          icon={HiSparkles}
          label="Key Benefits"
          title="Why Choose Patram?"
        />

        {/* Benefits Cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10"
        >
          {benefits.map((benefit, index) => {
            const IconComponent = benefit.icon;
            return (
              <motion.div
                key={benefit.title}
                variants={cardVariants}
                whileHover={{
                  y: -10,
                  scale: 1.02,
                  rotateY: 5,
                  transition: { duration: 0.3, ease: "easeOut" },
                }}
                whileTap={{ scale: 0.98 }}
                className="group relative"
              >
                <div className="relative bg-white/20 backdrop-blur-xl border border-white/30 rounded-3xl p-8 h-full hover:border-sky-400/50 hover:shadow-2xl hover:shadow-sky-200/20 transition-all duration-500 shadow-lg hover:bg-white/30">
                  {/* Icon */}
                  <div className="mb-6">
                    <div className="w-16 h-16 rounded-full bg-sky-100/60 backdrop-blur-sm hover:bg-sky-400/20 p-4 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3">
                      <IconComponent
                        className={`w-full h-full ${benefit.iconColor} transition-all duration-300 group-hover:drop-shadow-lg`}
                      />
                    </div>
                  </div>

                  {/* Content */}
                  <h3 className="text-2xl font-bold text-gray-900 mb-4 font-cairo group-hover:text-[#28aeec] transition-colors duration-300 uppercase">
                    {benefit.title}
                  </h3>

                  <p className="text-gray-700 leading-relaxed text-lg font-poppins group-hover:text-gray-800">
                    {benefit.description}
                  </p>

                  {/* Glowing accent line */}
                  <div className="absolute bottom-0 left-8 right-8 h-1 bg-linear-to-r from-transparent via-sky-400/30 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:shadow-lg group-hover:shadow-sky-200"></div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
};

export default KeyBenefits;
