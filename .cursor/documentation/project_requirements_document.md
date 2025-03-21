# Project Requirements Document

## 1. Project Overview

This project is all about creating a web-based tool that helps salespeople extract key contact details—like emails, phone numbers, and social media links—from Google Maps listings. The tool allows users to simply enter a location and keywords, starting a controlled scraping process that gathers useful data. Once collected, the data is displayed in a clear table format, and users can export it as a CSV file for further use in their sales strategies.

The tool is being built to streamline the data gathering process and save valuable time for sales teams. Its key objectives are to provide an intuitive user interface, ensure ethical and compliant data scraping, and enable on-demand data extraction with customization options for CSV exports. The project will emphasize user security, performance, and scalability, ensuring the system can handle high volumes of data and concurrent users.

## 2. In-Scope vs. Out-of-Scope

**In-Scope:**

*   Development of a web-based tool with a user-friendly interface.
*   Input fields for location and keywords that trigger the scraping process.
*   Back-end data scraping using Node.js libraries (Puppeteer or Playwright) with built-in rate limits and pause mechanisms for ethical scraping.
*   Displaying extracted contact data in a sortable, filterable table.
*   Customizable CSV export functionality with options to select specific columns and apply filters.
*   User authentication and role-based access (e.g., sales managers and individual salespeople).
*   Robust logging and audit trails to monitor both scraping activities and user interactions.
*   Integration support for AI tools (such as GPT-4) to generate insights, like prioritization and engagement suggestions.
*   Optional integrations with email verification (Hunter, NeverBounce) and data enrichment services (Clearbit).

**Out-of-Scope:**

*   Automated or scheduled scraping features; the tool is strictly for on-demand use.
*   Extensive theming or branding guidelines beyond a minimalistic, professional interface using Tailwind CSS and shadcn.
*   Any fully automated scraping that mimics abusive bot behavior or violates Google Maps' terms of service.
*   Advanced analytics dashboards beyond basic AI-generated insights within the results table.
*   Non-sales related data extraction or processing features.

## 3. User Flow

A typical user journey starts with a secure login page where users authenticate themselves. Depending on their role (for example, sales manager or individual salesperson), they gain access to the home screen. Here, users encounter a clean interface with input fields for entering a location and search keywords along with a clear “Search” button that initiates the scraping process. The system ensures that only authorized users can use the tool and that all access is logged for compliance.

Once the search is initiated, the tool triggers the back-end scraping process, which carefully interacts with Google Maps by respecting rate limits and ethical scraping practices. After the scraping finishes, the user is directed to a results page where the extracted data is neatly organized in a sortable and filterable table. From this page, users can customize which columns to include, apply filters, view AI-powered insights such as contact summaries and engagement suggestions, and finally export the data as a CSV file for use in their external sales tools.

## 4. Core Features

*   **User Authentication & Role Management:**\
    Secure login with support for different user roles (e.g., sales manager, individual salesperson) and detailed access rights management.
*   **Input Interface:**\
    A straightforward home screen with location and keyword fields, emphasizing ease-of-use and clarity.
*   **Data Scraping Module:**\
    Utilizes Node.js libraries (Puppeteer or Playwright) to extract contact information from Google Maps listings while implementing ethical scraping practices (rate limiting, pauses, and compliance with robots.txt guidelines).
*   **Results Display:**\
    A sortable, filterable table that showcases the extracted data. The interface allows for quick review and customization of the displayed information.
*   **CSV Export Functionality:**\
    Customizable CSV export options enabling users to select specific columns and apply filters before downloading the data.
*   **AI Insights Integration:**\
    Incorporation of AI models like GPT-4 to generate insights such as priority analysis, contact summaries, and engagement suggestions, integrating seamlessly into the results table.
*   **Logging & Audit Trails:**\
    Comprehensive logging to track both scraping activities and user interactions for debugging, monitoring, and ensuring compliance with data protection regulations.
*   **Optional External Integrations:**\
    Support for services like email verification (Hunter, NeverBounce) and data enrichment (Clearbit) to enhance the quality and reliability of extracted data.

## 5. Tech Stack & Tools

*   **Frontend:**

    *   Next.js (App Router) built with TypeScript.
    *   Tailwind CSS for styling along with shadcn for UI components.

*   **Backend & Storage:**

    *   Supabase for managing user data, storage, and authentication.

*   **Web Scraping:**

    *   Node.js-based libraries such as Puppeteer or Playwright to conduct the data scraping in compliance with Google's policies.

*   **AI & Data Enrichment:**

    *   GPT-4 for generating insights and summaries.
    *   Optional external APIs for email verification (Hunter, NeverBounce) and data enrichment (Clearbit).

*   **IDE & Developer Tools:**

    *   Cursor for real-time coding suggestions.
    *   V0 by Vercel for modern frontend component building and design pattern integration.

## 6. Non-Functional Requirements

*   **Performance:**\
    The system should have fast load times and responsive interactions. The backend is optimized for rapid data retrieval, and effective caching strategies should provide a smooth user experience even with large datasets.
*   **Security:**\
    Data encryption at rest and in transit, secure authentication mechanisms, role-based access, and adherence to legal compliance (e.g., GDPR, CCPA) are critical.
*   **Compliance:**\
    Ethical and legal scraping practices must be maintained, including adherence to Google Maps’ terms of service and respecting API rate limits.
*   **Usability:**\
    The design should be clean, modern, and minimalistic, ensuring that salespeople can easily navigate the application without confusion. The interface will use professional color schemes (blues or violets) and modern fonts (DM-Sans, UI-Sans, Inter, or Roboto) for clarity.

## 7. Constraints & Assumptions

*   **Constraints:**

    *   The tool must strictly adhere to Google Maps’ terms of service, meaning rate limits and request delays are necessary.
    *   The scraping process is on-demand only and does not support scheduled or automated scraping.
    *   The project relies on the availability and compliance of external APIs (e.g., for email verification and data enrichment).

*   **Assumptions:**

    *   Users will manually input search criteria, triggering the scraping process.
    *   The environment supports scaling, especially as concurrent usage grows; therefore, backend and database design must support high-volume operations.
    *   Legal consultation and ongoing monitoring will be in place to ensure compliance with changing data protection and scraping laws.

## 8. Known Issues & Potential Pitfalls

*   **API Rate Limits & Blocking:**\
    There is a risk of being blocked or flagged by Google due to scraping activities. To mitigate this, robust rate limiting, request delays, and adherence to ethical scraping practices must be implemented.
*   **Compliance Risks:**\
    Since Google Maps generally restricts scraping, continuous monitoring of their terms of service is necessary. The tool will include warning messages and user documentation to educate users about ethical usage and legal implications.
*   **Scalability Challenges:**\
    High volumes of data and many concurrent users might slow down performance. The use of efficient caching, load balancing, and optimized database queries is essential to manage heavy loads.
*   **Data Accuracy & Enrichment Issues:**\
    Integration with external services (e.g., email verification and Clearbit) comes with its own API rate limits or downtime. Fallback mechanisms and error handling should be in place to maintain data accuracy.
*   **Logging Overhead:**\
    Detailed logging can cause performance overhead if not managed properly. Ensure logs are rotated, stored securely, and do not adversely impact system performance.

This document should serve as a definitive guide for the AI model so that all subsequent technical documents (Tech Stack Document, Frontend Guidelines, Backend Structure, etc.) can be generated with clarity and precision.
