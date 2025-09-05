import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Card } from '@/components/ui/card.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx'
import { Play, Pause, SkipForward, Settings, Plus, Trash2, Loader2 } from 'lucide-react'
import Parser from 'rss-parser'
import './App.css'

function App() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [items, setItems] = useState([])
  const [rssUrl, setRssUrl] = useState('')
  const [rssItems, setRssItems] = useState([])
  const [showSettings, setShowSettings] = useState(false)
  const [isLoadingRss, setIsLoadingRss] = useState(false)
  const [playlists, setPlaylists] = useState({})
  const [currentPlaylistName, setCurrentPlaylistName] = useState('default')
  const [newPlaylistName, setNewPlaylistName] = useState('')

  const [newItem, setNewItem] = useState({
    type: 'image',
    url: '',
    duration: 5000,
    title: ''
  })

  const [hideHeader, setHideHeader] = useState(false)
  const [showHeaderOnHover, setShowHeaderOnHover] = useState(false)

  useEffect(() => {
    const savedPlaylists = localStorage.getItem('playlists')
    const savedCurrentPlaylist = localStorage.getItem('currentPlaylist')
    
    try {
      if (savedPlaylists) {
        const parsedPlaylists = JSON.parse(savedPlaylists)
        setPlaylists(parsedPlaylists)
        
        const playlistName = savedCurrentPlaylist || 'default'
        setCurrentPlaylistName(playlistName)
        
        if (parsedPlaylists[playlistName] && Array.isArray(parsedPlaylists[playlistName])) {
          setItems(parsedPlaylists[playlistName])
        }
      } else {
        // Migrar playlist antiga se existir
        const oldPlaylist = localStorage.getItem('playlist')
        if (oldPlaylist) {
          const parsed = JSON.parse(oldPlaylist)
          if (Array.isArray(parsed) && parsed.length > 0) {
            const newPlaylists = { default: parsed }
            setPlaylists(newPlaylists)
            setItems(parsed)
            localStorage.setItem('playlists', JSON.stringify(newPlaylists))
            localStorage.removeItem('playlist')
          }
        }
      }
    } catch (err) {
      console.error('Erro ao carregar playlists:', err)
    }
  }, [])

  useEffect(() => {
    const updatedPlaylists = { ...playlists, [currentPlaylistName]: items }
    setPlaylists(updatedPlaylists)
    localStorage.setItem('playlists', JSON.stringify(updatedPlaylists))
    localStorage.setItem('currentPlaylist', currentPlaylistName)
  }, [items, currentPlaylistName])

  useEffect(() => {
    if (isPlaying && items.length > 0) {
      setHideHeader(true)
    } else {
      setHideHeader(false)
    }
  }, [isPlaying, items])

  const addItem = () => {
    if (newItem.url.trim()) {
      setItems([...items, { ...newItem, id: Date.now() }])
      setNewItem({
        type: 'image',
        url: '',
        duration: 5000,
        title: ''
      })
    }
  }

  const removeItem = (id) => {
    setItems(items.filter(item => item.id !== id))
    if (currentIndex >= items.length - 1) {
      setCurrentIndex(0)
    }
  }

  const clearPlaylist = () => {
    setItems([])
    setCurrentIndex(0)
    const updatedPlaylists = { ...playlists, [currentPlaylistName]: [] }
    setPlaylists(updatedPlaylists)
    localStorage.setItem('playlists', JSON.stringify(updatedPlaylists))
  }

  const createPlaylist = () => {
    if (newPlaylistName.trim() && !playlists[newPlaylistName.trim()]) {
      const playlistName = newPlaylistName.trim()
      const updatedPlaylists = { ...playlists, [playlistName]: [] }
      setPlaylists(updatedPlaylists)
      setCurrentPlaylistName(playlistName)
      setItems([])
      setCurrentIndex(0)
      setNewPlaylistName('')
      localStorage.setItem('playlists', JSON.stringify(updatedPlaylists))
      localStorage.setItem('currentPlaylist', playlistName)
    }
  }

  const switchPlaylist = (playlistName) => {
    if (playlists[playlistName]) {
      setCurrentPlaylistName(playlistName)
      setItems(playlists[playlistName] || [])
      setCurrentIndex(0)
      localStorage.setItem('currentPlaylist', playlistName)
    }
  }

  const deletePlaylist = (playlistName) => {
    if (playlistName === 'default') return // Não permitir deletar a playlist padrão
    
    const updatedPlaylists = { ...playlists }
    delete updatedPlaylists[playlistName]
    setPlaylists(updatedPlaylists)
    
    if (currentPlaylistName === playlistName) {
      setCurrentPlaylistName('default')
      setItems(playlists['default'] || [])
      setCurrentIndex(0)
      localStorage.setItem('currentPlaylist', 'default')
    }
    
    localStorage.setItem('playlists', JSON.stringify(updatedPlaylists))
  }

  const fetchRSS = async () => {
    if (!rssUrl.trim()) return

    setIsLoadingRss(true)
    try {
      const parser = new Parser({
        customFields: {
          item: ['description', 'content:encoded']
        }
      })

      const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(rssUrl)}`
      const response = await fetch(proxyUrl)
      const data = await response.json()

      if (data.contents.includes('<rss')) {
        const feed = await parser.parseString(data.contents)
        const items = feed.items.slice(0, 10).map(item => ({
          title: item.title || 'Sem título',
          link: item.link || '#',
          pubDate: item.pubDate || ''
        }))
        setRssItems(items)
      } else {
        // Se não for XML, assume que é embed
        setRssItems([{ title: 'embed', link: rssUrl }])
      }
    } catch (error) {
      console.error('Erro ao buscar RSS:', error)
      const mockRssItems = [
        { title: 'Erro ao carregar RSS - Usando dados de exemplo', link: '#' },
        { title: 'Notícia 1: Lorem ipsum dolor sit amet', link: '#' },
        { title: 'Notícia 2: Consectetur adipiscing elit', link: '#' },
        { title: 'Notícia 3: Sed do eiusmod tempor incididunt', link: '#' }
      ]
      setRssItems(mockRssItems)
    } finally {
      setIsLoadingRss(false)
    }
  }

  const currentItem = items[currentIndex]

  const renderContent = () => {
    if (!currentItem) {
      return (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Nenhum conteúdo adicionado</h2>
            <p>Adicione slides, imagens, sites ou planilhas para começar</p>
          </div>
        </div>
      )
    }

    switch (currentItem.type) {
      case 'image':
        return (
          <div className="flex items-center justify-center h-full">
            <img
              src={currentItem.url}
              alt={currentItem.title || 'Imagem'}
              className="max-w-full max-h-full object-contain"

            />
          </div>
        )
      case 'website':
        return (
          <iframe
            src={currentItem.url}
            className="w-full h-full border-0"
            title={currentItem.title || 'Website'}
          />
        )
      case 'slide':
        return (
          <div className="flex items-center justify-center h-full">
            <embed
              src={currentItem.url}
              type="application/pdf"
              className="w-full h-full"
            />
          </div>
        )
      case 'spreadsheet':
        return (
          <iframe
            src={currentItem.url}
            className="w-full h-full border-0"
            title={currentItem.title || 'Planilha'}
          />
        )
      default:
        return (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p>Tipo de conteúdo não suportado</p>
          </div>
        )
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {(!hideHeader || showHeaderOnHover) && (
        <div className="bg-card border-b p-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Sala de Espera</h1>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsPlaying(!isPlaying)}
                  disabled={items.length === 0}
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentIndex((prev) => (prev + 1) % items.length)}
                  disabled={items.length === 0}
                >
                  <SkipForward className="w-4 h-4" />
                </Button>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSettings(!showSettings)}
              >
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>
          {items.length > 0 && (
            <div className="mt-2 text-sm text-muted-foreground">
              {currentIndex + 1} de {items.length} – {currentItem?.title || currentItem?.url}
            </div>
          )}
        </div>
      )}

      <div className="flex-1 flex relative">
        {/* Área de hover invisível na lateral direita */}
        {hideHeader && (
          <div 
            className="absolute top-0 right-0 w-16 h-full z-50 bg-transparent"
            onMouseEnter={() => setShowHeaderOnHover(true)}
            onMouseLeave={() => setShowHeaderOnHover(false)}
          />
        )}
        
        <div className="flex-1 bg-muted/20">
          {renderContent()}
        </div>

        {showSettings && (
          <div className="w-96 bg-card border-l p-4 overflow-y-auto">
            <Tabs defaultValue="content" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="content">Conteúdo</TabsTrigger>
                <TabsTrigger value="rss">RSS</TabsTrigger>
              </TabsList>

              <TabsContent value="content" className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-3">Gerenciar Playlists</h3>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="current-playlist">Playlist Atual</Label>
                      <Select value={currentPlaylistName} onValueChange={switchPlaylist}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {Object.keys(playlists).map(name => (
                            <SelectItem key={name} value={name}>
                              {name} ({playlists[name]?.length || 0} itens)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex gap-2">
                      <Input
                        placeholder="Nome da nova playlist"
                        value={newPlaylistName}
                        onChange={(e) => setNewPlaylistName(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && createPlaylist()}
                      />
                      <Button onClick={createPlaylist} size="sm">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>

                    {currentPlaylistName !== 'default' && (
                      <Button 
                        onClick={() => deletePlaylist(currentPlaylistName)} 
                        variant="destructive" 
                        size="sm"
                        className="w-full"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Deletar Playlist "{currentPlaylistName}"
                      </Button>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">Adicionar Conteúdo</h3>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="type">Tipo</Label>
                      <Select value={newItem.type} onValueChange={(value) => setNewItem({ ...newItem, type: value })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="image">Imagem</SelectItem>
                          <SelectItem value="website">Site</SelectItem>
                          <SelectItem value="slide">Slide (PDF)</SelectItem>
                          <SelectItem value="spreadsheet">Planilha</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="url">URL</Label>
                      <Input
                        id="url"
                        value={newItem.url}
                        onChange={(e) => setNewItem({ ...newItem, url: e.target.value })}
                        placeholder="https://..."
                      />
                    </div>

                    <div>
                      <Label htmlFor="title">Título (opcional)</Label>
                      <Input
                        id="title"
                        value={newItem.title}
                        onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                        placeholder="Título do conteúdo"
                      />
                    </div>

                    <div>
                      <Label htmlFor="duration">Duração (segundos)</Label>
                      <Input
                        id="duration"
                        type="number"
                        value={newItem.duration / 1000}
                        onChange={(e) => setNewItem({ ...newItem, duration: parseInt(e.target.value) * 1000 })}
                        min="1"
                      />
                    </div>

                    <Button onClick={addItem} className="w-full">
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar
                    </Button>

                    <Button onClick={clearPlaylist} variant="destructive" className="w-full">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Limpar Lista
                    </Button>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">Lista de Conteúdo</h3>
                  <div className="space-y-2">
                    {items.map((item, index) => (
                      <Card key={item.id} className={`p-2 ${index === currentIndex ? 'ring-2 ring-primary' : ''}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {item.title || item.url}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {item.type} - {item.duration / 1000}s
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItem(item.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="rss" className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-3">Feed RSS</h3>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="rss-url">URL do RSS</Label>
                      <Input
                        id="rss-url"
                        value={rssUrl}
                        onChange={(e) => setRssUrl(e.target.value)}
                        placeholder="https://exemplo.com/rss.xml"
                      />
                    </div>

                    <Button onClick={fetchRSS} className="w-full" disabled={isLoadingRss}>
                      {isLoadingRss ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Carregando...
                        </>
                      ) : (
                        'Carregar RSS'
                      )}
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>

      {/* Footer com RSS */}
      {rssItems.length > 0 && (
        <div className="bg-primary text-primary-foreground p-2 overflow-hidden">
          {rssItems[0].title === 'embed' ? (
            <iframe
              src={rssItems[0].link}
              width="100%"
              height="60"
              frameBorder="0"
            />
          ) : (
            <div className="animate-marquee whitespace-nowrap">
              {rssItems.map((item, index) => (
                <span key={index} className="mx-8">
                  📰 {item.title}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default App