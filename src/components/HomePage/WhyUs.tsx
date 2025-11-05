"use client";
import React from "react";
import { motion, Variants } from "framer-motion";
import Header from "../UI/Header";
import { HiStar } from "react-icons/hi2";
import {
  FaRocket,
  FaShieldAlt,
  FaGlobe,
  FaHandshake,
  FaCog,
  FaAward,
} from "react-icons/fa";

const WhyUs = () => {
  const reasons = [
    {
      icon: FaRocket,
      title: "Industry-Leading Innovation",
      description:
        "First-mover advantage in blockchain certification — built with cutting-edge technology for future-ready institutions.",
      iconColor: "text-[#28aeec]",
      delay: 0.2,
    },
    {
      icon: FaShieldAlt,
      title: "Uncompromising Security",
      description:
        "Military-grade cryptography and blockchain immutability ensure your certificates are tamper-proof and permanently secure.",
      iconColor: "text-[#28aeec]",
      delay: 0.3,
    },
    {
      icon: FaGlobe,
      title: "W3C Standards Compliant",
      description:
        "Fully compliant with international W3C Verifiable Credentials — recognized globally and compatible with DigiLocker & NAD.",
      iconColor: "text-[#28aeec]",
      delay: 0.4,
    },
    {
      icon: FaHandshake,
      title: "Trusted by Institutions",
      description:
        "Join leading universities and training organizations who trust ChainGrad for authentic, verifiable credential management.",
      iconColor: "text-[#28aeec]",
      delay: 0.5,
    },
    {
      icon: FaCog,
      title: "Seamless Integration",
      description:
        "Easy-to-use dashboard with API-ready JSON, Smart PDFs, and QR codes — integrate with existing systems in minutes.",
      iconColor: "text-[#28aeec]",
      delay: 0.6,
    },
    {
      icon: FaAward,
      title: "Proven Track Record",
      description:
        "Reduce verification time by 99% and cut costs by 80% — proven results delivering real value to institutions worldwide.",
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
    <section className="py-20 bg-gradient-to-b from-white to-sky-50/30 relative overflow-hidden">
      {/* Sky blue gradient overlays */}
      <div className="absolute top-[8%] left-[5%] w-[240px] h-[240px] bg-sky-400/30 blur-3xl opacity-100 rounded-full z-0" />
      <div className="absolute bottom-[15%] right-[8%] w-[220px] h-[220px] bg-sky-500/40 blur-3xl opacity-100 rounded-full z-0" />
      <div className="absolute top-[45%] right-[12%] w-[180px] h-[180px] bg-blue-400/35 blur-3xl opacity-100 rounded-full z-0" />
      <div className="absolute bottom-[40%] left-[15%] w-[160px] h-[160px] bg-sky-300/40 blur-3xl opacity-100 rounded-full z-0" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <Header
          icon={HiStar}
          label="Why Choose Us?"
          title="Trusted by Leading Institutions"
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
            ChainGrad is more than just a certification platform — it's a{" "}
            <span className="text-[#28aeec] font-semibold">
              complete trust infrastructure
            </span>{" "}
            for modern education. We combine blockchain security with intuitive
            design, global standards, and proven results to deliver a solution that{" "}
            <span className="text-[#28aeec] font-semibold">
              transforms how credentials are issued and verified
            </span>{" "}
            worldwide.
          </p>
        </motion.div>

        {/* Stats Bar */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="mb-16 bg-gradient-to-r from-[#28aeec] via-sky-400 to-blue-500 rounded-3xl p-8 lg:p-12 shadow-2xl shadow-sky-200/50"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="space-y-2">
              <motion.div
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.4, type: "spring" }}
                className="text-5xl lg:text-6xl font-bold text-white font-cairo"
              >
                99%
              </motion.div>
              <p className="text-white/90 text-lg font-poppins font-medium">
                Faster Verification
              </p>
            </div>
            <div className="space-y-2 border-x-0 md:border-x border-white/30">
              <motion.div
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.5, type: "spring" }}
                className="text-5xl lg:text-6xl font-bold text-white font-cairo"
              >
                80%
              </motion.div>
              <p className="text-white/90 text-lg font-poppins font-medium">
                Cost Reduction
              </p>
            </div>
            <div className="space-y-2">
              <motion.div
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.6, type: "spring" }}
                className="text-5xl lg:text-6xl font-bold text-white font-cairo"
              >
                100%
              </motion.div>
              <p className="text-white/90 text-lg font-poppins font-medium">
                Tamper-Proof Security
              </p>
            </div>
          </div>
        </motion.div>

        {/* Reasons Cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10"
        >
          {reasons.map((reason, index) => {
            const IconComponent = reason.icon;
            return (
              <motion.div
                key={reason.title}
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
                <div className="relative bg-white/40 backdrop-blur-xl border border-white/50 rounded-3xl p-8 h-full hover:border-sky-400/60 hover:shadow-2xl hover:shadow-sky-200/30 transition-all duration-500 shadow-lg hover:bg-white/60">
                  {/* Icon */}
                  <div className="mb-6">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-r from-[#28aeec] to-sky-400 p-4 transition-all duration-300 group-hover:scale-110 group-hover:rotate-12 shadow-lg">
                      <IconComponent className="w-full h-full text-white" />
                    </div>
                  </div>

                  {/* Content */}
                  <h3 className="text-2xl font-bold text-gray-900 mb-4 font-cairo group-hover:text-[#28aeec] transition-colors duration-300 uppercase">
                    {reason.title}
                  </h3>

                  <p className="text-gray-700 leading-relaxed text-lg font-poppins group-hover:text-gray-800">
                    {reason.description}
                  </p>

                  {/* Glowing accent line */}
                  <div className="absolute bottom-0 left-8 right-8 h-1 bg-gradient-to-r from-transparent via-sky-400/40 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:shadow-lg group-hover:shadow-sky-200"></div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Bottom CTA Box */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="mt-16 bg-gradient-to-br from-sky-50/80 to-blue-50/80 backdrop-blur-xl border-2 border-[#28aeec]/40 rounded-3xl p-8 lg:p-12 shadow-2xl text-center"
        >
          <h3 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4 font-cairo uppercase">
            Ready to Transform Your Certification Process?
          </h3>
          <p className="text-xl text-gray-700 font-poppins mb-8 max-w-3xl mx-auto">
            Join the future of academic verification. Issue tamper-proof certificates,
            reduce costs, and build trust with blockchain technology.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="group bg-gradient-to-r from-[#28aeec] to-sky-400 text-white font-bold px-8 py-4 rounded-full transition-all duration-300 transform hover:scale-105 hover:shadow-xl hover:shadow-sky-200/50 font-poppins text-lg uppercase">
              <span className="flex items-center gap-2 justify-center">
                Get Started
                <svg
                  className="w-5 h-5 transition-transform group-hover:translate-x-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </span>
            </button>
            <button className="group bg-white text-[#28aeec] font-bold px-8 py-4 rounded-full border-2 border-[#28aeec] transition-all duration-300 transform hover:scale-105 hover:shadow-xl hover:bg-sky-50 font-poppins text-lg uppercase">
              Schedule Demo
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default WhyUs;
