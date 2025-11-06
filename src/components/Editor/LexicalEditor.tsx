import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { CheckListPlugin as LexicalCheckListPlugin } from '@lexical/react/LexicalCheckListPlugin';
import LexicalErrorBoundary from '@lexical/react/LexicalErrorBoundary';
import editorConfig from './config';
import ToolbarPlugin from './plugins/ToolbarPlugin';
import CheckListPlugin from './plugins/CheckListPlugin';
import AutoSavePlugin from './plugins/AutoSavePlugin';
import './styles.css';

interface LexicalEditorProps {
  docId: string | null;
  initialEditorState?: string;
}

export default function LexicalEditor({ docId, initialEditorState }: LexicalEditorProps) {
  // Create config with initial state if provided
  const config = {
    ...editorConfig,
    editorState: initialEditorState || editorConfig.editorState,
  };

  return (
    <div className="editor-container bg-white rounded-lg shadow-sm border border-gray-200 max-w-4xl mx-auto">
      <LexicalComposer initialConfig={config}>
        <ToolbarPlugin />
        <div className="editor-inner relative">
          <RichTextPlugin
            contentEditable={
              <ContentEditable
                className="editor-input min-h-[400px] p-8 outline-none"
                aria-placeholder="Start typing..."
                placeholder={
                  <div className="editor-placeholder absolute top-8 left-8 text-gray-400 pointer-events-none">
                    Start typing...
                  </div>
                }
              />
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
          <HistoryPlugin />
          <ListPlugin />
          <LexicalCheckListPlugin />
          <CheckListPlugin />
          <AutoSavePlugin docId={docId} />
        </div>
      </LexicalComposer>
    </div>
  );
}
