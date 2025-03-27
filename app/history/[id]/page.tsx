'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Download } from 'lucide-react';
import { Card } from '@/components/ui/card';
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

type ScrapedContact = {
  id: string;
  business_name: string;
  business_type: string;
  address: string;
  office_hours: string;
  website: string;
  phone: string;
  email: string;
  rating: number;
  review_count: number;
  location: string;
  keywords: string;
  created_at: string;
};

export default function HistoryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [history, setHistory] = useState<SearchHistory | null>(null);
  const [contacts, setContacts] = useState<ScrapedContact[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createClientComponentClient();

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Fetching data for ID:', params.id);

        // Fetch history details
        const { data: historyData, error: historyError } = await supabase
          .from('search_history')
          .select('*')
          .eq('id', params.id)
          .single();

        console.log('History data:', historyData);
        console.log('History error:', historyError);

        if (historyError) throw historyError;
        setHistory(historyData);

        // Fetch contacts data
        const response = await fetch(`/api/contacts?search_id=${params.id}`);
        const { data, error } = await response.json();
        
        console.log('Contacts data:', data);
        console.log('Contacts error:', error);

        if (error) throw error;
        setContacts(data || []);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchData();
    }
  }, [params.id, supabase]);

  const handleDownload = () => {
    if (!contacts.length) return;

    const headers = [
      'Business Name',
      'Type',
      'Address',
      'Office Hours',
      'Website',
      'Phone',
      'Email',
      'Rating',
      'Review Count'
    ];

    const csvContent = [
      headers.join(','),
      ...contacts.map(contact => [
        contact.business_name,
        contact.business_type,
        contact.address,
        contact.office_hours,
        contact.website,
        contact.phone,
        contact.email,
        contact.rating,
        contact.review_count
      ].map(value => `"${value || ''}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `search_results_${history?.location}_${history?.keywords}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="max-w-7xl mx-auto p-6">
          <div className="text-center py-12">Loading...</div>
        </div>
      </MainLayout>
    );
  }

  if (!history) {
    return (
      <MainLayout>
        <div className="max-w-7xl mx-auto p-6">
          <div className="text-center py-12">History not found</div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Button
              variant="ghost"
              className="mb-4"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to History
            </Button>
            <h1 className="text-3xl font-bold mb-2">Search Details</h1>
            <p className="text-gray-500">
              Results for {history.location} - {history.keywords}
            </p>
          </div>
          <Button
            variant="outline"
            onClick={handleDownload}
            disabled={!contacts.length}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Download CSV
          </Button>
        </div>

        <Card className="p-6">
          <div className="grid grid-cols-2 gap-6 mb-8">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Location</h3>
              <p className="mt-1 text-lg">{history.location}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Keywords</h3>
              <p className="mt-1 text-lg">{history.keywords}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Date</h3>
              <p className="mt-1 text-lg">
                {new Date(history.created_at).toLocaleDateString()}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Results</h3>
              <p className="mt-1 text-lg">{history.results_count}</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-semibold">Business Name</TableHead>
                  <TableHead className="font-semibold">Type</TableHead>
                  <TableHead className="font-semibold">Address</TableHead>
                  <TableHead className="font-semibold">Website</TableHead>
                  <TableHead className="font-semibold">Phone</TableHead>
                  <TableHead className="font-semibold">Email</TableHead>
                  <TableHead className="font-semibold">Rating</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contacts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-4">
                      No data available
                    </TableCell>
                  </TableRow>
                ) : (
                  contacts.map((contact) => (
                    <TableRow key={contact.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">
                        {contact.business_name || '-'}
                      </TableCell>
                      <TableCell>{contact.business_type || '-'}</TableCell>
                      <TableCell>
                        {contact.address ? (
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(contact.address)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            {contact.address}
                          </a>
                        ) : '-'}
                      </TableCell>
                      <TableCell>
                        {contact.website ? (
                          <a
                            href={contact.website.startsWith('http') ? contact.website : `https://${contact.website}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            {contact.website}
                          </a>
                        ) : '-'}
                      </TableCell>
                      <TableCell>
                        {contact.phone ? (
                          <a
                            href={`tel:${contact.phone}`}
                            className="text-blue-600 hover:underline"
                          >
                            {contact.phone}
                          </a>
                        ) : '-'}
                      </TableCell>
                      <TableCell>
                        {contact.email ? (
                          <a
                            href={`mailto:${contact.email}`}
                            className="text-blue-600 hover:underline"
                          >
                            {contact.email}
                          </a>
                        ) : '-'}
                      </TableCell>
                      <TableCell>
                        {contact.rating ? (
                          <div className="flex items-center gap-1">
                            <span>{contact.rating}</span>
                            <span className="text-yellow-400">★</span>
                            {contact.review_count && (
                              <span className="text-sm text-gray-500">
                                ({contact.review_count})
                              </span>
                            )}
                          </div>
                        ) : '-'}
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