import { Resend } from 'resend'
import { createServiceRoleClient, getTopicById } from '@newsflow/db'
import type { EnvSource } from '@newsflow/config'
import { logger } from '../lib/logger'

const resend = new Resend(process.env.RESEND_API_KEY)
const fromEmail = process.env.FROM_EMAIL || 'hello@orca-labs.app'
const appUrl = process.env.APP_URL || 'http://localhost:3000'

interface DigestArticle {
  title: string
  sourceUrl: string
  sourceName: string
  tldrBullets?: string[]
}

export async function sendTopicDigest(
  topicId: string,
  articles: DigestArticle[],
  source?: EnvSource
) {
  if (articles.length === 0) {
    return
  }

  try {
    const supabase = createServiceRoleClient(source)
    const topic = await getTopicById(supabase, topicId)

    if (!topic || !topic.is_active) {
      logger.warn('Digest email skipped: topic missing or inactive', { topicId })
      return
    }

    // Only send digest for daily/weekly topics, not realtime
    if (topic.frequency === 'realtime') {
      logger.info('Digest email skipped: realtime topic', { topicId, topicName: topic.name })
      return
    }

    // Fetch user email
    const { data: userData } = await supabase
      .from('users')
      .select('email')
      .eq('id', topic.user_id)
      .single()

    const userEmail = (userData as any)?.email as string | undefined
    if (!userEmail) {
      logger.warn('Digest email skipped: no user email', { topicId, userId: topic.user_id })
      return
    }

    const articleCount = Math.min(articles.length, 10)
    const subject = articleCount === 1
      ? `Your ${topic.name} briefing`
      : `${topic.name}: ${articleCount} articles`

    await resend.emails.send({
      from: `Orca <${fromEmail}>`,
      to: userEmail,
      subject,
      html: buildDigestHtml(topic.name, articles),
    })

    logger.info('Digest email sent', {
      topicId,
      topicName: topic.name,
      userEmail,
      articleCount,
    })
  } catch (err: any) {
    logger.error('Digest email failed', {
      topicId,
      error: err.message,
    })
  }
}

function buildDigestHtml(topicName: string, articles: DigestArticle[]): string {
  const date = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  const articleCount = articles.length
  const displayArticles = articles.slice(0, 10)

  const articlesHtml = displayArticles
    .map(
      (article, i) => `
      <div style="border-top: ${i === 0 ? 'none' : '1px solid #eee'}; padding-top: ${i === 0 ? '0' : '20px'}; padding-bottom: 20px;">
        <a href="${article.sourceUrl}" style="font-size: 15px; font-weight: 600; color: #111; text-decoration: none;">
          ${escapeHtml(article.title)}
        </a>
        ${
          article.tldrBullets && article.tldrBullets.length > 0
            ? `<ul style="margin: 8px 0 0 0; padding-left: 18px; font-size: 13px; line-height: 1.6; color: #555;">
                ${article.tldrBullets.map((b) => `<li style="margin-bottom: 4px;">${escapeHtml(b)}</li>`).join('')}
              </ul>`
            : ''
        }
        <div style="font-size: 12px; color: #999; margin-top: 6px;">${escapeHtml(article.sourceName)}</div>
      </div>
    `
    )
    .join('')

  const overflowHtml =
    articleCount > 10
      ? `<p style="font-size: 14px; color: #777; margin-top: 8px;">
          + ${articleCount - 10} more. Read the full briefing in the <a href="${appUrl}" style="color: #3b82f6; text-decoration: none;">Orca app</a>.
        </p>`
      : ''

  return `
    <div style="font-family: system-ui, -apple-system, sans-serif; padding: 32px 0; max-width: 480px; margin: 0 auto;">
      <div style="font-size: 24px; font-weight: 800; margin-bottom: 8px; color: #111;">
        ${escapeHtml(topicName)}
      </div>
      <p style="font-size: 14px; color: #777; margin-bottom: 24px;">
        ${articleCount} article${articleCount !== 1 ? 's' : ''} — ${date}
      </p>
      ${articlesHtml}
      ${overflowHtml}
      <p style="font-size: 12px; color: #999; margin-top: 40px; border-top: 1px solid #eee; padding-top: 16px;">
        Sent by Orca. Manage your topic preferences in the app.
      </p>
    </div>
  `
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
