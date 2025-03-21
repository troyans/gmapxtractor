import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getUserRole } from '@/lib/auth';

// Helper function to get the current user
const getCurrentUser = async () => {
  const { data } = await supabase.auth.getSession();
  return data.session?.user;
};

// Main handler for GET request
export async function GET(req: NextRequest) {
  try {
    // Get current user
    const user = await getCurrentUser();
    
    // Check if user is authenticated
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Check user role and permissions
    const role = await getUserRole();
    if (!role) {
      return NextResponse.json(
        { error: 'User role not defined' },
        { status: 403 }
      );
    }
    
    // Get query parameters
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    // Construct query
    let query = supabase
      .from('scraped_contacts')
      .select('*');
    
    // If not an admin, limit to only user's own data
    if (role !== 'admin' && role !== 'sales_manager') {
      query = query.eq('user_id', user.id);
    }
    
    // Add pagination
    query = query.order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    // Execute query
    const { data: contacts, error } = await query;
    
    if (error) {
      console.error('Error fetching contacts:', error);
      return NextResponse.json(
        { error: 'Failed to retrieve contacts' },
        { status: 500 }
      );
    }
    
    // Get total count (for pagination)
    const { count, error: countError } = await supabase
      .from('scraped_contacts')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('Error counting contacts:', countError);
    }
    
    // Return the contacts
    return NextResponse.json({
      data: contacts,
      count: count || contacts.length,
      limit,
      offset,
    });
    
  } catch (error) {
    console.error('Unexpected error in contacts API:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      { error: `An unexpected error occurred: ${errorMessage}` },
      { status: 500 }
    );
  }
} 