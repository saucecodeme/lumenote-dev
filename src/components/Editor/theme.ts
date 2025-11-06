import type { EditorThemeClasses } from 'lexical';

export const editorTheme: EditorThemeClasses = {
  paragraph: 'editor-paragraph mb-1',
  heading: {
    h1: 'editor-heading-h1 text-4xl font-bold mt-8 mb-2',
    h2: 'editor-heading-h2 text-3xl font-bold mt-6 mb-2',
    h3: 'editor-heading-h3 text-2xl font-bold mt-4 mb-2',
  },
  list: {
    checklist: 'editor-checklist list-none p-0',
    listitem: 'editor-listitem mb-1',
    listitemChecked: 'editor-listitem-checked line-through opacity-60',
    listitemUnchecked: 'editor-listitem-unchecked',
    nested: {
      listitem: 'editor-nested-listitem',
    },
  },
  text: {
    bold: 'font-bold',
    italic: 'italic',
    underline: 'underline',
    strikethrough: 'line-through',
    code: 'bg-gray-100 px-1 py-0.5 rounded font-mono text-sm',
  },
};
