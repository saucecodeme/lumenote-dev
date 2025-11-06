import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary'
import ToolbarPlugin from '@/components/editor/plugins/ToolbarPlugin'

const placeholder = 'Your ideas begin here...'

export const lexicalTheme = {
  text: {
    bold: 'font-semibold',
  },
}

function onError(error: Error) {
  console.error(error)
}

const initialConfig = {
  namespace: 'LumeEditor',
  theme: lexicalTheme,
  onError,
}

export function Editor() {
  return (
    <div className="editor-container">
      <LexicalComposer initialConfig={initialConfig}>
        <ToolbarPlugin />
        <div className="editor-inner">
          <RichTextPlugin
            contentEditable={
              <ContentEditable
                aria-placeholder={placeholder}
                placeholder={
                  <div className="editor-placeholder">{placeholder}</div>
                }
              />
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
        </div>
      </LexicalComposer>
    </div>
  )
}
