import React from 'react'

function page() {
  return (
    <div className='min-h-screen bg-white flex flex-col items-center py-24 px-6'>
       <div className='flex flex-col gap-8 items-start max-w-3xl w-full'>
            <div className='w-full border-b border-gray-100 pb-6'>
              <h1 className='text-black text-3xl font-bold tracking-tight'>Privacy Policy</h1>
              <p className='text-gray-500 mt-2 text-sm'>Last Updated: {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
            </div>
            
            <div className='text-gray-700 font-light space-y-8 leading-relaxed w-full'>
              <p className='text-base'>
                At <strong>Orca labs</strong> ("we", "our", or "us"), we prioritize your privacy. We built Orca to be a distraction-free, signal-first reading experience. This means we do not serve ads, and we do not sell your personal data to advertisers.
              </p>

              <div>
                <h2 className='text-black font-semibold text-lg mb-3'>1. Information We Collect</h2>
                <ul className='list-disc pl-5 space-y-2 text-gray-600'>
                  <li><strong>Account Information:</strong> When you sign up, we collect your email address and a password to create your account via our authentication provider.</li>
                  <li><strong>Payment Information:</strong> Subscriptions are processed securely by Stripe. We do not directly collect or store your full credit card number.</li>
                  <li><strong>App Usage & Preferences:</strong> We store the topics, categories, and schedules you configure to deliver your personalized news feed.</li>
                </ul>
              </div>

              <div>
                <h2 className='text-black font-semibold text-lg mb-3'>2. How We Use Your Information</h2>
                <p>We use your information strictly to operate, maintain, and improve the Service. Specifically, to:</p>
                <ul className='list-disc pl-5 mt-3 space-y-2 text-gray-600'>
                  <li>Fetch, filter, and summarize news based on your specified topics.</li>
                  <li>Process audio generation requests for your reading feed.</li>
                  <li>Manage your subscription and provide customer support.</li>
                  <li>Send essential service updates and transactional emails.</li>
                </ul>
              </div>

              <div>
                <h2 className='text-black font-semibold text-lg mb-3'>3. Third-Party Integrations & AI Models</h2>
                <p>To provide our core features, we integrate with secure third-party services. By using Orca, you acknowledge that relevant data (such as your topic queries and fetched article texts) may be processed by these providers:</p>
                <ul className='list-disc pl-5 mt-3 space-y-2 text-gray-600'>
                  <li><strong>AI Processing:</strong> We use Large Language Models (like OpenAI) to structure your topics and summarize news. <em>Your personal account details are not sent to these models, and your data is not used to train their foundational models.</em></li>
                  <li><strong>Audio Generation:</strong> When you use our text-to-speech features, article text is sent to our audio provider (ElevenLabs) to generate voice files.</li>
                  <li><strong>Infrastructure & Payments:</strong> We rely on trusted providers like Supabase (database & auth) and Stripe (billing).</li>
                </ul>
              </div>

              <div>
                <h2 className='text-black font-semibold text-lg mb-3'>4. Cookies and Tracking</h2>
                <p>Orca uses minimal, essential cookies required to keep your session active and secure. Because our business model relies entirely on user subscriptions rather than advertising, we do not use third-party marketing or ad-tracking cookies across our applications.</p>
              </div>

              <div>
                <h2 className='text-black font-semibold text-lg mb-3'>5. Data Retention and Deletion</h2>
                <p>We store your account data as long as your account is active. If you wish to delete your account and all associated data, you may do so through the account settings in the application or by contacting us. Upon deletion, your topic preferences and credentials will be removed from our active databases.</p>
              </div>

              <div>
                <h2 className='text-black font-semibold text-lg mb-3'>6. Changes to This Policy</h2>
                <p>We may update this Privacy Policy periodically as our Service evolves. We will notify you of any material changes by updating the "Last Updated" date at the top of this page or by sending an email notification.</p>
              </div>

              <div className='bg-gray-50 border border-gray-100 p-6 rounded-lg'>
                <h2 className='text-black font-semibold text-lg mb-2'>7. Contact Us</h2>
                <p>We believe in full transparency. If you have any questions or concerns about how your data is handled, please reach out to our privacy team at: <br/>
                <a href="mailto:legal@orca-labs.app" className="text-sky-600 hover:text-sky-500 font-medium transition-colors mt-2 inline-block">legal@orca-labs.app</a>
                </p>
              </div>
            </div>
       </div>
    </div>
  )
}

export default page
