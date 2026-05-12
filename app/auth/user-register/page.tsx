import { UserRegisterFlow } from '@/components/auth/UserRegisterFlow'

export default async function UserRegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>
}) {
  const { next } = await searchParams

  return <UserRegisterFlow nextPath={next} />
}
