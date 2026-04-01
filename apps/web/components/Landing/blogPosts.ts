export type BlogPost = {
  id: string
  title: string
  date: string
  readTime: string
  category: string
  bodyMd: string
}

export const blogPosts: BlogPost[] = [
  {
    id: 'signal-over-noise',
    title: 'Signal over noise: how we read faster without missing context',
    date: 'March 28, 2026',
    readTime: '4 min read',
    category: 'Product',
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
    title: 'Building better daily briefings with topic memory',
    date: 'March 16, 2026',
    readTime: '5 min read',
    category: 'Engineering',
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
    title: 'Quality-first sourcing: fewer links, stronger trust',
    date: 'March 03, 2026',
    readTime: '3 min read',
    category: 'Research',
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
