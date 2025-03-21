'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Search, Download, ChevronDown } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import MainLayout from '@/components/layout/MainLayout';

type SearchHistory = {
  id: string;
  location: string;
  keywords: string;
  results_count: number;
  category: string;
  created_at: string;
};

export default function HistoryPage() {
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const router = useRouter();

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const supabase = createClientComponentClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          router.push('/auth/login');
          return;
        }

        const { data, error } = await supabase
          .from('search_history')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setSearchHistory(data || []);
      } catch (error) {
        console.error('Error fetching history:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [router]);

  const handleRerun = async (location: string, keywords: string) => {
    try {
      const response = await fetch('/api/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ location, keywords }),
      });

      if (!response.ok) {
        throw new Error('Failed to perform search');
      }

      router.push('/results');
    } catch (error) {
      console.error('Search error:', error);
    }
  };

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto p-6">
        {/* Header with Search */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Search History</h1>
            <p className="text-gray-500">View and manage your previous searches</p>
          </div>
          <div className="relative w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search"
              className="pl-8"
            />
          </div>
        </div>

        {/* Filter Section */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <span className="text-sm">Filter by Category</span>
            <Button variant="outline" className="text-sm">
              {selectedCategory}
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </div>
          <Button variant="ghost" className="text-sm text-gray-500">
            Clear Filter
          </Button>
        </div>

        {/* History Table */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 font-medium">Location</th>
                  <th className="text-left p-4 font-medium">Keyword</th>
                  <th className="text-left p-4 font-medium">Date</th>
                  <th className="text-left p-4 font-medium">Results</th>
                  <th className="text-left p-4 font-medium">Category</th>
                  <th className="text-left p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center p-4">
                      Loading...
                    </td>
                  </tr>
                ) : searchHistory.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center p-4">
                      No search history found
                    </td>
                  </tr>
                ) : (
                  searchHistory.map((item) => (
                    <tr key={item.id} className="border-b">
                      <td className="p-4">{item.location}</td>
                      <td className="p-4">{item.keywords}</td>
                      <td className="p-4">
                        {new Date(item.created_at).toLocaleDateString()}
                      </td>
                      <td className="p-4">{item.results_count}</td>
                      <td className="p-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100">
                          {item.category || 'Uncategorized'}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRerun(item.location, item.keywords)}
                          >
                            <Search className="h-4 w-4" />
                            Re-run
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Download className="h-4 w-4" />
                            Download
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Pagination */}
        <div className="flex justify-between items-center mt-4">
          <Button variant="ghost" disabled>
            Previous
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="min-w-[40px]">1</Button>
            <Button variant="ghost" className="min-w-[40px]">2</Button>
            <Button variant="ghost" className="min-w-[40px]">Next</Button>
          </div>
          <div className="text-sm text-gray-500">
            Showing 1-5 of 6 results
          </div>
        </div>
      </div>
    </MainLayout>
  );
} 