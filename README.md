# Google Maps Contact Extractor

A web-based tool that ethically extracts contact information from Google Maps listings, designed for sales professionals. This tool allows users to search for businesses by location and keywords, scrape contact details while respecting ethical guidelines, and export the data as CSV.

## Features

- **User Authentication**: Secure login and role-based access control
- **Simple Search Interface**: Enter location and keywords to start extracting data
- **Ethical Scraping**: Respects rate limits and follows ethical scraping practices
- **Results Display**: View extracted data in a sortable and filterable table
- **Customizable CSV Export**: Select which columns to include in your export
- **Data Security**: Encrypted data storage and secure authentication

## Technology Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn UI
- **Backend**: Supabase for authentication and database
- **Scraping**: Puppeteer for data extraction
- **Deployment**: Ready for deployment on Vercel or other hosting platforms

## Getting Started

### Prerequisites

- Node.js v20.2.1 or later
- npm or yarn
- Supabase account (free tier works for development)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/google-maps-contact-extractor.git
   cd google-maps-contact-extractor
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Set up environment variables:
   Copy the `.env.local.example` file to `.env.local` and update it with your Supabase credentials:
   ```bash
   cp .env.local.example .env.local
   ```

4. Set up Supabase tables:
   - Create a new project in Supabase
   - Set up the following tables:
     - `scraped_contacts`: Stores the contact data
     - `audit_logs`: Logs all user actions

5. Run the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. Sign up or log in to the application
2. On the home page, enter a location and keywords for the businesses you want to find
3. Click "Search" to start the scraping process
4. View the results in the table, with options to filter and sort
5. Select which columns you want to include in your export
6. Click "Export as CSV" to download the data

## Ethical Considerations

This tool is designed with ethical scraping practices in mind:
- Respects rate limits to avoid overloading Google Maps servers
- Implements delay between requests to simulate human browsing
- Only extracts publicly available information
- Does not allow automated or scheduled scraping

## License

[MIT License](LICENSE)

## Acknowledgements

- Built with Next.js, Tailwind CSS, and shadcn UI
- Uses Supabase for authentication and database
- Powered by Puppeteer for ethical web scraping
