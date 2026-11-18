import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Mention from '@tiptap/extension-mention';
import {
  Bold,
  Italic,
  List,
  X,
  BookOpen,
  Film,
  Send,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { searchMedia, createPost, Post, PostMention, NormalizedMediaItem } from '../../services/feedService';
import MentionList, { MentionListRef } from './MentionList';

interface PostComposerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated: (post: Post) => void;
}

const MINIMUM_WORDS = 80;

export const PostComposerModal: React.FC<PostComposerModalProps> = ({
  isOpen,
  onClose,
  onPostCreated,
}) => {
  const [title, setTitle] = useState('');
  const [wordCount, setWordCount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [recordedMentions, setRecordedMentions] = useState<PostMention[]>([]);

  // Suggestion popup state
  const [suggestionState, setSuggestionState] = useState<{
    isOpen: boolean;
    type: 'book' | 'movie';
    query: string;
    items: NormalizedMediaItem[];
    loading: boolean;
    range: any;
    coords: { x: number; y: number } | null;
  }>({
    isOpen: false,
    type: 'book',
    query: '',
    items: [],
    loading: false,
    range: null,
    coords: null,
  });

  const mentionListRef = useRef<MentionListRef | null>(null);
  const debounceTimerRef = useRef<any>(null);

  // Custom Mention extension configuring inline mention chips
  const CustomMention = Mention.extend({
    name: 'mediaMention',
  }).configure({
    HTMLAttributes: {
      class: 'mention-chip inline-flex items-center gap-1.5 px-2 py-0.5 mx-1 rounded-md bg-primary/10 text-primary border border-primary/20 text-xs font-semibold select-none align-baseline',
    },
    renderHTML({ node }) {
      const type = node.attrs.type || 'book';
      const label = node.attrs.label || node.attrs.title || 'Mention';
      const icon = type === 'book' ? '📖' : '🎬';
      return [
        'span',
        {
          'data-type': 'media-mention',
          'data-id': node.attrs.id,
          'data-mention-type': type,
          'data-external-id': node.attrs.external_id,
          'data-title': node.attrs.title,
          'data-cover-url': node.attrs.cover_url,
          class: 'mention-chip inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-primary/15 text-primary border border-primary/25 text-xs font-semibold select-none align-baseline',
        },
        `${icon} ${label}`,
      ];
    },
  });

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: {
          HTMLAttributes: {
            class: 'list-disc list-inside space-y-1 my-2',
          },
        },
      }),
      CustomMention,
    ],
    content: '',
    editorProps: {
      attributes: {
        class: 'prose dark:prose-invert prose-sm max-w-none min-h-[180px] p-4 focus:outline-none text-foreground placeholder:text-muted-foreground',
      },
      handleKeyDown: (view, event) => {
        if (suggestionState.isOpen && mentionListRef.current) {
          return mentionListRef.current.onKeyDown({ event });
        }
        return false;
      },
    },
    onUpdate: ({ editor }) => {
      const text = editor.getText();
      const words = text.trim() ? text.trim().split(/\s+/).filter(Boolean).length : 0;
      setWordCount(words);

      // Check text around cursor for @book/ or @movie/ or @ triggers
      checkTriggers(editor);
    },
  });

  // Check in-progress text for @book/ and @movie/
  const checkTriggers = useCallback((ed: any) => {
    const { state } = ed;
    const { selection } = state;
    const { $from } = selection;

    // Grab text from current paragraph up to cursor
    const textBefore = $from.parent.textBetween(0, $from.parentOffset, undefined, '\ufffc');

    // Match @book/<query> or @movie/<query>
    const bookMatch = textBefore.match(/(?:^|\s)@book\/([^\s/]*)$/);
    const movieMatch = textBefore.match(/(?:^|\s)@movie\/([^\s/]*)$/);

    if (bookMatch) {
      const query = bookMatch[1];
      const matchStart = $from.pos - (bookMatch[0].trim().length);
      const range = { from: matchStart, to: $from.pos };
      openSuggestions('book', query, range, ed);
      return;
    }

    if (movieMatch) {
      const query = movieMatch[1];
      const matchStart = $from.pos - (movieMatch[0].trim().length);
      const range = { from: matchStart, to: $from.pos };
      openSuggestions('movie', query, range, ed);
      return;
    }

    // Bare @ trigger fallback
    const bareMatch = textBefore.match(/(?:^|\s)@([a-zA-Z0-9_\s]*)$/);
    if (bareMatch && !textBefore.endsWith('@book/') && !textBefore.endsWith('@movie/')) {
      const query = bareMatch[1];
      const matchStart = $from.pos - (bareMatch[0].trim().length);
      const range = { from: matchStart, to: $from.pos };
      openSuggestions('book', query, range, ed);
      return;
    }

    // No trigger active
    if (suggestionState.isOpen) {
      setSuggestionState((prev) => ({ ...prev, isOpen: false }));
    }
  }, [suggestionState.isOpen]);

  // Open suggestions popup and debounce media search
  const openSuggestions = (type: 'book' | 'movie', query: string, range: any, ed: any) => {
    // Get cursor coordinates for floating placement
    try {
      const coords = ed.view.coordsAtPos(range.to);
      setSuggestionState((prev) => ({
        ...prev,
        isOpen: true,
        type,
        query,
        range,
        coords: { x: coords.left, y: coords.bottom + 6 },
        loading: true,
      }));
    } catch {
      setSuggestionState((prev) => ({
        ...prev,
        isOpen: true,
        type,
        query,
        range,
        loading: true,
      }));
    }

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(async () => {
      try {
        const results = await searchMedia(type, query || (type === 'book' ? 'alchemist' : 'odyssey'));
        setSuggestionState((prev) => ({
          ...prev,
          items: results,
          loading: false,
        }));
      } catch (e) {
        setSuggestionState((prev) => ({
          ...prev,
          items: [],
          loading: false,
        }));
      }
    }, 300);
  };

  // Insert mention into editor and record in post metadata
  const insertMention = (item: NormalizedMediaItem) => {
    if (!editor || !suggestionState.range) return;

    const { from, to } = suggestionState.range;

    // Insert mention node replacing trigger text
    editor
      .chain()
      .focus()
      .deleteRange({ from, to })
      .insertContent({
        type: 'mediaMention',
        attrs: {
          id: item.external_id,
          label: item.title,
          type: item.type,
          external_id: item.external_id,
          title: item.title,
          subtitle: item.subtitle,
          cover_url: item.cover_url,
          year: item.year,
        },
      })
      .insertContent(' ')
      .run();

    // Record mention in state
    setRecordedMentions((prev) => {
      if (prev.some((m) => m.external_id === item.external_id)) return prev;
      return [
        ...prev,
        {
          type: item.type,
          external_id: item.external_id,
          title: item.title,
          subtitle: item.subtitle,
          cover_url: item.cover_url,
          year: item.year,
        },
      ];
    });

    setSuggestionState((prev) => ({ ...prev, isOpen: false }));
  };

  // Quick toolbar button to insert trigger
  const triggerMentionShortcut = (type: 'book' | 'movie') => {
    if (!editor) return;
    editor.chain().focus().insertContent(`@${type}/`).run();
  };

  // Submit post
  const handleSubmit = async () => {
    if (!editor) return;

    const plainText = editor.getText();
    const html = editor.getHTML();
    const words = plainText.trim() ? plainText.trim().split(/\s+/).filter(Boolean).length : 0;

    if (words < MINIMUM_WORDS) {
      setErrorMessage(`Your review is ${words} words. A minimum of ${MINIMUM_WORDS} words is required.`);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const newPost = await createPost({
        title: title.trim(),
        content_html: html,
        content_plain: plainText,
        mentions: recordedMentions,
      });

      onPostCreated(newPost);
      editor.commands.setContent('');
      setTitle('');
      setRecordedMentions([]);
      setWordCount(0);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const isWordCountMet = wordCount >= MINIMUM_WORDS;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh] text-card-foreground">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/20">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">Write a Book or Movie Review</h2>
              <p className="text-xs text-muted-foreground">
                Minimum 80 words. Type <code className="px-1 py-0.5 bg-muted rounded font-mono text-[11px] text-primary">@book/</code> or <code className="px-1 py-0.5 bg-muted rounded font-mono text-[11px] text-primary">@movie/</code> to embed real media art.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer border-none bg-transparent"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Minimal Toolbar */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-border/70 bg-muted/30">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => editor?.chain().focus().toggleBold().run()}
              className={`p-2 rounded-lg text-xs font-bold transition-colors cursor-pointer border-none ${
                editor?.isActive('bold') ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
              title="Bold (Ctrl+B)"
            >
              <Bold className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => editor?.chain().focus().toggleItalic().run()}
              className={`p-2 rounded-lg text-xs transition-colors cursor-pointer border-none ${
                editor?.isActive('italic') ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
              title="Italic (Ctrl+I)"
            >
              <Italic className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => editor?.chain().focus().toggleBulletList().run()}
              className={`p-2 rounded-lg text-xs transition-colors cursor-pointer border-none ${
                editor?.isActive('bulletList') ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
              title="Bullet List"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quick Mention Trigger Shortcuts */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => triggerMentionShortcut('book')}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold transition-colors border border-emerald-500/20 cursor-pointer"
            >
              <BookOpen className="w-3 h-3" />
              <span>@book/</span>
            </button>
            <button
              type="button"
              onClick={() => triggerMentionShortcut('movie')}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-600 dark:text-sky-400 text-xs font-semibold transition-colors border border-sky-500/20 cursor-pointer"
            >
              <Film className="w-3 h-3" />
              <span>@movie/</span>
            </button>
          </div>
        </div>

        {/* Title Input */}
        <div className="px-5 pt-3.5 pb-2 border-b border-border/50 bg-card">
          <input
            type="text"
            placeholder="Review Title (e.g., A Masterpiece on Personal Destiny & Life Pursuits)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-transparent text-sm sm:text-base font-bold text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
          />
        </div>

        {/* Editor Body */}
        <div className="flex-1 overflow-y-auto relative min-h-[220px]">
          <EditorContent editor={editor} />

          {/* Floating Mention Suggestions Dropdown */}
          {suggestionState.isOpen && (
            <div
              className="fixed z-50"
              style={{
                left: suggestionState.coords ? `${Math.min(window.innerWidth - 380, Math.max(16, suggestionState.coords.x))}px` : '40%',
                top: suggestionState.coords ? `${suggestionState.coords.y}px` : '40%',
              }}
            >
              <MentionList
                ref={mentionListRef}
                items={suggestionState.items}
                command={insertMention}
                loading={suggestionState.loading}
                type={suggestionState.type}
              />
            </div>
          )}
        </div>

        {/* Recorded Mentions Pill List */}
        {recordedMentions.length > 0 && (
          <div className="px-5 py-2.5 border-t border-border/50 bg-muted/20 flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Attached Media:
            </span>
            {recordedMentions.map((m) => (
              <span
                key={m.external_id}
                className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-secondary text-secondary-foreground text-xs font-medium border border-border"
              >
                {m.type === 'book' ? <BookOpen className="w-3 h-3 text-emerald-500" /> : <Film className="w-3 h-3 text-sky-500" />}
                <span className="truncate max-w-[150px]">{m.title}</span>
                <button
                  type="button"
                  onClick={() => setRecordedMentions((prev) => prev.filter((item) => item.external_id !== m.external_id))}
                  className="hover:text-destructive text-muted-foreground ml-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Error message */}
        {errorMessage && (
          <div className="px-5 py-2.5 bg-destructive/10 border-t border-destructive/20 text-destructive text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Modal Footer: Live Word Counter & Post Button */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-border bg-muted/10">
          <div className="flex items-center gap-2">
            <div
              className={`text-xs font-mono font-semibold flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${
                isWordCountMet
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
              }`}
            >
              {isWordCountMet ? (
                <CheckCircle2 className="w-3.5 h-3.5" />
              ) : (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              )}
              <span>
                {wordCount} / {MINIMUM_WORDS} words minimum
              </span>
            </div>
            {!isWordCountMet && (
              <span className="text-[11px] text-muted-foreground hidden sm:inline">
                ({MINIMUM_WORDS - wordCount} more needed to post)
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer border-none bg-transparent"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!isWordCountMet || isSubmitting}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${
                isWordCountMet && !isSubmitting
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer shadow-md'
                  : 'bg-muted text-muted-foreground cursor-not-allowed opacity-60'
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Publishing...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Post Review</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostComposerModal;

