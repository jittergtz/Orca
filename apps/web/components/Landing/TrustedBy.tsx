"use client";

import React from "react";

const companies = [
  { name: "Reuters" },
  { name: "Bloomberg" },
  { name: "The New York Times" },
  { name: "The Washington Post" },
  { name: "Financial Times" },
  { name: "The Economist" },
  { name: "Associated Press" },
  { name: "Politico" },
  { name: "Axios" },
  { name: "The Atlantic" },
];

// Duplicate for seamless infinite loop
const allCompanies = [...companies, ...companies];

export default function TrustedBy() {
  return (
    <section className="w-full max-w-7xl py-20 px-4">
      {/* Header */}
      <p className="text-center text-2xl font-semibold  text-black mb-10">
        Trusted by Employes at
      </p>

      {/* Marquee container */}
      <div className="relative overflow-hidden">
        {/* Left fade */}
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-[#fbfbfbee] to-transparent" />
        {/* Right fade */}
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-[#fbfbfbee] to-transparent" />

        {/* Scrolling track */}
        <div className="flex w-max animate-marquee gap-16 items-center">
          {allCompanies.map((company, i) => (
            <span
              key={i}
              className="font-serif text-xl  text-neutral-500 whitespace-nowrap select-none"
              aria-label={company.name}
            >
              {company.name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
