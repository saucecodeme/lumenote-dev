import Dexie from 'dexie';
import { db, type Block, type Document } from './db';
import { ulid } from 'ulid';

export type CreateDoc = Omit<Document, 'id' | 'createdAt' | 'updatedAt'>;
export type CreateBlock = Omit<Block, 'id' | 'createdAt' | 'updatedAt'>;
export type DocumentWithBlocks = Document & { blocks: Block[] };
/**
 * Create a new document
 * @param opts.title - The title of the document (default: 'Untitled')
 * @returns The created document
 */
export async function createDoc(opts: CreateDoc): Promise<Document> {
  const now = Date.now()
  const doc: Document = {
    id: ulid(),
    title: opts.title || 'Untitled',
    createdAt: now,
    updatedAt: now,
  }
  await db.documents.add(doc)
  await createBlock({
    docId: doc.id,
    type: 'text',
    content: '',
    order: 0,
  })
  return doc
}

/**
 * Create a new block
 * @param opts.docId - The document ID (ulid)
 * @param opts.type - The type of the block (default: 'text')
 * @param opts.content - The content of the block (default: '')
 * @param opts.order - The order of the block (default: 0)
 * @returns The created block
 */
export async function createBlock(opts: CreateBlock): Promise<Block> {
  const now = Date.now()
  const block: Block = {
    id: ulid(),
    docId: opts.docId,
    type: opts.type || 'text',
    content: opts.content || '',
    order: opts.order || 0,
    createdAt: now,
    updatedAt: now,
  }
  await db.blocks.add(block)
  return block
}

/**
 * Get a document by ID with its blocks
 * @param id - The document ID (ulid)
 * @returns The document with its blocks
 */
export async function getDoc(docId: string): Promise<DocumentWithBlocks | null> {
  const doc = await db.documents.get(docId)
  if (!doc) return null

  return {
    ...doc,
    blocks: await getBlocksByDocId(docId),
  }
}

/**
 * Get all blocks for a document
 * @param docId - The document ID (ulid)
 * @returns The blocks for the document (sorted by order)
 */
export async function getBlocksByDocId(docId: string): Promise<Block[]> {
  return db.blocks.where('[docId+order]').between([docId, Dexie.minKey], [docId, Dexie.maxKey]).toArray()
}

/**
 * Get all documents (sorted by updatedAt)
 * @returns All documents
 */
export async function getAllDocs() {
  return await db.documents.orderBy('updatedAt').reverse().toArray()
}
