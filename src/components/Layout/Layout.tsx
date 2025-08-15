import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') as 'light' | 'dark' || 'light';
    }
    return 'light';
  });

  useEffect(() => {
    localStorage.setItem('theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col lg:flex-row">
      {/* Sidebar overlays on mobile, static on desktop */}
      <Sidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />
  <div className="flex-1 flex flex-col w-full">
        <Header 
          theme={theme}
          onThemeToggle={toggleTheme}
        />
        <main className="p-2 sm:p-4 md:p-6 flex-1 w-full max-w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
}