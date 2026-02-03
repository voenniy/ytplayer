export interface Track {
  id: string;
  title: string;
  artist: string;
  thumbnail: string;
  duration: number; // seconds
  viewCount: number;
  likeCount: number;
}

export interface SearchResult {
  tracks: Track[];
  nextPageToken?: string;
}
