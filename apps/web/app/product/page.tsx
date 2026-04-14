"use client"
import Navbar from '@/components/Landing/Navbar'
import ScrollFlow from '@/components/Landing/Product/ScrollFlow'
import { motion } from 'framer-motion'

import React from 'react'

function page() {
  return (
  <main className="bg-black min-h-screen">
      {/* Hero Section */}
      <section className="h-screen flex flex-col justify-center items-center px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-900/30 via-black to-blue-600/20" />
        
        <div className="relative z-10 text-center max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-6xl md:text-8xl font-serif italic text-white tracking-tight mb-6">
              Workdone.
              <span className="block text-neutral-500">On the run.</span>
            </h1>
          </motion.div>
          
          <motion.p 
            className="text-xl md:text-2xl text-neutral-300 font-light max-w-2xl mx-auto mt-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
          >
            Connect all your work apps to get instant answers to anything 
            and solve hours of complex tasks in seconds.
          </motion.p>

          <motion.div
            className="mt-12 flex gap-4 justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
          >
            <button className="px-8 py-3 bg-white text-black rounded-full font-semibold text-lg hover:bg-gray-100 transition-colors">
              Download for Mac
            </button>
            <button className="px-8 py-3 bg-white/10 text-white border border-white/20 rounded-full font-semibold text-lg hover:bg-white/20 transition-colors">
              View Demo
            </button>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div 
          className="absolute bottom-12 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center p-2">
            <motion.div 
              className="w-1 h-2 bg-white/60 rounded-full"
              animate={{ y: [0, 12, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
            />
          </div>
        </motion.div>
      </section>

      {/* Main Scroll Flow Section */}
      <ScrollFlow />

      {/* CTA Section */}
      <section className="h-screen flex flex-col justify-center items-center px-6 bg-black relative">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Ready to get started?
          </h2>
          <p className="text-xl text-gray-400 mb-12">
            Join thousands of teams already using Sana to work smarter.
          </p>
          <button className="px-7 py-4 bg-white text-black rounded-full font-semibold text-sm hover:scale-105 transition-transform">
            Download the App
          </button>
          
          <p className="mt-8 text-gray-500">
            Coming soon to mobile. <a href="#" className="text-white underline">Join the waitlist</a>
          </p>
        </div>
      </section>
    </main>
  )
}

export default page