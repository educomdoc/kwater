'use client';

import { Suspense, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { ClipboardCheck, ArrowLeft, Send, Calendar, MapPin, Layers, GraduationCap } from 'lucide-react';
import { MOCK_PROGRAMS } from '@/lib/constants';
import { useEffect } from 'react';

function ApplyForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const programId = searchParams.get('programId');
  
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [program, setProgram] = useState<any>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    department: '',
    reason: '',
  });

  useEffect(() => {
    const fetchProgram = async () => {
      if (!programId) return;
      
      try {
        // 우선 Firestore에서 확인
        const docRef = doc(db, "programs", programId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setProgram({ id: docSnap.id, ...docSnap.data() });
        } else {
          // Mock 데이터에서 확인
          const mockProgram = MOCK_PROGRAMS.find(p => p.id === programId);
          if (mockProgram) setProgram(mockProgram);
        }
      } catch (err) {
        console.error("Error fetching program:", err);
        const mockProgram = MOCK_PROGRAMS.find(p => p.id === programId);
        if (mockProgram) setProgram(mockProgram);
      }
    };
    fetchProgram();
  }, [programId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Firebase에 저장 (기본 데이터베이스)
      const docRef = await addDoc(collection(db, "applications"), {
        ...formData,
        program_id: programId,
        program_title: program?.title || 'Unknown',
        program_round: program?.round || '-',
        status: 'pending',
        created_at: serverTimestamp(),
      });

      // 2. 구글 시트 연동 API 호출
      try {
        await fetch('/api/apply', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            programTitle: program?.title,
            programRound: program?.round,
            programDate: `${program?.startDate} ~ ${program?.endDate}`,
            programLocation: program?.location,
          }),
        });
      } catch (sheetErr) {
        console.error("Google Sheets sync failed:", sheetErr);
        // 시트 연동 실패해도 사용자에게는 성공으로 표시 (Firebase에는 저장되었으므로)
      }

      setSubmitted(true);
      setTimeout(() => router.push('/'), 3000);
    } catch (err: any) {
      alert('신청 처리 중 오류가 발생했습니다: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!programId) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-24 text-center text-white">
        <h2 className="text-xl font-bold">잘못된 접근입니다. 프로그램을 먼저 선택해주세요.</h2>
        <button onClick={() => router.push('/')} className="mt-4 text-blue-400 underline">홈으로 돌아가기</button>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-24 text-center">
        <motion.div 
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="rounded-full bg-emerald-500/20 p-8 w-24 h-24 mx-auto flex items-center justify-center mb-8"
        >
          <ClipboardCheck className="w-12 h-12 text-emerald-400" />
        </motion.div>
        <h2 className="text-3xl font-bold text-white mb-4">신청 완료!</h2>
        <p className="text-slate-400">관리자 승인 후 안내 메일이 발송됩니다. 곧 메인 페이지로 이동합니다.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-12 sm:py-24">
      <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 sm:p-12 shadow-2xl">
        <div className="flex items-center gap-4 mb-4">
          <button onClick={() => router.back()} className="p-2 hover:bg-slate-800 rounded-full transition text-slate-400">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-white">교육 프로그램 신청</h2>
            <p className="text-sm text-slate-500">정확한 정보 입력을 부탁드립니다.</p>
          </div>
        </div>

        {/* 교육 정보 요약 카드 */}
        {program && (
          <div className="mb-10 p-6 bg-slate-950/50 border border-slate-800 rounded-3xl grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="col-span-1 sm:col-span-2 flex items-start gap-3 border-b border-slate-800 pb-4 mb-2">
              <GraduationCap className="w-5 h-5 text-blue-400 mt-1 shrink-0" />
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">교육명</span>
                <h3 className="text-lg font-bold text-white leading-tight">{program.title}</h3>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Layers className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">차수</span>
                <p className="text-sm text-white font-medium">{program.round || '-'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-purple-400 shrink-0" />
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">일자</span>
                <p className="text-sm text-white font-medium">{program.startDate} ~ {program.endDate}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-rose-400 shrink-0" />
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">장소</span>
                <p className="text-sm text-white font-medium">{program.location}</p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
            <div className="group">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">성함</label>
              <input
                type="text"
                required
                value={formData.fullName}
                onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl py-4 px-6 text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all outline-none"
                placeholder="홍길동"
              />
            </div>
            <div className="group">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">이메일</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl py-4 px-6 text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all outline-none"
                placeholder="example@mail.com"
              />
            </div>
            <div className="group">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">연락처</label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl py-4 px-6 text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all outline-none"
                placeholder="010-0000-0000"
              />
            </div>
            <div className="group">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">소속</label>
              <input
                type="text"
                value={formData.department}
                onChange={(e) => setFormData({...formData, department: e.target.value})}
                className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl py-4 px-6 text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all outline-none"
                placeholder="회사/부서명"
              />
            </div>
          </div>

          <div className="group">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">신청 사유</label>
            <textarea
              rows={4}
              value={formData.reason}
              onChange={(e) => setFormData({...formData, reason: e.target.value})}
              className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl py-4 px-6 text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all outline-none resize-none"
              placeholder="본 교육 과정에 신청하시게 된 이유를 적어주세요."
            />
          </div>

          <div className="pt-6">
            <button
              type="submit"
              disabled={loading}
              className="w-full group relative flex items-center justify-center py-5 rounded-2xl bg-white text-slate-950 font-black text-lg overflow-hidden transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-emerald-500 opacity-0 group-hover:opacity-10 transition-opacity" />
              {loading ? '처리 중...' : '신청서 제출하기'}
              {!loading && <Send className="ml-3 w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ApplyPage() {
  return (
    <div className="min-h-screen bg-slate-950 px-4">
      <Suspense fallback={<div className="text-center py-24 text-white">로딩 중...</div>}>
        <ApplyForm />
      </Suspense>
    </div>
  );
}
