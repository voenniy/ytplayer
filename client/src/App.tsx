import { Layout } from "@/components/Layout";
import { SearchBar } from "@/components/SearchBar";
import { TrackList } from "@/components/TrackList";
import { searchTracks } from "@/lib/api";
import { usePlayerStore } from "@/stores/player";

function App() {
  const setSearchResults = usePlayerStore((s) => s.setSearchResults);
  const searchResults = usePlayerStore((s) => s.searchResults);
  const play = usePlayerStore((s) => s.play);
  const addToQueue = usePlayerStore((s) => s.addToQueue);

  const handleSearch = async (query: string) => {
    const tracks = await searchTracks(query);
    setSearchResults(tracks);
  };

  return (
    <Layout>
      <div className="p-4 flex justify-center">
        <SearchBar onSearch={handleSearch} />
      </div>
      <div className="flex-1 overflow-auto p-4">
        <TrackList tracks={searchResults} onPlay={play} onAddToQueue={addToQueue} />
      </div>
    </Layout>
  );
}

export default App;
