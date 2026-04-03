'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { UserRound } from 'lucide-react'
import { getSupabase } from '@/lib/supabaseClient'

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
  const router = useRouter()
  const membershipMonths = getMembershipMonths(createdAt)
  const signupLabel = getSignupLabel(createdAt)
  const memberForLabel = getMemberForLabel(membershipMonths)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const handleOpenModal = () => {
    setDeleteError(null)
    setConfirmText('')
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    if (deleteLoading) return
    setIsModalOpen(false)
  }

  const handleDeleteAccount = async () => {
    if (confirmText.trim().toLowerCase() !== 'delete') return
    const s = getSupabase()
    if (!s) {
      setDeleteError('Could not initialize auth client.')
      return
    }
    setDeleteLoading(true)
    setDeleteError(null)
    try {
      const { data: sessionData } = await s.auth.getSession()
      const token = sessionData.session?.access_token
      if (!token) {
        setDeleteError('Your session expired. Please sign in again.')
        setDeleteLoading(false)
        return
      }

      const res = await fetch('/api/account/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await res.json()
      if (!res.ok) {
        setDeleteError(data?.error ?? 'Could not delete account.')
        setDeleteLoading(false)
        return
      }

      await s.auth.signOut()
      router.push('/')
    } catch {
      setDeleteError('Unexpected error while deleting account.')
      setDeleteLoading(false)
    }
  }

  return (
    <>
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

        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: membershipMonths }, (_, i) => i + 1).map((month) => (
              <span
                key={`batch-month-${month}`}
                className={`inline-flex items-center rounded-full px-5 py-2 text-xs font-medium text-stone-800 border border-black/5 bg-gradient-to-br ${BADGE_GRADIENTS[(month - 1) % BADGE_GRADIENTS.length]}`}
              >
                Batch Month: {month}
              </span>
            ))}
          </div>

          <button
            onClick={handleOpenModal}
            className="rounded-full w-40  border border-red-200 bg-red-50 px-4 py-2 font-sans text-xs font-medium text-red-700 hover:bg-red-100 transition-colors"
          >
            Delete your account
          </button>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={handleCloseModal}
          />
          <div className="relative w-full max-w-md rounded-2xl border border-stone-200 bg-white p-6 shadow-xl">
            <h3 className="font-serif text-2xl text-stone-900 mb-2">Delete account</h3>
            <p className="font-sans text-sm text-stone-600 leading-relaxed mb-4">
              This will cancel your Orca subscription immediately and permanently delete your account and data.
            </p>
            <p className="font-sans text-xs text-stone-500 mb-2">Type DELETE to confirm</p>
            <input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="w-full rounded-xl border border-stone-200 px-3 py-2 font-sans text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-300"
              placeholder="DELETE"
            />

            {deleteError && (
              <p className="mt-3 font-sans text-xs text-red-600">{deleteError}</p>
            )}

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                onClick={handleCloseModal}
                disabled={deleteLoading}
                className="rounded-full border border-stone-300 px-4 py-2 font-sans text-xs font-medium text-stone-700 hover:bg-stone-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteLoading || confirmText.trim().toLowerCase() !== 'delete'}
                className="rounded-full bg-red-600 px-4 py-2 font-sans text-xs font-medium text-white hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {deleteLoading ? 'Deleting...' : 'Delete now'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
