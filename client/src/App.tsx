import { useState, useCallback, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { SearchBar } from "@/components/SearchBar";
import { TrackList } from "@/components/TrackList";
import { Player } from "@/components/Player";
import { Sidebar } from "@/components/Sidebar";
import { Queue } from "@/components/Queue";
import { MobileNav, type MobileTab } from "@/components/MobileNav";
import { MiniPlayer } from "@/components/MiniPlayer";
import { FullscreenPlayer } from "@/components/FullscreenPlayer";
import { searchTracks } from "@/lib/api";
import { usePlayerStore } from "@/stores/player";
import { usePlaylistsStore } from "@/stores/playlists";
import { useAudio } from "@/hooks/useAudio";
import { useMediaSession } from "@/hooks/useMediaSession";

function App() {
  const [mobileTab, setMobileTab] = useState<MobileTab>("search");
  const [fullscreenOpen, setFullscreenOpen] = useState(false);

  const setSearchResults = usePlayerStore((s) => s.setSearchResults);
  const searchResults = usePlayerStore((s) => s.searchResults);
  const play = usePlayerStore((s) => s.play);
  const addToQueue = usePlayerStore((s) => s.addToQueue);
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const storeIsPlaying = usePlayerStore((s) => s.isPlaying);
  const storePause = usePlayerStore((s) => s.pause);
  const storeResume = usePlayerStore((s) => s.resume);
  const playNext = usePlayerStore((s) => s.playNext);

  const activePlaylistId = usePlaylistsStore((s) => s.activePlaylistId);
  const activePlaylistTracks = usePlaylistsStore((s) => s.activePlaylistTracks);

  // Single audio instance shared across desktop and mobile
  const audio = useAudio(playNext);

  // Play track when currentTrack changes
  useEffect(() => {
    if (currentTrack) {
      audio.play(currentTrack.id);
    }
  }, [currentTrack?.id]);

  const handlePlayPause = useCallback(() => {
    if (storeIsPlaying) {
      audio.pause();
      storePause();
    } else {
      audio.resume();
      storeResume();
    }
  }, [storeIsPlaying, audio, storePause, storeResume]);

  const handlePlay = useCallback(() => {
    audio.resume();
    storeResume();
  }, [audio, storeResume]);

  const handlePauseAction = useCallback(() => {
    audio.pause();
    storePause();
  }, [audio, storePause]);

  // Media Session for mobile background playback
  useMediaSession({
    title: currentTrack?.title,
    artist: currentTrack?.artist,
    artwork: currentTrack?.thumbnail,
    isPlaying: storeIsPlaying,
    onPlay: handlePlay,
    onPause: handlePauseAction,
    onNextTrack: playNext,
  });

  const handleSearch = async (query: string) => {
    try {
      const tracks = await searchTracks(query);
      setSearchResults(tracks);
    } catch (err) {
      console.error("Search failed:", err);
    }
  };

  // Mobile content based on active tab
  const renderMobileContent = () => {
    switch (mobileTab) {
      case "search":
        return activePlaylistId === null ? (
          <>
            <div className="p-4 flex justify-center">
              <SearchBar onSearch={handleSearch} />
            </div>
            <div className="flex-1 overflow-auto p-4">
              <TrackList tracks={searchResults} onPlay={play} onAddToQueue={addToQueue} />
            </div>
          </>
        ) : (
          <div className="flex-1 overflow-auto p-4">
            <TrackList tracks={activePlaylistTracks} onPlay={play} onAddToQueue={addToQueue} />
          </div>
        );
      case "playlists":
        return (
          <div className="flex-1 overflow-auto">
            <Sidebar />
          </div>
        );
      case "queue":
        return (
          <div className="flex-1 overflow-auto">
            <Queue />
          </div>
        );
    }
  };

  return (
    <>
      <Layout
        desktopPlayer={
          <Player
            currentTime={audio.currentTime}
            duration={audio.duration}
            volume={audio.volume}
            onPlayPause={handlePlayPause}
            onNext={playNext}
            onSeek={audio.seek}
            onVolumeChange={audio.setVolume}
          />
        }
        mobileBottom={
          <div className="md:hidden">
            <MiniPlayer
              currentTime={audio.currentTime}
              duration={audio.duration}
              onPlayPause={handlePlayPause}
              onNext={playNext}
              onTap={() => setFullscreenOpen(true)}
            />
            <MobileNav activeTab={mobileTab} onTabChange={setMobileTab} />
          </div>
        }
      >
        {/* Desktop: same as before */}
        <div className="hidden md:flex md:flex-col md:flex-1 min-h-0">
          {activePlaylistId === null ? (
            <>
              <div className="p-4 flex justify-center">
                <SearchBar onSearch={handleSearch} />
              </div>
              <div className="flex-1 overflow-auto p-4">
                <TrackList tracks={searchResults} onPlay={play} onAddToQueue={addToQueue} />
              </div>
            </>
          ) : (
            <div className="flex-1 overflow-auto p-4">
              <TrackList tracks={activePlaylistTracks} onPlay={play} onAddToQueue={addToQueue} />
            </div>
          )}
        </div>

        {/* Mobile: tab-based content */}
        <div className="flex flex-col flex-1 min-h-0 md:hidden">
          {renderMobileContent()}
        </div>
      </Layout>

      {/* Fullscreen player (mobile only) */}
      <FullscreenPlayer
        open={fullscreenOpen}
        onClose={() => setFullscreenOpen(false)}
        currentTime={audio.currentTime}
        duration={audio.duration}
        onPlayPause={handlePlayPause}
        onNext={playNext}
        onPrev={() => {}} // No previous track functionality yet
        onSeek={audio.seek}
      />
    </>
  );
}

export default App;
