import Dexie, { type Table } from 'dexie'

export type BlockType = 'text' | 'heading' | 'todo' | 'code'
export type Block = {
  id: string // ulid
  docId: string
  type: BlockType
  content: string
  meta?: {
    level?: 1 | 2 | 3 // for headings
    checked?: boolean // for todos
    language?: string // for code
  }
  order: number // sortable index
  createdAt: number
  updatedAt: number
}

export type Document = {
  id: string // ulid
  title: string
  createdAt: number
  updatedAt: number
}

class DexieDB extends Dexie {
  documents!: Table<Document, string>
  blocks!: Table<Block, string>

  constructor() {
    super('lumenote')
    this.version(1).stores({
      documents: 'id, updatedAt',
      blocks: 'id, docId, [docId+order], order, updatedAt',
    })
  }
}

export const db = new DexieDB()
