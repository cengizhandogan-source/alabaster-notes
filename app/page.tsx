import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect("/notes")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="text-center space-y-8">
        <div className="space-y-2">
          <h1 className="text-2xl font-medium text-foreground">
            alabaster notes
          </h1>
          <p className="text-secondary text-sm">
            a quiet place for your thoughts
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <Link
            href="/login"
            className="text-sm text-foreground border border-border px-6 py-2 hover:bg-surface transition-colors duration-100 inline-block"
          >
            &gt; log in
          </Link>
          <Link
            href="/signup"
            className="text-sm text-secondary hover:text-foreground transition-colors duration-100 inline-block"
          >
            &gt; sign up
          </Link>
        </div>
      </div>
    </div>
  )
}
