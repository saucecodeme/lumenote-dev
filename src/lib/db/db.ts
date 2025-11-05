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
 * Create a new document with an initial empty block
 * @param title - The title of the document
 * @returns The created document with its initial block
 */
export async function createDoc(title: string = 'Untitled'): Promise<DocumentWithBlocks> {
  const now = Date.now();
  const doc: Document = {
    id: ulid(),
    title,
    createdAt: now,
    updatedAt: now,
  };

  const initialBlock: Block = {
    id: ulid(),
    docId: doc.id,
    type: 'text',
    content: '',
    order: 0,
    createdAt: now,
    updatedAt: now,
  };

  await db.documents.add(doc);
  await db.blocks.add(initialBlock);

  return {
    ...doc,
    blocks: [initialBlock],
  };
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
 * Append a new block to the end of a document
 * @param docId - The document ID
 * @param type - The block type
 * @param content - The block content
 * @param meta - Optional metadata for the block
 * @returns The created block
 */
export async function appendBlock(
  docId: string,
  type: BlockType,
  content: string = '',
  meta?: Block['meta']
): Promise<Block> {
  // Get the current max order for this document
  const maxBlock = await db.blocks
    .where('docId')
    .equals(docId)
    .reverse()
    .sortBy('order');

  const maxOrder = maxBlock.length > 0 ? maxBlock[0].order : -1;
  const now = Date.now();

  const block: Block = {
    id: ulid(),
    docId,
    type,
    content,
    order: maxOrder + 1,
    meta,
    createdAt: now,
    updatedAt: now,
  };

  await db.blocks.add(block);
  return block;
}

/**
 * Insert a block at a specific position in a document
 * Shifts all blocks at or after the position down by 1
 * @param docId - The document ID
 * @param position - The position to insert at (0-based)
 * @param type - The block type
 * @param content - The block content
 * @param meta - Optional metadata for the block
 * @returns The created block
 */
export async function insertBlockAt(
  docId: string,
  position: number,
  type: BlockType,
  content: string = '',
  meta?: Block['meta']
): Promise<Block> {
  // Get all blocks at or after the position
  const blocksToShift = await db.blocks
    .where('[docId+order]')
    .between([docId, position], [docId, Dexie.maxKey])
    .toArray();

  // Shift them down by 1
  await db.transaction('rw', db.blocks, async () => {
    for (const block of blocksToShift) {
      await db.blocks.update(block.id, {
        order: block.order + 1,
        updatedAt: Date.now()
      });
    }
  });

  // Create the new block
  const now = Date.now();
  const newBlock: Block = {
    id: ulid(),
    docId,
    type,
    content,
    order: position,
    meta,
    createdAt: now,
    updatedAt: now,
  };

  await db.blocks.add(newBlock);
  return newBlock;
}

/**
 * Delete a block and reorder remaining blocks
 * @param blockId - The block ID to delete
 * @returns True if deleted, false if not found
 */
export async function deleteBlock(blockId: string): Promise<boolean> {
  const block = await db.blocks.get(blockId);
  if (!block) return false;

  await db.transaction('rw', db.blocks, async () => {
    // Delete the block
    await db.blocks.delete(blockId);

    // Get all blocks after this one in the same document
    const blocksToReorder = await db.blocks
      .where('[docId+order]')
      .between([block.docId, block.order + 1], [block.docId, Dexie.maxKey])
      .toArray();

    // Shift them up by 1
    for (const b of blocksToReorder) {
      await db.blocks.update(b.id, {
        order: b.order - 1,
        updatedAt: Date.now()
      });
    }
  });

  return true;
}

/**
 * Move a block from one position to another within the same document
 * @param blockId - The block ID to move
 * @param newPosition - The new position (0-based)
 * @returns The updated block or undefined if not found
 */
export async function moveBlock(blockId: string, newPosition: number): Promise<Block | undefined> {
  const block = await db.blocks.get(blockId);
  if (!block) return undefined;

  const oldPosition = block.order;
  if (oldPosition === newPosition) return block;

  await db.transaction('rw', db.blocks, async () => {
    if (newPosition > oldPosition) {
      // Moving down: shift blocks between old and new position up by 1
      const blocksToShift = await db.blocks
        .where('[docId+order]')
        .between([block.docId, oldPosition + 1], [block.docId, newPosition], true, true)
        .toArray();

      for (const b of blocksToShift) {
        await db.blocks.update(b.id, {
          order: b.order - 1,
          updatedAt: Date.now()
        });
      }
    } else {
      // Moving up: shift blocks between new and old position down by 1
      const blocksToShift = await db.blocks
        .where('[docId+order]')
        .between([block.docId, newPosition], [block.docId, oldPosition - 1], true, true)
        .toArray();

      for (const b of blocksToShift) {
        await db.blocks.update(b.id, {
          order: b.order + 1,
          updatedAt: Date.now()
        });
      }
    }

    // Move the block to new position
    await db.blocks.update(blockId, {
      order: newPosition,
      updatedAt: Date.now()
    });
  });

  return await db.blocks.get(blockId);
}

/**
 * Update a block's content and/or metadata
 * @param blockId - The block ID
 * @param updates - Partial block updates
 * @returns The updated block or undefined if not found
 */
export async function updateBlock(
  blockId: string,
  updates: {
    content?: string;
    type?: BlockType;
    meta?: Block['meta'];
  }
): Promise<Block | undefined> {
  const block = await db.blocks.get(blockId);
  if (!block) return undefined;

  await db.blocks.update(blockId, {
    ...updates,
    updatedAt: Date.now(),
  });

  return await db.blocks.get(blockId);
}

/**
 * @deprecated Use appendBlock instead. This function is kept for backward compatibility.
 */
export async function createBlock(
  docId: string,
  type: BlockType,
  content: string,
  order: number,
  meta?: Block['meta']
): Promise<Block> {
  console.warn('createBlock is deprecated. Use appendBlock or insertBlockAt instead.');
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
