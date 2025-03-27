'use client';

import { useState } from 'react';
import { Search, Download, Trash2, Settings2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import MainLayout from '@/components/layout/MainLayout';
import React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

type ColumnConfig = {
  key: keyof ScrapedContact;
  label: string;
  width?: string;
  visible: boolean;
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
  const [sortConfig, setSortConfig] = useState<{
    key: keyof ScrapedContact;
    direction: 'asc' | 'desc';
  } | null>(null);
  const [columnConfig, setColumnConfig] = useState<ColumnConfig[]>([
    { key: 'business_name', label: 'Business Name', width: 'w-[180px]', visible: true },
    { key: 'business_type', label: 'Type', width: 'w-[120px]', visible: true },
    { key: 'address', label: 'Address', width: 'w-[180px]', visible: true },
    { key: 'office_hours', label: 'Office Hours', width: 'w-[120px]', visible: true },
    { key: 'website', label: 'Website', width: 'w-[120px]', visible: true },
    { key: 'phone', label: 'Phone', width: 'w-[100px]', visible: true },
    { key: 'email', label: 'Email', width: 'w-[120px]', visible: true },
    { key: 'rating', label: 'Rating', width: 'w-[80px]', visible: true },
  ]);

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

  const filteredContacts = sortedContacts.filter(contact =>
    Object.values(contact).some(value =>
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  // Calculate pagination
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const totalPages = Math.ceil(filteredContacts.length / itemsPerPage);
  const paginatedContacts = filteredContacts.slice(startIndex, endIndex);

  const toggleColumn = (key: keyof ScrapedContact) => {
    setColumnConfig(prev =>
      prev.map(col =>
        col.key === key ? { ...col, visible: !col.visible } : col
      )
    );
  };

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Business Contact Finder</h1>
          <p className="text-gray-500">Find business contacts by location and keywords</p>
        </div>

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
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="flex items-center gap-2">
                      <Settings2 className="h-4 w-4" />
                      Customize Columns
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {columnConfig.map((col) => (
                      <DropdownMenuCheckboxItem
                        key={col.key}
                        checked={col.visible}
                        onCheckedChange={() => toggleColumn(col.key)}
                      >
                        {col.label}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
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
                        {columnConfig.filter(col => col.visible).map((col) => (
                          <TableHead
                            key={col.key}
                            className={`${col.width} font-semibold cursor-pointer hover:bg-gray-100`}
                            onClick={() => handleSort(col.key)}
                          >
                            <div className="flex items-center gap-1">
                              {col.label}
                              {sortConfig?.key === col.key && (
                                <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                              )}
                            </div>
                          </TableHead>
                        ))}
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
                      ) : paginatedContacts.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={9} className="h-24 text-center text-gray-500">
                            No results found
                          </TableCell>
                        </TableRow>
                      ) : (
                        paginatedContacts.map((contact) => (
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
                            {columnConfig.filter(col => col.visible).map((col) => (
                              <TableCell key={col.key}>
                                {col.key === 'business_name' && (
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
                                )}
                                {col.key === 'business_type' && (
                                  contact.business_type ? (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 truncate max-w-[100px]" title={contact.business_type}>
                                      {contact.business_type}
                                    </span>
                                  ) : '-'
                                )}
                                {col.key === 'address' && (
                                  contact.address ? (
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
                                  ) : '-'
                                )}
                                {col.key === 'office_hours' && (
                                  contact.office_hours ? (
                                    <div className="max-h-20 overflow-y-auto text-sm space-y-1">
                                      {contact.office_hours.split('\n').map((line, i) => (
                                        <div key={i} className="truncate max-w-[100px]" title={line}>
                                          {line}
                                        </div>
                                      ))}
                                    </div>
                                  ) : '-'
                                )}
                                {col.key === 'website' && (
                                  contact.website && contact.website !== 'maps.google.com' ? (
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
                                  ) : '-'
                                )}
                                {col.key === 'phone' && (
                                  contact.phone ? (
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
                                  ) : '-'
                                )}
                                {col.key === 'email' && (
                                  contact.email ? (
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
                                  ) : '-'
                                )}
                                {col.key === 'rating' && (
                                  contact.rating ? (
                                    <div className="flex items-center gap-1">
                                      <span className="font-medium">{contact.rating}</span>
                                      <span className="text-yellow-400">★</span>
                                      {contact.review_count ? (
                                        <span className="text-gray-500 text-xs">
                                          ({contact.review_count})
                                        </span>
                                      ) : null}
                                    </div>
                                  ) : '-'
                                )}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between space-x-2 py-4">
                  <div className="flex-1 text-sm text-muted-foreground">
                    Showing {startIndex + 1} to {Math.min(endIndex, contacts.length)} of{' '}
                    {contacts.length} results
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(page => Math.max(1, page - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <div className="flex w-[100px] items-center justify-center text-sm font-medium">
                      Page {currentPage} of {totalPages}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(page => Math.min(totalPages, page + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
