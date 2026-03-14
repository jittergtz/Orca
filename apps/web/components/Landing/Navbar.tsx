"use client";

import Link from 'next/link';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Prevent scrolling when mobile menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const navLinks = [
    { name: 'Product', href: '/product' },
    { name: 'Terms', href: '/terms' },
    { name: 'Privacy', href: '/privacy' },
    { name: 'Pricing', href: '/pricing' },
  ];

  return (
    <>
      <nav 
        className={` sticky top-1  z-50 flex w-full justify-center transition-all duration-300 ${
          scrolled ? 'bg-white/80 backdrop-blur-md w-[350px] sm:w-full sm:max-w-7xl shadow-sm shadow-black/40 sm:shadow-black/20 rounded-full' : '  bg-transparent'
        }`}
      >
        <div className='h-[50px]  flex items-center justify-between w-full  max-w-7xl px-5 lg:px-4'>
          <div className='flex gap-10 items-center'>
          {/* Logo */}
          <Link href="/" className='flex items-center z-50'>
            <h1 className='text-black text-2xl font-serif font-semibold tracking-tight'>Orca</h1>
          </Link>

          {/* Desktop Navigation */}
          <div className='hidden md:flex items-center gap-8'>
            <div className='flex items-center gap-6'>
              {navLinks.map((link) => (
                <Link key={link.name} href={link.href} className='text-sm text-neutral-600 hover:text-black transition-colors'>
                  {link.name}
                </Link>
              ))}
            </div>
          </div>
          </div>

          {/* Desktop Right Actions & Mobile Toggle */}
          <div className='flex items-center gap-4'>
            <div className='hidden md:flex items-center gap-4'>
              <Link href="/product" className='text-sm text-neutral-600 hover:text-black transition-colors'>
                Mission
              </Link>
              <Link 
                href="/product" 
                className='text-sm bg-black text-white px-4 py-2 rounded-full hover:bg-neutral-800 transition-all hover:scale-105 active:scale-95'
              >
                Get Started
              </Link>
            </div>
            
            {/* Mobile Menu Toggle */}
            <button 
              className='md:hidden z-50 p-2 -mr-2 text-neutral-600 hover:text-black transition-colors'
              onClick={() => setIsOpen(!isOpen)}
              aria-label="Toggle menu"
            >
              <motion.div initial={false} animate={{ rotate: isOpen ? 90 : 0 }} transition={{ duration: 0.2 }}>
                {isOpen ? <X size={20} /> : <Menu size={20} />}
              </motion.div>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: '0' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '0' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className='fixed inset w-full mt-20 z-40 bg-white/30 border border-black/30 rounded-[40px] backdrop-blur-xl md:hidden overflow-y-auto flex flex-col justify-center'
          >
            <div className='flex flex-col items-center mt-10  justify-start min-h-screen p-5'>
              <div className='flex flex-col items-center gap-8 w-full  max-w-sm'>
                {navLinks.map((link, i) => (
                  <motion.div
                    key={link.name}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + i * 0.05 }}
                  >
                    <Link 
                      href={link.href} 
                      className='text-2xl text-neutral-800  hover:text-black transition-colors'
                      onClick={() => setIsOpen(false)}
                    >
                      {link.name}
                    </Link>
                  </motion.div>
                ))}
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + navLinks.length * 0.05 }}
                >
                  <Link 
                    href="/mission" 
                    className='text-2xl  text-neutral-800 hover:text-black transition-colors'
                    onClick={() => setIsOpen(false)}
                  >
                    Mission
                  </Link>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + (navLinks.length + 1) * 0.05 }}
                  className='w-full pt-8   flex flex-col items-center'
                >
                  <Link 
                    href="/product" 
                    className='w-full text-center bg-black text-white px-6 py-4 rounded-full text-lg  hover:bg-neutral-800 transition-all active:scale-95'
                    onClick={() => setIsOpen(false)}
                  >
                    Get Started
                  </Link>
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default Navbar;