import Link from 'next/link'
import React from 'react'

function Footer() {
 
    const Orca = [
        {name: "Overview",
        link: "/overview"
        },
          {name: "Ai agents",
        link: "/ai-agents"
        },
        {name: "Pricing",
        link: "/pricing"
        },
    ]

       const Company = [
        {name: "Mission",
        link: "/mission"
        },
          {name: "Blog",
        link: "/blog"
        },
          {name: "Terms",
        link: "/terms"
        },
        {name: "Privacy",
        link: "/privacy"
        },
          {name: "Contact",
        link: "/contact"
        },
    ]

  return (
    <footer className='border-t mt-20 pb-20 text-black border-neutral-200 p-5   w-full flex justify-center'>
        <div className='max-w-6xl w-full text-sm flex flex-col md:flex-row md:justify-between'>
        <div>
            <h1 className='text-2xl font-serif font-bold'>Orca</h1>
        </div>

        <div className='flex mt-10 gap-12'>
            <div className='flex flex-col'>
                <h1 className='text-sm font-semibold unde'>Orca</h1>
                   {Orca.map((data, i) => (
              <Link className='text-neutral-600 mt-2' id='i' href={data.link}>{data.name}</Link>
            ))}
            </div>
             <div className='flex flex-col'>
                <h1 className='text-sm font-semibold'>Company</h1>
                {Company.map((data, i) => (
              <Link  className='text-neutral-600 mt-2' id='i' href={data.link}>{data.name}</Link>
            ))}
              
            </div>
        </div>
</div>
    </footer>
  )
}

export default Footer