import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';

export interface DashboardContextType {
  selectedMonth: string;
  setSelectedMonth: (m: string) => void;
  refreshTrigger: number;
  triggerRefresh: () => void;
}

export const DashboardLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Default to current month "YYYY-MM"
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const triggerRefresh = () => setRefreshTrigger((prev) => prev + 1);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="lg:pl-64 flex flex-col flex-1">
        <Navbar
          onMenuToggle={() => setIsSidebarOpen((prev) => !prev)}
          selectedMonth={selectedMonth}
          onMonthChange={setSelectedMonth}
          onDataRefresh={triggerRefresh}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto animate-in fade-in duration-300">
          <Outlet context={{ selectedMonth, setSelectedMonth, refreshTrigger, triggerRefresh }} />
        </main>
      </div>
    </div>
  );
};
