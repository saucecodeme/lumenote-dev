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

class DexieDB extends Dexie {
  documents!: Table<Document, string>;
  blocks!: Table<Block, string>;

  constructor() {
    super('lumenote');
    this.version(1).stores({
      documents: 'id, updatedAt',
      blocks: 'id, docId, order, updatedAt',
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
 * Get a document by ID
 * @param id - The document ID (ULID)
 * @returns The document or undefined if not found
 */
export async function getDoc(id: string): Promise<Document | undefined> {
  return await db.documents.get(id);
}
