import React from 'react'

function page() {
  return (
    <div className='min-h-screen bg-white flex flex-col items-center py-24 px-6'>
       <div className='flex flex-col gap-8 items-start max-w-3xl w-full'>
            <div className='w-full border-b border-gray-100 pb-6'>
              <h1 className='text-black text-3xl font-bold tracking-tight'>Terms of Service</h1>
              <p className='text-gray-500 mt-2 text-sm'>Last Updated: {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
            </div>
            
            <div className='text-gray-700 font-light space-y-8 leading-relaxed w-full'>
              <p className='text-base'>
                Welcome to Orca ("we", "our", or "us"), operated by <strong>Orca labs</strong>. By accessing or using our website, desktop application, and related services (collectively, the "Service"), you agree to be bound by these Terms of Service.
              </p>

              <div>
                <h2 className='text-black font-semibold text-lg mb-3'>1. Description of Service</h2>
                <p>Orca provides an AI-powered news curation and summarization application. The Service includes automated topic filtering, AI-generated summaries, and text-to-speech audio integrations. Our goal is to provide a high-signal, distraction-free reading environment.</p>
              </div>

              <div>
                <h2 className='text-black font-semibold text-lg mb-3'>2. Subscriptions and Payments</h2>
                <p>Access to the Orca desktop application requires a paid subscription, processed securely through our payment provider (Stripe). Subscriptions are billed on a recurring basis depending on your selected plan. You may cancel your subscription at any time via your account settings. We do not provide refunds for partial billing periods unless required by applicable law.</p>
              </div>

              <div>
                <h2 className='text-black font-semibold text-lg mb-3'>3. AI-Generated Content Disclaimer</h2>
                <p>Our Service utilizes artificial intelligence (including Large Language Models) to aggregate, filter, and summarize news articles. While we strive to provide high-quality curation, you acknowledge that AI-generated content can occasionally produce errors, hallucinations, or misinterpretations. You should not rely solely on our Service for critical financial, medical, or legal decisions without verifying the original sources.</p>
              </div>

              <div>
                <h2 className='text-black font-semibold text-lg mb-3'>4. Acceptable Use</h2>
                <p>You agree to use the Service only for your personal, non-commercial use. You agree not to:</p>
                <ul className='list-disc pl-5 mt-3 space-y-2 text-gray-600'>
                  <li>Share, resell, or distribute your account credentials to third parties.</li>
                  <li>Reverse engineer, decompile, or attempt to extract the source code of the desktop app.</li>
                  <li>Use automated scripts to scrape, bulk-download, or data-mine content from the Service.</li>
                  <li>Use the Service for any illegal, harmful, or unauthorized purpose.</li>
                </ul>
              </div>

              <div>
                <h2 className='text-black font-semibold text-lg mb-3'>5. Third-Party Services</h2>
                <p>Orca integrates with third-party providers such as search aggregators and AI audio generators to provide the Service. Your use of the Service is also subject to their respective terms and availability. We do not control and are not responsible for the original texts, claims, or information published by third-party news sources.</p>
              </div>

              <div>
                <h2 className='text-black font-semibold text-lg mb-3'>6. Changes to the Service and Terms</h2>
                <p>We reserve the right to modify or discontinue the Service at any time. We may also update these Terms from time to time. Your continued use of the Service after any changes indicates your acceptance of the newly updated Terms.</p>
              </div>

              <div className='bg-gray-50 border border-gray-100 p-6 rounded-lg'>
                <h2 className='text-black font-semibold text-lg mb-2'>7. Contact Us</h2>
                <p>If you have any questions, concerns, or legal inquiries regarding these Terms, please reach out to us at: <br/>
                <a href="mailto:legal@orca-labs.app" className="text-sky-600 hover:text-sky-500 font-medium transition-colors mt-2 inline-block">legal@orca-labs.app</a>
                </p>
              </div>
            </div>
       </div>
    </div>
  )
}

export default page