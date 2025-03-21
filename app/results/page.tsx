'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Search, Download, Filter, Home, Settings, LogOut, Menu } from 'lucide-react';

type ScrapedContact = {
  id: string;
  business_name: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  rating: number;
  review_count: number;
  location: string;
  keywords: string;
  created_at: string;
};

export default function ResultsPage() {
  const [contacts, setContacts] = useState<ScrapedContact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<ScrapedContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([
    'business_name',
    'address',
    'phone',
    'email',
    'website',
    'rating',
    'review_count'
  ]);
  
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    const checkAuthAndFetchData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push('/auth/login');
          return;
        }

        const { data, error } = await supabase
          .from('scraped_contacts')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setContacts(data || []);
        setFilteredContacts(data || []);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load results');
      } finally {
        setLoading(false);
      }
    };

    checkAuthAndFetchData();
  }, [supabase, router]);

  useEffect(() => {
    const filtered = contacts.filter(contact =>
      Object.values(contact).some(value =>
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
    setFilteredContacts(filtered);
  }, [searchTerm, contacts]);

  const handleColumnToggle = (column: string) => {
    setSelectedColumns(prev =>
      prev.includes(column)
        ? prev.filter(col => col !== column)
        : [...prev, column]
    );
  };

  const exportToCSV = () => {
    if (filteredContacts.length === 0) return;

    const headers = selectedColumns.join(',');
    const rows = filteredContacts.map(contact => {
      return selectedColumns
        .map(column => {
          const value = contact[column as keyof ScrapedContact];
          return typeof value === 'string' ? `"${value}"` : value;
        })
        .join(',');
    });

    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'scraped_contacts.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const columns = [
    { key: 'business_name', label: 'Business Name' },
    { key: 'address', label: 'Address' },
    { key: 'phone', label: 'Phone' },
    { key: 'email', label: 'Email' },
    { key: 'website', label: 'Website' },
    { key: 'rating', label: 'Rating' },
    { key: 'review_count', label: 'Reviews' },
    { key: 'location', label: 'Location' },
    { key: 'keywords', label: 'Keywords' }
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/auth/login');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 z-40 w-64 h-screen transition-transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-full px-3 py-4 overflow-y-auto bg-white border-r">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Dashboard</h2>
            <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(false)}>
              <Menu className="h-6 w-6" />
            </Button>
          </div>
          <nav className="space-y-2">
            <Button variant="ghost" className="w-full justify-start" onClick={() => router.push('/')}>
              <Home className="mr-2 h-4 w-4" />
              Home
            </Button>
            <Button variant="ghost" className="w-full justify-start" onClick={() => router.push('/settings')}>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Button>
            <Button variant="ghost" className="w-full justify-start" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </nav>
        </div>
      </aside>

      {/* Main content */}
      <div className={`p-4 ${isSidebarOpen ? 'ml-64' : 'ml-0'} transition-margin duration-300`}>
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            {!isSidebarOpen && (
              <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(true)}>
                <Menu className="h-6 w-6" />
              </Button>
            )}
            <h1 className="text-2xl font-bold">Search Results</h1>
            <div className="flex items-center gap-4">
              <div className="relative w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search results..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Button onClick={exportToCSV} disabled={filteredContacts.length === 0}>
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Total Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{filteredContacts.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Average Rating</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(filteredContacts.reduce((acc, curr) => acc + (curr.rating || 0), 0) / filteredContacts.length || 0).toFixed(1)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Total Reviews</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {filteredContacts.reduce((acc, curr) => acc + (curr.review_count || 0), 0)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Contact List</CardTitle>
              <CardDescription>
                View and manage your scraped contact information
              </CardDescription>
            </div>
            <Button variant="outline" onClick={() => document.getElementById('column-select')?.click()}>
              <Filter className="mr-2 h-4 w-4" />
              Columns
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]" />
                <p className="mt-2 text-gray-500">Loading results...</p>
              </div>
            ) : error ? (
              <div className="text-red-500 text-center py-8">{error}</div>
            ) : filteredContacts.length === 0 ? (
              <div className="text-center py-8">No results found</div>
            ) : (
              <>
                <div className="hidden">
                  <div id="column-select" className="flex flex-wrap gap-4 p-4 bg-gray-50 rounded-lg mb-4">
                    {columns.map(({ key, label }) => (
                      <label key={key} className="flex items-center space-x-2">
                        <Checkbox
                          checked={selectedColumns.includes(key)}
                          onCheckedChange={() => handleColumnToggle(key)}
                        />
                        <span>{label}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {columns.map(({ key, label }) => (
                          selectedColumns.includes(key) && (
                            <TableHead key={key} className="font-semibold">
                              {label}
                            </TableHead>
                          )
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredContacts.map((contact) => (
                        <TableRow key={contact.id}>
                          {columns.map(({ key }) => (
                            selectedColumns.includes(key) && (
                              <TableCell key={key}>
                                {key === 'website' ? (
                                  <a
                                    href={contact[key]}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-500 hover:underline"
                                  >
                                    {contact[key]}
                                  </a>
                                ) : key === 'rating' ? (
                                  <span className="flex items-center">
                                    {contact[key]}
                                    <span className="text-yellow-400 ml-1">★</span>
                                  </span>
                                ) : (
                                  contact[key as keyof ScrapedContact]
                                )}
                              </TableCell>
                            )
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 