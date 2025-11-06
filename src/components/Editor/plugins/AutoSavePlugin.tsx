import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect, useRef, useState } from 'react';
import { $getRoot } from 'lexical';
import { saveEditorState } from '@/lib/db/db';

interface AutoSavePluginProps {
  docId: string | null;
}

export default function AutoSavePlugin({ docId }: AutoSavePluginProps) {
  const [editor] = useLexicalComposerContext();
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!docId) return;

    const removeUpdateListener = editor.registerUpdateListener(({ editorState }) => {
      // Clear existing timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // Debounce save by 1 second
      saveTimeoutRef.current = setTimeout(async () => {
        setIsSaving(true);

        try {
          // Get the editor state as JSON string
          const stateJSON = JSON.stringify(editorState.toJSON());

          // Check if there's actual content (not just empty root)
          const hasContent = editorState.read(() => {
            const root = $getRoot();
            return root.getTextContent().trim().length > 0;
          });

          // Only save if there's content or if we want to save empty state
          await saveEditorState(docId, stateJSON);
          setLastSaved(new Date());
        } catch (error) {
          console.error('Failed to save editor state:', error);
        } finally {
          setIsSaving(false);
        }
      }, 1000); // 1 second debounce
    });

    return () => {
      removeUpdateListener();
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [editor, docId]);

  if (!docId) return null;

  return (
    <div className="absolute top-2 right-2 text-xs text-gray-500 bg-white px-2 py-1 rounded shadow-sm">
      {isSaving ? (
        <span className="flex items-center gap-1">
          <span className="animate-pulse">●</span> Saving...
        </span>
      ) : lastSaved ? (
        <span className="flex items-center gap-1">
          <span className="text-green-500">✓</span> Saved {formatTime(lastSaved)}
        </span>
      ) : (
        <span>No changes</span>
      )}
    </div>
  );
}

function formatTime(date: Date): string {
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000); // seconds

  if (diff < 5) return 'just now';
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return date.toLocaleTimeString();
}
