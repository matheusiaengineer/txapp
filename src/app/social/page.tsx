"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, MessageCircle, Share2, Image, MapPin, Send, MoreHorizontal, Bookmark, Smile, ThumbsUp, Star, Clock } from "lucide-react";

interface Post {
  id: number;
  author: string;
  avatar: string;
  content: string;
  image?: string;
  location?: string;
  likes: number;
  comments: number;
  time: string;
  hashtags: string[];
  liked: boolean;
}

const MOCK_POSTS: Post[] = [
  { id: 1, author: "Ana Oliveira", avatar: "AO", content: "Melhor corrida do dia! 🌟 Cliente super simpático, deixou gorjeta de R$ 10. TXDAPP transformando meu dia a dia!", likes: 24, comments: 5, time: "há 15 min", hashtags: ["#TXDAPP", "#MotoristaFeliz"], liked: false },
  { id: 2, author: "Carlos Silva", avatar: "CS", content: "Bora pessoal! 🚀 Quem mais está online agora? Bora fazer esse sábado render! 📱💰", location: "São Paulo - Zona Sul", likes: 18, comments: 8, time: "há 42 min", hashtags: ["#TXDAPP", "#Sabadão"], liked: true },
  { id: 3, author: "Maria Santos", avatar: "MS", content: "Dica pra quem está começando: foque em horários de pico (11h-13h e 18h-20h). O segredo está nos horários certos! 📈", likes: 45, comments: 12, time: "há 2h", hashtags: ["#DicasTXDAPP", "#Motoboy"], liked: false },
];

export default function SocialPage() {
  const [posts, setPosts] = useState(MOCK_POSTS);
  const [newPost, setNewPost] = useState("");
  const [showStories, setShowStories] = useState(false);

  const handleLike = (postId: number) => {
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 } : p));
  };

  const handlePost = () => {
    if (!newPost.trim()) return;
    const post: Post = {
      id: posts.length + 1,
      author: "Você",
      avatar: "V",
      content: newPost,
      likes: 0, comments: 0,
      time: "agora",
      hashtags: [],
      liked: false,
    };
    setPosts(prev => [post, ...prev]);
    setNewPost("");
  };

  const stories = [
    { id: 1, user: "Ana", avatar: "A", viewed: false },
    { id: 2, user: "Carlos", avatar: "C", viewed: true },
    { id: 3, user: "Maria", avatar: "M", viewed: false },
    { id: 4, user: "João", avatar: "J", viewed: true },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold">Comunidade TXDAPP</h1>
          <p className="text-sm text-gray-400">Conecte-se com outros profissionais</p>
        </motion.div>

        {/* Stories */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="flex gap-3 overflow-x-auto pb-2">
          {stories.map(s => (
            <button key={s.id} onClick={() => setShowStories(true)}
              className="flex flex-col items-center gap-1 shrink-0">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center text-sm font-bold border-2 ${
                s.viewed ? "border-gray-600" : "border-primary"
              } bg-primary/20 text-primary`}>
                {s.avatar}
              </div>
              <span className="text-[10px] text-gray-400">{s.user}</span>
            </button>
          ))}
        </motion.div>

        {/* Create Post */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-4">
          <div className="flex gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary shrink-0">V</div>
            <textarea value={newPost} onChange={e => setNewPost(e.target.value)}
              placeholder="Compartilhe algo com a comunidade..."
              className="flex-1 bg-transparent text-white text-sm resize-none outline-none placeholder-gray-500 min-h-[60px]" />
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-card-border">
            <div className="flex gap-3">
              <button className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors"><Image className="w-4 h-4" /> Foto</button>
              <button className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors"><MapPin className="w-4 h-4" /> Local</button>
              <button className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors"><Smile className="w-4 h-4" /> Emoji</button>
            </div>
            <button onClick={handlePost} disabled={!newPost.trim()}
              className="bg-primary hover:bg-primary-hover disabled:opacity-50 text-background text-xs font-bold px-5 py-2 rounded-xl flex items-center gap-1.5 transition-all">
              <Send className="w-3.5 h-3.5" /> Publicar
            </button>
          </div>
        </motion.div>

        {/* Feed */}
        <div className="space-y-4">
          {posts.map(post => (
            <motion.div key={post.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="glass-panel p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary text-sm">
                    {post.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{post.author}</p>
                    <div className="flex items-center gap-2 text-[10px] text-gray-500">
                      <Clock className="w-3 h-3" />
                      <span>{post.time}</span>
                      {post.location && <><span>·</span><MapPin className="w-3 h-3" /><span>{post.location}</span></>}
                    </div>
                  </div>
                </div>
                <button className="p-1 hover:bg-white/5 rounded-lg"><MoreHorizontal className="w-4 h-4 text-gray-400" /></button>
              </div>

              <p className="text-sm mb-3">{post.content}</p>

              {post.hashtags.length > 0 && (
                <div className="flex gap-2 mb-3">
                  {post.hashtags.map(tag => (
                    <span key={tag} className="text-xs text-primary">{tag}</span>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-4 pt-3 border-t border-card-border">
                <button onClick={() => handleLike(post.id)}
                  className={`flex items-center gap-1.5 text-xs transition-colors ${post.liked ? "text-red-400" : "text-gray-400 hover:text-red-400"}`}>
                  <Heart className={`w-4 h-4 ${post.liked ? "fill-red-400" : ""}`} /> {post.likes}
                </button>
                <button className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors">
                  <MessageCircle className="w-4 h-4" /> {post.comments}
                </button>
                <button className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors">
                  <Share2 className="w-4 h-4" /> Compartilhar
                </button>
                <button className="ml-auto flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors">
                  <Bookmark className="w-4 h-4" /> Salvar
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
