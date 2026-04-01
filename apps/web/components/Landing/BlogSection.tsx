import React from 'react'
import { blogPosts } from './blogPosts'

function renderInlineMarkdown(text: string) {
  const nodes: React.ReactNode[] = []
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
  const blocks: React.ReactNode[] = []
  let bulletBuffer: string[] = []
  let key = 0

  const flushBullets = () => {
    if (!bulletBuffer.length) {
      return
    }

    blocks.push(
      <ul key={`ul-${key++}`} className='list-disc list-inside text-sm md:text-base text-neutral-600 space-y-1'>
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
        <h4 key={`h4-${key++}`} className='text-base md:text-lg font-semibold text-neutral-900 mt-2'>
          {renderInlineMarkdown(trimmed.slice(4))}
        </h4>
      )
      continue
    }

    blocks.push(
      <p key={`p-${key++}`} className='text-sm md:text-base text-neutral-600 leading-relaxed'>
        {renderInlineMarkdown(trimmed)}
      </p>
    )
  }

  flushBullets()
  return blocks
}

function BlogSection() {
  return (
    <section className='w-full max-w-6xl py-20 md:py-32'>
      <div className='mb-10 md:mb-14'>
        <h2 className='text-3xl md:text-4xl text-neutral-800 font-semibold tracking-tight'>From our blog</h2>
        <p className='text-neutral-500 mt-3 max-w-2xl'>
          Fresh notes from the team. Edit the <span className='font-medium text-neutral-700'>blogPosts.ts</span> file to
          add a new post.
        </p>
      </div>

      <div className='grid gap-6 md:gap-8'>
        {blogPosts.map((post) => (
          <article
            key={post.id}
            className='rounded-3xl md:rounded-[32px] bg-white border border-neutral-200 p-6 md:p-8 shadow-sm shadow-neutral-300/30'
          >
            <div className='flex flex-wrap items-center gap-2 text-xs md:text-sm mb-3'>
              <span className='px-3 py-1 rounded-full bg-neutral-100 text-neutral-700 font-medium'>{post.category}</span>
              <span className='text-neutral-400'>•</span>
              <span className='text-neutral-500'>{post.date}</span>
              <span className='text-neutral-400'>•</span>
              <span className='text-neutral-500'>{post.readTime}</span>
            </div>
            <h3 className='text-xl md:text-2xl tracking-tight text-neutral-900 font-semibold mb-5'>{post.title}</h3>
            <div className='space-y-3'>{renderMarkdown(post.bodyMd)}</div>
          </article>
        ))}
      </div>
    </section>
  )
}

export default BlogSection
