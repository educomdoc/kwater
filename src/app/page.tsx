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
    <div className="bg-slate-950 text-white min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-24 sm:py-32">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1470770841072-f978cf4d019e?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')] bg-cover bg-center opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-950/50 to-slate-950" />
        
        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto max-w-2xl text-center"
          >
            <h1 className="text-5xl font-extrabold tracking-tight sm:text-7xl bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
              한국수자원공사 <br/> 가족캠프
            </h1>
            <p className="mt-8 text-lg leading-8 text-slate-300">
              진행 중인 교육을 확인하고 원하는 프로그램과 시간을 신청해주세요
            </p>
          </motion.div>
        </div>
      </section>

      {/* Program List Section */}
      <section id="programs" className="mx-auto max-w-7xl px-6 lg:px-8 py-1">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-white">진행 중인 교육</h2>
            <p className="mt-2 text-slate-400">실시간 모집 중인 교육 프로그램을 확인하세요.</p>
          </div>
          <Link href="/apply" className="text-blue-400 hover:text-blue-300 flex items-center gap-2 text-sm font-semibold">
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
              className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 hover:border-blue-500/50 transition-all group"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="bg-blue-500/10 p-3 rounded-2xl">
                  <BookOpen className="w-6 h-6 text-blue-400" />
                </div>
                <span className="text-xs font-medium text-slate-500 uppercase tracking-widest">{program.location}</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-4 group-hover:text-blue-400 transition">{program.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-8 line-clamp-2">{program.description}</p>
              
              <div className="space-y-3 mb-8">
                <div className="flex items-center text-xs text-slate-400">
                  <Users className="w-4 h-4 mr-2 text-emerald-400" />
                  신청 가능 인원: {program.capacity - program.currentApplicants}명
                </div>
                <div className="overflow-hidden h-1.5 bg-slate-800 rounded-full">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full" 
                    style={{ width: `${(program.currentApplicants / program.capacity) * 100}%` }}
                  />
                </div>
              </div>

              <Link 
                href={`/apply?programId=${program.id}`}
                className="w-full inline-flex justify-center items-center py-3 rounded-2xl bg-white text-slate-950 font-bold hover:bg-blue-400 transition"
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
