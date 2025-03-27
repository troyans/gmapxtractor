'use client';

import { useState, useEffect } from 'react';
import { Search, Eye, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import MainLayout from '@/components/layout/MainLayout';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

type SearchHistory = {
  id: string;
  location: string;
  keywords: string;
  results_count: number;
  created_at: string;
};

export default function HistoryPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  const supabase = createClientComponentClient();

  // Fetch search history
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const { data, error } = await supabase
          .from('search_history')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setSearchHistory(data || []);
      } catch (error) {
        console.error('Error fetching history:', error);
      } finally {
        setHistoryLoading(false);
      }
    };

    fetchHistory();
  }, [supabase]);

  // Handle viewing history data
  const handleViewHistory = (historyItem: SearchHistory) => {
    router.push(`/history/${historyItem.id}`);
  };

  // Handle deleting history
  const handleDeleteHistory = async (historyId: string) => {
    if (!confirm('Are you sure you want to delete this search history?')) return;

    try {
      const { error } = await supabase
        .from('search_history')
        .delete()
        .eq('id', historyId);

      if (error) throw error;

      // Remove from local state
      setSearchHistory(prev => prev.filter(h => h.id !== historyId));
    } catch (error) {
      console.error('Error deleting history:', error);
      alert('Failed to delete history');
    }
  };

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Search History</h1>
          <p className="text-gray-500">View and manage your previous searches</p>
        </div>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Search History</h2>
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Filter history..."
                className="pl-8"
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Date</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Keywords</TableHead>
                  <TableHead className="text-right">Results</TableHead>
                  <TableHead className="w-[150px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {historyLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-4">
                      Loading history...
                    </TableCell>
                  </TableRow>
                ) : searchHistory.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-4">
                      No search history found
                    </TableCell>
                  </TableRow>
                ) : (
                  searchHistory
                    .filter(item =>
                      Object.values(item).some(value =>
                        String(value).toLowerCase().includes(searchTerm.toLowerCase())
                      )
                    )
                    .map((history) => (
                      <TableRow key={history.id}>
                        <TableCell className="font-medium">
                          {new Date(history.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>{history.location}</TableCell>
                        <TableCell>{history.keywords}</TableCell>
                        <TableCell className="text-right">{history.results_count}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewHistory(history)}
                              className="inline-flex items-center gap-2"
                            >
                              <Eye className="h-4 w-4" />
                              View
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteHistory(history.id)}
                              className="inline-flex items-center gap-2 text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </MainLayout>
  );
} 