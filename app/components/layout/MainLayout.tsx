'use client';

import { useRouter } from 'next/navigation';
import { Search, CreditCard, LogOut, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const router = useRouter();
  const supabase = createClientComponentClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/auth/login');
  };

  const navigation = [
    { name: 'Search', icon: Search, href: '/' },
    { name: 'Profile', icon: User, href: '/settings/profile' },
    { name: 'Billing', icon: CreditCard, href: '/settings/billing' },
  ];

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
          {navigation.map((item) => (
            <Button
              key={item.name}
              variant="ghost"
              className="w-full justify-start text-base font-normal"
              onClick={() => router.push(item.href)}
            >
              <item.icon className="h-4 w-4 mr-3" />
              {item.name}
            </Button>
          ))}
        </nav>

        {/* Credits and User Info */}
        <div className="border-t p-4 space-y-4">
          <div className="space-y-1">
            <div className="text-sm font-medium">Credits</div>
            <div className="h-2 bg-gray-100 rounded-full">
              <div className="h-2 bg-black rounded-full" style={{ width: '75%' }} />
            </div>
            <div className="text-sm text-gray-500">750/1000 credits remaining</div>
          </div>
          <Button
            variant="default"
            className="w-full bg-black text-white hover:bg-gray-800"
            onClick={() => router.push('/settings/billing')}
          >
            Upgrade Plan
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">JD</div>
              <div className="text-sm text-gray-500">john@example.com</div>
            </div>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={handleLogout}
              className="text-gray-500 hover:text-gray-700"
            >
              <LogOut className="h-4 w-4" />
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