'use client';

import { useRouter } from 'next/navigation';
import { Search, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const router = useRouter();

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-[240px] border-r bg-white flex flex-col h-screen fixed">
        {/* Logo */}
        <div className="p-4 border-b">
          <h1 className="text-xl font-bold">LocalLeads</h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          <Button
            variant="ghost"
            className="w-full justify-start text-base font-normal"
            onClick={() => router.push('/')}
          >
            <Search className="h-4 w-4 mr-3" />
            Search
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start text-base font-normal"
            onClick={() => router.push('/settings')}
          >
            <Settings className="h-4 w-4 mr-3" />
            Settings
          </Button>
        </nav>

        {/* Credits and User Info */}
        <div className="border-t p-4 space-y-4">
          <div className="space-y-1">
            <div className="text-sm font-medium">Credits</div>
            <div className="h-2 bg-gray-100 rounded-full">
              <div className="h-2 bg-black rounded-full" style={{ width: '75%' }} />
            </div>
            <div className="text-sm text-gray-500">250 credits remaining</div>
          </div>
          <Button
            variant="default"
            className="w-full bg-black text-white hover:bg-gray-800"
          >
            Upgrade Plan
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">JD</div>
              <div className="text-sm text-gray-500">john@example.com</div>
            </div>
            <Button variant="ghost" size="icon">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-[240px]">
        {children}
      </main>
    </div>
  );
} 