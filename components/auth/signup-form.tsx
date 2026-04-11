"use client"

import { useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"

export function SignupForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    const supabase = createClient()
    const { error } = await supabase.auth.signUp({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
  }

  if (success) {
    return (
      <div className="border border-border p-6 font-mono">
        <h1 className="text-lg font-medium text-foreground mb-4">&gt; check your email</h1>
        <p className="text-sm text-secondary">
          check your email to confirm your account
        </p>
        <p className="text-sm text-secondary mt-4">
          <Link href="/login" className="text-foreground hover:text-accent transition-colors duration-100">
            &gt; back to log in
          </Link>
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="border border-border p-6 font-mono">
      <h1 className="text-lg font-medium text-foreground mb-6">&gt; sign up</h1>

      <div className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm text-secondary mb-1">
            email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full bg-surface border border-border px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-foreground transition-colors duration-100"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm text-secondary mb-1">
            password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full bg-surface border border-border px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-foreground transition-colors duration-100"
          />
        </div>
      </div>

      {error && (
        <p className="text-sm text-error mt-4">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full mt-6 bg-foreground text-background py-2 text-sm font-medium hover:opacity-90 transition-opacity duration-100 disabled:opacity-50"
      >
        {loading ? "> loading..." : "> sign up"}
      </button>

      <p className="text-sm text-secondary mt-4">
        already have an account?{" "}
        <Link href="/login" className="text-foreground hover:text-accent transition-colors duration-100">
          &gt; log in
        </Link>
      </p>
    </form>
  )
}
