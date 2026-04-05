import Navbar from '@/components/Landing/Navbar'
import React from 'react'

function page() {
  return (
    <div className='min-h-screen p-2 bg-white flex flex-col items-center '>
      <Navbar/>
       <div className='flex  px-6 py-24 flex-col gap-8 items-start max-w-3xl w-full'>
            <div className='w-full border-b border-gray-100 pb-6'>
              <h1 className='text-black text-4xl font-serif italic '>Contact Us</h1>
              <p className='text-gray-500 mt-2 text-sm'>We are here to help you get the most out of Orca.</p>
            </div>
            
            <div className='text-gray-700 font-light space-y-8 leading-relaxed w-full'>
              <p className='text-base'>
                Whether you have a question about your subscription, a feature request, or need help troubleshooting the desktop app, our support team is ready to assist you.
              </p>

              <div className='bg-gray-50 border border-gray-100 p-10 rounded-2xl w-full flex flex-col items-center text-center'>
                <div className='bg-neutral-100 shadow text-neutral-600 p-4 rounded-full mb-4'>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h2 className='text-black font-normal font-serif text-xl mb-2'>Email Support</h2>
                <p className='text-gray-500 mb-6'>Drop us an email and we'll get back to you as soon as possible.</p>
                <a 
                  href="mailto:support@orca-labs.app" 
                  className="bg-black text-white px-8 py-3 rounded-full font-normal hover:bg-neutral-800 transition-colors inline-block"
                >
                  support@orca-labs.app
                </a>
              </div>

              <div>
                <h2 className='text-black font-serif  text-3xl mb-3'>Other Inquiries</h2>
                <ul className='list-disc pl-5 mt-3 space-y-3 text-gray-600'>
                  <li>
                    <strong>Billing & Subscriptions:</strong> You can quickly manage or cancel your subscription by visiting the billing section within the Orca desktop app settings.
                  </li>
                  <li>
                    <strong>Legal & Privacy:</strong> For legal inquiries or questions regarding our Privacy Policy, please send an email directly to <a href="mailto:legal@orca-labs.app" className="text-neutral-600 hover:text-neurtal-500 font-medium">legal@orca-labs.app</a>.
                  </li>
                </ul>
              </div>
            </div>
       </div>
    </div>
  )
}

export default page
