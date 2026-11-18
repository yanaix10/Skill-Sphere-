import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { BookOpen, Film, Loader2 } from 'lucide-react';
import { NormalizedMediaItem } from '../../services/feedService';

export interface MentionListProps {
  items: NormalizedMediaItem[];
  command: (item: NormalizedMediaItem) => void;
  loading?: boolean;
  type?: 'book' | 'movie';
}

export interface MentionListRef {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
}

export const MentionList = forwardRef<MentionListRef, MentionListProps>(({
  items,
  command,
  loading = false,
  type = 'book',
}, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    setSelectedIndex(0);
  }, [items]);

  const selectItem = (index: number) => {
    const item = items[index];
    if (item) {
      command(item);
    }
  };

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: { event: KeyboardEvent }) => {
      if (event.key === 'ArrowUp') {
        setSelectedIndex((prev) => (prev + items.length - 1) % Math.max(1, items.length));
        return true;
      }

      if (event.key === 'ArrowDown') {
        setSelectedIndex((prev) => (prev + 1) % Math.max(1, items.length));
        return true;
      }

      if (event.key === 'Enter' || event.key === 'Tab') {
        if (items.length > 0) {
          selectItem(selectedIndex);
          return true;
        }
      }

      return false;
    },
  }));

  if (loading && items.length === 0) {
    return (
      <div className="z-50 min-w-[280px] max-w-[340px] p-4 bg-popover/95 backdrop-blur-md border border-border rounded-xl shadow-2xl flex items-center justify-center gap-2.5 text-xs text-muted-foreground animate-in fade-in zoom-in-95">
        <Loader2 className="w-4 h-4 animate-spin text-primary" />
        <span>Searching {type === 'book' ? 'books (Open Library)' : 'movies (TMDB)'}...</span>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="z-50 min-w-[280px] max-w-[340px] p-3.5 bg-popover/95 backdrop-blur-md border border-border rounded-xl shadow-2xl text-xs text-muted-foreground text-center animate-in fade-in zoom-in-95">
        No {type === 'book' ? 'books' : 'movies'} found. Keep typing title...
      </div>
    );
  }

  return (
    <div className="z-50 w-[300px] sm:w-[360px] max-h-[300px] overflow-y-auto bg-popover/95 backdrop-blur-md border border-border rounded-xl shadow-2xl p-1.5 flex flex-col gap-1 select-none text-popover-foreground animate-in fade-in zoom-in-95">
      <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between border-b border-border/50 pb-1.5 mb-0.5">
        <span className="flex items-center gap-1.5">
          {type === 'book' ? <BookOpen className="w-3 h-3 text-emerald-500" /> : <Film className="w-3 h-3 text-sky-500" />}
          <span>{type === 'book' ? 'Book Suggestions' : 'Movie Suggestions'}</span>
        </span>
        <span className="text-[9px] opacity-70">↑↓ to navigate, Enter to select</span>
      </div>

      {items.map((item, index) => {
        const isSelected = index === selectedIndex;
        return (
          <button
            key={item.external_id || index}
            type="button"
            onClick={() => selectItem(index)}
            onMouseEnter={() => setSelectedIndex(index)}
            className={`w-full flex items-center gap-3 p-2 rounded-lg text-left transition-colors cursor-pointer border-none bg-transparent ${
              isSelected ? 'bg-primary/10 text-primary border border-primary/20' : 'hover:bg-muted/50 text-foreground'
            }`}
          >
            {/* 2:3 Cover Poster Thumbnail */}
            <div className="w-10 h-14 shrink-0 rounded-md overflow-hidden bg-muted border border-border/60 relative flex items-center justify-center">
              {item.cover_url ? (
                <img
                  src={item.cover_url}
                  alt={item.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  onError={(e) => {
                    // Hide broken image
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                item.type === 'book' ? (
                  <BookOpen className="w-4 h-4 text-muted-foreground opacity-60" />
                ) : (
                  <Film className="w-4 h-4 text-muted-foreground opacity-60" />
                )
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 flex flex-col justify-center">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-xs truncate leading-snug">{item.title}</span>
                {item.year && (
                  <span className="text-[10px] text-muted-foreground shrink-0 font-mono">
                    ({item.year})
                  </span>
                )}
              </div>
              {item.subtitle && (
                <span className="text-[11px] text-muted-foreground truncate leading-tight mt-0.5">
                  {item.subtitle}
                </span>
              )}
              <div className="flex items-center gap-1 mt-1">
                <span className={`inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider ${
                  item.type === 'book'
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : 'bg-sky-500/10 text-sky-600 dark:text-sky-400'
                }`}>
                  {item.type}
                </span>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
});

MentionList.displayName = 'MentionList';
export default MentionList;

