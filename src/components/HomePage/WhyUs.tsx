"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const reasons = [
    {
      icon: FaRocket,
      title: "Industry-Leading Innovation",
      description:
        "First-mover advantage in blockchain certification — built with cutting-edge technology for future-ready institutions.",
      iconColor: "text-[#28aeec]",
    },
    {
      icon: FaShieldAlt,
      title: "Uncompromising Security",
      description:
        "Military-grade cryptography and blockchain immutability ensure your certificates are tamper-proof and permanently secure.",
      iconColor: "text-[#28aeec]",
    },
    {
      icon: FaGlobe,
      title: "W3C Standards Compliant",
      description:
        "Fully compliant with international W3C Verifiable Credentials — recognized globally and compatible with DigiLocker & NAD.",
      iconColor: "text-[#28aeec]",
    },
    {
      icon: FaHandshake,
      title: "Trusted by Institutions",
      description:
        "Join leading universities and training organizations who trust ChainGrad for authentic, verifiable credential management.",
      iconColor: "text-[#28aeec]",
    },
    {
      icon: FaCog,
      title: "Seamless Integration",
      description:
        "Easy-to-use dashboard with API-ready JSON, Smart PDFs, and QR codes — integrate with existing systems in minutes.",
      iconColor: "text-[#28aeec]",
    },
    {
      icon: FaAward,
      title: "Proven Track Record",
      description:
        "Reduce verification time by 99% and cut costs by 80% — proven results delivering real value to institutions worldwide.",
      iconColor: "text-[#28aeec]",
    },
  ];

  // Calculate positions for circles in a circular layout
  const calculatePosition = (index: number, total: number, radius: number) => {
    const angle = (index * 2 * Math.PI) / total - Math.PI / 2;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    return { x, y };
  };

  return (
    <section className="py-20 bg-linear-to-b from-white to-sky-50/30 relative overflow-hidden">
      {/* Sky blue linear overlays */}
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

        {/* Mobile Card Grid (visible on screens < lg) */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="lg:hidden mb-16"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8">
            {reasons.map((reason, index) => {
              const IconComponent = reason.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="group relative"
                >
                  <div className="relative bg-white/60 backdrop-blur-xl border-2 border-sky-100 rounded-3xl p-6 h-full hover:border-[#28aeec] hover:shadow-2xl hover:shadow-sky-200/30 transition-all duration-500 shadow-lg hover:bg-white/80">
                    {/* Icon */}
                    <div className="mb-4">
                      <div className="w-16 h-16 rounded-full bg-linear-to-r from-[#28aeec] to-sky-400 p-4 transition-all duration-300 group-hover:scale-110 shadow-lg">
                        <IconComponent className="w-full h-full text-white" />
                      </div>
                    </div>

                    {/* Content */}
                    <h3 className="text-xl font-bold text-gray-900 mb-3 font-cairo group-hover:text-[#28aeec] transition-colors duration-300 uppercase">
                      {reason.title}
                    </h3>

                    <p className="text-gray-700 leading-relaxed text-base font-poppins">
                      {reason.description}
                    </p>

                    {/* Glowing accent line */}
                    <div className="absolute bottom-0 left-6 right-6 h-1 bg-linear-to-r from-transparent via-sky-400/40 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Circular Layout (visible on lg screens and above) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="hidden lg:block relative w-full h-[800px] my-16"
        >
          <div className="relative w-full h-full flex items-center justify-center">
            {/* SVG for connecting lines */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
              {reasons.map((_, index) => {
                const centerX = 50;
                const centerY = 50;
                const radius = 35;
                const position = calculatePosition(index, reasons.length, radius);
                const endX = centerX + position.x;
                const endY = centerY + position.y;

                return (
                  <motion.line
                    key={index}
                    initial={{ pathLength: 0, opacity: 0 }}
                    whileInView={{ pathLength: 1, opacity: 0.3 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.2 + index * 0.1 }}
                    x1={`${centerX}%`}
                    y1={`${centerY}%`}
                    x2={`${endX}%`}
                    y2={`${endY}%`}
                    stroke="#28aeec"
                    strokeWidth="2"
                    className={hoveredIndex === index ? "opacity-80" : ""}
                  />
                );
              })}
            </svg>

            {/* Center Circle */}
            <motion.div
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3, type: "spring", stiffness: 200 }}
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10"
            >
              <div className="size-40 rounded-full bg-linear-to-br from-[#28aeec] to-sky-600 shadow-2xl shadow-sky-300/50 flex items-center justify-center border-4 border-white">
                <p className="text-2xl font-bold text-white font-cairo uppercase text-center px-4 leading-tight">
                  Why <br/>Choose Us
                </p>
              </div>
            </motion.div>

            {/* Surrounding Circles */}
            {reasons.map((reason, index) => {
              const IconComponent = reason.icon;
              const radius = 35; // percentage based radius
              const position = calculatePosition(index, reasons.length, radius);

              return (
                <motion.div
                  key={index}
                  initial={{ scale: 0, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{
                    duration: 0.5,
                    delay: 0.4 + index * 0.1,
                    type: "spring",
                    stiffness: 200,
                  }}
                  style={{
                    position: "absolute",
                    left: `calc(50% + ${position.x-5}%)`,
                    top: `calc(50% + ${position.y-5}%)`,
                    transform: "translate(-50%, -50%)",
                  }}
                  className="z-20"
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    transition={{ duration: 0.3 }}
                    className="relative"
                  >
                    <div className="w-28 h-28 rounded-full bg-white shadow-xl shadow-sky-200/50 flex items-center justify-center cursor-pointer border-4 border-sky-100 hover:border-[#28aeec] transition-all duration-300">
                      <IconComponent className="w-14 h-14 text-[#28aeec]" />
                    </div>

                    {/* Hover Card */}
                    <AnimatePresence>
                      {hoveredIndex === index && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8, y: 10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.8, y: 10 }}
                          transition={{ duration: 0.3 }}
                          className="absolute top-full mt-4 left-1/2 transform -translate-x-1/2 w-80 z-50"
                        >
                          <div className="bg-white/95 backdrop-blur-xl border-2 border-[#28aeec]/50 rounded-2xl p-6 shadow-2xl shadow-sky-300/50">
                            <h3 className="text-xl font-bold text-gray-900 mb-3 font-cairo uppercase">
                              {reason.title}
                            </h3>
                            <p className="text-base text-gray-700 leading-relaxed font-poppins">
                              {reason.description}
                            </p>
                            {/* Arrow pointing up */}
                            <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-white border-t-2 border-l-2 border-[#28aeec]/50 rotate-45"></div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Stats Bar */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="mb-16 bg-linear-to-r from-[#28aeec] via-sky-400 to-blue-500 rounded-3xl p-8 lg:p-12 shadow-2xl shadow-sky-200/50"
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

        {/* Bottom CTA Box */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="mt-16 bg-linear-to-br from-sky-50/80 to-blue-50/80 backdrop-blur-xl border-2 border-[#28aeec]/40 rounded-3xl p-8 lg:p-12 shadow-2xl text-center"
        >
          <h3 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4 font-cairo uppercase">
            Ready to Transform Your Certification Process?
          </h3>
          <p className="text-xl text-gray-700 font-poppins mb-8 max-w-3xl mx-auto">
            Join the future of academic verification. Issue tamper-proof certificates,
            reduce costs, and build trust with blockchain technology.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="group bg-linear-to-r from-[#28aeec] to-sky-400 text-white font-bold px-8 py-4 rounded-full transition-all duration-300 transform hover:scale-105 hover:shadow-xl hover:shadow-sky-200/50 font-poppins text-lg uppercase">
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
