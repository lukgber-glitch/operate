import { MinimalHeader } from '@/components/main/MinimalHeader'

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col h-screen bg-background">
      <MinimalHeader />
      <main className="flex-1 overflow-hidden">
        {children}
      </main>
    </div>
  )
}
