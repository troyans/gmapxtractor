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
      headless: false, // Set to false for debugging
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
    
    // Block unnecessary resources
    await page.setRequestInterception(true);
    page.on('request', (request) => {
      const resourceType = request.resourceType();
      if (['image', 'stylesheet', 'font', 'media'].includes(resourceType)) {
        request.abort();
      } else {
        request.continue();
      }
    });

    console.log('Navigating to Google Maps...');
    await page.goto('https://www.google.com/maps', { 
      waitUntil: ['networkidle0', 'domcontentloaded']
    });

    // Accept cookies if present
    try {
      const acceptButton = await page.$('button[aria-label*="Accept"], button[jsname="higCR"]');
      if (acceptButton) {
        await acceptButton.click();
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch {
      console.log('No cookie consent needed');
    }

    // Wait for and interact with the search box
    console.log('Waiting for search box...');
    const searchBoxSelector = '#searchboxinput, input[name="q"], input[aria-label*="Search"]';
    await page.waitForSelector(searchBoxSelector, { visible: true });

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
        page.click('#searchbox-searchbutton'),
        page.click('button[aria-label="Search"]'),
        page.click('button[jsaction*="search"]'),
        page.keyboard.press('Enter')
      ]);
    } catch {
      await page.keyboard.press('Enter');
    }

    // Wait for results to appear
    console.log('Waiting for results...');
    await page.waitForFunction(() => {
      const selectors = [
        'div[role="feed"]',
        'div[role="main"] div[role="article"]',
        'div.section-result-content',
        'div[jsaction*="mouseover:pane"]',
        'div[aria-label*="Results"]',
        'div[aria-label*="result"]',
        'a[href^="/maps/place"]',
        'div.Nv2PK',
        // Add more specific selectors
        'div[class*="m6QErb"]',
        'div[class*="DxyBCb"]',
        'div[class*="kXGGdf"]'
      ];
      return selectors.some(selector => document.querySelector(selector));
    }, { timeout: 30000 });

    // Give more time for results to load
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Scroll to load more results
    console.log('Loading more results...');
    for (let i = 0; i < 5; i++) {
      await page.evaluate(() => {
        const selectors = [
          'div[role="feed"]',
          'div[role="main"]',
          'div.section-result-content',
          'div[jsaction*="mouseover:pane"]',
          'div[aria-label*="Results"]',
          'div.ecceSd',
          'div[role="region"]',
          // Add more scroll container selectors
          'div[class*="m6QErb"]',
          'div[class*="DxyBCb"]'
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
    }

    // Extract data
    console.log('Extracting business data...');
    const results = await page.evaluate((searchLocation, searchKeywords) => {
      // Try multiple selectors for business listings
      const containers = Array.from(document.querySelectorAll([
        'div.Nv2PK',
        'div[role="article"]',
        'div[jsaction*="mouseover:pane.placeCard"]',
        'div[class*="m6QErb"] > div',
        'div[class*="DxyBCb"] > div',
        'a[href^="/maps/place"]'
      ].join(', ')))
      .filter(el => el?.textContent?.trim());

      console.log('Found containers:', containers.length);

      // Use Set to track unique business names
      const seen = new Set();
      
      return containers
        .map(item => {
          // Get business name - using multiple selectors
          const nameElement = 
            item.querySelector('h3.fontHeadlineLarge') || 
            item.querySelector('[role="heading"]') ||
            item.querySelector('.fontHeadlineSmall') ||
            item.querySelector('div[role="heading"][class*="fontHeadline"]');
          const name = nameElement?.textContent?.trim() || '';

          // Skip if we've seen this business name before
          if (seen.has(name)) return null;
          seen.add(name);

          // Get business type - using multiple selectors
          const typeElement = 
            item.querySelector('div[aria-label*="Type of place"]') ||
            item.querySelector('button[jsaction*="category"]') ||
            item.querySelector('div[jsaction*="category"]') ||
            item.querySelector('div.W4Efsd:first-child') ||
            item.querySelector('div[class*="fontBodyMedium"]:first-child');
          const businessType = typeElement?.textContent?.trim().split('·')[0].trim() || '';

          // Get rating - using multiple selectors
          const ratingElement = 
            item.querySelector('span.MW4etd') ||
            item.querySelector('span[aria-hidden="true"]') ||
            item.querySelector('span.fontDisplayLarge');
          const rating = ratingElement ? 
            parseFloat(ratingElement.textContent?.trim() || '0') : 
            null;

          // Get review count - using multiple selectors
          const reviewElement = 
            item.querySelector('span.UY7F9') ||
            item.querySelector('span[aria-label*="review"]') ||
            item.querySelector('button[aria-label*="review"]');
          const reviewCount = reviewElement ? 
            parseInt(reviewElement.textContent?.replace(/[^0-9]/g, '') || '0') : 
            null;

          // Get address - using multiple selectors
          const addressElement = 
            item.querySelector('div[class*="fontBodyMedium"]:nth-child(2)') ||
            item.querySelector('div[role="link"] div.W4Efsd:last-child') ||
            item.querySelector('div[class*="W4Efsd"]:last-child') ||
            item.querySelector('[data-item-id*="address"]') ||
            item.querySelector('div[aria-label*="Address"]');
          const address = addressElement?.textContent?.trim() || '';

          // Get website - using multiple methods with improved filtering
          let website = '';
          const websiteButton = 
            item.querySelector('a[data-item-id*="authority"]') ||
            item.querySelector('a[aria-label*="website"]') ||
            Array.from(item.querySelectorAll('a')).find(a => {
              const href = (a as HTMLAnchorElement).href || '';
              return href && 
                !href.includes('maps.google.com') && 
                !href.includes('mailto:') && 
                !href.includes('tel:') &&
                !href.includes('google.com/search') &&
                !href.includes('/maps/dir/');
            });

          if (websiteButton) {
            const href = (websiteButton as HTMLAnchorElement).href || websiteButton.getAttribute('href') || '';
            website = href.includes('url?q=') 
              ? decodeURIComponent(href.split('url?q=')[1].split('&')[0])
              : href.replace(/^.*?redirect=/, '');
          }

          // Get phone - using multiple methods with improved extraction
          let phone = '';
          const phoneButton = 
            item.querySelector('button[data-item-id*="phone"]') ||
            item.querySelector('button[aria-label*="phone"]') ||
            item.querySelector('[data-item-id*="phone"]') ||
            item.querySelector('div[aria-label*="phone"]') ||
            item.querySelector('a[href^="tel:"]');

          if (phoneButton) {
            // Try multiple ways to get the phone number
            phone = 
              phoneButton.getAttribute('aria-label')?.replace(/^.*?phone:?\s*/i, '')?.trim() ||
              phoneButton.getAttribute('href')?.replace('tel:', '')?.trim() ||
              phoneButton.textContent?.trim() ||
              '';
            
            // Clean up the phone number
            phone = phone.replace(/^[\s•·]+|[\s•·]+$/g, '');
          }

          // Get office hours - using multiple methods
          const hoursButton = 
            item.querySelector('button[data-item-id*="oh"]') ||
            item.querySelector('[aria-label*="Hours"]') ||
            item.querySelector('div[data-item-id*="oh"]');
          let officeHours = '';
          if (hoursButton) {
            const hoursText = hoursButton.getAttribute('aria-label') || hoursButton.textContent;
            officeHours = hoursText?.replace(/^Hours:\s*/i, '')?.trim() || '';
            
            // Try to get detailed hours if available
            const detailedHours = item.querySelector('table[aria-label*="hour"]');
            if (detailedHours) {
              const rows = Array.from(detailedHours.querySelectorAll('tr'));
              officeHours = rows.map(row => row.textContent?.trim()).join('\n');
            }
          }

          // Get email - using multiple methods
          let email = '';
          const emailElement = 
            item.querySelector('a[href^="mailto:"]') ||
            Array.from(item.querySelectorAll('a')).find(a => a.href?.startsWith('mailto:'));
          if (emailElement) {
            email = emailElement.getAttribute('href')?.replace('mailto:', '') || '';
          }

          // Try to extract email from description if available
          const description = item.querySelector('div[data-item-id*="description"]')?.textContent || '';
          const emailMatch = description.match(/[\w.-]+@[\w.-]+\.\w+/);
          if (emailMatch && !email) {
            email = emailMatch[0];
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
            review_count: reviewCount,
            location: searchLocation,
            keywords: searchKeywords,
            created_at: new Date().toISOString(),
            user_id: ''
          };
        })
        .filter(result => result !== null); // Remove duplicates that were marked as null
    }, location, keywords);

    // Filter and format results
    const scrapedData: ScrapedContact[] = results
      .filter(result => 
        result.business_name && 
        result.business_name.trim() !== '' &&
        // Additional filtering for websites
        (!result.website || 
          (!result.website.includes('google.com') && 
           !result.website.includes('goo.gl')))
      )
      .map(result => ({
        ...result,
        user_id: userId,
        // Ensure website starts with http/https
        website: result.website && !result.website.startsWith('http') 
          ? `https://${result.website}` 
          : result.website
      }));

    console.log(`Found ${scrapedData.length} results`);
    
    if (scrapedData.length === 0) {
      // Try one more time with a delay if no results
      await new Promise(resolve => setTimeout(resolve, 3000));
      const retryResults = await page.evaluate((searchLocation, searchKeywords) => {
        // Try multiple selectors for business listings
        const containers = Array.from(document.querySelectorAll([
          'div.Nv2PK',
          'div[role="article"]',
          'div[jsaction*="mouseover:pane.placeCard"]',
          'div[class*="m6QErb"] > div',
          'div[class*="DxyBCb"] > div',
          'a[href^="/maps/place"]'
        ].join(', ')))
        .filter(el => el?.textContent?.trim());

        console.log('Found containers on retry:', containers.length);

        if (containers.length === 0) {
          // Try alternative selectors if no results found
          const altContainers = Array.from(document.querySelectorAll([
            'div[class*="kXGGdf"]',
            'div[class*="qBF1Pd"]',
            'div.section-result',
            'div[data-result-index]'
          ].join(', ')));
          if (altContainers.length > 0) {
            containers.push(...altContainers);
          }
        }

        return containers.map(item => {
          // Get business name - using multiple selectors
          const nameElement = 
            item.querySelector('h3.fontHeadlineLarge') || 
            item.querySelector('[role="heading"]') ||
            item.querySelector('.fontHeadlineSmall') ||
            item.querySelector('div[role="heading"][class*="fontHeadline"]');
          const name = nameElement?.textContent?.trim() || '';

          // Get business type - using multiple selectors
          const typeElement = 
            item.querySelector('div[aria-label*="Type of place"]') ||
            item.querySelector('button[jsaction*="category"]') ||
            item.querySelector('div[jsaction*="category"]') ||
            item.querySelector('div.W4Efsd:first-child') ||
            item.querySelector('div[class*="fontBodyMedium"]:first-child');
          const businessType = typeElement?.textContent?.trim().split('·')[0].trim() || '';

          // Get rating - using multiple selectors
          const ratingElement = 
            item.querySelector('span.MW4etd') ||
            item.querySelector('span[aria-hidden="true"]') ||
            item.querySelector('span.fontDisplayLarge');
          const rating = ratingElement ? 
            parseFloat(ratingElement.textContent?.trim() || '0') : 
            null;

          // Get review count - using multiple selectors
          const reviewElement = 
            item.querySelector('span.UY7F9') ||
            item.querySelector('span[aria-label*="review"]') ||
            item.querySelector('button[aria-label*="review"]');
          const reviewCount = reviewElement ? 
            parseInt(reviewElement.textContent?.replace(/[^0-9]/g, '') || '0') : 
            null;

          // Get address - using multiple selectors
          const addressElement = 
            item.querySelector('div[class*="fontBodyMedium"]:nth-child(2)') ||
            item.querySelector('div[role="link"] div.W4Efsd:last-child') ||
            item.querySelector('div[class*="W4Efsd"]:last-child') ||
            item.querySelector('[data-item-id*="address"]') ||
            item.querySelector('div[aria-label*="Address"]');
          const address = addressElement?.textContent?.trim() || '';

          // Get website - using multiple methods
          const websiteButton = 
            item.querySelector('a[data-item-id*="authority"]') ||
            item.querySelector('a[aria-label*="website"]') ||
            Array.from(item.querySelectorAll('a')).find(a => {
              const href = (a as HTMLAnchorElement).href || '';
              return href && 
                !href.includes('maps.google.com') && 
                !href.includes('mailto:') && 
                !href.includes('tel:') &&
                !href.includes('google.com/search') &&
                !href.includes('/maps/dir/');
            });
          const website = websiteButton?.getAttribute('href')?.replace(/^.*?redirect=/, '') || '';

          // Get phone - using multiple methods
          const phoneButton = 
            item.querySelector('button[data-item-id*="phone"]') ||
            item.querySelector('button[aria-label*="phone"]') ||
            item.querySelector('[data-item-id*="phone"]') ||
            item.querySelector('div[aria-label*="phone"]');
          let phone = '';
          if (phoneButton) {
            phone = phoneButton.getAttribute('aria-label')?.replace('Phone:', '')?.trim() ||
                   phoneButton.textContent?.trim() || '';
          }

          // Get office hours - using multiple methods
          const hoursButton = 
            item.querySelector('button[data-item-id*="oh"]') ||
            item.querySelector('[aria-label*="Hours"]') ||
            item.querySelector('div[data-item-id*="oh"]');
          let officeHours = '';
          if (hoursButton) {
            const hoursText = hoursButton.getAttribute('aria-label') || hoursButton.textContent;
            officeHours = hoursText?.replace(/^Hours:\s*/i, '')?.trim() || '';
            
            // Try to get detailed hours if available
            const detailedHours = item.querySelector('table[aria-label*="hour"]');
            if (detailedHours) {
              const rows = Array.from(detailedHours.querySelectorAll('tr'));
              officeHours = rows.map(row => row.textContent?.trim()).join('\n');
            }
          }

          // Get email - using multiple methods
          let email = '';
          const emailElement = 
            item.querySelector('a[href^="mailto:"]') ||
            Array.from(item.querySelectorAll('a')).find(a => a.href?.startsWith('mailto:'));
          if (emailElement) {
            email = emailElement.getAttribute('href')?.replace('mailto:', '') || '';
          }

          // Try to extract email from description if available
          const description = item.querySelector('div[data-item-id*="description"]')?.textContent || '';
          const emailMatch = description.match(/[\w.-]+@[\w.-]+\.\w+/);
          if (emailMatch && !email) {
            email = emailMatch[0];
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
            review_count: reviewCount,
            location: searchLocation,
            keywords: searchKeywords,
            created_at: new Date().toISOString(),
            user_id: ''
          };
        });
      }, location, keywords);
      
      const retryData = retryResults
        .filter(result => 
          result && 
          typeof result === 'object' && 
          'business_name' in result && 
          result.business_name && 
          result.business_name.trim() !== ''
        )
        .map(result => ({
          ...result,
          user_id: userId
        }));
        
      if (retryData.length > 0) {
        console.log(`Found ${retryData.length} results on retry`);
        return { data: retryData, error: null };
      }
      
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