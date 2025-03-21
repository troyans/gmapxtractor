import { ScrapedContact } from '@/lib/supabase';

/**
 * Initiates a scraping operation via the API
 * @param location The location to search for
 * @param keywords The keywords to search for
 * @returns A promise that resolves to the scraping results
 */
export async function initiateScrapingOperation(location: string, keywords: string): 
  Promise<{ data: ScrapedContact[]; error: string | null }> {
  try {
    const response = await fetch('/api/scrape', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ location, keywords }),
    });

    const result = await response.json();

    if (!response.ok) {
      return { 
        data: [], 
        error: result.error || `Error: ${response.status} ${response.statusText}` 
      };
    }

    return { data: result.data, error: null };
  } catch (error) {
    console.error('Scraping service error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { data: [], error: errorMessage };
  }
}

/**
 * Fetches previously scraped data from Supabase
 * @returns A promise that resolves to previously scraped contacts
 */
export async function fetchSavedScrapedData(): 
  Promise<{ data: ScrapedContact[]; error: string | null }> {
  try {
    const response = await fetch('/api/contacts', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();

    if (!response.ok) {
      return { 
        data: [], 
        error: result.error || `Error: ${response.status} ${response.statusText}` 
      };
    }

    return { data: result.data, error: null };
  } catch (error) {
    console.error('Error fetching saved scraping data:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { data: [], error: errorMessage };
  }
}

/**
 * Exports the data as CSV
 * @param data The data to export
 * @param selectedColumns The columns to include in the export
 * @returns A CSV file for download
 */
export function exportAsCSV(data: ScrapedContact[], selectedColumns: string[]): string {
  // Create header row
  const headers = selectedColumns.join(',');
  
  // Create data rows
  const rows = data.map(contact => {
    return selectedColumns.map(column => {
      // Handle nested properties like social_media
      if (column.includes('.')) {
        const [parent, child] = column.split('.');
        return parent === 'social_media' && contact.social_media
          ? `"${contact.social_media[child as keyof typeof contact.social_media] || ''}"`
          : '""';
      }
      
      // Handle regular properties
      const value = contact[column as keyof ScrapedContact];
      // Wrap strings in quotes and handle undefined
      return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : (value || '""');
    }).join(',');
  }).join('\n');
  
  return `${headers}\n${rows}`;
}

/**
 * Triggers a download of CSV data
 * @param csvContent The CSV content as a string
 * @param filename The name of the file to download
 */
export function downloadCSV(csvContent: string, filename = 'exported-contacts.csv'): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
} 