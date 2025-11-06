import { createFileRoute, Link } from '@tanstack/react-router'
import LexicalEditor from '@/components/Editor/LexicalEditor'
import ClientOnly from '@/components/ClientOnly'
import { ArrowLeft } from 'lucide-react'

export const Route = createFileRoute('/editor')({
  component: EditorPage
})

function EditorPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="container mx-auto px-4">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6"
        >
          <ArrowLeft size={20} />
          Back to DB Test
        </Link>
        <h1 className="text-3xl font-bold mb-8 text-gray-900 text-center">
          Lumenote Editor
        </h1>
        <p className="text-gray-600 text-center mb-8">
          A Notion-style editor with text, headings, and todo lists
        </p>
        <ClientOnly fallback={
          <div className="editor-container bg-white rounded-lg shadow-sm border border-gray-200 max-w-4xl mx-auto p-8 min-h-[400px] flex items-center justify-center">
            <p className="text-gray-400">Loading editor...</p>
          </div>
        }>
          <LexicalEditor />
        </ClientOnly>
        <div className="mt-8 max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold mb-4">Try these features:</h2>
          <ul className="space-y-2 text-gray-700">
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span><strong>Headings:</strong> Use the H1, H2, H3 buttons in the toolbar</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span><strong>Text Formatting:</strong> Select text and use Bold, Italic, Underline buttons</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span><strong>Todo List:</strong> Click the checkbox icon to create a checklist</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span><strong>Keyboard Shortcuts:</strong> Cmd/Ctrl + B (bold), Cmd/Ctrl + I (italic), Cmd/Ctrl + U (underline)</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
