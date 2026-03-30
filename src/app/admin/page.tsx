'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, updateDoc, doc, query, orderBy, onSnapshot } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, CheckCircle, XCircle, Home, RefreshCw, Search, ShieldAlert } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const { user, userData, loading: authLoading } = useAuth();
  const router = useRouter();
  const [applications, setApplications] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!authLoading && (!user || userData?.role !== 'admin')) {
      // 관리자가 아니면 메인으로 리다이렉트 (추후 접근 권한 없음 페이지로 변경 가능)
      if (!user) router.push('/login');
    }
  }, [user, userData, authLoading, router]);

  useEffect(() => {
    if (!user || userData?.role !== 'admin') return;
    // 실시간 데이터 구독 (Firestore)
    const q = query(collection(db, "applications"), orderBy("created_at", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setApplications(data);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching applications:", error);
      setLoading(false);
    });

    // 숙소 정보 가져오기 (고정 Mock 데이터 또는 DB)
    setRooms([
      { id: 'r1', name: '생활관 101호', cap: 2 },
      { id: 'r2', name: '생활관 102호', cap: 2 },
      { id: 'r3', name: '생활관 201호', cap: 4 },
    ]);

    return () => unsubscribe();
  }, []);

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const appRef = doc(db, "applications", id);
      await updateDoc(appRef, { status: newStatus });
      // 이 시점에 Cloud Function이 트리거되어 이메일 발송 가능
    } catch (error) {
      alert("상태 수정 중 오류 발생: " + error);
    }
  };

  const assignRoom = async (appId: string, roomId: string) => {
    try {
      const appRef = doc(db, "applications", appId);
      await updateDoc(appRef, { room_id: roomId });
    } catch (error) {
      alert("숙소 배정 중 오류 발생: " + error);
    }
  };

  const filteredApps = applications.filter(app => 
    app.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (authLoading) {
    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user || userData?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-blue-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-red-50 p-6 rounded-3xl mb-8 border border-red-100">
          <ShieldAlert className="w-12 h-12 text-red-500" />
        </div>
        <h1 className="text-3xl font-black text-slate-900 mb-4">접근 권한이 없습니다</h1>
        <p className="text-slate-600 mb-8">이 페이지는 관리자만 접근할 수 있습니다.</p>
        <button 
          onClick={() => router.push('/')}
          className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-bold hover:bg-blue-700 transition shadow-sm"
        >
          홈으로 돌아가기
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blue-50 text-slate-900 p-6 lg:p-12">
      <div className="max-w-7xl mx-auto">
        <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-blue-600 font-bold uppercase tracking-widest text-xs mb-2">
              <Users className="w-4 h-4" /> Management
            </div>
            <h1 className="text-4xl font-black">관리자 대시보드</h1>
            <p className="text-slate-600 mt-2">사용자의 교육 신청 현황을 관리하고 숙소를 배정하세요.</p>
          </div>
          
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="신청자 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white border border-blue-200 rounded-2xl py-3 pl-12 pr-6 text-sm focus:ring-2 focus:ring-blue-500/50 outline-none w-full md:w-64 transition-all shadow-sm"
            />
          </div>
        </header>

        {loading ? (
          <div className="flex justify-center py-24">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="bg-white border border-blue-100 rounded-[2rem] overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-blue-100 bg-blue-50/50">
                    <th className="px-8 py-6 text-xs font-bold text-slate-500 uppercase tracking-widest">신청자 정보</th>
                    <th className="px-8 py-6 text-xs font-bold text-slate-500 uppercase tracking-widest">프로그램 ID</th>
                    <th className="px-8 py-6 text-xs font-bold text-slate-500 uppercase tracking-widest">상태</th>
                    <th className="px-8 py-6 text-xs font-bold text-slate-500 uppercase tracking-widest">숙소 배정</th>
                    <th className="px-8 py-6 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">관리</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-blue-50">
                  {filteredApps.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-8 py-24 text-center text-slate-500 bg-white">신청 내역이 없습니다.</td>
                    </tr>
                  )}
                  {filteredApps.map((app) => (
                    <motion.tr 
                      layout
                      key={app.id} 
                      className="hover:bg-blue-50/50 transition-colors group bg-white"
                    >
                      <td className="px-8 py-6">
                        <div className="font-bold text-slate-900">{app.fullName || '미입력'}</div>
                        <div className="text-xs text-slate-500 mt-1">{app.email}</div>
                      </td>
                      <td className="px-8 py-6 text-sm text-slate-600">
                        {app.program_id || 'ID 없음'}
                      </td>
                      <td className="px-8 py-6">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          app.status === 'approved' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 
                          app.status === 'rejected' ? 'bg-red-50 text-red-600 border border-red-200' : 
                          'bg-yellow-50 text-yellow-600 border border-yellow-200'
                        }`}>
                          {app.status === 'approved' ? <CheckCircle className="w-3 h-3" /> : app.status === 'rejected' ? <XCircle className="w-3 h-3" /> : null}
                          {app.status}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="relative flex items-center gap-2">
                          <Home className="w-4 h-4 text-slate-400" />
                          <select
                            value={app.room_id || ''}
                            onChange={(e) => assignRoom(app.id, e.target.value)}
                            className="bg-transparent border-none text-sm text-slate-700 focus:ring-0 cursor-pointer hover:text-blue-600 transition outline-none"
                          >
                            <option value="" className="bg-white text-slate-900">미배정</option>
                            {rooms.map(room => (
                              <option key={room.id} value={room.id} className="bg-white text-slate-900">{room.name}</option>
                            ))}
                          </select>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {app.status === 'pending' ? (
                            <>
                              <button 
                                onClick={() => updateStatus(app.id, 'approved')}
                                className="p-2 rounded-xl bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => updateStatus(app.id, 'rejected')}
                                className="p-2 rounded-xl bg-red-100 text-red-700 hover:bg-red-200 transition"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <button 
                              onClick={() => updateStatus(app.id, 'pending')}
                              className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition"
                            >
                              <RefreshCw className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
