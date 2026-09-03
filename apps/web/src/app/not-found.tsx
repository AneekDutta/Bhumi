import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
      <h2 className="text-2xl font-bold">404 - Page Not Found</h2>
      <p className="text-gray-600">The requested resource could not be found.</p>
      <Link href="/" className="text-blue-600 hover:underline">
        Return Home
      </Link>
    </div>
  )
}
