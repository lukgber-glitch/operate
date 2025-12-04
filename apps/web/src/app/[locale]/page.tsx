import { redirect } from 'next/navigation'

export default function RootPage({
  params: { locale },
}: {
  params: { locale: string }
}) {
  // Redirect to the dashboard
  redirect(`/${locale}/dashboard`)
}
