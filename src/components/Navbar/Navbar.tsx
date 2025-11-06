"use client";
import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { IoWallet, IoCopy, IoLogOut, IoChevronDown } from "react-icons/io5";

const Navbar = () => {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Privy wallet integration
  const { ready, authenticated, login, logout } = usePrivy();
  const { wallets } = useWallets();
  const address = wallets?.[0]?.address || "";
  const isConnected = Boolean(address);

  const isHomePage = pathname === "/";

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setIsScrolled(scrollTop > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Clear session cookie when user becomes unauthenticated
  useEffect(() => {
    if (ready && !authenticated) {
      // User logged out - clear session cookie
      fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      }).catch(() => {});
    }
  }, [ready, authenticated]);

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  const handleConnectWallet = () => {
    login();
  };

  const handleDisconnect = async () => {
    try {
      // First clear the session cookie
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Error clearing session:", error);
    }
    // Then logout from Privy
    logout();
    setDropdownOpen(false);
    // Redirect to home page after logout
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
  };

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      // You can add a toast notification here if needed
    }
  };

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          !isHomePage || isScrolled ? "bg-[#325164]/60 backdrop-blur-md" : ""
        }`}
      >
        <div className="mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link
                href="/"
                className="flex items-center space-x-2 group font-major-mono"
              >
                {/* bg-linear-to-r from-white via-sky-200 to-sky-400 bg-clip-text text-transparent */}
                <span className="bg-linear-to-r from-white via-sky-200 to-sky-400 bg-clip-text text-transparent text-4xl font-bold tracking-tighter">
                  PramanaX
                </span>
              </Link>
            </div>

            {/* Right Side Buttons */}
            <div className="flex items-center space-x-3 font-poppins">
              {ready && authenticated && isConnected ? (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={toggleDropdown}
                    className="cursor-pointer group relative overflow-hidden
        bg-linear-to-r from-[#28aeec] via-sky-400 to-[#28aeec]
        text-white font-semibold
        px-6 py-2.5 rounded-full transition-all duration-500
        transform hover:scale-105 hover:-translate-y-0.5
        shadow-lg hover:shadow-xl hover:shadow-[#28aeec]/40
        border border-[#28aeec]/40 hover:border-[#28aeec]/80 uppercase"
                  >
                    <span className="relative z-10 flex items-center gap-2.5">
                      <IoWallet className="w-5 h-5 text-white " />
                      <span className="hidden sm:block">
                        {address
                          ? `${address.slice(0, 6)}...${address.slice(-4)}`
                          : "Connected"}
                      </span>
                      <IoChevronDown
                        className={`w-4 h-4 transition-transform duration-300 ${
                          dropdownOpen ? "rotate-180" : ""
                        }`}
                      />
                    </span>

                    {/* Shine sweep */}
                    <div
                      className="absolute inset-0 bg-linear-to-r from-white/30 via-[#28aeec]/20 to-white/30
        opacity-0 group-hover:opacity-100 transition-all duration-700
        transform -translate-x-full group-hover:translate-x-0"
                    ></div>

                    {/* Glow border */}
                    <div
                      className="absolute -inset-0.5 bg-linear-to-r from-[#28aeec] via-sky-400 to-[#28aeec]
        rounded-full opacity-0 group-hover:opacity-40 blur-lg transition-all duration-500"
                    ></div>
                  </button>

                  {/* Dropdown Menu */}
                  {dropdownOpen && (
                    <div
                      className="absolute right-0 mt-2 w-64
        bg-white/95 backdrop-blur-xl rounded-xl shadow-2xl
        border border-[#28aeec]/40 overflow-hidden z-50
        shadow-[#28aeec]/20"
                    >
                      <div className="p-4">
                        {/* Address Section */}
                        <div className="mb-4">
                          <p className="text-[#28aeec] text-sm font-medium mb-2 font-poppins">
                            Wallet Address
                          </p>
                          <div
                            className="flex items-center justify-between
              bg-[#28aeec]/10 backdrop-blur-md rounded-lg p-3
              border border-[#28aeec]/30
              hover:bg-[#28aeec]/20 hover:border-[#28aeec]/50 transition-all duration-300"
                          >
                            <span className="text-[#28aeec] font-mono text-sm font-medium">
                              {address
                                ? `${address.slice(0, 8)}...${address.slice(
                                    -8
                                  )}`
                                : ""}
                            </span>
                            <button
                              onClick={copyAddress}
                              className="cursor-pointer p-2 hover:bg-[#28aeec]/30 rounded-lg transition-all duration-300 group"
                              title="Copy Address"
                            >
                              <IoCopy className="w-4 h-4 text-[#28aeec] group-hover:text-[#28aeec] group-hover:scale-110" />
                            </button>
                          </div>
                        </div>

                        {/* Disconnect Button */}
                        <button
                          onClick={handleDisconnect}
                          className="w-full flex items-center gap-3 px-4 py-3 text-white
               bg-linear-to-r from-[#28aeec] via-sky-400 to-[#28aeec]
              rounded-lg transition-all duration-300 group
              border border-[#28aeec]/40 hover:border-[#28aeec]/80 hover:shadow-lg hover:shadow-[#28aeec]/30 cursor-pointer font-poppins"
                        >
                          <IoLogOut className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" />
                          <span className="font-medium">Logout</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={handleConnectWallet}
                  className="cursor-pointer group relative overflow-hidden
      bg-linear-to-r from-[#28aeec] via-sky-400 to-[#28aeec]
      text-white font-semibold
      px-6 py-2.5 rounded-full transition-all duration-500
      transform hover:scale-105 hover:-translate-y-0.5
      shadow-lg hover:shadow-xl hover:shadow-[#28aeec]/40
      border border-[#28aeec]/40 hover:border-[#28aeec]/80 uppercase"
                >
                  <span className="relative z-10 flex items-center gap-2.5">
                    <IoWallet className="w-5 h-5 transition-all duration-300 group-hover:rotate-12 group-hover:scale-110" />
                    <span className="hidden sm:block">Login</span>
                  </span>

                  {/* Shine sweep */}
                  <div
                    className="absolute inset-0 bg-linear-to-r from-white/30 via-[#28aeec]/20 to-white/30
      opacity-0 group-hover:opacity-100 transition-all duration-700
      transform -translate-x-full group-hover:translate-x-0"
                  ></div>

                  {/* Glow border */}
                  <div
                    className="absolute -inset-0.5 bg-linear-to-r from-[#28aeec] via-sky-400 to-[#28aeec]
      rounded-full opacity-0 group-hover:opacity-40 blur-lg transition-all duration-500"
                  ></div>
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>
    </>
  );
};

export default Navbar;
