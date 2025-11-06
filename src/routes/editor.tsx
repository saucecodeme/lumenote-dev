import { createFileRoute, Link } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import LexicalEditor from '@/components/Editor/LexicalEditor'
import ClientOnly from '@/components/ClientOnly'
import {
  ArrowLeft,
  Plus,
  FileText,
  Trash2,
  Edit2,
  Check,
  X
} from 'lucide-react'
import {
  createDoc,
  getAllDocs,
  loadEditorState,
  updateDocTitle,
  deleteDoc,
  type Document
} from '@/lib/db/db'

export const Route = createFileRoute('/editor')({
  component: EditorPage
})

function EditorPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b bg-white">
        <div className="container mx-auto px-4 py-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700"
          >
            <ArrowLeft size={20} />
            Back to DB Test
          </Link>
        </div>
      </div>
      <ClientOnly fallback={
        <div className="container mx-auto px-4 py-8">
          <p className="text-center text-gray-400">Loading editor...</p>
        </div>
      }>
        <EditorWithDocs />
      </ClientOnly>
    </div>
  )
}

function EditorWithDocs() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [currentDoc, setCurrentDoc] = useState<Document | null>(null)
  const [editorState, setEditorState] = useState<string | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(true)
  const [editingDocId, setEditingDocId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')

  // Load all documents on mount
  useEffect(() => {
    loadDocuments()
  }, [])

  // Load editor state when document changes
  useEffect(() => {
    if (currentDoc) {
      loadCurrentDocState()
    }
  }, [currentDoc?.id])

  const loadDocuments = async () => {
    try {
      const docs = await getAllDocs()
      setDocuments(docs)

      // If no current doc and we have docs, select the first one
      if (!currentDoc && docs.length > 0) {
        setCurrentDoc(docs[0])
      }

      setIsLoading(false)
    } catch (error) {
      console.error('Failed to load documents:', error)
      setIsLoading(false)
    }
  }

  const loadCurrentDocState = async () => {
    if (!currentDoc) return

    try {
      const state = await loadEditorState(currentDoc.id)
      setEditorState(state || undefined)
    } catch (error) {
      console.error('Failed to load editor state:', error)
    }
  }

  const handleCreateDoc = async () => {
    try {
      const doc = await createDoc('Untitled Document')
      setDocuments([doc, ...documents])
      setCurrentDoc(doc)
      setEditorState(undefined) // Clear editor for new doc
    } catch (error) {
      console.error('Failed to create document:', error)
    }
  }

  const handleSelectDoc = (doc: Document) => {
    setCurrentDoc(doc)
  }

  const handleDeleteDoc = async (docId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return

    try {
      await deleteDoc(docId)
      const updatedDocs = documents.filter(d => d.id !== docId)
      setDocuments(updatedDocs)

      // If deleting current doc, select another one
      if (currentDoc?.id === docId) {
        setCurrentDoc(updatedDocs[0] || null)
      }
    } catch (error) {
      console.error('Failed to delete document:', error)
    }
  }

  const startEditingTitle = (doc: Document) => {
    setEditingDocId(doc.id)
    setEditTitle(doc.title)
  }

  const cancelEditingTitle = () => {
    setEditingDocId(null)
    setEditTitle('')
  }

  const saveTitle = async (docId: string) => {
    if (!editTitle.trim()) {
      cancelEditingTitle()
      return
    }

    try {
      await updateDocTitle(docId, editTitle.trim())
      setDocuments(docs =>
        docs.map(d => d.id === docId ? { ...d, title: editTitle.trim() } : d)
      )
      if (currentDoc?.id === docId) {
        setCurrentDoc({ ...currentDoc, title: editTitle.trim() })
      }
      setEditingDocId(null)
    } catch (error) {
      console.error('Failed to update title:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-center text-gray-400">Loading...</p>
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-73px)]">
      {/* Sidebar */}
      <div className="w-64 border-r bg-white flex flex-col">
        <div className="p-4 border-b">
          <button
            onClick={handleCreateDoc}
            className="w-full flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={18} />
            New Document
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {documents.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">
              No documents yet
            </p>
          ) : (
            <div className="space-y-1">
              {documents.map(doc => (
                <div
                  key={doc.id}
                  className={`group relative rounded-lg ${
                    currentDoc?.id === doc.id
                      ? 'bg-blue-50 border border-blue-200'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  {editingDocId === doc.id ? (
                    <div className="p-2 flex items-center gap-1">
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveTitle(doc.id)
                          if (e.key === 'Escape') cancelEditingTitle()
                        }}
                        className="flex-1 px-2 py-1 text-sm border rounded"
                        autoFocus
                      />
                      <button
                        onClick={() => saveTitle(doc.id)}
                        className="p-1 text-green-600 hover:bg-green-50 rounded"
                      >
                        <Check size={14} />
                      </button>
                      <button
                        onClick={cancelEditingTitle}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => handleSelectDoc(doc)}
                        className="w-full text-left p-3 flex items-start gap-2"
                      >
                        <FileText size={16} className="mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {doc.title}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(doc.updatedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </button>
                      <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 flex gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            startEditingTitle(doc)
                          }}
                          className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                          title="Rename"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteDoc(doc.id)
                          }}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {currentDoc ? (
            <>
              <h1 className="text-3xl font-bold mb-6 text-gray-900">
                {currentDoc.title}
              </h1>
              <LexicalEditor
                key={currentDoc.id}
                docId={currentDoc.id}
                initialEditorState={editorState}
              />
            </>
          ) : (
            <div className="text-center py-20">
              <FileText size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 mb-4">No document selected</p>
              <button
                onClick={handleCreateDoc}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus size={18} />
                Create Your First Document
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
