export interface Track {
  id: string;
  title: string;
  artist: string;
  thumbnail: string;
  duration: number; // seconds
}

export interface SearchResult {
  tracks: Track[];
  nextPageToken?: string;
}
