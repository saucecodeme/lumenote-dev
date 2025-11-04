import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { createDoc, getDoc, createBlock, getAllDocs, type DocumentWithBlocks, type BlockType } from '@/lib/db/db'

export const Route = createFileRoute('/')({ component: App })

function App() {
  const [allDocs, setAllDocs] = useState<Array<{ id: string; title: string }>>([])
  const [selectedDoc, setSelectedDoc] = useState<DocumentWithBlocks | null>(null)
  const [docTitle, setDocTitle] = useState('')
  const [blockDocId, setBlockDocId] = useState('')
  const [blockType, setBlockType] = useState<BlockType>('text')
  const [blockContent, setBlockContent] = useState('')
  const [blockOrder, setBlockOrder] = useState(0)
  const [getDocId, setGetDocId] = useState('')
  const [message, setMessage] = useState('')

  const handleCreateDoc = async () => {
    try {
      const doc = await createDoc(docTitle || 'Untitled')
      setMessage(`Created document: ${doc.id}`)
      setDocTitle('')
      await refreshAllDocs()
    } catch (error) {
      setMessage(`Error: ${error}`)
    }
  }

  const handleCreateBlock = async () => {
    try {
      const block = await createBlock(
        blockDocId,
        blockType,
        blockContent,
        blockOrder
      )
      setMessage(`Created block: ${block.id}`)
      setBlockContent('')
      setBlockOrder(blockOrder + 1)
    } catch (error) {
      setMessage(`Error: ${error}`)
    }
  }

  const handleGetDoc = async () => {
    try {
      const doc = await getDoc(getDocId)
      if (doc) {
        setSelectedDoc(doc)
        setMessage(`Retrieved document: ${doc.title}`)
      } else {
        setMessage('Document not found')
        setSelectedDoc(null)
      }
    } catch (error) {
      setMessage(`Error: ${error}`)
    }
  }

  const refreshAllDocs = async () => {
    try {
      const docs = await getAllDocs()
      setAllDocs(docs)
    } catch (error) {
      setMessage(`Error: ${error}`)
    }
  }

  return (
    <div className="min-h-screen p-10 bg-gray-50">
      <h1 className="text-3xl font-bold mb-8 text-gray-900">Lumenote DB Test</h1>

      {message && (
        <div className="mb-6 p-4 bg-blue-100 text-blue-800 rounded-lg">
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Create Document Section */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">1. Create Document</h2>
          <input
            type="text"
            placeholder="Document title"
            value={docTitle}
            onChange={(e) => setDocTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded mb-3"
          />
          <button
            onClick={handleCreateDoc}
            className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Create Document
          </button>
        </div>

        {/* Create Block Section */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">2. Create Block</h2>
          <input
            type="text"
            placeholder="Document ID"
            value={blockDocId}
            onChange={(e) => setBlockDocId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded mb-3"
          />
          <select
            value={blockType}
            onChange={(e) => setBlockType(e.target.value as BlockType)}
            className="w-full px-3 py-2 border border-gray-300 rounded mb-3"
          >
            <option value="text">Text</option>
            <option value="heading">Heading</option>
            <option value="todo">Todo</option>
            <option value="code">Code</option>
          </select>
          <input
            type="text"
            placeholder="Content"
            value={blockContent}
            onChange={(e) => setBlockContent(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded mb-3"
          />
          <input
            type="number"
            placeholder="Order"
            value={blockOrder}
            onChange={(e) => setBlockOrder(parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded mb-3"
          />
          <button
            onClick={handleCreateBlock}
            className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Create Block
          </button>
        </div>

        {/* Get Document Section */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">3. Get Document</h2>
          <input
            type="text"
            placeholder="Document ID"
            value={getDocId}
            onChange={(e) => setGetDocId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded mb-3"
          />
          <button
            onClick={handleGetDoc}
            className="w-full bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
          >
            Get Document
          </button>
        </div>

        {/* All Documents Section */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">All Documents</h2>
          <button
            onClick={refreshAllDocs}
            className="w-full bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 mb-4"
          >
            Refresh All Docs
          </button>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {allDocs.map((doc) => (
              <div key={doc.id} className="p-2 bg-gray-100 rounded text-sm">
                <div className="font-semibold">{doc.title}</div>
                <div className="text-gray-600 text-xs font-mono">{doc.id}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Document Display Section */}
      {selectedDoc && (
        <div className="mt-6 bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Document Details</h2>
          <div className="mb-4">
            <div className="text-lg font-semibold text-gray-900">{selectedDoc.title}</div>
            <div className="text-sm text-gray-600 font-mono">ID: {selectedDoc.id}</div>
            <div className="text-sm text-gray-600">
              Created: {new Date(selectedDoc.createdAt).toLocaleString()}
            </div>
          </div>

          <h3 className="text-lg font-semibold mb-3 text-gray-800">
            Blocks ({selectedDoc.blocks.length})
          </h3>
          <div className="space-y-3">
            {selectedDoc.blocks.map((block) => (
              <div key={block.id} className="p-4 border border-gray-200 rounded bg-gray-50">
                <div className="flex justify-between items-start mb-2">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded">
                    {block.type}
                  </span>
                  <span className="text-xs text-gray-500">Order: {block.order}</span>
                </div>
                <div className="text-gray-900">
                  {block.content || <span className="text-gray-400 italic">Empty block</span>}
                </div>
                <div className="text-xs text-gray-500 mt-2 font-mono">
                  ID: {block.id}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
