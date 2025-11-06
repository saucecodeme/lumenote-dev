import Dexie, { type Table} from 'dexie';
import { ulid } from 'ulid';

// Base62 characters for lexicographic ordering (0-9, A-Z, a-z)
const BASE62 = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const BASE = BASE62.length;

/**
 * Generate a lexicographic order key between two positions
 * This allows inserting between any two blocks without reordering others
 */
export function generateOrderKey(before?: string, after?: string): string {
  // If no positions provided, start with 'a0'
  if (!before && !after) {
    return 'a0';
  }

  // If only before, append to get next key
  if (!after) {
    return incrementKey(before!);
  }

  // If only after, get key before it
  if (!before) {
    return decrementKey(after);
  }

  // Generate key between before and after
  return getMiddleKey(before, after);
}

/**
 * Get the next key after the given key
 */
function incrementKey(key: string): string {
  // Try to increment the last character
  const lastChar = key[key.length - 1];
  const lastIndex = BASE62.indexOf(lastChar);

  if (lastIndex < BASE - 1) {
    // Can increment the last character
    return key.slice(0, -1) + BASE62[lastIndex + 1];
  }

  // Need to append a new character
  return key + BASE62[0];
}

/**
 * Get a key before the given key
 */
function decrementKey(key: string): string {
  const lastChar = key[key.length - 1];
  const lastIndex = BASE62.indexOf(lastChar);

  if (lastIndex > 0) {
    return key.slice(0, -1) + BASE62[lastIndex - 1];
  }

  // If we can't decrement, create a smaller key
  return key.slice(0, -1) + BASE62[0] + BASE62[BASE - 1];
}

/**
 * Generate a key between two keys
 */
function getMiddleKey(before: string, after: string): string {
  // Ensure before < after
  if (before >= after) {
    throw new Error(`Invalid order: before (${before}) must be less than after (${after})`);
  }

  const maxLen = Math.max(before.length, after.length);
  const beforePadded = before.padEnd(maxLen, BASE62[0]);
  const afterPadded = after.padEnd(maxLen, BASE62[0]);

  let result = '';
  let carry = false;

  for (let i = 0; i < maxLen; i++) {
    const beforeIndex = BASE62.indexOf(beforePadded[i]);
    const afterIndex = BASE62.indexOf(afterPadded[i]);

    if (beforeIndex === afterIndex) {
      // Characters are the same, copy and continue
      result += beforePadded[i];
      continue;
    }

    // Found differing characters
    const diff = afterIndex - beforeIndex;

    if (diff > 1) {
      // Can fit a character in between
      const midIndex = beforeIndex + Math.floor(diff / 2);
      result += BASE62[midIndex];
      break;
    } else {
      // diff === 1, need to look at next character or extend
      result += beforePadded[i];

      // Check if we can insert after the current position in 'before'
      if (i < before.length - 1 || before[i] !== beforePadded[i]) {
        // Can extend from before's position
        const nextBeforeIndex = i + 1 < before.length ? BASE62.indexOf(before[i + 1]) : 0;
        const midIndex = Math.floor((BASE + nextBeforeIndex) / 2);
        result += BASE62[midIndex];
        break;
      } else {
        // Extend with a middle character
        result += BASE62[Math.floor(BASE / 2)];
        break;
      }
    }
  }

  return result || before + BASE62[Math.floor(BASE / 2)];
}

export type BlockType = 'text' | 'heading' | 'todo' | 'code'
export type Block = {
  id: string // ulid
  docId: string
  type: BlockType
  content: string
  meta?: {
    level?: 1 | 2 | 3; // for headings
    checked?: boolean; // for todos
    language?: string; // for code
  };
  order: string, // lexicographic order key
  createdAt: number,
  updatedAt: number,
}

export type Document = {
  id: string // ulid
  title: string
  createdAt: number
  updatedAt: number
}

export type DocumentWithBlocks = Document & {
  blocks: Block[];
}

class DexieDB extends Dexie {
  documents!: Table<Document, string>
  blocks!: Table<Block, string>

  constructor() {
    super('lumenote');
    // Version 1: Initial schema with numeric order
    this.version(1).stores({
      documents: 'id, updatedAt',
      blocks: 'id, docId, [docId+order], order, updatedAt',
    })
    // Version 2: Changed order from number to string (lexicographic)
    // Note: Dexie will automatically handle the schema change
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
    order: generateOrderKey(), // 'a0'
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
  // Get the last block's order key
  const blocks = await db.blocks
    .where('docId')
    .equals(docId)
    .sortBy('order');

  const lastOrder = blocks.length > 0 ? blocks[blocks.length - 1].order : undefined;
  const now = Date.now();

  const block: Block = {
    id: ulid(),
    docId,
    type,
    content,
    order: generateOrderKey(lastOrder), // Generate key after the last one
    meta,
    createdAt: now,
    updatedAt: now,
  };

  await db.blocks.add(block);
  return block;
}

/**
 * Insert a block at a specific position in a document
 * Uses lexicographic ordering - no need to shift other blocks!
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
  // Get all blocks sorted by order
  const blocks = await db.blocks
    .where('docId')
    .equals(docId)
    .sortBy('order');

  let orderKey: string;

  if (position <= 0) {
    // Insert at the beginning
    const firstOrder = blocks.length > 0 ? blocks[0].order : undefined;
    orderKey = generateOrderKey(undefined, firstOrder);
  } else if (position >= blocks.length) {
    // Insert at the end
    const lastOrder = blocks.length > 0 ? blocks[blocks.length - 1].order : undefined;
    orderKey = generateOrderKey(lastOrder);
  } else {
    // Insert between two blocks
    const beforeOrder = blocks[position - 1].order;
    const afterOrder = blocks[position].order;
    orderKey = generateOrderKey(beforeOrder, afterOrder);
  }

  // Create the new block
  const now = Date.now();
  const newBlock: Block = {
    id: ulid(),
    docId,
    type,
    content,
    order: orderKey,
    meta,
    createdAt: now,
    updatedAt: now,
  };

  await db.blocks.add(newBlock);
  return newBlock;
}

/**
 * Delete a block (no reordering needed with lexicographic keys!)
 * @param blockId - The block ID to delete
 * @returns True if deleted, false if not found
 */
export async function deleteBlock(blockId: string): Promise<boolean> {
  const block = await db.blocks.get(blockId);
  if (!block) return false;

  // Simply delete - no need to update other blocks!
  await db.blocks.delete(blockId);
  return true;
}

/**
 * Move a block from one position to another within the same document
 * Uses lexicographic ordering - only updates the moved block!
 * @param blockId - The block ID to move
 * @param newPosition - The new position (0-based)
 * @returns The updated block or undefined if not found
 */
export async function moveBlock(blockId: string, newPosition: number): Promise<Block | undefined> {
  const block = await db.blocks.get(blockId);
  if (!block) return undefined;

  // Get all blocks in the document sorted by order
  const blocks = await db.blocks
    .where('docId')
    .equals(block.docId)
    .sortBy('order');

  // Find current position
  const currentPosition = blocks.findIndex(b => b.id === blockId);
  if (currentPosition === newPosition) return block;

  // Calculate new order key
  let newOrderKey: string;

  if (newPosition <= 0) {
    // Move to the beginning
    const firstBlock = blocks[0];
    newOrderKey = generateOrderKey(undefined, firstBlock.id === blockId ? blocks[1]?.order : firstBlock.order);
  } else if (newPosition >= blocks.length - 1) {
    // Move to the end
    const lastBlock = blocks[blocks.length - 1];
    newOrderKey = generateOrderKey(lastBlock.id === blockId ? blocks[blocks.length - 2]?.order : lastBlock.order);
  } else {
    // Move between two blocks
    // Need to account for the fact that we're removing the current block from the list
    let beforeIdx = newPosition - 1;
    let afterIdx = newPosition;

    // Adjust indices if we're moving down (current block shifts the indices)
    if (newPosition > currentPosition) {
      afterIdx = newPosition;
      beforeIdx = newPosition;
    } else {
      beforeIdx = newPosition - 1;
      afterIdx = newPosition;
    }

    const beforeOrder = blocks[beforeIdx]?.id === blockId ? blocks[beforeIdx - 1]?.order : blocks[beforeIdx]?.order;
    const afterOrder = blocks[afterIdx]?.id === blockId ? blocks[afterIdx + 1]?.order : blocks[afterIdx]?.order;

    newOrderKey = generateOrderKey(beforeOrder, afterOrder);
  }

  // Update only this block's order
  await db.blocks.update(blockId, {
    order: newOrderKey,
    updatedAt: Date.now()
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
 * Note: The order parameter is now ignored. Use appendBlock or insertBlockAt instead.
 */
export async function createBlock(
  docId: string,
  type: BlockType,
  content: string,
  order: number | string,
  meta?: Block['meta']
): Promise<Block> {
  console.warn('createBlock is deprecated. Use appendBlock or insertBlockAt instead.');

  // Just append to the end, ignoring the order parameter
  return appendBlock(docId, type, content, meta);
}

/**
 * Get all documents (sorted by most recently updated)
 * @returns Array of documents
 */
export async function getAllDocs(): Promise<Document[]> {
  return await db.documents.orderBy('updatedAt').reverse().toArray();
}
