import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { ListItemNode, ListNode } from '@lexical/list';
import type { InitialConfigType } from '@lexical/react/LexicalComposer';
import { editorTheme } from './theme';

const editorConfig: InitialConfigType = {
  namespace: 'LumenoteEditor',
  theme: editorTheme,
  onError: (error: Error) => {
    console.error('Lexical Error:', error);
  },
  nodes: [
    HeadingNode,
    ListNode,
    ListItemNode,
    QuoteNode,
  ],
};

export default editorConfig;
