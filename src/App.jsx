import React, { useState, useEffect } from "react";
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Trash2,
  Plus,
} from "lucide-react";

function App() {
  const [playlists, setPlaylists] = useState({});
  const [currentPlaylist, setCurrentPlaylist] = useState("default");
  const [contentItems, setContentItems] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [newItem, setNewItem] = useState({
    type: "image",
    url: "",
    duration: 5000,
  });

  // Carregar playlists do localStorage
  useEffect(() => {
    const saved = localStorage.getItem("playlists");
    if (saved) {
      const parsed = JSON.parse(saved);
      setPlaylists(parsed);
      if (parsed[currentPlaylist]) {
        setContentItems(parsed[currentPlaylist]);
      }
    }
  }, []);

  // Salvar playlists no localStorage
  useEffect(() => {
    localStorage.setItem("playlists", JSON.stringify(playlists));
  }, [playlists]);

  // Atualizar contentItems quando a playlist mudar
  useEffect(() => {
    if (playlists[currentPlaylist]) {
      setContentItems(playlists[currentPlaylist]);
      setCurrentIndex(0);
    }
  }, [currentPlaylist, playlists]);

  // Controle automático da playlist
  useEffect(() => {
    if (!isPlaying || contentItems.length === 0) return;

    const current = contentItems[currentIndex];
    if (!current) return;

    const timer = setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % contentItems.length);
    }, current.duration);

    return () => clearTimeout(timer);
  }, [isPlaying, currentIndex, contentItems]);

  const addContent = () => {
    if (!newItem.url) return;
    const updated = [...contentItems, newItem];
    setContentItems(updated);
    setPlaylists({ ...playlists, [currentPlaylist]: updated });
    setNewItem({ type: "image", url: "", duration: 5000 });
  };

  const deleteContent = (index) => {
    const updated = contentItems.filter((_, i) => i !== index);
    setContentItems(updated);
    setPlaylists({ ...playlists, [currentPlaylist]: updated });
    if (currentIndex >= updated.length) setCurrentIndex(0);
  };

  const getCurrentContent = () => contentItems[currentIndex] || null;

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Painel de controle */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold mb-4">Gerenciar Playlists</h2>

          {/* Seleção de playlist */}
          <select
            value={currentPlaylist}
            onChange={(e) => setCurrentPlaylist(e.target.value)}
            className="w-full p-2 border rounded-lg mb-4"
          >
            {Object.keys(playlists).map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>

          {/* Criar nova playlist */}
          <div className="flex mb-4">
            <input
              type="text"
              placeholder="Nome da nova playlist"
              className="flex-1 p-2 border rounded-l-lg"
              onKeyDown={(e) => {
                if (e.key === "Enter" && e.target.value) {
                  setPlaylists({ ...playlists, [e.target.value]: [] });
                  setCurrentPlaylist(e.target.value);
                  e.target.value = "";
                }
              }}
            />
            <button className="bg-blue-500 text-white px-4 rounded-r-lg">
              <Plus />
            </button>
          </div>

          {/* Adicionar conteúdo */}
          <h3 className="font-semibold mb-2">Adicionar Conteúdo</h3>
          <select
            value={newItem.type}
            onChange={(e) => setNewItem({ ...newItem, type: e.target.value })}
            className="w-full p-2 border rounded-lg mb-2"
          >
            <option value="image">Imagem</option>
            <option value="website">Website</option>
          </select>
          <input
            type="text"
            placeholder="URL"
            value={newItem.url}
            onChange={(e) => setNewItem({ ...newItem, url: e.target.value })}
            className="w-full p-2 border rounded-lg mb-2"
          />
          <input
            type="number"
            placeholder="Duração (ms)"
            value={newItem.duration}
            onChange={(e) =>
              setNewItem({ ...newItem, duration: Number(e.target.value) })
            }
            className="w-full p-2 border rounded-lg mb-2"
          />
          <button
            onClick={addContent}
            className="w-full bg-green-500 text-white p-2 rounded-lg"
          >
            Adicionar
          </button>

          {/* Lista de itens */}
          <h3 className="font-semibold mt-6 mb-2">Playlist: {currentPlaylist}</h3>
          <div className="space-y-2">
            {contentItems.map((item, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
              >
                <span className="truncate">{item.url}</span>
                <button
                  onClick={() => deleteContent(i)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Player */}
        <div className="md:col-span-2 bg-white rounded-xl shadow-md p-6 flex flex-col items-center">
          <h2 className="text-xl font-bold mb-4">Player</h2>

          <div className="w-full h-[500px] bg-gray-200 rounded-lg flex items-center justify-center">
            {getCurrentContent() ? (
              getCurrentContent().type === "image" ? (
                <img
                  src={getCurrentContent().url}
                  alt="content"
                  className="max-h-[500px] object-contain"
                />
              ) : (
                <iframe
                  src={getCurrentContent().url}
                  title="website"
                  className="w-full h-[500px] rounded-lg"
                />
              )
            ) : (
              <p className="text-gray-500">Nenhum conteúdo</p>
            )}
          </div>

          {/* Controles */}
          <div className="flex gap-4 mt-4">
            <button
              onClick={() =>
                setCurrentIndex(
                  (prev) => (prev - 1 + contentItems.length) % contentItems.length
                )
              }
              className="p-3 bg-gray-100 rounded-full hover:bg-gray-200"
            >
              <SkipBack />
            </button>

            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-3 bg-blue-500 text-white rounded-full hover:bg-blue-600"
            >
              {isPlaying ? <Pause /> : <Play />}
            </button>

            <button
              onClick={() =>
                setCurrentIndex((prev) => (prev + 1) % contentItems.length)
              }
              className="p-3 bg-gray-100 rounded-full hover:bg-gray-200"
            >
              <SkipForward />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
