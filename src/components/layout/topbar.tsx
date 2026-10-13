'use client';

import React from 'react';
import {
  Search,
  Plus,
  Timer,
  Menu,
  Key,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserProfile } from '@/types';

interface TopbarProps {
  user: UserProfile;
  onOpenQuickCapture: () => void;
  onOpenTimer: () => void;
  onOpenMobileMenu: () => void;
  onResetDemoData: () => void;
  onOpenApiKeys: () => void;
}

export function Topbar({
  user,
  onOpenQuickCapture,
  onOpenTimer,
  onOpenMobileMenu,
  onResetDemoData,
  onOpenApiKeys,
}: TopbarProps) {
  return (
    <header className="h-16 bg-white border-b border-[#E6EAF2] px-4 md:px-8 flex items-center justify-between shrink-0 z-20">
      {/* Mobile toggle & Search */}
      <div className="flex items-center gap-3 flex-1 max-w-lg">
        <button
          onClick={onOpenMobileMenu}
          className="md:hidden p-2 text-[#718096] hover:text-[#17243D] hover:bg-[#F0F2FA] rounded-xl transition-colors cursor-pointer"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Search Bar */}
        <div
          onClick={onOpenQuickCapture}
          className="hidden sm:flex items-center gap-2.5 px-3.5 py-2 bg-[#F6F8FC] border border-[#E6EAF2] hover:border-[#CBD5E1] rounded-xl text-xs text-[#718096] cursor-pointer w-full max-w-xs transition-colors"
        >
          <Search className="w-3.5 h-3.5 text-[#94A3B8]" />
          <span className="flex-1 truncate">Search notes, tasks, videos...</span>
          <kbd className="px-1.5 py-0.5 bg-white border border-[#E6EAF2] rounded text-[10px] font-mono text-[#94A3B8] shadow-2xs">
            Ctrl+K
          </kbd>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2.5 sm:gap-4">
        {/* Focus Timer Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={onOpenTimer}
          className="hidden sm:inline-flex text-xs text-[#17243D] border-[#E6EAF2] hover:border-[#20C997] hover:text-[#138A67]"
        >
          <Timer className="w-3.5 h-3.5 text-[#20C997]" />
          <span>Timer</span>
        </Button>

        {/* API Keys Configuration Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={onOpenApiKeys}
          className="inline-flex text-xs text-[#17243D] border-[#E6EAF2] hover:border-[#6658F5] hover:text-[#6658F5] hover:bg-purple-50/50"
        >
          <Key className="w-3.5 h-3.5 text-[#6658F5]" />
          <span>API Keys</span>
        </Button>

        {/* Global Quick Capture CTA */}
        <Button
          variant="primary"
          size="sm"
          onClick={onOpenQuickCapture}
          className="text-xs bg-[#6658F5] hover:bg-[#5345E6] shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span className="font-semibold">Quick Capture</span>
        </Button>

        {/* User Avatar */}
        <div className="flex items-center gap-2 pl-2 border-l border-[#F0F2FA]">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#6658F5] to-[#20C997] flex items-center justify-center text-white font-bold text-xs shadow-xs">
            {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'L'}
          </div>
          <div className="hidden xl:block text-left">
            <p className="text-xs font-semibold text-[#17243D] leading-none">
              {user.displayName || 'Learner'}
            </p>
            <p className="text-[10px] text-[#718096] mt-0.5">
              Active Account
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
