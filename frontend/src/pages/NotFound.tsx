import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <section className="rounded-md border border-neutral-200 bg-white p-8 text-center shadow-sm">
      <h1 className="text-xl font-semibold text-neutral-900">Page not found</h1>
      <p className="mt-2 text-sm text-neutral-600">That URL does not match any screen in this app.</p>
      <Link
        to="/outlets"
        className="mt-6 inline-block rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2"
      >
        Go to outlets
      </Link>
    </section>
  )
}
