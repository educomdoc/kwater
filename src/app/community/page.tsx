'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { generateAIResponse } from '@/lib/gemini';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Star, Sparkles, Lock, ChevronRight, PenTool } from 'lucide-react';

export default function CommunityPage() {
  const [activeTab, setActiveTab] = useState<'review' | 'qna'>('qna');
  const [posts, setPosts] = useState<any[]>([]);
  const [aiAnalysis, setAiAnalysis] = useState<Record<string, string>>({});
  const [isAnalysing, setIsAnalysing] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, "posts"), orderBy("created_at", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPosts(data);
    });
    return () => unsubscribe();
  }, []);

  const handleAiAction = async (postId: string, content: string, type: 'summary' | 'answer') => {
    setIsAnalysing(postId);
    const prompt = type === 'summary' 
      ? `다음 교육 후기를 한 문장으로 핵심만 요약해줘: "${content}"`
      : `다음 교육 관련 질문에 대해 친절하게 답변해줘: "${content}"`;
    
    const response = await generateAIResponse(prompt);
    setAiAnalysis(prev => ({ ...prev, [postId]: response }));
    setIsAnalysing(null);
  };

  const reviews = posts.filter(p => p.type === 'review');
  const qnas = posts.filter(p => p.type === 'qna');

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 lg:p-12">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-widest mb-6">
            <Sparkles className="w-3 h-3" /> Community with AI
          </div>
          <h1 className="text-4xl sm:text-6xl font-black mb-4">소통과 성장의 공간</h1>
          <p className="text-slate-500 text-lg">교육 경험을 공유하고 궁금한 점을 AI와 함께 해결하세요.</p>
        </header>

        <div className="flex justify-center mb-12">
          <div className="inline-flex bg-slate-900 p-1.5 rounded-2xl border border-slate-800">
            <button
              onClick={() => setActiveTab('qna')}
              className={`px-8 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'qna' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-500 hover:text-white'}`}
            >
              Q&A 질문하기
            </button>
            <button
              onClick={() => setActiveTab('review')}
              className={`px-8 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'review' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-500 hover:text-white'}`}
            >
              교육 후기
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8">
          {activeTab === 'qna' ? (
            <div className="space-y-6">
              {qnas.length === 0 && <div className="text-center py-24 text-slate-600 border border-dashed border-slate-800 rounded-3xl">질문이 없습니다. 첫 질문을 남겨보세요!</div>}
              {qnas.map((qna) => (
                <motion.div 
                  layout
                  key={qna.id} 
                  className="bg-slate-900 border border-slate-800 p-8 rounded-[2rem] hover:border-blue-500/30 transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-5">
                      <div className="bg-slate-800 p-4 rounded-2xl">
                        {qna.is_private ? <Lock className="w-6 h-6 text-slate-500" /> : <MessageSquare className="w-6 h-6 text-blue-400" />}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold">{qna.is_private ? "비공개 질문입니다." : qna.title}</h3>
                        {!qna.is_private && <p className="text-slate-400 mt-2 text-sm leading-relaxed">{qna.content}</p>}
                        <div className="flex items-center gap-4 mt-6 text-xs font-medium text-slate-500 uppercase tracking-widest">
                          <span>{qna.user_name || "익명"}</span>
                          <span>•</span>
                          <span>{qna.date || "2024.03.26"}</span>
                        </div>
                      </div>
                    </div>
                    
                    {!qna.is_private && (
                      <button 
                        onClick={() => handleAiAction(qna.id, qna.content, 'answer')}
                        disabled={isAnalysing === qna.id}
                        className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold hover:bg-blue-500/20 transition-all"
                      >
                        {isAnalysing === qna.id ? <div className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div> : <Sparkles className="w-3 h-3" />}
                        AI 답변 받기
                      </button>
                    )}
                  </div>

                  {aiAnalysis[qna.id] && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-8 p-6 bg-blue-500/5 border border-blue-500/10 rounded-2xl"
                    >
                      <div className="text-[10px] font-bold text-blue-400 mb-2 uppercase tracking-widest flex items-center gap-2">
                        <Sparkles className="w-3 h-3" /> Gemini AI Answer
                      </div>
                      <p className="text-blue-100 text-sm leading-relaxed">{aiAnalysis[qna.id]}</p>
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {reviews.length === 0 && <div className="col-span-full text-center py-24 text-slate-600 border border-dashed border-slate-800 rounded-3xl">등록된 후기가 없습니다.</div>}
              {reviews.map((review) => (
                <motion.div 
                  layout
                  key={review.id} 
                  className="bg-slate-900 border border-slate-800 p-8 rounded-[2rem] flex flex-col justify-between hover:-translate-y-1 transition-all"
                >
                  <div>
                    <div className="flex items-center gap-1 mb-6">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-4 h-4 ${i < (review.rating || 5) ? 'fill-yellow-400 text-yellow-400' : 'text-slate-800'}`} />
                      ))}
                    </div>
                    <p className="text-white text-sm leading-relaxed mb-6">"{review.content}"</p>
                  </div>

                  <div className="pt-6 border-t border-slate-800 flex items-center justify-between">
                    <div className="text-xs text-slate-500">
                      <span className="font-bold text-slate-300">{review.user_name || "수강생"}</span>
                      <span className="mx-2">|</span>
                      <span>{review.program_name || "교육 수료"}</span>
                    </div>
                    <button 
                      onClick={() => handleAiAction(review.id, review.content, 'summary')}
                      disabled={isAnalysing === review.id}
                      className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-blue-400 transition"
                    >
                      {isAnalysing === review.id ? <div className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div> : <Sparkles className="w-4 h-4" />}
                    </button>
                  </div>

                  {aiAnalysis[review.id] && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="mt-4 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl"
                    >
                      <div className="text-[10px] font-bold text-emerald-400 mb-1 uppercase tracking-widest flex items-center gap-1">
                        <Sparkles className="w-2 h-2" /> AI Summary
                      </div>
                      <p className="text-emerald-50 text-[11px] font-medium">{aiAnalysis[review.id]}</p>
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>
        
        {/* Float Input Button (Post) */}
        <div className="fixed bottom-12 right-12">
          <button className="group relative flex items-center justify-center w-16 h-16 rounded-3xl bg-blue-600 text-white shadow-2xl shadow-blue-600/40 hover:scale-110 active:scale-95 transition-all">
             <PenTool className="w-6 h-6 " />
             <span className="absolute right-full mr-4 px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
               글쓰기
             </span>
          </button>
        </div>
      </div>
    </div>
  );
}
