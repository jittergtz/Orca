'use client'
import { UserRound } from 'lucide-react'

type ProfileInfoCardProps = {
  email: string | null
  createdAt: string | null
}

const BADGE_GRADIENTS = [
  'from-lime-200 via-emerald-100 to-green-200',
  'from-sky-200 via-cyan-100 to-blue-200',
  'from-violet-200 via-fuchsia-100 to-purple-200',
  'from-amber-200 via-yellow-100 to-orange-200',
  'from-rose-200 via-pink-100 to-red-200',
  'from-stone-300 via-zinc-100 to-stone-200',
]

function getMembershipMonths(createdAt: string | null) {
  if (!createdAt) return 1
  const created = new Date(createdAt)
  if (Number.isNaN(created.getTime())) return 1
  const now = new Date()
  const diffMs = now.getTime() - created.getTime()
  const diffDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)))
  return Math.max(1, Math.floor(diffDays / 30) + 1)
}

function getSignupLabel(createdAt: string | null) {
  if (!createdAt) return 'Unknown signup date'
  const created = new Date(createdAt)
  if (Number.isNaN(created.getTime())) return 'Unknown signup date'
  const now = new Date()
  const diffMs = now.getTime() - created.getTime()
  const diffDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)))
  if (diffDays === 0) return 'Signed up today'
  if (diffDays === 1) return 'Signed up yesterday'
  if (diffDays < 30) return `Signed up ${diffDays} days ago`
  const months = Math.floor(diffDays / 30)
  if (months < 12) return `Signed up ${months} months ago`
  const years = Math.floor(months / 12)
  return `Signed up ${years} years ago`
}

function getMemberForLabel(months: number) {
  if (months < 12) {
    return `Member for ${months} month${months === 1 ? '' : 's'}`
  }
  const years = Math.floor(months / 12)
  const remainingMonths = months % 12
  if (remainingMonths === 0) {
    return `Member for ${years} year${years === 1 ? '' : 's'}`
  }
  return `Member for ${years} year${years === 1 ? '' : 's'} and ${remainingMonths} month${remainingMonths === 1 ? '' : 's'}`
}

export default function ProfileInfoCard({ email, createdAt }: ProfileInfoCardProps) {
  const membershipMonths = getMembershipMonths(createdAt)
  const signupLabel = getSignupLabel(createdAt)
  const memberForLabel = getMemberForLabel(membershipMonths)

  return (
    <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm md:col-span-2">
      <div className="flex items-center gap-2 mb-6">
        <UserRound className="w-5 h-5 text-stone-900" />
        <h2 className="font-serif text-xl text-stone-900">Profile Info</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="rounded-xl border border-stone-200 bg-stone-50/60 p-4">
          <p className="font-sans text-xs uppercase tracking-wide text-stone-500 mb-2">Email</p>
          <p className="font-sans text-sm font-medium text-stone-900 break-all">{email ?? 'No email found'}</p>
        </div>
        <div className="rounded-xl border border-stone-200 bg-stone-50/60 p-4">
          <p className="font-sans text-xs uppercase tracking-wide text-stone-500 mb-2">Created</p>
          <p className="font-sans text-sm font-medium text-stone-900">
            {createdAt ? new Date(createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Unknown date'}
          </p>
        </div>
        <div className="rounded-xl border border-stone-200 bg-gradient-to-tl from-stone-500/60 p-4">
          <p className="font-sans text-xs uppercase tracking-wide text-stone-500 mb-2">Membership</p>
          <p className="font-sans text-sm font-medium text-stone-900">{memberForLabel}</p>
        </div>
      </div>

      <div className="mb-4">
        <p className="font-sans text-sm text-stone-600">{signupLabel}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {Array.from({ length: membershipMonths }, (_, i) => i + 1).map((month) => (
          <span
            key={`batch-month-${month}`}
            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium text-stone-800 border border-black/5 bg-gradient-to-br ${BADGE_GRADIENTS[(month - 1) % BADGE_GRADIENTS.length]}`}
          >
            Batch Month: {month}
          </span>
        ))}
      </div>
    </div>
  )
}
