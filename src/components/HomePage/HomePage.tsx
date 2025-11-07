"use client"
import React, { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
// @ts-ignore - provided by Alchemy Account Kit at runtime
import { useUser, useAuthModal, useSmartAccountClient } from '@account-kit/react'
import Navbar from '../Navbar/Navbar'
import certi1 from "@/app/assets/certi1.jpg"
import certi2 from "@/app/assets/certi2.jpg"
import certi3 from "@/app/assets/certi3.jpg"
import certi4 from "@/app/assets/certi4.jpg"
import certi5 from "@/app/assets/certi5.jpg"


const Homepage = () => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const user = useUser()
  const { client } = useSmartAccountClient({})
  const { openAuthModal } = useAuthModal()
  const router = useRouter()
  const authenticated = user && user.email
  const processedAuthRef = useRef(false)

  const images = [ certi1, certi2, certi3, certi4, certi5]

  // Content for each slide
  const slideContent = [
    {
      title: "Empowering Authenticity:<br/> Blockchain-Based Certificate Verification",
      subtitle: "Issue and verify certificates with complete transparency. Built on L2 blockchain to ensure trust, security, and immutability."
    },
    {
      title: "Decentralized Certification:<br/> Smart, Secure, and Tamper-Proof",
      subtitle: "Admins can create programs and issue verified certificates to students — all recorded on-chain for lifetime authenticity."
    },
    {
      title: "Unique Digital Identity:<br/> Every Certificate Has Its Own Hash",
      subtitle: "Each issued certificate generates a unique blockchain hash, acting as a digital fingerprint for instant verification and proof of ownership."
    },
    {
      title: "Seamless Verification:<br/> Validate in Just One Click",
      subtitle: "Anyone can verify the authenticity of a certificate by entering its unique hash — fast, transparent, and publicly accessible."
    },
    {
      title: "Revolutionizing Trust:<br/> The Future of Digital Credentials",
      subtitle: "Say goodbye to fake or forged certificates. Experience a decentralized system that brings trust and transparency to digital verification."
    }
  ];
  

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) =>
        prevIndex === images.length - 1 ? 0 : prevIndex + 1
      )
    }, 5000)

    return () => clearInterval(interval)
  }, [images.length])

 

  const goToSlide = (index: number) => {
    setCurrentImageIndex(index)
  }

  const goToPrevious = () => {
    setCurrentImageIndex(currentImageIndex === 0 ? images.length - 1 : currentImageIndex - 1)
  }

  const goToNext = () => {
    setCurrentImageIndex(currentImageIndex === images.length - 1 ? 0 : currentImageIndex + 1)
  }

  const handleOpenApp = async () => {
    try {
      // Open Alchemy modal; subsequent effect will complete auth+redirect
      openAuthModal()
    } catch (err) {
      console.error('Open App failed:', err)
    }
  }

  // Complete auth: once user/email or smart wallet address is available, set JWT and redirect
  useEffect(() => {
    (async () => {
      if (processedAuthRef.current) return
      const email = (user as any)?.email ? String((user as any).email).toLowerCase() : ""
      const smartAddress = (client as any)?.account?.address as string | undefined
      const walletAddress = smartAddress ? String(smartAddress).toLowerCase() : ""

      if (!email && !walletAddress) return

      processedAuthRef.current = true

      try {
        // Upsert wallet mapping when available
        if (walletAddress) {
          await fetch('/api/admin/wallet', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ walletAddress, chainId: null, walletType: 'alchemy' })
          }).catch(() => {})
        }

        // Request JWT for allowlisted admins (email or wallet)
        await fetch('/api/auth/alchemy', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, walletAddress })
        }).catch(() => {})

        // Give the browser a moment to persist the cookie before navigation
        await new Promise(r => setTimeout(r, 300))

        // Poll for cookie
        let meOk = false
        for (let i = 0; i < 3; i++) {
          const meResp = await fetch('/api/auth/me', { credentials: 'include', cache: 'no-store' as any })
          if (meResp.ok) { meOk = true; break }
          await new Promise(r => setTimeout(r, 300))
        }
        if (meOk) {
          if (typeof window !== 'undefined') {
            // Full reload so middleware sees the cookie for sure
            window.location.replace('/admin/dashboard')
          } else {
            router.push('/admin/dashboard')
          }
        } else {
          router.push('/verify')
        }
      } catch (e) {
        console.error('Finalize auth failed:', e)
        router.push('/verify')
      }
    })()
  }, [user, client, router])

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Navbar */}
      <Navbar />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-16">
        {/* Background Image Carousel */}
        <div className="absolute inset-0 z-0">
          {images.map((image, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-all duration-1000 ${
                index === currentImageIndex ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
              }`}
            >
              <Image
                src={image}
                alt={`Business ${index + 1}`}
                fill
                className="object-cover transition-transform duration-8000 ease-out hover:scale-110"
                priority={index === 0}
              />
              <div className="absolute inset-0 bg-[#2d4b59]/80 "></div>
            </div>
          ))}
        </div>


        {/* Navigation Arrows */}
        <button
          onClick={goToPrevious}
          className="cursor-pointer absolute left-2 lg:left-4 top-1/2 transform -translate-y-1/2 z-20 bg-white/20 hover:bg-white/40 text-white p-2 sm:p-3 lg:p-4 rounded-full transition-all duration-500 hover:scale-110 hover:rotate-12 animate-bounce-subtle backdrop-blur-sm border border-white/30"
        >
          <svg className="size-4 sm:size-5 lg:size-6 transition-transform duration-300 group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <button
          onClick={goToNext}
          className="cursor-pointer absolute right-2 lg:right-4 top-1/2 transform -translate-y-1/2 z-20 bg-white/20 hover:bg-white/40 text-white p-2 sm:p-3 lg:p-4 rounded-full transition-all duration-500 hover:scale-110 hover:-rotate-12 animate-bounce-subtle backdrop-blur-sm border border-white/30"
        >
          <svg className="size-4 sm:size-5 lg:size-6 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Dots Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20 flex space-x-2">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`cursor-pointer size-3 rounded-full transition-all duration-500 transform hover:scale-125 ${
                index === currentImageIndex
                  ? 'bg-white shadow-lg shadow-white/50 animate-pulse'
                  : 'bg-white/40 hover:bg-white/70 hover:rotate-45'
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <div className=" mx-auto px-12 text-center relative z-10">
          <div className="max-w-[1600px] mx-auto">
            <h1
              key={`title-${currentImageIndex}`}
              className="text-3xl sm:text-4xl lg:text-6xl font-bold mb-6 leading-tight font-cairo drop-shadow-lg bg-linear-to-r from-white via-sky-200 to-sky-400 bg-clip-text text-transparent uppercase animate-fadeInUp"
              dangerouslySetInnerHTML={{ __html: slideContent[currentImageIndex].title }}
            />
            {/* bg-linear-to-r from-white via-sky-200 to-sky-400 bg-clip-text text-transparent */}

            <p
              key={`subtitle-${currentImageIndex}`}
              className="text-sm xs:text-lg sm:text-xl lg:text-xl text-white/90 mb-10 max-w-3xl mx-auto leading-relaxed font-poppins drop-shadow-md animate-fadeInUp animation-delay-200 px-2"
            >
              {slideContent[currentImageIndex].subtitle}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 xs:gap-6 justify-center items-center">
              <button
                onClick={handleOpenApp}
                className="group bg-linear-to-r from-white/20 to-sky-100/20 hover:bg-white/20 text-white font-medium px-6 py-3 lg:px-10 lg:py-5 rounded-full cursor-pointer font-poppins text-base xs:text-lg transition-all duration-300 transform hover:scale-105 shadow-2xl hover:shadow-sky-200/50 border-2 border-white/20 backdrop-blur-sm relative z-10 overflow-hidden uppercase"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Open App
                  <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
                <div className="absolute inset-0 bg-linear-to-r from-sky-400/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="absolute inset-0 bg-linear-to-r from-white/20 via-transparent to-sky-200/20 opacity-0 group-hover:opacity-100 transition-all duration-500 transform -translate-x-full group-hover:translate-x-0"></div>
              </button>
              <Link href="/verify">
                <button className="group bg-linear-to-r from-white/20 to-sky-100/20 hover:bg-white/20 text-white font-medium px-6 py-3 lg:px-10 lg:py-5 rounded-full cursor-pointer font-poppins text-base xs:text-lg transition-all duration-300 transform hover:scale-105 shadow-2xl hover:shadow-sky-200/50 border-2 border-white/20 backdrop-blur-sm relative z-10 overflow-hidden uppercase">
                  <span className="relative z-10 flex items-center gap-2">
                  Verify a Certificate
                    <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </span>
                  <div className="absolute inset-0 bg-linear-to-r from-sky-400/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute inset-0 bg-linear-to-r from-white/20 via-transparent to-sky-200/20 opacity-0 group-hover:opacity-100 transition-all duration-500 transform -translate-x-full group-hover:translate-x-0"></div>
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Homepage