'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { ClipboardList, Trash2, Edit2, X, Save, Clock, CheckCircle } from 'lucide-react';

interface Application {
  id: string;
  userId?: string;
  program_id?: string;
  program_title?: string;
  program_round?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  department?: string;
  reason?: string;
  status?: string;
  created_at?: Timestamp;
}

export default function MyApplicationsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const fetchApplications = async () => {
      if (!user) return;
      try {
        const q = query(collection(db, "applications"), where("userId", "==", user.uid));
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Application));
        // 최신순으로 정렬 (created_at 기준)
        data.sort((a, b) => {
          const dateA = a.created_at?.toMillis() || 0;
          const dateB = b.created_at?.toMillis() || 0;
          return dateB - dateA;
        });
        setApplications(data);
      } catch (error) {
        console.error("Error fetching applications:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchApplications();
    }
  }, [user]);

  const startEdit = (app: any) => {
    setEditingId(app.id);
    setEditForm({
      phone: app.phone || '',
      department: app.department || '',
      reason: app.reason || ''
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const saveEdit = async (id: string) => {
    setSaving(true);
    try {
      const appRef = doc(db, "applications", id);
      await updateDoc(appRef, {
        phone: editForm.phone,
        department: editForm.department,
        reason: editForm.reason
      });
      // 업데이트된 데이터 로컬 상태에 반영
      setApplications(prev => prev.map(app => 
        app.id === id ? { ...app, ...editForm } : app
      ));
      setEditingId(null);
      alert('신청 내용이 수정되었습니다.');
    } catch (error) {
      console.error("Error updating application:", error);
      alert('수정 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('정말 이 교육 신청을 취소하시겠습니까?')) return;
    
    try {
      await deleteDoc(doc(db, "applications", id));
      setApplications(prev => prev.filter(app => app.id !== id));
      alert('신청이 취소되었습니다.');
    } catch (error) {
      console.error("Error deleting application:", error);
      alert('취소 중 오류가 발생했습니다.');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center">
        <div className="text-slate-900 text-lg animate-pulse block">데이터를 불러오는 중입니다...</div>
      </div>
    );
  }

  if (!user) return null; // redirect handled in useEffect

  return (
    <div className="min-h-screen bg-blue-50 px-4 py-12 sm:py-24">
      <div className="mx-auto max-w-5xl">
        <div className="mb-12">
          <h1 className="text-4xl font-extrabold text-slate-900 mb-4">신청한 프로그램</h1>
          <p className="text-slate-600 text-lg">지금까지 신청하신 교육 프로그램 내역과 승인 상태를 확인하실 수 있습니다.</p>
        </div>

        {applications.length === 0 ? (
          <div className="bg-white/80 border border-blue-100 rounded-3xl p-16 text-center shadow-sm">
            <ClipboardList className="w-16 h-16 text-slate-400 mx-auto mb-6" />
            <h3 className="text-xl font-bold text-slate-900 mb-2">신청 내역이 없습니다</h3>
            <p className="text-slate-500 mb-8">안내 중인 교육 프로그램을 확인하고 신청해 보세요.</p>
            <button 
              onClick={() => router.push('/')}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl transition-colors shadow-lg shadow-blue-500/20"
            >
              교육 프로그램 둘러보기
            </button>
          </div>
        ) : (
          <div className="grid gap-6">
            <AnimatePresence>
              {applications.map((app) => {
                const isEditing = editingId === app.id;
                const isApproved = app.status === 'approved';

                return (
                  <motion.div
                    key={app.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={`bg-white border ${isEditing ? 'border-blue-500' : 'border-blue-100'} rounded-[2rem] p-8 transition-all overflow-hidden shadow-sm`}
                  >
                    <div className="flex flex-col md:flex-row justify-between md:items-start gap-6 mb-6 pb-6 border-b border-blue-50">
                      <div>
                        <div className="flex items-center gap-3 mb-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                            isApproved 
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' 
                            : 'bg-amber-50 text-amber-600 border border-amber-200'
                          }`}>
                            {isApproved ? (
                              <span className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5" /> 승인됨</span>
                            ) : (
                              <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> 대기 중</span>
                            )}
                          </span>
                          <span className="text-xs font-medium text-slate-500">{app.program_round}</span>
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 leading-tight">{app.program_title}</h2>
                        <p className="text-slate-600 text-sm mt-2 flex items-center gap-2">
                          신청일시: {app.created_at?.toDate ? new Date(app.created_at.toDate()).toLocaleDateString('ko-KR') : '알 수 없음'}
                        </p>
                      </div>

                      {!isEditing && !isApproved && (
                        <div className="flex gap-2 shrink-0">
                          <button 
                            onClick={() => startEdit(app)}
                            className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 rounded-xl transition flex items-center justify-center font-semibold text-sm gap-2"
                          >
                            <Edit2 className="w-4 h-4" /> 내역 수정
                          </button>
                          <button 
                            onClick={() => handleDelete(app.id)}
                            className="p-3 bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 border border-red-100 rounded-xl transition flex items-center justify-center"
                            title="신청 취소"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    {isEditing ? (
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-xs font-bold text-slate-600 uppercase tracking-widest mb-2 ml-1">연락처</label>
                            <input
                              type="text"
                              value={editForm.phone}
                              onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                              className="w-full bg-white border border-blue-200 rounded-xl py-3 px-4 text-slate-900 focus:ring-2 focus:ring-blue-500/50 outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-600 uppercase tracking-widest mb-2 ml-1">소속</label>
                            <input
                              type="text"
                              value={editForm.department}
                              onChange={(e) => setEditForm({...editForm, department: e.target.value})}
                              className="w-full bg-white border border-blue-200 rounded-xl py-3 px-4 text-slate-900 focus:ring-2 focus:ring-blue-500/50 outline-none"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-600 uppercase tracking-widest mb-2 ml-1">신청 사유</label>
                          <textarea
                            rows={3}
                            value={editForm.reason}
                            onChange={(e) => setEditForm({...editForm, reason: e.target.value})}
                            className="w-full bg-white border border-blue-200 rounded-xl py-3 px-4 text-slate-900 focus:ring-2 focus:ring-blue-500/50 outline-none"
                          />
                        </div>
                        <div className="flex gap-3 pt-2">
                          <button 
                            onClick={() => saveEdit(app.id)}
                            disabled={saving}
                            className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition flex items-center justify-center gap-2"
                          >
                            {saving ? '저장 중...' : <><Save className="w-4 h-4" /> 저장하기</>}
                          </button>
                          <button 
                            onClick={cancelEdit}
                            disabled={saving}
                            className="flex-1 py-3 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl transition flex items-center justify-center gap-2"
                          >
                            <X className="w-4 h-4" /> 취소
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div>
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 block">신청자 성함</span>
                          <span className="text-sm text-slate-700">{app.fullName}</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 block">이메일</span>
                          <span className="text-sm text-slate-700">{app.email}</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 block">연락처</span>
                          <span className="text-sm text-slate-700">{app.phone}</span>
                        </div>
                        <div className="md:col-span-2 lg:col-span-3">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 block">신청 사유</span>
                          <p className="text-sm text-slate-700 bg-blue-50 rounded-xl p-4 mt-1 border border-blue-100">
                            {app.reason || '입력된 사유가 없습니다.'}
                          </p>
                        </div>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
