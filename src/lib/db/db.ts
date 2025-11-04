import Dexie, { type Table} from 'dexie';
import { ulid } from 'ulid';

export type BlockType = 'text' | 'heading' | 'todo' | 'code'
export type Block = {
  id: string, // ulid
  docId: string,
  type: BlockType,
  content: string,
  meta?: {
    level?: 1 | 2 | 3; // for headings
    checked?: boolean; // for todos
    language?: string; // for code
  };
  order: number, // sortable index
  createdAt: number,
  updatedAt: number,
}

export type Document = {
  id: string, // ulid
  title: string,
  createdAt: number,
  updatedAt: number,
}

export type DocumentWithBlocks = Document & {
  blocks: Block[];
}

class DexieDB extends Dexie {
  documents!: Table<Document, string>;
  blocks!: Table<Block, string>;

  constructor() {
    super('lumenote');
    this.version(1).stores({
      documents: 'id, updatedAt',
      blocks: 'id, docId, [docId+order], order, updatedAt',
    })
  }
}

export const db = new DexieDB();

/**
 * Create a new document
 * @param title - The title of the document
 * @returns The created document
 */
export async function createDoc(title: string = 'Untitled'): Promise<Document> {
  const now = Date.now();
  const doc: Document = {
    id: ulid(),
    title,
    createdAt: now,
    updatedAt: now,
  };

  await db.documents.add(doc);
  return doc;
}

/**
 * Get a document by ID with all its blocks
 * @param id - The document ID (ULID)
 * @returns The document with blocks or undefined if not found
 */
export async function getDoc(id: string): Promise<DocumentWithBlocks | undefined> {
  const doc = await db.documents.get(id);
  if (!doc) return undefined;

  const blocks = await db.blocks
    .where('[docId+order]')
    .between([id, Dexie.minKey], [id, Dexie.maxKey])
    .toArray();

  return {
    ...doc,
    blocks,
  };
}

/**
 * Create a new block for a document
 * @param docId - The document ID
 * @param type - The block type
 * @param content - The block content
 * @param order - The order/position of the block
 * @param meta - Optional metadata for the block
 * @returns The created block
 */
export async function createBlock(
  docId: string,
  type: BlockType,
  content: string,
  order: number,
  meta?: Block['meta']
): Promise<Block> {
  const now = Date.now();
  const block: Block = {
    id: ulid(),
    docId,
    type,
    content,
    order,
    meta,
    createdAt: now,
    updatedAt: now,
  };

  await db.blocks.add(block);
  return block;
}

/**
 * Get all documents (sorted by most recently updated)
 * @returns Array of documents
 */
export async function getAllDocs(): Promise<Document[]> {
  return await db.documents.orderBy('updatedAt').reverse().toArray();
}
