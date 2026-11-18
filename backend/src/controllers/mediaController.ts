import { Request, Response } from 'express';
import axios from 'axios';
import MediaCache, { IMediaCache } from '../models/MediaCache.js';

export interface NormalizedMediaItem {
  external_id: string;
  type: 'book' | 'movie';
  title: string;
  subtitle: string;
  cover_url: string;
  year: string;
}

// 150 days in milliseconds (150 * 24 * 60 * 60 * 1000)
const CACHE_TTL_MS = 150 * 24 * 60 * 60 * 1000;

// Curated classic/popular movies fallback when TMDB_API_KEY is not configured
const POPULAR_MOVIES_FALLBACK: NormalizedMediaItem[] = [
  {
    external_id: "tmdb-550",
    type: "movie",
    title: "Fight Club",
    subtitle: "A ticking-time-bomb insomniac and a slippery soap salesman",
    year: "1999",
    cover_url: "https://image.tmdb.org/t/p/w500/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg"
  },
  {
    external_id: "tmdb-603",
    type: "movie",
    title: "The Matrix",
    subtitle: "Welcome to the Real World",
    year: "1999",
    cover_url: "https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg"
  },
  {
    external_id: "tmdb-27205",
    type: "movie",
    title: "Inception",
    subtitle: "Your mind is the scene of the crime",
    year: "2010",
    cover_url: "https://image.tmdb.org/t/p/w500/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg"
  },
  {
    external_id: "tmdb-157336",
    type: "movie",
    title: "Interstellar",
    subtitle: "Mankind was born on Earth. It was never meant to die here",
    year: "2014",
    cover_url: "https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg"
  },
  {
    external_id: "tmdb-37799",
    type: "movie",
    title: "The Social Network",
    subtitle: "You don't get to 500 million friends without making a few enemies",
    year: "2010",
    cover_url: "https://image.tmdb.org/t/p/w500/n0ybibhJtQ5icDqTpTAvRbhF0Y4.jpg"
  },
  {
    external_id: "tmdb-205596",
    type: "movie",
    title: "The Imitation Game",
    subtitle: "The true enigma was the man who cracked the code",
    year: "2014",
    cover_url: "https://image.tmdb.org/t/p/w500/zSqJ1qFqGgiRaCuwiL20aUi0BM5.jpg"
  },
  {
    external_id: "tmdb-872585",
    type: "movie",
    title: "Oppenheimer",
    subtitle: "The world forever changes",
    year: "2023",
    cover_url: "https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg"
  },
  {
    external_id: "tmdb-264660",
    type: "movie",
    title: "Ex Machina",
    subtitle: "There is nothing more human than the will to survive",
    year: "2015",
    cover_url: "https://image.tmdb.org/t/p/w500/dmkW8v1uFkLpX9RndfK5yV5Vj2.jpg"
  },
  {
    external_id: "tmdb-693134",
    type: "movie",
    title: "Dune: Part Two",
    subtitle: "Long live the fighters",
    year: "2024",
    cover_url: "https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg"
  },
  {
    external_id: "tmdb-438631",
    type: "movie",
    title: "Dune",
    subtitle: "It begins",
    year: "2021",
    cover_url: "https://image.tmdb.org/t/p/w500/d5NXSklXo0qyIYkgV94XAgMIckC.jpg"
  },
  {
    external_id: "tmdb-24428",
    type: "movie",
    title: "The Avengers",
    subtitle: "Earth's Mightiest Heroes",
    year: "2012",
    cover_url: "https://image.tmdb.org/t/p/w500/RYMX2wcKCBAr24UyPD7xwmjaTn.jpg"
  },
  {
    external_id: "tmdb-109091",
    type: "movie",
    title: "The Odyssey",
    subtitle: "The mythical voyage of Odysseus",
    year: "1997",
    cover_url: "https://image.tmdb.org/t/p/w500/e9bM0eH5h6G5vN2XhL7zM6W3Q1.jpg"
  }
];

/**
 * Searches Open Library for books, with Google Books fallback
 */
async function searchBooks(query: string): Promise<NormalizedMediaItem[]> {
  const items: NormalizedMediaItem[] = [];

  // 1. Open Library primary search
  try {
    const olRes = await axios.get('https://openlibrary.org/search.json', {
      params: { q: query, limit: 10 },
      timeout: 5000,
    });

    const docs = olRes.data?.docs || [];
    for (const doc of docs) {
      const coverUrl = doc.cover_i
        ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`
        : '';
      const authors = Array.isArray(doc.author_name)
        ? doc.author_name.slice(0, 2).join(', ')
        : (doc.author_name || '');
      const year = doc.first_publish_year ? String(doc.first_publish_year) : '';

      items.push({
        external_id: doc.key || `openlib-${doc.cover_i || Math.random()}`,
        type: 'book',
        title: doc.title || 'Untitled Book',
        subtitle: authors ? `by ${authors}` : '',
        cover_url: coverUrl,
        year: year,
      });
    }
  } catch (err: any) {
    console.warn('[MediaController] Open Library search failed:', err.message);
  }

  // 2. Google Books fallback if Open Library returned nothing or had no covers
  const hasCover = items.some(i => Boolean(i.cover_url));
  if (items.length === 0 || !hasCover) {
    try {
      const apiKey = process.env.GOOGLE_BOOKS_API_KEY;
      const gbRes = await axios.get('https://www.googleapis.com/books/v1/volumes', {
        params: {
          q: query,
          maxResults: 8,
          ...(apiKey ? { key: apiKey } : {})
        },
        timeout: 4000,
      });

      const gbItems = gbRes.data?.items || [];
      for (const item of gbItems) {
        const info = item.volumeInfo || {};
        const thumbnail = info.imageLinks?.thumbnail || info.imageLinks?.smallThumbnail || '';
        const secureThumb = thumbnail ? thumbnail.replace(/^http:/, 'https:') : '';
        const authors = info.authors ? info.authors.slice(0, 2).join(', ') : '';
        const year = info.publishedDate ? info.publishedDate.slice(0, 4) : '';

        // Prepend Google Books results if they have cover images
        if (secureThumb) {
          items.unshift({
            external_id: `gbooks-${item.id}`,
            type: 'book',
            title: info.title || 'Untitled Book',
            subtitle: authors ? `by ${authors}` : '',
            cover_url: secureThumb,
            year: year,
          });
        }
      }
    } catch (err: any) {
      console.warn('[MediaController] Google Books fallback failed/rate-limited:', err.message);
    }
  }

  // Deduplicate by external_id or title
  const seen = new Set<string>();
  return items.filter(i => {
    const key = i.external_id || i.title.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 10);
}

/**
 * Searches TMDB for movies, with graceful offline/free fallback
 */
async function searchMovies(query: string): Promise<NormalizedMediaItem[]> {
  const tmdbKey = process.env.TMDB_API_KEY;

  if (tmdbKey) {
    try {
      const tmdbRes = await axios.get('https://api.themoviedb.org/3/search/movie', {
        params: {
          query: query,
          include_adult: false,
          api_key: tmdbKey,
        },
        timeout: 5000,
      });

      const results = tmdbRes.data?.results || [];
      return results.slice(0, 10).map((m: any) => ({
        external_id: `tmdb-${m.id}`,
        type: 'movie' as const,
        title: m.title || 'Untitled Movie',
        subtitle: m.overview ? `${m.overview.slice(0, 90)}...` : '',
        cover_url: m.poster_path ? `https://image.tmdb.org/t/p/w500${m.poster_path}` : '',
        year: m.release_date ? m.release_date.slice(0, 4) : '',
      }));
    } catch (err: any) {
      console.warn('[MediaController] TMDB API search failed:', err.message);
    }
  }

  // Fallback movie matcher if TMDB API is offline or not configured
  const qLower = query.toLowerCase().trim();
  const matched = POPULAR_MOVIES_FALLBACK.filter(m =>
    m.title.toLowerCase().includes(qLower) || qLower.includes(m.title.toLowerCase())
  );

  if (matched.length > 0) {
    return matched;
  }

  // Generic movie fallback card
  return [
    {
      external_id: `movie-${Date.now()}`,
      type: 'movie',
      title: query.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
      subtitle: 'Movie Review',
      cover_url: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=500&q=80',
      year: new Date().getFullYear().toString(),
    }
  ];
}

/**
 * GET /api/media/search?type=book|movie&q={query}
 */
export async function searchMedia(req: Request, res: Response): Promise<any> {
  try {
    const rawType = (req.query.type as string || '').toLowerCase().trim();
    const query = (req.query.q as string || '').trim();

    if (!query) {
      return res.status(400).json({ error: 'Missing search query (q)' });
    }

    if (rawType !== 'book' && rawType !== 'movie') {
      return res.status(400).json({ error: 'Invalid media type. Must be "book" or "movie".' });
    }

    const type = rawType as 'book' | 'movie';
    const cutoffDate = new Date(Date.now() - CACHE_TTL_MS);

    // 1. Check local media_cache first (case-insensitive title match, younger than 150 days)
    const cachedMatches = await MediaCache.find({
      type,
      title: new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'),
      fetched_at: { $gt: cutoffDate } as any,
    }).limit(8);

    if (cachedMatches && cachedMatches.length >= 3) {
      return res.json(cachedMatches.map(m => ({
        external_id: m.external_id,
        type: m.type,
        title: m.title,
        subtitle: m.subtitle,
        cover_url: m.cover_url,
        year: m.year,
      })));
    }

    // 2. Fetch from external provider
    const results = type === 'book'
      ? await searchBooks(query)
      : await searchMovies(query);

    // 3. Upsert into MediaCache for subsequent requests
    for (const item of results) {
      try {
        await MediaCache.findOneAndUpdate(
          { external_id: item.external_id },
          {
            $set: {
              external_id: item.external_id,
              type: item.type,
              title: item.title,
              subtitle: item.subtitle,
              cover_url: item.cover_url,
              year: item.year,
              fetched_at: new Date(),
            }
          },
          { upsert: true, new: true }
        );
      } catch (cacheErr) {
        // Cache upsert error shouldn't fail the search response
      }
    }

    return res.json(results);
  } catch (err: any) {
    console.error('[MediaController] Unexpected search error:', err);
    return res.status(500).json({ error: 'Failed to search media provider' });
  }
}

