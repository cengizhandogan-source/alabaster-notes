import Image from "next/image"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <Image
        src="/logo.png"
        alt="Alabaster Notes"
        width={80}
        height={80}
        className="mb-4"
      />
      <p className="mb-6 text-sm text-muted-foreground">
        Created by:{" "}
        <a
          href="https://www.linkedin.com/in/cengo"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-foreground transition-colors"
        >
          Cengizhan Dogan
        </a>
      </p>
      <div className="w-full max-w-sm">
        {children}
      </div>
    </div>
  )
}
