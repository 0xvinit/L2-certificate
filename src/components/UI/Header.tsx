"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { IconType } from 'react-icons';

interface HeaderProps {
  icon: IconType;
  label: string;
  title: string;
  subtitle?: string;
}

const Header: React.FC<HeaderProps> = ({ icon: Icon, label, title, subtitle }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="mb-12"
    >
      {/* Number + Label */}
      <div className="flex items-center gap-3 mb-4">
        <div className="size-10 rounded-full bg-linear-to-r from-[#28aeec] to-sky-400 flex items-center justify-center text-white font-bold text-2xl font-poppins">
          <Icon />
        </div>
        <span className="uppercase text-3xl xl:text-4xl tracking-wider text-[#28aeec] font-bold font-cairo">
          {label}
        </span>
      </div>

      {/* Divider */}
      <div className="h-px w-full bg-linear-to-r from-sky-400/60 via-sky-200/50 to-transparent mb-6"></div>

      {/* Title */}
      <h2 className="text-3xl sm:text-4xl lg:text-6xl font-extrabold uppercase font-cairo leading-tight text-gray-900">
        {title}
      </h2>
    </motion.div>
  );
};

export default Header;
