'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabase } from '@/lib/supabaseClient'

export default function AuthRedirect() {
  const router = useRouter()

  useEffect(() => {
    const s = getSupabase()
    if (!s) return
    s.auth.getSession().then(({ data }) => {
      if (data.session) {
        router.push('/dashboard')
      }
    })
  }, [router])

  return null
}
