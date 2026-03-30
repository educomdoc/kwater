'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, limit, startAfter, QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Star, Lock, RefreshCw, PenTool, X, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';

export default function CommunityPage() {
  const { user, userData, loading: authLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'review' | 'qna'>('qna');
  const [posts, setPosts] = useState<any[]>([]);

  // Pagination & Refresh
  const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // Modal & Post
  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<any>(null);
  const [newPostContent, setNewPostContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Admin Reply
  const [replyingPost, setReplyingPost] = useState<any>(null);
  const [replyContent, setReplyContent] = useState('');
  const [isReplying, setIsReplying] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const fetchPosts = async (isRefresh = false) => {
    if (!user) return;
    
    if (isRefresh) {
      setIsRefreshing(true);
      setLastVisible(null);
      setHasMore(true);
    } else {
      setLoadingPosts(true);
    }

    try {
      let q = query(collection(db, "posts"), orderBy("created_at", "desc"), limit(50));
      
      if (!isRefresh && lastVisible) {
        q = query(collection(db, "posts"), orderBy("created_at", "desc"), startAfter(lastVisible), limit(50));
      }

      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      if (isRefresh) {
        setPosts(data);
      } else {
        setPosts(prev => [...prev, ...data]);
      }

      setHasMore(querySnapshot.docs.length === 50);
      const lastDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
      if (lastDoc) setLastVisible(lastDoc);
      
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setIsRefreshing(false);
      setLoadingPosts(false);
    }
  };

  useEffect(() => {
    if (user) fetchPosts(true);
  }, [user]);

  // 글쓰기 창 열기
  const handleWriteClick = () => {
    setEditingPost(null);
    setNewPostContent('');
    setIsWriteModalOpen(true);
  };

  // 글 수정 시작
  const handleEditPostStart = (post: any) => {
    setEditingPost(post);
    setNewPostContent(post.content);
    setIsWriteModalOpen(true);
  };

  // 모달 닫기
  const handleModalClose = () => {
    setIsWriteModalOpen(false);
    setEditingPost(null);
    setNewPostContent('');
  };

  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim()) return;
    setIsSubmitting(true);
    
    if (editingPost) {
      // ==== 글 수정 로직 ====
      const prevPosts = [...posts];
      setPosts(prev => prev.map(p => p.id === editingPost.id ? { ...p, content: newPostContent } : p));
      handleModalClose();

      try {
        const postRef = doc(db, "posts", editingPost.id);
        await updateDoc(postRef, { content: newPostContent });
      } catch (error) {
        console.error(error);
        setPosts(prevPosts);
        alert("글 수정 중 오류가 발생했습니다.");
      } finally {
        setIsSubmitting(false);
      }
    } else {
      // ==== 새 글 작성 로직 (낙관적 업데이트) ====
      const tempId = `temp_${Date.now()}`;
      const newPost = {
        id: tempId,
        title: activeTab === 'qna' ? '질문입니다.' : '교육 후기입니다.',
        content: newPostContent,
        type: activeTab,
        user_name: userData?.fullName || '수강생',
        user_id: user?.uid,
        date: new Date().toLocaleDateString('ko-KR'),
        loading: true // 로딩 중임을 나타내는 플래그
      };
      
      setPosts(prev => [newPost, ...prev]);
      handleModalClose();

      try {
        const docRef = await addDoc(collection(db, "posts"), {
          title: newPost.title,
          content: newPost.content,
          type: newPost.type,
          user_name: newPost.user_name,
          user_id: newPost.user_id,
          date: newPost.date,
          created_at: serverTimestamp()
        });
        // 임시 ID를 실제 ID로 교체하고 로딩 상태 해제
        setPosts(prev => prev.map(p => p.id === tempId ? { ...p, id: docRef.id, loading: false } : p));
      } catch(err) {
        console.error(err);
        setPosts(prev => prev.filter(p => p.id !== tempId));
        alert("글 등록에 실패했습니다.");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  // 글 삭제 로직
  const handleDeletePost = async (postId: string) => {
    if (!window.confirm("정말로 삭제하시겠습니까?")) return;
    
    const prevPosts = [...posts];
    setPosts(prev => prev.filter(p => p.id !== postId));

    try {
      await deleteDoc(doc(db, "posts", postId));
      alert("삭제되었습니다.");
    } catch (error) {
      console.error(error);
      setPosts(prevPosts);
      alert("삭제 중 오류가 발생했습니다.");
    }
  };

  // 관리자 답변 시작
  const handleAdminReplyStart = (post: any) => {
    setReplyingPost(post);
    setReplyContent(post.admin_reply || '');
  };

  // 관리자 답변 등록
  const handleAdminReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim()) return;
    setIsReplying(true);

    const prevPosts = [...posts];
    setPosts(prev => prev.map(p => p.id === replyingPost.id ? { ...p, admin_reply: replyContent } : p));
    
    try {
      const postRef = doc(db, "posts", replyingPost.id);
      await updateDoc(postRef, { admin_reply: replyContent });
      setReplyingPost(null);
      setReplyContent('');
    } catch (error) {
      console.error(error);
      setPosts(prevPosts);
      alert("답변 등록 중 오류가 발생했습니다.");
    } finally {
      setIsReplying(false);
    }
  };

  const reviews = posts.filter(p => p.type === 'review');
  const qnas = posts.filter(p => p.type === 'qna');

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blue-50 text-slate-900 p-6 lg:p-12 relative overflow-hidden">
      <div className="max-w-7xl mx-auto relative z-10">
        <header className="text-center mb-16 relative">
          <h1 className="text-4xl sm:text-6xl font-black mb-4">후기 게시판</h1>
          <p className="text-slate-600 text-lg mb-8">다음 차수에 반영을 위하여 학습 후기를 남겨주세요.</p>
          
          <button 
            onClick={() => fetchPosts(true)}
            disabled={isRefreshing}
            className="inline-flex items-center gap-2 bg-white px-6 py-2.5 rounded-full shadow-sm text-sm font-bold text-slate-700 hover:text-blue-600 transition-all border border-blue-100 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
            최신글 불러오기
          </button>
        </header>

        <div className="flex justify-center mb-12">
          <div className="inline-flex bg-white p-1.5 rounded-2xl border border-blue-200 shadow-sm">
            <button
              onClick={() => setActiveTab('qna')}
              className={`px-8 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'qna' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-500 hover:text-slate-900 hover:bg-blue-50'}`}
            >
              Q&A 질문하기
            </button>
            <button
              onClick={() => setActiveTab('review')}
              className={`px-8 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'review' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-500 hover:text-slate-900 hover:bg-blue-50'}`}
            >
              교육 후기
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8">
          {activeTab === 'qna' ? (
            <div className="space-y-6">
              {qnas.length === 0 && !isRefreshing && <div className="text-center py-24 text-slate-500 border border-dashed border-blue-200 rounded-3xl bg-white/50">질문이 없습니다. 첫 질문을 남겨보세요!</div>}
              {qnas.map((qna) => (
                <motion.div 
                  layout
                  key={qna.id} 
                  className={`bg-white border ${qna.loading ? 'border-dashed border-blue-300 opacity-70' : 'border-blue-100'} p-8 rounded-[2rem] hover:border-blue-400 transition-all shadow-sm`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-5 flex-1">
                      <div className="bg-blue-50 p-4 rounded-2xl shrink-0">
                        {qna.is_private ? <Lock className="w-6 h-6 text-slate-500" /> : <MessageSquare className="w-6 h-6 text-blue-600" />}
                      </div>
                      <div className="flex-1 w-full">
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                          <h3 className="text-xl font-bold">{qna.is_private ? "비공개 질문입니다." : qna.title}</h3>
                          
                          {/* Action Buttons */}
                          {!qna.loading && (
                            <div className="flex items-center gap-3">
                              {/* 작성자 본인일 경우 수정 노출 (단, 답변이 달렸으면 수정 불가) */}
                              {qna.user_id === user?.uid && !qna.admin_reply && (
                                <button onClick={() => handleEditPostStart(qna)} className="text-xs font-bold text-slate-400 hover:text-blue-600 transition">수정</button>
                              )}
                              {/* 작성자 본인 이거나 관리자일 경우 삭제 노출 */}
                              {(qna.user_id === user?.uid || userData?.role === 'admin') && (
                                <button onClick={() => handleDeletePost(qna.id)} className="text-xs font-bold text-slate-400 hover:text-red-500 transition">삭제</button>
                              )}
                              {/* 관리자일 경우 답변달기 노출 */}
                              {userData?.role === 'admin' && (
                                <button onClick={() => handleAdminReplyStart(qna)} className="text-xs font-bold text-blue-600 hover:text-blue-800 transition bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100">
                                  {qna.admin_reply ? '답변 수정' : '답변 작성'}
                                </button>
                              )}
                            </div>
                          )}
                        </div>

                        {!qna.is_private && <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">{qna.content}</p>}
                        
                        <div className="flex items-center gap-4 mt-6 text-xs font-medium text-slate-400 uppercase tracking-widest">
                          <span>{qna.user_name || "익명"}</span>
                          <span>•</span>
                          <span>{qna.date || "-"}</span>
                          {qna.loading && <span className="text-blue-500 flex items-center gap-1"><RefreshCw className="w-3 h-3 animate-spin"/> 등록 중...</span>}
                        </div>
                        
                        {/* 관리자 답변 렌더링 */}
                        {qna.admin_reply && (
                          <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-6 p-5 bg-blue-50 border border-blue-200 rounded-2xl shadow-inner relative"
                          >
                            <div className="absolute -top-3 left-6 flex items-center gap-1.5 px-3 py-1 bg-blue-600 text-white text-[10px] font-bold uppercase tracking-widest rounded-full shadow-sm">
                              <ShieldCheck className="w-3 h-3" /> 관리자 답변
                            </div>
                            <p className="text-slate-800 text-sm leading-relaxed whitespace-pre-wrap mt-2">{qna.admin_reply}</p>
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {reviews.length === 0 && !isRefreshing && <div className="col-span-full text-center py-24 text-slate-500 border border-dashed border-blue-200 rounded-3xl bg-white/50">등록된 후기가 없습니다.</div>}
              {reviews.map((review) => (
                <motion.div 
                  layout
                  key={review.id} 
                  className={`bg-white border ${review.loading ? 'border-dashed border-blue-300 opacity-70' : 'border-blue-100'} p-8 rounded-[2rem] flex flex-col justify-between hover:-translate-y-1 transition-all shadow-sm group`}
                >
                  <div>
                    <div className="flex items-center gap-1 mb-6">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-4 h-4 ${i < (review.rating || 5) ? 'fill-yellow-400 text-yellow-500' : 'text-slate-300'}`} />
                      ))}
                    </div>
                    <p className="text-slate-800 text-sm leading-relaxed mb-6 whitespace-pre-wrap">"{review.content}"</p>
                  </div>

                  <div className="pt-6 border-t border-blue-50 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-slate-500">
                        <span className="font-bold text-slate-700">{review.user_name || "수강생"}</span>
                        <span className="mx-2">|</span>
                        <span>{review.program_name || "교육 수료"}</span>
                        {review.loading && <span className="text-blue-500 ml-2 animate-pulse">등록 중...</span>}
                      </div>

                      {/* Action Buttons */}
                      {!review.loading && (
                        <div className="flex items-center gap-2">
                          {review.user_id === user?.uid && !review.admin_reply && (
                            <button onClick={() => handleEditPostStart(review)} className="text-xs font-bold text-slate-400 hover:text-blue-600 transition">수정</button>
                          )}
                          {(review.user_id === user?.uid || userData?.role === 'admin') && (
                            <button onClick={() => handleDeletePost(review.id)} className="text-xs font-bold text-slate-400 hover:text-red-500 transition">삭제</button>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex justify-start">
                      {userData?.role === 'admin' && !review.loading && (
                        <button onClick={() => handleAdminReplyStart(review)} className="text-xs font-bold text-blue-600 hover:text-blue-800 transition bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 mt-2">
                          {review.admin_reply ? '답변 수정' : '답변 작성'}
                        </button>
                      )}
                    </div>

                    {/* 관리자 답변 렌더링 */}
                    {review.admin_reply && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="mt-2 p-4 bg-blue-50 border border-blue-200 rounded-xl relative"
                      >
                        <div className="absolute -top-2 left-4 flex items-center gap-1 px-2 py-0.5 bg-blue-600 text-white text-[9px] font-bold uppercase tracking-widest rounded-full shadow-sm">
                          <ShieldCheck className="w-3 h-3" /> 답변
                        </div>
                        <p className="text-slate-800 text-[12px] leading-relaxed whitespace-pre-wrap mt-2">{review.admin_reply}</p>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* 더보기 버튼 */}
          {hasMore && posts.length > 0 && (
            <div className="flex justify-center mt-8">
              <button
                onClick={() => fetchPosts(false)}
                disabled={loadingPosts}
                className="px-8 py-3 bg-white border border-blue-200 text-blue-600 font-bold rounded-2xl hover:bg-blue-50 transition-colors shadow-sm disabled:opacity-50"
              >
                {loadingPosts ? '불러오는 중...' : '더보기 (Load More)'}
              </button>
            </div>
          )}
        </div>
        
        {/* Float Input Button (Post) */}
        <div className="fixed bottom-12 right-12 z-50">
          <button 
            onClick={handleWriteClick}
            className="group relative flex items-center justify-center w-16 h-16 rounded-3xl bg-blue-600 text-white shadow-2xl shadow-blue-600/40 hover:scale-110 active:scale-95 transition-all"
          >
             <PenTool className="w-6 h-6 " />
             <span className="absolute right-full mr-4 px-4 py-2 bg-white border border-blue-100 text-slate-900 rounded-xl text-xs font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-sm">
               글쓰기
             </span>
          </button>
        </div>
      </div>

      {/* Write / Edit Modal */}
      <AnimatePresence>
        {isWriteModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={handleModalClose}
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-lg bg-white rounded-3xl p-8 shadow-2xl"
            >
              <button 
                onClick={handleModalClose}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:bg-slate-100 rounded-full transition"
              >
                <X className="w-5 h-5" />
              </button>
              
              <h2 className="text-2xl font-bold text-slate-900 mb-6">
                {editingPost ? '글 수정하기' : (activeTab === 'qna' ? '질문 작성하기' : '교육 후기 작성하기')}
              </h2>
              
              <form onSubmit={handlePostSubmit}>
                <textarea
                  required
                  rows={5}
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  className="w-full bg-blue-50/50 border border-blue-100 rounded-2xl p-4 text-slate-900 focus:ring-2 focus:ring-blue-500/50 outline-none resize-none"
                  placeholder={activeTab === 'qna' ? "궁금한 내용을 자유롭게 남겨주세요." : "본 교육에 대한 소중한 후기를 남겨주세요."}
                />
                <button 
                  type="submit" 
                  disabled={isSubmitting || !newPostContent.trim()}
                  className="w-full mt-6 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg rounded-2xl transition-colors shadow-lg shadow-blue-600/20 disabled:opacity-50"
                >
                  {editingPost ? '수정하기' : '등록하기'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Admin Reply Modal */}
      <AnimatePresence>
        {replyingPost && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setReplyingPost(null)}
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-lg bg-white rounded-3xl p-8 shadow-2xl"
            >
              <button 
                onClick={() => setReplyingPost(null)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:bg-slate-100 rounded-full transition"
              >
                <X className="w-5 h-5" />
              </button>
              
              <h2 className="text-2xl font-bold text-slate-900 mb-2 flex items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-blue-600" /> 관리자 답변 작성
              </h2>
              <p className="text-sm text-slate-500 mb-6">해당 질문/후기에 사용자에게 보여질 답변을 작성합니다.</p>
              
              <div className="mb-6 p-4 bg-slate-50 border border-slate-100 rounded-2xl line-clamp-3 text-sm text-slate-600 italic">
                "{replyingPost.content}"
              </div>

              <form onSubmit={handleAdminReplySubmit}>
                <textarea
                  required
                  rows={5}
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  className="w-full bg-blue-50/50 border border-blue-100 rounded-2xl p-4 text-slate-900 focus:ring-2 focus:ring-blue-500/50 outline-none resize-none"
                  placeholder="답변 내용을 작성해주세요."
                />
                <button 
                  type="submit" 
                  disabled={isReplying || !replyContent.trim()}
                  className="w-full mt-6 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-lg rounded-2xl transition-colors shadow-lg shadow-emerald-600/20 disabled:opacity-50"
                >
                  답변 등록하기
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
