# Implementation plan

## Phase 1: Environment Setup

1.  Install Node.js v20.2.1 and set up a new Next.js 14 project with TypeScript by running:

`npx create-next-app@14 --typescript google-maps-scraper`

(Tech Stack Document, Project Requirements Document)

1.  **Validation**: Run `node -v` and check `package.json` to confirm Node.js v20.2.1 and Next.js 14.
2.  Navigate into the project directory:

`cd google-maps-scraper`

(Tech Stack Document)

1.  Install Tailwind CSS following official docs. Initialize Tailwind by running:

`npm install -D tailwindcss postcss autoprefixer npx tailwindcss init -p`

(Frontend Guidelines Document)

1.  Configure Tailwind by updating `tailwind.config.js` and adding necessary content paths. (Frontend Guidelines Document)
2.  Install shadcn UI components as per docs. For example, run:

`npm install @shadcn/ui`

(Frontend Guidelines Document)

1.  Set up a Supabase project for backend storage and authentication. Retrieve your Supabase URL and anon key, and create a `.env.local` file in the project root with the following:

`NEXT_PUBLIC_SUPABASE_URL=<YOUR_SUPABASE_URL> NEXT_PUBLIC_SUPABASE_ANON_KEY=<YOUR_SUPABASE_ANON_KEY>`

(Tech Stack Document, Project Requirements Document)

1.  Install Supabase client for the frontend:

`npm install @supabase/supabase-js`

(Backend Structure Document)

1.  Install the Puppeteer (or Playwright) library for web scraping. For example, using Puppeteer:

`npm install puppeteer`

(Tech Stack Document, Project Requirements Document)

## Phase 2: Frontend Development

1.  Create the Home Page using the Next.js App Router. Create `/app/page.tsx` with input fields for location and keywords. (Project Requirements Document: Core Features, Frontend Guidelines Document)
2.  Implement the UI with Tailwind CSS and shadcn components in `/app/page.tsx` for a clean and modern design. (Frontend Guidelines Document, Project Requirements Document)
3.  Add state management (React useState) to capture user input from the location and keyword fields in `/app/page.tsx`. (App Flow Document, Project Requirements Document)
4.  Create a service file at `/services/scrape.ts` to handle API calls to the backend scraping endpoint. Include a POST function that sends location and keywords. (App Flow Document, Project Requirements Document)
5.  **Validation**: Test the input forms by running the app locally with `npm run dev` and ensuring inputs change state as expected.
6.  Create a React component for displaying results. Create `/components/ResultsTable.tsx` that shows scraped data in a sortable and filterable table. (Project Requirements Document: Core Features, Frontend Guidelines Document)
7.  Create a CSV export component at `/components/ExportCSV.tsx` which allows users to export the displayed table data with customizable columns. (Project Requirements Document: Customizable CSV Export, Frontend Guidelines Document)

## Phase 3: Backend Development

1.  Create a new API route for scraping in the Next.js App Router by creating `/app/api/scrape/route.ts` that handles POST requests. (Project Requirements Document: Data Scraping Compliance, Tech Stack Document)

2.  In `/app/api/scrape/route.ts`, implement the scraping function using Puppeteer. The function should:

    *   Receive location and keyword data.
    *   Navigate to Google Maps listings.
    *   Extract contact details (emails, phone numbers, social media links).
    *   Implement rate limiting and delay between requests to comply with ethical scraping practices. (Project Requirements Document: Data Scraping Compliance, Backend Structure Document)

3.  Integrate logging and audit trails by updating a Supabase database table (e.g., `scrape_logs`) from the API route. Create helper functions in `/lib/db.ts` to insert logs. (Project Requirements Document: Logging and Audit Trails, Backend Structure Document)

4.  Implement user authentication using Supabase authentication, ensuring role-based access control. Create or update `/app/api/auth/route.ts` if needed, or integrate directly in the scraping API. (Project Requirements Document: User Authentication and Authorization, Backend Structure Document)

5.  **Validation**: Test the API endpoint using a tool like Postman or curl, sending a POST request with sample location and keyword values, ensuring successful scraping responses and log entries in Supabase.

## Phase 4: Integration

1.  Connect the frontend service (`/services/scrape.ts`) to the backend API endpoint (`/api/scrape/route.ts`) by ensuring the POST request sends user inputs and handles the returned scraped data. (App Flow Document, Project Requirements Document)
2.  In the Home Page (`/app/page.tsx`), update state upon receiving data from the API and pass the results to the `ResultsTable` component. (Project Requirements Document, Frontend Guidelines Document)
3.  Connect the CSV export button in `/components/ExportCSV.tsx` to the current dataset, allowing users to download the filtered table as CSV. (Project Requirements Document: Customizable CSV Export, App Flow Document)
4.  **Validation**: Run the full workflow locally: input location and keywords, trigger the scraping API, display results in the table, and export CSV. Confirm all functionalities are working as expected.

## Phase 5: Deployment

1.  Prepare your project for deployment by ensuring that all environment variables (Supabase keys, etc.) are correctly set up in a `.env.production` file. (Tech Stack Document, Project Requirements Document)
2.  Set up a Vercel project for deployment. Create a new project on Vercel and link it to your GitHub repository. (Tech Stack Document, Project Requirements Document)
3.  Configure Vercel to use Node.js v20.2.1 and ensure the build uses Next.js 14. (Note: Next.js 14 is required for optimal performance with current AI coding tools and LLM models.) (Tech Stack Document)
4.  Deploy the application to Vercel, and verify that the live site correctly handles API calls, user authentication, and data rendering. (Project Requirements Document, App Flow Document)
5.  **Validation**: Once deployed, perform end-to-end tests using real user flows (input, scraping, data table display, CSV export) and confirm that logging, audit trails, and compliance features are functioning.
6.  (Optional) Integrate external services such as Hunter or NeverBounce for email verification and Clearbit for data enrichment by adding appropriate API calls in the backend scraping route or as separate microservices. (Project Requirements Document: Integration with External Services)
7.  (Optional) Integrate AI-powered insights with GPT-4 for lead prioritization by creating a new service file (e.g., `/services/aiInsights.ts`) that calls GPT-4 APIs and displays insights on the frontend. (Project Requirements Document: AI-Generated Insights)
8.  **Validation**: After optional integrations, ensure that additional asynchronous API calls complete successfully and that the UI reflects the enriched data provided by third-party services.
