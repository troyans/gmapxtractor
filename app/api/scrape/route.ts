import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { scrapeGoogleMaps } from '@/lib/scraper'
import { getUserRole } from '@/lib/auth'
import type { Database } from '@/lib/database.types'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ 
      cookies
    })

    // Check authentication
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get user role
    const role = await getUserRole(session.user.id, supabase)
    if (!role) {
      return NextResponse.json(
        { error: 'User role not defined. Please contact support.' },
        { status: 403 }
      )
    }

    // Parse request body
    const body = await req.json()
    const { location, keywords } = body

    // Validate input
    if (!location || !keywords) {
      return NextResponse.json(
        { error: 'Location and keywords are required' },
        { status: 400 }
      )
    }

    // Perform scraping
    console.log(`Starting scrape for ${keywords} in ${location}`)
    const { data: scrapedData, error: scrapeError } = await scrapeGoogleMaps(
      location,
      keywords,
      session.user.id
    )

    if (scrapeError) {
      console.error('Scraping error:', scrapeError)
      return NextResponse.json(
        { error: scrapeError },
        { status: 400 }
      )
    }

    if (!scrapedData || scrapedData.length === 0) {
      return NextResponse.json(
        { error: 'No results found' },
        { status: 404 }
      )
    }

    // Save to database
    const { error: dbError } = await supabase
      .from('scraped_contacts')
      .insert(scrapedData)

    if (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json(
        { error: 'Failed to save results' },
        { status: 500 }
      )
    }

    // Save search history
    const { error: historyError } = await supabase
      .from('search_history')
      .insert({
        user_id: session.user.id,
        location,
        keywords,
        results_count: scrapedData.length,
        created_at: new Date().toISOString()
      })

    if (historyError) {
      console.error('History error:', historyError)
      // Don't fail the request if history saving fails
    }

    // Return success response
    return NextResponse.json({
      message: 'Scraping completed successfully',
      count: scrapedData.length,
      data: scrapedData
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 