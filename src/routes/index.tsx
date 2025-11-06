import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: RouteComponent,
  ssr: false, // Disable SSR to prevent "window is not defined" errors with Lexical
})

function RouteComponent() {
  return (
    <div className="min-h-screen">
      <section>Hello world</section>
    </div>
  )
}
