'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import Image from 'next/image';
import { useAuth } from '@/lib/auth-context';
import { LogOut, Shield, User as UserIcon } from 'lucide-react';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function Navbar() {
  const pathname = usePathname();
  const { user, userData, logout } = useAuth();

  const navItems = [
    { name: '교육 프로그램', href: '/' },
    { name: '교육 신청', href: '/apply' },
  ];

  if (user) {
    navItems.push({ name: '신청한 프로그램', href: '/my-applications' });
  }

  navItems.push({ name: '커뮤니티', href: '/community' });

  // 관리자인 경우에만 메뉴 추가
  if (userData?.role === 'admin') {
    navItems.push({ name: '관리자 대시보드', href: '/admin' });
  }

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between items-center">
          <div className="flex shrink-0 items-center gap-3">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative w-10 h-10 overflow-hidden rounded-xl bg-blue-50/50 p-1 group-hover:scale-110 transition-transform">
                <Image 
                  src="/logo_kwater.png" 
                  alt="K-water logo" 
                  fill
                  className="object-contain"
                />
              </div>
              <span className="text-xl font-black text-slate-900 tracking-tight">
                수자원공사 <span className="text-blue-600">가족캠프</span>
              </span>
            </Link>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium transition-colors",
                  pathname === item.href
                    ? "border-blue-500 text-gray-900"
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                )}
              >
                {item.name}
              </Link>
            ))}
          </div>
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-slate-600 bg-slate-100 py-1.5 px-3 rounded-full">
                  {userData?.role === 'admin' ? <Shield className="w-3.5 h-3.5 text-blue-600" /> : <UserIcon className="w-3.5 h-3.5" />}
                  <span className="text-xs font-bold">{userData?.username || '사용자'}님</span>
                </div>
                <button 
                  onClick={logout}
                  className="p-2 rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50 transition"
                  title="로그아웃"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              >
                로그인
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
