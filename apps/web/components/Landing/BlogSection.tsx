import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { blogPosts } from './blogPosts'

function BlogSection() {
  return (
    <section className='w-full max-w-5xl py-20 md:py-32'>
      <div className='mb-10 md:mb-14'>
        <h2 className='text-4xl md:text-5xl text-neutral-800 italic font-serif '>From our blog</h2>
        <p className='text-neutral-500 mt-3 max-w-2xl'>
          Fresh notes from the team. Edit the <span className='font-medium text-neutral-700'>blogPosts.ts</span> file to
          add a new post.
        </p>
      </div>

      <div className='grid gap-6 md:grid-cols-2 md:gap-8'>
        {blogPosts.map((post) => (
          <Link key={post.id} href={`/blog/${post.slug}`} className='group'>
            <article className='rounded-3xl md:rounded-[32px] p-4 h-[440px] shadow-sm shadow-neutral-500/30 transition-transform duration-300 group-hover:-translate-y-1'>
              <div className='relative w-full h-48 md:h-56 rounded-2xl overflow-hidden'>
                <Image src={post.imageSrc} alt={post.imageAlt} fill className='object-cover transition-transform duration-500 group-hover:scale-105' />
              </div>
              <div className='pt-5 pb-2'>
                <div className='flex flex-wrap items-center gap-2 text-xs md:text-sm mb-3'>
                  <span className='px-3 py-1 rounded-full bg-black text-neutral-200'>{post.category}</span>
                  <span className='text-neutral-400'>•</span>
                  <span className='text-neutral-500'>{post.date}</span>
                  <span className='text-neutral-400'>•</span>
                  <span className='text-neutral-500'>{post.readTime}</span>
                </div>
                <h3 className='text-xl md:text-2xl text-neutral-900 mb-2 italic font-serif'>{post.title}</h3>
                <p className='text-neutral-600 text-sm md:text-base leading-relaxed'>{post.description}</p>
              </div>
            </article>
          </Link>
        ))}
      </div>
    </section>
  )
}

export default BlogSection
