"use client"
import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import Navbar from '../Navbar/Navbar'
import certi1 from "@/app/assets/certi1.jpg"
import certi2 from "@/app/assets/certi2.jpg"
import certi3 from "@/app/assets/certi3.jpg"
import certi4 from "@/app/assets/certi4.jpg"
import certi5 from "@/app/assets/certi5.jpg"


const Homepage = () => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  const images = [ certi1, certi2, certi3, certi4, certi5]

  // Content for each slide
  const slideContent = [
    {
      title: "Invest in Next Generation Assets:<br/> Everyday Businesses, Extraordinary Returns",
      subtitle: "Own a piece of stable businesses with affordable entry points. Earn 15-25% yields, backed by equipment, powered by Arbitrum."
    },
    {
      title: "Tokenized Real-World Assets:<br/> The Future of Investment",
      subtitle: "Access fractional ownership of real businesses. Transparent, secure, and powered by blockchain technology for modern investors."
    },
    {
      title: "Build Your Portfolio:<br/> Diversify with Digital Certificates",
      subtitle: "Invest in a diversified portfolio of tokenized assets. Low barriers to entry, high potential returns, all on the Arbitrum network."
    },
    {
      title: "Earn Passive Income:<br/> Smart Investments, Real Returns",
      subtitle: "Generate consistent yields from verified business assets. Secure ownership, automated distributions, backed by real-world value."
    },
    {
      title: "Join the Revolution:<br/> Blockchain-Powered Investments",
      subtitle: "Experience the next generation of investing. Transparent ownership, instant settlements, and global accessibility through DeFi."
    }
  ]

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
          className="cursor-pointer absolute left-4 top-1/2 transform -translate-y-1/2 z-20 bg-white/20 hover:bg-white/40 text-white p-4 rounded-full transition-all duration-500 hover:scale-110 hover:rotate-12 animate-bounce-subtle backdrop-blur-sm border border-white/30"
        >
          <svg className="w-6 h-6 transition-transform duration-300 group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <button
          onClick={goToNext}
          className="cursor-pointer absolute right-4 top-1/2 transform -translate-y-1/2 z-20 bg-white/20 hover:bg-white/40 text-white p-4 rounded-full transition-all duration-500 hover:scale-110 hover:-rotate-12 animate-bounce-subtle backdrop-blur-sm border border-white/30"
        >
          <svg className="w-6 h-6 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        <div className=" mx-auto px-6 sm:px-8 lg:px-12 text-center relative z-10">
          <div className="max-w-[1600px] mx-auto">
            <h1
              key={`title-${currentImageIndex}`}
              className="text-3xl sm:text-4xl lg:text-6xl font-semibold mb-6 leading-tight font-cairo drop-shadow-lg bg-linear-to-r from-white via-sky-200 to-sky-400 bg-clip-text text-transparent uppercase animate-fadeInUp"
              dangerouslySetInnerHTML={{ __html: slideContent[currentImageIndex].title }}
            />
            {/* bg-linear-to-r from-white via-sky-200 to-sky-400 bg-clip-text text-transparent */}

            <p
              key={`subtitle-${currentImageIndex}`}
              className="text-lg sm:text-xl lg:text-xl text-white/90 mb-10 max-w-3xl mx-auto leading-relaxed font-poppins drop-shadow-md animate-fadeInUp animation-delay-200"
            >
              {slideContent[currentImageIndex].subtitle}
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Link href="/admin/dashboard">
                <button className="group bg-linear-to-r from-white/20 to-sky-100/20 hover:bg-white/20 text-white font-medium px-10 py-5 rounded-full cursor-pointer font-poppins text-lg transition-all duration-300 transform hover:scale-105 shadow-2xl hover:shadow-sky-200/50 border-2 border-white/20 backdrop-blur-sm relative z-10 overflow-hidden uppercase">
                  <span className="relative z-10 flex items-center gap-2">
                    Open App
                    <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </span>
                  <div className="absolute inset-0 bg-linear-to-r from-sky-400/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute inset-0 bg-linear-to-r from-white/20 via-transparent to-sky-200/20 opacity-0 group-hover:opacity-100 transition-all duration-500 transform -translate-x-full group-hover:translate-x-0"></div>
                </button>
              </Link>
              <Link href="/verify">
                <button className="group bg-linear-to-r from-white/20 to-sky-100/20 hover:bg-white/20 text-white font-medium px-10 py-5 rounded-full cursor-pointer font-poppins text-lg transition-all duration-300 transform hover:scale-105 shadow-2xl hover:shadow-sky-200/50 border-2 border-white/20 backdrop-blur-sm relative z-10 overflow-hidden uppercase">
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