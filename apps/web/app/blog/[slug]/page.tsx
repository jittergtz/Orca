import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import type { ReactNode } from 'react'
import { blogPosts, getBlogPostBySlug } from '@/components/Landing/blogPosts'

function renderInlineMarkdown(text: string) {
  const nodes: ReactNode[] = []
  const inlineRegex = /(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g
  let cursor = 0

  let match = inlineRegex.exec(text)
  while (match) {
    const index = match.index ?? 0
    if (index > cursor) {
      nodes.push(text.slice(cursor, index))
    }

    const token = match[0]
    if (token.startsWith('**') && token.endsWith('**')) {
      nodes.push(
        <strong key={`${token}-${index}`} className='font-semibold text-neutral-900'>
          {token.slice(2, -2)}
        </strong>
      )
    } else {
      const linkMatch = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
      if (linkMatch) {
        nodes.push(
          <a
            key={`${token}-${index}`}
            href={linkMatch[2]}
            className='underline underline-offset-2 text-neutral-900 hover:text-neutral-700'
          >
            {linkMatch[1]}
          </a>
        )
      } else {
        nodes.push(token)
      }
    }

    cursor = index + token.length
    match = inlineRegex.exec(text)
  }

  if (cursor < text.length) {
    nodes.push(text.slice(cursor))
  }

  return nodes
}

function renderMarkdown(bodyMd: string) {
  const lines = bodyMd.split('\n')
  const blocks: ReactNode[] = []
  let bulletBuffer: string[] = []
  let key = 0

  const flushBullets = () => {
    if (!bulletBuffer.length) {
      return
    }

    blocks.push(
      <ul key={`ul-${key++}`} className='list-disc list-inside text-base md:text-lg text-neutral-700 space-y-1'>
        {bulletBuffer.map((bullet, index) => (
          <li key={`li-${index}`}>{renderInlineMarkdown(bullet)}</li>
        ))}
      </ul>
    )
    bulletBuffer = []
  }

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) {
      flushBullets()
      continue
    }

    if (trimmed.startsWith('- ')) {
      bulletBuffer.push(trimmed.slice(2))
      continue
    }

    flushBullets()

    if (trimmed.startsWith('### ')) {
      blocks.push(
        <h2 key={`h2-${key++}`} className='text-xl md:text-2xl font-semibold text-neutral-900 mt-7'>
          {renderInlineMarkdown(trimmed.slice(4))}
        </h2>
      )
      continue
    }

    blocks.push(
      <p key={`p-${key++}`} className='text-base md:text-lg text-neutral-700 leading-relaxed'>
        {renderInlineMarkdown(trimmed)}
      </p>
    )
  }

  flushBullets()
  return blocks
}

export async function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }))
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const post = getBlogPostBySlug(slug)

  if (!post) {
    notFound()
  }

  return (
    <main className='min-h-screen bg-neutral-50 px-4 py-10 md:py-16 flex justify-center'>
      <article className='w-full max-w-3xl'>
        <Link href='/' className='text-sm text-neutral-500 hover:text-neutral-800'>
          ← Back to home
        </Link>
        <div className='relative w-full h-56 md:h-80 mt-6 rounded-3xl overflow-hidden'>
          <Image src={post.imageSrc} alt={post.imageAlt} fill className='object-cover' />
        </div>
        <div className='mt-6 mb-4 flex flex-wrap items-center gap-2 text-xs md:text-sm'>
          <span className='px-3 py-1 rounded-full bg-black text-neutral-200'>{post.category}</span>
          <span className='text-neutral-400'>•</span>
          <span className='text-neutral-500'>{post.date}</span>
          <span className='text-neutral-400'>•</span>
          <span className='text-neutral-500'>{post.readTime}</span>
        </div>
        <h1 className='text-4xl md:text-5xl text-neutral-900 italic font-serif'>{post.title}</h1>
        <p className='text-neutral-600 text-base md:text-lg mt-4 mb-8'>{post.description}</p>
        <div className='space-y-4'>{renderMarkdown(post.bodyMd)}</div>
      </article>
    </main>
  )
}
