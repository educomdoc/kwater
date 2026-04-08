'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import Image from 'next/image';
import { useAuth } from '@/lib/auth-context';
import { LogOut, Shield, User as UserIcon, Menu, X } from 'lucide-react';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function Navbar() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, userData, logout } = useAuth();

  const navItems = [
    { name: '교육 프로그램', href: '/' },
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

          {/* Desktop Navigation */}
          <div className="hidden md:ml-6 md:flex md:space-x-8">
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
            {/* User Session Info (Desktop) */}
            <div className="hidden md:flex items-center space-x-4">
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

            {/* Mobile Menu Toggle Button */}
            <div className="flex md:hidden items-center">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none"
              >
                <span className="sr-only">메뉴 열기</span>
                {isMenuOpen ? (
                  <X className="block h-6 w-6" aria-hidden="true" />
                ) : (
                  <Menu className="block h-6 w-6" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <div className={cn(
        "md:hidden absolute w-full bg-white border-b border-gray-200 transition-all duration-300 ease-in-out overflow-hidden",
        isMenuOpen ? "max-h-96 opacity-100 py-4" : "max-h-0 opacity-0 py-0"
      )}>
        <div className="space-y-1 px-4 pb-3 pt-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsMenuOpen(false)}
              className={cn(
                "block rounded-md px-3 py-2 text-base font-medium transition-colors",
                pathname === item.href
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              {item.name}
            </Link>
          ))}
          
          <div className="mt-4 pt-4 border-t border-gray-100">
            {user ? (
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2 text-slate-600 px-3">
                  {userData?.role === 'admin' ? <Shield className="w-4 h-4 text-blue-600" /> : <UserIcon className="w-4 h-4" />}
                  <span className="text-sm font-semibold">{userData?.username || '사용자'}님 고맙습니다.</span>
                </div>
                <button 
                  onClick={() => {
                    logout();
                    setIsMenuOpen(false);
                  }}
                  className="flex items-center gap-2 w-full text-left px-3 py-2 text-base font-medium text-red-600 hover:bg-red-50 rounded-md transition"
                >
                  <LogOut className="w-5 h-5" />
                  로그아웃
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                onClick={() => setIsMenuOpen(false)}
                className="block w-full text-center rounded-xl bg-blue-600 px-4 py-3 text-base font-semibold text-white shadow-sm hover:bg-blue-500"
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
