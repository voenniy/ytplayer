import { Layout } from "@/components/Layout";
import { SearchBar } from "@/components/SearchBar";
import { searchTracks } from "@/lib/api";
import { usePlayerStore } from "@/stores/player";

function App() {
  const setSearchResults = usePlayerStore((s) => s.setSearchResults);

  const handleSearch = async (query: string) => {
    const tracks = await searchTracks(query);
    setSearchResults(tracks);
  };

  return (
    <Layout>
      <div className="p-4 flex justify-center">
        <SearchBar onSearch={handleSearch} />
      </div>
    </Layout>
  );
}

export default App;
