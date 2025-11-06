import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useCallback, useEffect, useState } from 'react';
import {
  $getSelection,
  $isRangeSelection,
  FORMAT_TEXT_COMMAND,
  SELECTION_CHANGE_COMMAND,
  type LexicalEditor,
} from 'lexical';
import { $getNearestNodeOfType } from '@lexical/utils';
import { INSERT_CHECK_LIST_COMMAND, INSERT_UNORDERED_LIST_COMMAND } from '@lexical/list';
import { $createHeadingNode, $isHeadingNode, HeadingTagType } from '@lexical/rich-text';
import { $setBlocksType } from '@lexical/selection';
import {
  Type,
  Heading1,
  Heading2,
  Heading3,
  Bold,
  Italic,
  Underline,
  CheckSquare
} from 'lucide-react';

export default function ToolbarPlugin() {
  const [editor] = useLexicalComposerContext();
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [blockType, setBlockType] = useState('paragraph');

  const updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      setIsBold(selection.hasFormat('bold'));
      setIsItalic(selection.hasFormat('italic'));
      setIsUnderline(selection.hasFormat('underline'));

      const anchorNode = selection.anchor.getNode();
      const element =
        anchorNode.getKey() === 'root'
          ? anchorNode
          : anchorNode.getTopLevelElementOrThrow();

      if ($isHeadingNode(element)) {
        const tag = element.getTag();
        setBlockType(tag);
      } else {
        setBlockType(element.getType());
      }
    }
  }, []);

  useEffect(() => {
    return editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      () => {
        updateToolbar();
        return false;
      },
      1
    );
  }, [editor, updateToolbar]);

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        updateToolbar();
      });
    });
  }, [editor, updateToolbar]);

  const formatHeading = (headingSize: HeadingTagType) => {
    if (blockType !== headingSize) {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          $setBlocksType(selection, () => $createHeadingNode(headingSize));
        }
      });
    }
  };

  const formatCheckList = () => {
    editor.dispatchCommand(INSERT_CHECK_LIST_COMMAND, undefined);
  };

  return (
    <div className="toolbar flex items-center gap-2 p-2 border-b border-gray-200 bg-white sticky top-0 z-10">
      <button
        onClick={() => formatHeading('h1')}
        className={`p-2 rounded hover:bg-gray-100 ${
          blockType === 'h1' ? 'bg-gray-200' : ''
        }`}
        title="Heading 1"
      >
        <Heading1 size={18} />
      </button>
      <button
        onClick={() => formatHeading('h2')}
        className={`p-2 rounded hover:bg-gray-100 ${
          blockType === 'h2' ? 'bg-gray-200' : ''
        }`}
        title="Heading 2"
      >
        <Heading2 size={18} />
      </button>
      <button
        onClick={() => formatHeading('h3')}
        className={`p-2 rounded hover:bg-gray-100 ${
          blockType === 'h3' ? 'bg-gray-200' : ''
        }`}
        title="Heading 3"
      >
        <Heading3 size={18} />
      </button>

      <div className="w-px h-6 bg-gray-300" />

      <button
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold')}
        className={`p-2 rounded hover:bg-gray-100 ${
          isBold ? 'bg-gray-200' : ''
        }`}
        title="Bold"
      >
        <Bold size={18} />
      </button>
      <button
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic')}
        className={`p-2 rounded hover:bg-gray-100 ${
          isItalic ? 'bg-gray-200' : ''
        }`}
        title="Italic"
      >
        <Italic size={18} />
      </button>
      <button
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline')}
        className={`p-2 rounded hover:bg-gray-100 ${
          isUnderline ? 'bg-gray-200' : ''
        }`}
        title="Underline"
      >
        <Underline size={18} />
      </button>

      <div className="w-px h-6 bg-gray-300" />

      <button
        onClick={formatCheckList}
        className="p-2 rounded hover:bg-gray-100"
        title="Todo List"
      >
        <CheckSquare size={18} />
      </button>
    </div>
  );
}
