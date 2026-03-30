'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword 
} from 'firebase/auth';

import { doc, setDoc, getDocs, collection, query, where } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { motion, AnimatePresence } from 'framer-motion';
import { LogIn, UserPlus, ShieldCheck, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const internalEmail = `${userId}@kwater-camp.internal`;

    try {
      if (isLogin) {
        // 로그인
        await signInWithEmailAndPassword(auth, internalEmail, password);
        router.push('/');
      } else {
        // 회원가입 전 중복 아이디 체크 (Firestore)
        const q = query(collection(db, 'users'), where('username', '==', userId));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          throw new Error('이미 사용 중인 아이디입니다.');
        }

        // 계정 생성
        try {
          const userCredential = await createUserWithEmailAndPassword(auth, internalEmail, password);
          const user = userCredential.user;

          // Firestore에 유저 정보 저장
          const role = userId === 'admin' ? 'admin' : 'user';
          
          await setDoc(doc(db, 'users', user.uid), {
            username: userId,
            fullName: fullName || (userId === 'admin' ? '관리자' : '사용자'),
            role: role,
            createdAt: new Date().toISOString()
          });

          alert('회원가입이 완료되었습니다!');
          setIsLogin(true);
        } catch (authErr: any) {
          if (authErr.code === 'auth/email-already-in-use') {
            throw new Error('이미 등록된 계정입니다. 로그인을 시도해주세요.');
          }
          throw authErr;
        }
      }
    } catch (err: any) {
      console.error("Auth Error:", err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('아이디 또는 비밀번호가 일치하지 않습니다.');
      } else {
        setError(err.message || '인증 오류가 발생했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-6 bg-blue-50">
      <div className="absolute inset-0 bg-cover bg-center opacity-60" style={{ backgroundImage: "url('/hero-bg.png')" }} />
      <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-blue-50/80 to-blue-50 backdrop-blur-sm" />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative w-full max-w-md bg-white border border-blue-100 rounded-[2.5rem] p-10 shadow-xl shadow-blue-900/5"
      >
        <div className="text-center mb-10">
          <div className="inline-flex p-4 rounded-3xl bg-blue-50 mb-6">
            {isLogin ? <LogIn className="w-8 h-8 text-blue-600" /> : <UserPlus className="w-8 h-8 text-emerald-600" />}
          </div>
          <h2 className="text-3xl font-black text-slate-900">{isLogin ? '반갑습니다' : '새로운 시작'}</h2>
          <p className="text-slate-600 mt-2">{isLogin ? '아이디로 로그인을 진행하세요' : '계정을 생성하여 캠프를 즐기세요'}</p>
        </div>

        <form onSubmit={handleAuth} className="space-y-6">
          <AnimatePresence mode="wait">
            {!isLogin && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <label className="text-xs font-bold text-slate-600 uppercase tracking-widest ml-4 mb-2 block">이름</label>
                <input 
                  type="text" 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required 
                  className="w-full bg-white border border-blue-200 rounded-2xl py-4 px-6 text-slate-900 text-sm focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all shadow-sm"
                  placeholder="실명을 입력하세요"
                />
              </motion.div>
            )}
          </AnimatePresence>

          <div>
            <label className="text-xs font-bold text-slate-600 uppercase tracking-widest ml-4 mb-2 block">아이디</label>
            <input 
              type="text" 
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              required 
              className="w-full bg-white border border-blue-200 rounded-2xl py-4 px-6 text-slate-900 text-sm focus:ring-2 focus:ring-blue-500/50 outline-none transition-all shadow-sm"
              placeholder="ID를 입력하세요"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600 uppercase tracking-widest ml-4 mb-2 block">비밀번호</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
              className="w-full bg-white border border-blue-200 rounded-2xl py-4 px-6 text-slate-900 text-sm focus:ring-2 focus:ring-blue-500/50 outline-none transition-all shadow-sm"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-600 text-xs bg-red-50 p-4 rounded-xl border border-red-200">
              <AlertCircle className="w-4 h-4" /> {error}
            </div>
          )}

          <button 
            disabled={loading}
            className={`w-full py-4 rounded-2xl font-black text-white shadow-xl transition-all ${
              isLogin 
              ? 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/20' 
              : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20'
            } active:scale-95 disabled:opacity-50`}
          >
            {loading ? '처리 중...' : (isLogin ? '로그인' : '회원가입')}
          </button>
        </form>

        <div className="mt-8 pt-8 border-t border-blue-100 text-center">
          <button 
            onClick={() => { setIsLogin(!isLogin); setError(''); }}
            className="text-sm font-bold text-slate-500 hover:text-blue-600 transition"
          >
            {isLogin ? '아직 계정이 없으신가요? 회원가입' : '이미 계정이 있으신가요? 로그인'}
          </button>
        </div>

        {userId === 'admin' && isLogin && (
          <div className="mt-6 flex items-center justify-center gap-2 text-[10px] font-bold text-blue-600 uppercase tracking-[0.2em] animate-pulse">
            <ShieldCheck className="w-3 h-3" /> Admin Mode Detected
          </div>
        )}
      </motion.div>
    </div>
  );
}
