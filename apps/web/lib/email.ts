import { Resend } from 'resend'
import { WelcomeEmail } from '../emails/welcome'
import { PaymentEmail } from '../emails/payment'
import { DigestEmail } from '../emails/digest'

let _resend: Resend | null = null
function getResend() {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY)
  return _resend
}
const fromEmail = process.env.FROM_EMAIL || 'hello@orca-labs.app'
const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

export async function sendWelcomeEmail(to: string, planCode: string) {
  try {
    await getResend().emails.send({
      from: `Orca <${fromEmail}>`,
      to,
      subject: 'Welcome to Orca',
      react: WelcomeEmail({ email: to, planCode, appUrl }),
    })
  } catch (err) {
    console.error('[email] Failed to send welcome email:', err)
  }
}

export async function sendPaymentEmail(to: string, planCode: string, amount: string, date: string) {
  try {
    await getResend().emails.send({
      from: `Orca <${fromEmail}>`,
      to,
      subject: 'Payment confirmed',
      react: PaymentEmail({ email: to, planCode, amount, date, appUrl }),
    })
  } catch (err) {
    console.error('[email] Failed to send payment email:', err)
  }
}

export async function sendDigestEmail(to: string, topicName: string, articles: Array<{ title: string; sourceUrl: string; sourceName: string; tldrBullets?: string[] }>) {
  try {
    await getResend().emails.send({
      from: `Orca <${fromEmail}>`,
      to,
      subject: `Your ${topicName} briefing`,
      react: DigestEmail({ email: to, topicName, articles, appUrl }),
    })
  } catch (err) {
    console.error('[email] Failed to send digest email:', err)
  }
}
