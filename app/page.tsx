'use client';

import { useState, useEffect } from 'react';
import { Search, ChevronLeft, ChevronRight, Download, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import MainLayout from '@/components/layout/MainLayout';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import React from 'react';

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

type SearchHistory = {
  id: string;
  location: string;
  keywords: string;
  results_count: number;
  created_at: string;
};

export default function HomePage() {
  const [location, setLocation] = useState('');
  const [keywords, setKeywords] = useState('');
  const [contacts, setContacts] = useState<ScrapedContact[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState<{
    key: keyof ScrapedContact;
    direction: 'asc' | 'desc';
  } | null>(null);

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

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!location || !keywords) return;

    setLoading(true);
    setError(null);
    setCurrentPage(1);
    setSelectedRows([]);
    setContacts([]);

    try {
      const response = await fetch('/api/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ location, keywords }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to perform search');
      }

      if (data.data && Array.isArray(data.data)) {
        if (data.data.length === 0) {
          setError('No businesses found. Please try different search terms or check if the location is correct.');
        } else {
          setContacts(data.data);
        }
      } else {
        throw new Error('Invalid response format from server');
      }
    } catch (error) {
      console.error('Search error:', error);
      setError(
        error instanceof Error 
          ? error.message 
          : 'An unexpected error occurred. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRowSelect = (id: string) => {
    setSelectedRows(prev =>
      prev.includes(id)
        ? prev.filter(rowId => rowId !== id)
        : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedRows.length === filteredContacts.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(filteredContacts.map(contact => contact.id));
    }
  };

  const handleDeleteSelected = async () => {
    if (!selectedRows.length) return;
    
    if (!confirm('Are you sure you want to delete the selected items?')) return;

    try {
      const response = await fetch('/api/contacts/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids: selectedRows }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete contacts');
      }

      // Remove deleted contacts from state
      setContacts(prev => prev.filter(contact => !selectedRows.includes(contact.id)));
      setSelectedRows([]);
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete contacts');
    }
  };

  const handleDownloadSelected = () => {
    if (!selectedRows.length) return;

    const selectedContacts = contacts.filter(contact => selectedRows.includes(contact.id));
    const headers = ['business_name', 'email', 'phone', 'address', 'website'];
    const csvContent = [
      headers.join(','),
      ...selectedContacts.map(contact => 
        headers.map(header => 
          typeof contact[header as keyof ScrapedContact] === 'string' 
            ? `"${contact[header as keyof ScrapedContact]}"` 
            : contact[header as keyof ScrapedContact]
        ).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `contacts_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadHistory = async (historyItem: SearchHistory) => {
    try {
      const response = await fetch('/api/contacts/history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          location: historyItem.location, 
          keywords: historyItem.keywords,
          created_at: historyItem.created_at 
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch historical data');
      }

      const data = await response.json();
      const contacts = data.contacts || [];

      // Generate CSV
      const headers = ['business_name', 'business_type', 'address', 'office_hours', 'website', 'phone', 'email', 'rating'];
      const csvContent = [
        headers.join(','),
        ...contacts.map((contact: ScrapedContact) => 
          headers.map(header => 
            typeof contact[header as keyof ScrapedContact] === 'string' 
              ? `"${contact[header as keyof ScrapedContact]}"` 
              : contact[header as keyof ScrapedContact]
          ).join(',')
        )
      ].join('\n');

      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `search_results_${historyItem.location}_${historyItem.keywords}_${new Date(historyItem.created_at).toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download historical data');
    }
  };

  // Add sorting function
  const handleSort = (key: keyof ScrapedContact) => {
    setSortConfig(current => {
      if (!current || current.key !== key) {
        return { key, direction: 'asc' };
      }
      if (current.direction === 'asc') {
        return { key, direction: 'desc' };
      }
      return null;
    });
  };

  // Sort contacts based on sortConfig
  const sortedContacts = React.useMemo(() => {
    if (!sortConfig) return contacts;

    return [...contacts].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortConfig.direction === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'asc'
          ? aValue - bValue
          : bValue - aValue;
      }

      return 0;
    });
  }, [contacts, sortConfig]);

  // Update filtered contacts to use sorted contacts
  const filteredContacts = sortedContacts.filter(contact =>
    Object.values(contact).some(value =>
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const totalPages = Math.ceil(filteredContacts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentContacts = filteredContacts.slice(startIndex, endIndex);

  // Generate page numbers with ellipsis
  const getPageNumbers = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];
    let l;

    range.push(1);

    for (let i = currentPage - delta; i <= currentPage + delta; i++) {
      if (i < totalPages && i > 1) {
        range.push(i);
      }
    }

    range.push(totalPages);

    for (const i of range) {
      if (l) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1);
        } else if (i - l !== 1) {
          rangeWithDots.push('...');
        }
      }
      rangeWithDots.push(i);
      l = i;
    }

    return rangeWithDots;
  };

  const handleRerun = async (historyLocation: string, historyKeywords: string) => {
    setLocation(historyLocation);
    setKeywords(historyKeywords);
    
    const fakeEvent = { preventDefault: () => {} };
    await handleSearch(fakeEvent as React.FormEvent);
  };

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Business Contact Finder</h1>
          <p className="text-gray-500">Find business contacts by location and keywords</p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="search" className="mb-8">
          <TabsList className="grid w-[400px] grid-cols-2">
            <TabsTrigger value="search">Search</TabsTrigger>
            <TabsTrigger value="history">Search History</TabsTrigger>
          </TabsList>

          <TabsContent value="search">
            {/* Search Parameters */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Search Parameters</h2>
              <p className="text-gray-500 mb-6">Enter location and keywords to find business contacts</p>
              
              <form onSubmit={handleSearch} className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <label htmlFor="location" className="block text-sm font-medium mb-2">
                      Location
                    </label>
                    <Input
                      id="location"
                      placeholder="e.g., Jakarta"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="keyword" className="block text-sm font-medium mb-2">
                      Keyword
                    </label>
                    <Input
                      id="keyword"
                      placeholder="e.g., dentist"
                      value={keywords}
                      onChange={(e) => setKeywords(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-auto bg-black text-white hover:bg-gray-800"
                  disabled={!location || !keywords || loading}
                >
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
              </form>
            </Card>

            {/* Results Section */}
            {(contacts.length > 0 || error) && (
              <div className="space-y-4 mt-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <h2 className="text-xl font-semibold">Search Results</h2>
                    {selectedRows.length > 0 && (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleDownloadSelected}
                          className="flex items-center gap-2"
                        >
                          <Download className="h-4 w-4" />
                          Download Selected
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleDeleteSelected}
                          className="flex items-center gap-2 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete Selected
                        </Button>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                      <Input
                        placeholder="Search results..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8 w-64"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">Show:</span>
                      <select
                        className="border rounded-md px-2 py-1"
                        value={itemsPerPage}
                        onChange={(e) => {
                          setItemsPerPage(Number(e.target.value));
                          setCurrentPage(1);
                        }}
                      >
                        <option value={20}>20 per page</option>
                        <option value={50}>50 per page</option>
                        <option value={100}>100 per page</option>
                      </select>
                    </div>
                  </div>
                </div>

                {error ? (
                  <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800">Search Error</h3>
                        <div className="mt-2 text-sm text-red-700">
                          <p>{error}</p>
                          <p className="mt-2">Suggestions:</p>
                          <ul className="list-disc pl-5 mt-1">
                            <li>Check if the location name is spelled correctly</li>
                            <li>Try using a broader location (e.g., city instead of specific area)</li>
                            <li>Make sure your keywords are not too specific</li>
                            <li>Try different keywords that might be more common</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gray-50">
                            <TableHead className="w-[40px] text-center p-2">
                              <Checkbox
                                checked={selectedRows.length === filteredContacts.length}
                                onCheckedChange={handleSelectAll}
                              />
                            </TableHead>
                            <TableHead 
                              className="w-[180px] font-semibold cursor-pointer hover:bg-gray-100"
                              onClick={() => handleSort('business_name')}
                            >
                              <div className="flex items-center gap-1">
                                Business Name
                                {sortConfig?.key === 'business_name' && (
                                  <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                                )}
                              </div>
                            </TableHead>
                            <TableHead 
                              className="w-[120px] font-semibold cursor-pointer hover:bg-gray-100"
                              onClick={() => handleSort('business_type')}
                            >
                              <div className="flex items-center gap-1">
                                Type
                                {sortConfig?.key === 'business_type' && (
                                  <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                                )}
                              </div>
                            </TableHead>
                            <TableHead 
                              className="w-[180px] font-semibold cursor-pointer hover:bg-gray-100"
                              onClick={() => handleSort('address')}
                            >
                              <div className="flex items-center gap-1">
                                Address
                                {sortConfig?.key === 'address' && (
                                  <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                                )}
                              </div>
                            </TableHead>
                            <TableHead className="w-[120px] font-semibold">Office Hours</TableHead>
                            <TableHead 
                              className="w-[120px] font-semibold cursor-pointer hover:bg-gray-100"
                              onClick={() => handleSort('website')}
                            >
                              <div className="flex items-center gap-1">
                                Website
                                {sortConfig?.key === 'website' && (
                                  <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                                )}
                              </div>
                            </TableHead>
                            <TableHead 
                              className="w-[100px] font-semibold cursor-pointer hover:bg-gray-100"
                              onClick={() => handleSort('phone')}
                            >
                              <div className="flex items-center gap-1">
                                Phone
                                {sortConfig?.key === 'phone' && (
                                  <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                                )}
                              </div>
                            </TableHead>
                            <TableHead 
                              className="w-[120px] font-semibold cursor-pointer hover:bg-gray-100"
                              onClick={() => handleSort('email')}
                            >
                              <div className="flex items-center gap-1">
                                Email
                                {sortConfig?.key === 'email' && (
                                  <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                                )}
                              </div>
                            </TableHead>
                            <TableHead 
                              className="w-[80px] font-semibold cursor-pointer hover:bg-gray-100"
                              onClick={() => handleSort('rating')}
                            >
                              <div className="flex items-center gap-1">
                                Rating
                                {sortConfig?.key === 'rating' && (
                                  <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                                )}
                              </div>
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {loading ? (
                            <TableRow>
                              <TableCell colSpan={9} className="h-[400px]">
                                <div className="flex flex-col items-center justify-center h-full">
                                  <div className="w-16 h-16 border-4 border-t-black border-r-black border-gray-200 rounded-full animate-spin mb-4"></div>
                                  <p className="text-gray-500">Scraping data from Google Maps...</p>
                                  <p className="text-sm text-gray-400 mt-2">This may take a few moments</p>
                                </div>
                              </TableCell>
                            </TableRow>
                          ) : currentContacts.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={9} className="h-24 text-center text-gray-500">
                                No results found
                              </TableCell>
                            </TableRow>
                          ) : (
                            currentContacts.map((contact) => (
                              <TableRow 
                                key={contact.id}
                                className="hover:bg-gray-50 transition-colors"
                              >
                                <TableCell className="text-center p-2">
                                  <Checkbox
                                    checked={selectedRows.includes(contact.id)}
                                    onCheckedChange={() => handleRowSelect(contact.id)}
                                  />
                                </TableCell>
                                <TableCell className="font-medium">
                                  <div className="flex flex-col">
                                    <span className="truncate max-w-[160px]" title={contact.business_name}>
                                      {contact.business_name || '-'}
                                    </span>
                                    {contact.keywords && (
                                      <span className="text-xs text-gray-500 mt-1 truncate max-w-[160px]" title={contact.keywords}>
                                        Keywords: {contact.keywords}
                                      </span>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {contact.business_type ? (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 truncate max-w-[100px]" title={contact.business_type}>
                                      {contact.business_type}
                                    </span>
                                  ) : '-'}
                                </TableCell>
                                <TableCell>
                                  {contact.address ? (
                                    <div className="flex flex-col">
                                      <a
                                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(contact.address)}`}
            target="_blank"
            rel="noopener noreferrer"
                                        className="text-blue-600 hover:underline truncate max-w-[160px]"
                                        title={contact.address}
                                      >
                                        {contact.address}
                                      </a>
                                      <span className="text-xs text-gray-500 mt-1 truncate max-w-[160px]" title={contact.location}>
                                        {contact.location}
                                      </span>
                                    </div>
                                  ) : '-'}
                                </TableCell>
                                <TableCell>
                                  {contact.office_hours ? (
                                    <div className="max-h-20 overflow-y-auto text-sm space-y-1">
                                      {contact.office_hours.split('\n').map((line, i) => (
                                        <div key={i} className="truncate max-w-[100px]" title={line}>
                                          {line}
                                        </div>
                                      ))}
        </div>
                                  ) : '-'}
                                </TableCell>
                                <TableCell>
                                  {contact.website && contact.website !== 'maps.google.com' ? (
                                    <a 
                                      href={contact.website.startsWith('http') ? contact.website : `https://${contact.website}`}
          target="_blank"
          rel="noopener noreferrer"
                                      className="text-blue-600 hover:underline inline-flex items-center gap-1"
                                      title={contact.website}
                                    >
                                      <span className="truncate max-w-[100px]">
                                        {contact.website.replace(/^https?:\/\//, '')}
                                      </span>
                                      <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                      </svg>
                                    </a>
                                  ) : '-'}
                                </TableCell>
                                <TableCell>
                                  {contact.phone ? (
                                    <a 
                                      href={`tel:${contact.phone}`}
                                      className="text-blue-600 hover:underline inline-flex items-center gap-1"
                                      title={contact.phone}
                                    >
                                      <span className="truncate max-w-[80px]">{contact.phone}</span>
                                      <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                      </svg>
                                    </a>
                                  ) : '-'}
                                </TableCell>
                                <TableCell>
                                  {contact.email ? (
                                    <a 
                                      href={`mailto:${contact.email}`}
                                      className="text-blue-600 hover:underline inline-flex items-center gap-1"
                                      title={contact.email}
                                    >
                                      <span className="truncate max-w-[100px]">{contact.email}</span>
                                      <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                      </svg>
                                    </a>
                                  ) : '-'}
                                </TableCell>
                                <TableCell>
                                  {contact.rating ? (
                                    <div className="flex items-center gap-1">
                                      <span className="font-medium">{contact.rating}</span>
                                      <span className="text-yellow-400">★</span>
                                      {contact.review_count ? (
                                        <span className="text-gray-500 text-xs">
                                          ({contact.review_count})
                                        </span>
                                      ) : null}
                                    </div>
                                  ) : '-'}
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center justify-between py-4">
                      <div className="text-sm text-gray-500">
                        Showing {startIndex + 1}-{Math.min(endIndex, filteredContacts.length)} of {filteredContacts.length} results
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setCurrentPage(1)}
                          disabled={currentPage === 1}
                        >
                          <ChevronLeft className="h-4 w-4" />
                          <ChevronLeft className="h-4 w-4 -ml-2" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={currentPage === 1}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        {getPageNumbers().map((page, index) => (
                          page === '...' ? (
                            <span key={`dots-${index}`} className="px-2">...</span>
                          ) : (
                            <Button
                              key={page}
                              variant={currentPage === page ? "default" : "outline"}
                              className={currentPage === page ? "bg-black text-white" : ""}
                              onClick={() => setCurrentPage(Number(page))}
                            >
                              {page}
                            </Button>
                          )
                        ))}
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                          disabled={currentPage === totalPages}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setCurrentPage(totalPages)}
                          disabled={currentPage === totalPages}
                        >
                          <ChevronRight className="h-4 w-4" />
                          <ChevronRight className="h-4 w-4 -ml-2" />
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="history">
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
                      <TableHead>Location</TableHead>
                      <TableHead>Keywords</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Results</TableHead>
                      <TableHead>Actions</TableHead>
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
                        .map((item) => (
                          <TableRow key={`history-${item.id}`}>
                            <TableCell>{item.location}</TableCell>
                            <TableCell>{item.keywords}</TableCell>
                            <TableCell>
                              {new Date(item.created_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell>{item.results_count} results</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRerun(item.location, item.keywords)}
                                >
                                  <Search className="h-4 w-4 mr-2" />
                                  Re-run
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDownloadHistory(item)}
                                >
                                  <Download className="h-4 w-4 mr-2" />
                                  Download
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
          </TabsContent>
        </Tabs>
    </div>
    </MainLayout>
  );
}
