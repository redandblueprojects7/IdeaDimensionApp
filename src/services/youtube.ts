import env from '../config/env';
import { VideoItem } from '../types/video';

/** Decode HTML entities returned by the YouTube Data API (e.g. &#39; → ') */
function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&apos;/g, "'");
}

const CHANNEL_HANDLE = 'idimensionpodcast';
const API_BASE = 'https://www.googleapis.com/youtube/v3';

async function resolveChannelId(): Promise<string> {
  const res = await fetch(
    `${API_BASE}/channels?part=id&forHandle=${CHANNEL_HANDLE}&key=${env.youtubeApiKey}`
  );
  if (!res.ok) throw new Error(`YouTube channels API error: ${res.status}`);
  const json = await res.json();
  const id: string | undefined = json?.items?.[0]?.id;
  if (!id) throw new Error('Could not resolve YouTube channel ID for @' + CHANNEL_HANDLE);
  return id;
}

export async function fetchChannelVideos(maxResults = 20): Promise<VideoItem[]> {
  if (!env.youtubeApiKey) {
    throw new Error('EXPO_PUBLIC_YOUTUBE_API_KEY is not set in your .env file.');
  }

  const channelId = await resolveChannelId();

  const res = await fetch(
    `${API_BASE}/search?part=snippet&channelId=${channelId}&maxResults=${maxResults}&order=date&type=video&key=${env.youtubeApiKey}`
  );
  if (!res.ok) throw new Error(`YouTube search API error: ${res.status}`);
  const json = await res.json();

  return (json.items ?? []).map((item: any) => ({
    id: item.id.videoId as string,
    title: decodeHtmlEntities(item.snippet.title as string),
    thumbnailUrl:
      (item.snippet.thumbnails?.high?.url ??
        item.snippet.thumbnails?.medium?.url ??
        item.snippet.thumbnails?.default?.url) as string,
    publishedAt: (item.snippet.publishedAt as string).split('T')[0],
  }));
}

export function getYouTubeEmbedUrl(videoId: string): string {
  return `https://www.youtube.com/embed/${videoId}?playsinline=1&enablejsapi=1&rel=0&modestbranding=1`;
}
