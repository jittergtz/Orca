export type BlogPost = {
  id: string
  slug: string
  title: string
  description: string
  date: string
  readTime: string
  category: string
  imageSrc: string
  imageAlt: string
  bodyMd: string
}

export const blogPosts: BlogPost[] = [
  {
    id: 'signal-over-noise',
    slug: 'signal-over-noise',
    title: 'Signal over noise: how we read faster without missing context',
    description: 'How Orca highlights what changed, trims repetition, and keeps context intact.',
    date: 'March 28, 2026',
    readTime: '4 min read',
    category: 'Product',
    imageSrc: '/carousel/newspaper.jpg',
    imageAlt: 'Newspaper pages spread on a table',
    bodyMd: `### Why this matters
Modern news moves faster than attention spans. Orca prioritizes what changed and why it matters.

### What we changed
- grouped related updates into one stream
- added source confidence at the sentence level
- highlighted what is **new** vs what is repeated

### What you get
You spend less time scrolling and more time understanding.`
  },
  {
    id: 'better-briefings',
    slug: 'building-better-daily-briefings',
    title: 'Building better daily briefings with topic memory',
    description: 'A simple memory layer that turns daily updates into one continuous narrative.',
    date: 'March 16, 2026',
    readTime: '5 min read',
    category: 'Engineering',
    imageSrc: '/carousel/Datacenter.jpg',
    imageAlt: 'Server racks representing data processing',
    bodyMd: `### The core idea
Briefings should remember your ongoing interests, not reset every morning.

### How it works
- keep a lightweight memory of followed topics
- compare today against your previous summary
- surface deltas first, background second

### Result
Every briefing feels continuous, like a conversation that picks up where it left off.`
  },
  {
    id: 'quality-sources',
    slug: 'quality-first-sourcing',
    title: 'Quality-first sourcing: fewer links, stronger trust',
    description: 'Why fewer, better sources produce clearer and more reliable coverage.',
    date: 'March 03, 2026',
    readTime: '3 min read',
    category: 'Research',
    imageSrc: '/carousel/Global.jpg',
    imageAlt: 'Global map visualizing worldwide coverage',
    bodyMd: `### Less volume, more clarity
More links do not always mean better information.

### Our filtering principles
- diversity across regions and publishers
- consistency between independent sources
- transparent confidence signals per claim

### Takeaway
We optimize for **trustworthy coverage**, not endless feed length.`
  }
]

export function getBlogPostBySlug(slug: string) {
  return blogPosts.find((post) => post.slug === slug)
}
