'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { Topbar } from '@/components/layout/topbar';
import { QuickCaptureModal } from '@/components/quick-capture-modal';
import { ManageSectorsModal } from '@/components/manage-sectors-modal';
import { StudyTimerModal } from '@/components/study-timer-modal';
import { ApiKeysModal } from '@/components/api-keys-modal';
import { StorageEngine } from '@/lib/storage';
import { Sector, UserProfile } from '@/types';
import { X } from 'lucide-react';

export function AppShell({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [isQuickCaptureOpen, setIsQuickCaptureOpen] = useState(false);
  const [isManageSectorsOpen, setIsManageSectorsOpen] = useState(false);
  const [isTimerOpen, setIsTimerOpen] = useState(false);
  const [isApiKeysOpen, setIsApiKeysOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const loadData = () => {
    const currentUser = StorageEngine.getCurrentUser();
    const currentSectors = StorageEngine.getSectors();
    setUser(currentUser);
    setSectors(currentSectors);
  };

  useEffect(() => {
    loadData();

    // Global keyboard shortcut: Ctrl+K or Cmd+K for Quick Capture
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsQuickCaptureOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [refreshKey]);

  const handleResetDemoData = () => {
    StorageEngine.resetToDemoData();
    setRefreshKey((k) => k + 1);
    window.location.reload();
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#F6F8FC] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#6658F5] border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#F6F8FC] overflow-hidden">
      {/* Desktop Fixed Left Sidebar */}
      <div className="hidden md:flex h-full">
        <Sidebar
          sectors={sectors}
          onOpenTimer={() => setIsTimerOpen(true)}
          onOpenManageSectors={() => setIsManageSectorsOpen(true)}
        />
      </div>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-[#17243D]/40 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="relative w-72 max-w-xs bg-white h-full shadow-2xl z-10 flex flex-col">
            <div className="absolute top-4 right-4 z-20">
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 text-[#718096] hover:text-[#17243D] rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <Sidebar
              sectors={sectors}
              onOpenTimer={() => {
                setIsMobileMenuOpen(false);
                setIsTimerOpen(true);
              }}
              onOpenManageSectors={() => {
                setIsMobileMenuOpen(false);
                setIsManageSectorsOpen(true);
              }}
              onCloseMobile={() => setIsMobileMenuOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Main Column */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar
          user={user}
          onOpenQuickCapture={() => setIsQuickCaptureOpen(true)}
          onOpenTimer={() => setIsTimerOpen(true)}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          onResetDemoData={handleResetDemoData}
          onOpenApiKeys={() => setIsApiKeysOpen(true)}
        />

        {/* Roomy Main Canvas */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-8">{children}</div>
        </main>
      </div>

      {/* Global Quick Capture Modal */}
      <QuickCaptureModal
        isOpen={isQuickCaptureOpen}
        onClose={() => setIsQuickCaptureOpen(false)}
        sectors={sectors}
        onSuccess={() => {
          setRefreshKey((k) => k + 1);
        }}
      />

      {/* Manage Sectors Modal */}
      <ManageSectorsModal
        isOpen={isManageSectorsOpen}
        onClose={() => setIsManageSectorsOpen(false)}
        sectors={sectors}
        onSectorsChanged={() => {
          setRefreshKey((k) => k + 1);
        }}
      />

      {/* Study Focus Timer Modal */}
      <StudyTimerModal
        isOpen={isTimerOpen}
        onClose={() => setIsTimerOpen(false)}
        sectors={sectors}
        onSessionLogged={() => {
          setRefreshKey((k) => k + 1);
        }}
      />

      {/* API Keys & Model Config Modal */}
      <ApiKeysModal
        isOpen={isApiKeysOpen}
        onClose={() => setIsApiKeysOpen(false)}
        onConfigUpdated={() => {
          setRefreshKey((k) => k + 1);
        }}
      />
    </div>
  );
}
