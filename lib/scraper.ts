import puppeteer from 'puppeteer';
import { ScrapedContact } from './supabase';
import { logUserAction } from './auth';

// Main scraping function
export const scrapeGoogleMaps = async (
  location: string,
  keywords: string,
  userId: string
): Promise<{ data: ScrapedContact[]; error: string | null }> => {
  let browser;
  
  try {
    await logUserAction(userId, 'scrape_start', { location, keywords });
    
    browser = await puppeteer.launch({
      headless: false,
      defaultViewport: { width: 1920, height: 1080 },
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--window-size=1920,1080'
      ]
    });
    
    const page = await browser.newPage();
    
    // Enable console logging from the page
    page.on('console', msg => console.log('Browser console:', msg.text()));
    
    // Set longer timeouts
    page.setDefaultTimeout(90000);
    page.setDefaultNavigationTimeout(90000);

    // Only block heavy media resources
    await page.setRequestInterception(true);
    page.on('request', (request) => {
      const resourceType = request.resourceType();
      const url = request.url().toLowerCase();
      
      // Block only heavy media and non-essential resources
      if (
        resourceType === 'media' ||
        url.endsWith('.mp4') ||
        url.endsWith('.avi') ||
        url.endsWith('.wav') ||
        url.endsWith('.webm') ||
        url.includes('adservice.') ||
        url.includes('/ads/') ||
        url.includes('analytics') ||
        url.includes('tracking')
      ) {
        request.abort();
      } else {
        request.continue();
      }
    });

    // Add error handling for failed requests
    page.on('requestfailed', (request) => {
      const failure = request.failure();
      if (failure) {
        console.log(`Request failed: ${request.url()}, ${failure.errorText}`);
      }
    });

    console.log('Navigating to Google Maps...');
    await page.goto('https://www.google.com/maps', { 
      waitUntil: ['networkidle0', 'domcontentloaded'],
      timeout: 60000
    });

    // Accept cookies if present
    try {
      await page.waitForSelector('button[aria-label*="Accept"], button[jsname="higCR"]', { timeout: 5000 });
      const acceptButton = await page.$('button[aria-label*="Accept"], button[jsname="higCR"]');
      if (acceptButton) {
        await acceptButton.click();
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } catch {
      console.log('No cookie consent needed or timed out');
    }

    // Wait for and interact with the search box
    console.log('Waiting for search box...');
    const searchBoxSelector = '#searchboxinput, input[name="q"], input[aria-label*="Search"]';
    await page.waitForSelector(searchBoxSelector, { visible: true, timeout: 10000 });

    // Clear any existing text and type new search
    await page.evaluate((selector) => {
      const searchBox = document.querySelector(selector) as HTMLInputElement;
      if (searchBox) searchBox.value = '';
    }, searchBoxSelector);
    
    await page.type(searchBoxSelector, `${keywords} in ${location}`, { delay: 100 });
    
    // Click search using multiple methods
    console.log('Performing search...');
    try {
      await Promise.any([
        page.waitForSelector('#searchbox-searchbutton').then(button => button?.click()),
        page.waitForSelector('button[aria-label="Search"]').then(button => button?.click()),
        page.waitForSelector('button[jsaction*="search"]').then(button => button?.click()),
        page.keyboard.press('Enter')
      ]);
    } catch {
      await page.keyboard.press('Enter');
    }

    // Wait for results to appear with better error handling
    console.log('Waiting for results...');
    try {
      await page.waitForFunction(() => {
        const selectors = [
          'div[role="feed"]',
          'div[role="main"] div[role="article"]',
          'div.section-result-content',
          'div[jsaction*="mouseover:pane"]',
          'div[aria-label*="Results"]',
          'div[aria-label*="result"]',
          'a[href^="/maps/place"]',
          'div.Nv2PK'
        ];
        return selectors.some(selector => document.querySelector(selector));
      }, { timeout: 30000 });
    } catch (error) {
      console.error('Error waiting for results:', error);
      throw new Error('No results found. Please try different search terms.');
    }

    // Give more time for results to load
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Scroll to load more results with better error handling
    console.log('Loading more results...');
    for (let i = 0; i < 5; i++) {
      try {
        await page.evaluate(() => {
          const selectors = [
            'div[role="feed"]',
            'div[role="main"]',
            'div.section-result-content',
            'div[jsaction*="mouseover:pane"]',
            'div[aria-label*="Results"]',
            'div.ecceSd',
            'div[role="region"]'
          ];
          
          for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element) {
              element.scrollTop = element.scrollHeight;
              return true;
            }
          }
          window.scrollTo(0, document.body.scrollHeight);
          return true;
        });
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.error('Error during scrolling:', error);
        break; // Continue with the results we have
      }
    }

    // Extract data
    console.log('Extracting business data...');
    const results = [];
    
    // Get all business cards with better error handling
    const cards = await page.$$([
      'div.Nv2PK',
      'div[role="article"]',
      'div[jsaction*="mouseover:pane.placeCard"]',
      'a[href^="/maps/place"]'
    ].join(', '));

    console.log(`Found ${cards.length} business cards`);

    // Process each card with improved error handling
    for (const card of cards) {
      try {
        // Click the card to open details
        await Promise.race([
          card.click(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Click timeout')), 5000))
        ]);
        
        // Wait for the details panel to load
        await page.waitForFunction(() => {
          return document.querySelector('h1.DUwDvf, h1[class*="fontHeadline"]') !== null;
        }, { timeout: 5000 });

        // Extract data from the detailed view
        const result = await page.evaluate(() => {
          // Business name
          const nameElement = 
            document.querySelector('h1.DUwDvf') || 
            document.querySelector('h1[class*="fontHeadline"]') ||
            document.querySelector('div[role="main"] [role="heading"]');
          const name = nameElement?.textContent?.trim() || '';

          // Business type
          const typeElement = 
            document.querySelector('button[jsaction*="category"]') ||
            document.querySelector('div[jsaction*="category"]') ||
            document.querySelector('div.DkEaL');
          const businessType = typeElement?.textContent?.trim().split('·')[0].trim() || '';

          // Rating and reviews
          const ratingElement = document.querySelector('div.F7nice span, span.ceNzKf');
          const rating = ratingElement ? 
            parseFloat(ratingElement.textContent?.trim() || '0') : 
            null;

          const reviewElement = document.querySelector('div.F7nice div, span[aria-label*="review"]');
          const reviewCount = reviewElement ? 
            parseInt(reviewElement.textContent?.replace(/[^0-9]/g, '') || '0') : 
            null;

          // Address
          const addressElement = 
            document.querySelector('button[data-item-id*="address"]') ||
            document.querySelector('div[data-item-id*="address"]');
          const address = addressElement?.textContent?.trim() || '';

          // Website - Multiple attempts to get the correct website
          let website = '';
          const websiteButton = 
            document.querySelector('a[data-item-id*="authority"]') ||
            document.querySelector('a[jsaction*="authority"]') ||
            document.querySelector('div[data-item-id*="authority"] a') ||
            Array.from(document.querySelectorAll('a')).find(a => {
              const href = a.getAttribute('href') || '';
              return href.includes('url?q=') || (href.startsWith('http') && !href.includes('google.com'));
            });

          if (websiteButton) {
            const href = websiteButton.getAttribute('href') || '';
            if (href.includes('url?q=')) {
              website = decodeURIComponent(href.split('url?q=')[1].split('&')[0]);
            } else if (href.includes('redirect?')) {
              website = decodeURIComponent(href.split('redirect?')[1].split('&')[0].replace('url=', ''));
            } else {
              website = href;
            }
            website = website.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
          }

          // Phone
          const phoneButton = 
            document.querySelector('button[data-item-id*="phone"]') ||
            document.querySelector('div[data-item-id*="phone"]') ||
            document.querySelector('a[href^="tel:"]');
          let phone = '';
          if (phoneButton) {
            phone = 
              phoneButton.getAttribute('data-item-id')?.split('phone:')[1] ||
              phoneButton.getAttribute('aria-label')?.replace('Phone:', '')?.trim() ||
              phoneButton.getAttribute('href')?.replace('tel:', '')?.trim() ||
              phoneButton.textContent?.trim() || '';
            phone = phone.replace(/^[\s•·]+|[\s•·]+$/g, '').replace(/\s+/g, ' ');
          }

          // Email - Check in the about section and description
          let email = '';
          const emailLinks = Array.from(document.querySelectorAll('a[href^="mailto:"]'));
          if (emailLinks.length > 0) {
            email = emailLinks[0].getAttribute('href')?.replace('mailto:', '') || '';
          }

          // Try to find email in description
          if (!email) {
            const description = document.querySelector('[data-item-id*="description"]')?.textContent || '';
            const emailMatch = description.match(/[\w.-]+@[\w.-]+\.\w+/);
            if (emailMatch) {
              email = emailMatch[0];
            }
          }

          // Office hours
          let officeHours = '';
          const hoursContainer = 
            document.querySelector('div[aria-label*="Hours"] table') ||
            document.querySelector('div[data-item-id*="oh"] table');
          if (hoursContainer) {
            const rows = Array.from(hoursContainer.querySelectorAll('tr'));
            officeHours = rows.map(row => row.textContent?.trim()).join('\n');
          }

          return {
            business_name: name,
            business_type: businessType,
            address,
            office_hours: officeHours,
            phone,
            website,
            email,
            rating,
            review_count: reviewCount
          };
        });

        if (result.business_name) {
          results.push({
            ...result,
            location,
            keywords,
            created_at: new Date().toISOString(),
            user_id: userId
          });
        }

        // Click back or close the detail panel
        try {
          const backButton = await page.$('button[aria-label="Back"]');
          if (backButton) {
            await backButton.click();
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        } catch (error) {
          console.log('Error clicking back button:', error);
          // Try alternative methods to go back
          try {
            await page.keyboard.press('Escape');
            await new Promise(resolve => setTimeout(resolve, 1000));
          } catch (error) {
            console.log('Error pressing escape:', error);
          }
        }

      } catch (error) {
        console.log('Error processing business card:', error);
        // Try to recover by pressing escape
        try {
          await page.keyboard.press('Escape');
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          console.log('Error recovering from card processing error:', error);
        }
        continue;
      }
    }

    // Filter and format results
    const scrapedData: ScrapedContact[] = results
      .filter(result => 
        result.business_name && 
        result.business_name.trim() !== '' &&
        (!result.website || 
          (!result.website.includes('google.com') && 
           !result.website.includes('goo.gl')))
      )
      .map(result => ({
        ...result,
        website: result.website && !result.website.startsWith('http') 
          ? `https://${result.website}` 
          : result.website
      }));

    console.log(`Found ${scrapedData.length} results`);
    
    if (scrapedData.length === 0) {
      throw new Error('No businesses found for the given location and keywords. Please try different search terms or check if the location is correct.');
    }

    await logUserAction(userId, 'scrape_complete', { 
      location, 
      keywords, 
      results_count: scrapedData.length 
    });
    
    return { data: scrapedData, error: null };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error scraping Google Maps:', errorMessage);
    await logUserAction(userId, 'scrape_error', { location, keywords, error: errorMessage });
    return { data: [], error: errorMessage };
  } finally {
    if (browser) await browser.close();
  }
}; 