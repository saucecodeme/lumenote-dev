import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import {
  createDoc,
  getDoc,
  appendBlock,
  insertBlockAt,
  deleteBlock,
  moveBlock,
  updateBlock,
  getAllDocs,
  type DocumentWithBlocks,
  type BlockType
} from '@/lib/db/db'

export const Route = createFileRoute('/')({ component: App })

function App() {
  const [allDocs, setAllDocs] = useState<Array<{ id: string; title: string }>>([])
  const [selectedDoc, setSelectedDoc] = useState<DocumentWithBlocks | null>(null)
  const [docTitle, setDocTitle] = useState('')
  const [blockDocId, setBlockDocId] = useState('')
  const [blockType, setBlockType] = useState<BlockType>('text')
  const [blockContent, setBlockContent] = useState('')
  const [insertPosition, setInsertPosition] = useState(0)
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

  const handleAppendBlock = async () => {
    try {
      const block = await appendBlock(
        blockDocId,
        blockType,
        blockContent
      )
      setMessage(`Appended block: ${block.id} at position ${block.order}`)
      setBlockContent('')
      if (selectedDoc?.id === blockDocId) {
        await handleGetDoc()
      }
    } catch (error) {
      setMessage(`Error: ${error}`)
    }
  }

  const handleInsertBlock = async () => {
    try {
      const block = await insertBlockAt(
        blockDocId,
        insertPosition,
        blockType,
        blockContent
      )
      setMessage(`Inserted block: ${block.id} at position ${insertPosition}`)
      setBlockContent('')
      if (selectedDoc?.id === blockDocId) {
        await handleGetDoc()
      }
    } catch (error) {
      setMessage(`Error: ${error}`)
    }
  }

  const handleDeleteBlock = async (blockId: string) => {
    try {
      const deleted = await deleteBlock(blockId)
      if (deleted) {
        setMessage(`Deleted block: ${blockId}`)
        await handleGetDoc()
      } else {
        setMessage('Block not found')
      }
    } catch (error) {
      setMessage(`Error: ${error}`)
    }
  }

  const handleMoveBlock = async (blockId: string, direction: 'up' | 'down') => {
    try {
      if (!selectedDoc) return
      const block = selectedDoc.blocks.find(b => b.id === blockId)
      if (!block) return

      const newPosition = direction === 'up' ? block.order - 1 : block.order + 1
      if (newPosition < 0 || newPosition >= selectedDoc.blocks.length) return

      await moveBlock(blockId, newPosition)
      setMessage(`Moved block ${direction}`)
      await handleGetDoc()
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
          <h2 className="text-xl font-semibold mb-4 text-gray-800">2. Add Blocks</h2>
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
          <button
            onClick={handleAppendBlock}
            className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 mb-2"
          >
            Append Block (to end)
          </button>
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Position"
              value={insertPosition}
              onChange={(e) => setInsertPosition(parseInt(e.target.value))}
              className="flex-1 px-3 py-2 border border-gray-300 rounded"
            />
            <button
              onClick={handleInsertBlock}
              className="flex-1 bg-teal-600 text-white px-4 py-2 rounded hover:bg-teal-700"
            >
              Insert At
            </button>
          </div>
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
            {selectedDoc.blocks.map((block, index) => (
              <div key={block.id} className="p-4 border border-gray-200 rounded bg-gray-50">
                <div className="flex justify-between items-start mb-2">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded">
                    {block.type}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleMoveBlock(block.id, 'up')}
                      disabled={index === 0}
                      className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => handleMoveBlock(block.id, 'down')}
                      disabled={index === selectedDoc.blocks.length - 1}
                      className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      ↓
                    </button>
                    <button
                      onClick={() => handleDeleteBlock(block.id)}
                      className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                    >
                      Delete
                    </button>
                    <span className="text-xs text-gray-500 self-center">#{block.order}</span>
                  </div>
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
