'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { ArrowRight, BookOpen, Users } from 'lucide-react';
import { motion } from 'framer-motion';

import { MOCK_PROGRAMS } from '@/lib/constants';

export default function Home() {
  const [programs, setPrograms] = useState<any[]>([]);

  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        const q = query(collection(db, "programs"), orderBy("created_at", "desc"));
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setPrograms(data.length > 0 ? data : MOCK_PROGRAMS);
      } catch (error) {
        console.error("Error fetching programs:", error);
        setPrograms(MOCK_PROGRAMS);
      }
    };
    fetchPrograms();
  }, []);

  return (
    <div className="bg-blue-50 text-slate-900 min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-24 sm:py-32">
        <div className="absolute inset-0 bg-cover bg-center opacity-60" style={{ backgroundImage: "url('/hero-bg.png')" }} />
        <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-blue-50/80 to-blue-50" />

        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto max-w-2xl text-center"
          >
            <h1 className="text-5xl font-extrabold tracking-tight sm:text-7xl bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-emerald-600">
              한국수자원공사 <br /> 가족캠프
            </h1>
            <p className="mt-8 text-lg leading-8 text-slate-700 font-medium">
              진행 중인 캠프를 확인하고 원하시는 차수에 신청해주세요.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Program List Section */}
      <section id="programs" className="mx-auto max-w-7xl px-6 lg:px-8 py-1">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-slate-900">신청 가능한 캠프</h2>
            <p className="mt-2 text-slate-600 font-medium">지금 신청 가능한 캠프를 확인하세요.</p>
          </div>
          <Link href="/apply" className="text-blue-600 hover:text-blue-700 flex items-center gap-2 text-sm font-bold">
            전체 보기 <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {programs.map((program, idx) => (
            <motion.div
              key={program.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white/80 backdrop-blur-xl border border-blue-100 rounded-3xl p-8 hover:border-blue-400 transition-all shadow-xl shadow-blue-900/5 group"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="bg-blue-50 p-3 rounded-2xl">
                  <BookOpen className="w-6 h-6 text-blue-600" />
                </div>
                <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">{program.location}</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-4 group-hover:text-blue-600 transition">{program.title}</h3>
              <p className="text-slate-600 text-sm leading-relaxed mb-8 line-clamp-2">{program.description}</p>

              <div className="space-y-3 mb-8">
              </div>

              <Link
                href={`/apply?programId=${program.id}`}
                className="w-full inline-flex justify-center items-center py-3 rounded-2xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-600/20"
              >
                신청하기
              </Link>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
