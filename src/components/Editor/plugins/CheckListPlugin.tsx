import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect } from 'react';
import { $isListItemNode, ListItemNode } from '@lexical/list';
import { $getNearestNodeOfType } from '@lexical/utils';
import { $getSelection, $isRangeSelection, COMMAND_PRIORITY_LOW, KEY_SPACE_COMMAND } from 'lexical';

export default function CheckListPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    const removeListener = editor.registerNodeTransform(ListItemNode, (node: ListItemNode) => {
      // Handle checklist item rendering
      if (node.getChecked() !== undefined) {
        const checked = node.getChecked();
        const dom = editor.getElementByKey(node.getKey());
        if (dom) {
          if (checked) {
            dom.classList.add('editor-listitem-checked');
            dom.classList.remove('editor-listitem-unchecked');
          } else {
            dom.classList.add('editor-listitem-unchecked');
            dom.classList.remove('editor-listitem-checked');
          }
        }
      }
    });

    return removeListener;
  }, [editor]);

  return null;
}
