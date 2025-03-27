import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const searchId = searchParams.get('search_id');

    if (!searchId) {
      return new NextResponse('Search ID is required', { status: 400 });
    }

    // Get the search history record first
    const { data: searchHistory } = await supabase
      .from('search_history')
      .select('*')
      .eq('id', searchId)
      .eq('user_id', session.user.id)
      .single();

    if (!searchHistory) {
      return new NextResponse('Search history not found', { status: 404 });
    }

    // Get the contacts associated with this search based on location and keywords
    const { data: contacts, error } = await supabase
      .from('scraped_contacts')
      .select('*')
      .eq('location', searchHistory.location)
      .eq('keywords', searchHistory.keywords)
      .eq('user_id', session.user.id);

    if (error) {
      console.error('Error fetching contacts:', error);
      return new NextResponse('Error fetching contacts', { status: 500 });
    }

    return NextResponse.json({
      data: contacts || [],
      search: searchHistory
    });
  } catch (error) {
    console.error('Error:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
} 