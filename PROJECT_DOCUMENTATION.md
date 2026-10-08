# ABSTRACT

ResolveAI is an AI-powered web application that helps users evaluate product trustworthiness by analyzing review sentiment, suspicious review patterns, and recommendation confidence. The system allows users to analyze products from e-commerce platforms, save analyses, generate downloadable reports, and track quality insights through a dashboard. The project combines a modern Next.js frontend, Supabase backend, and AI-driven scoring logic to improve purchasing decisions and reduce the risk of misleading reviews.

# LIST OF FIGURES

1. Figure 4.1 - System Workflow of ResolveAI  
2. Figure 4.2 - Dashboard Overview Screen  
3. Figure 4.3 - Product Analysis Interface  
4. Figure 5.1 - Reports Management Module  
5. Figure 5.2 - PDF Export Report Preview

# LIST OF TABLES

1. Table 3.1 - Software Requirements  
2. Table 3.2 - Hardware Requirements  
3. Table 6.1 - Result Summary Metrics

# Chapter 1 Introduction

## 1.1 Introduction

Online shopping decisions are often influenced by product ratings and user reviews, but those reviews may include spam, manipulation, or biased feedback. ResolveAI addresses this by applying AI-based analysis to product-related review data and presenting a trust score with explainable insights.

## 1.2 Problem Statement

Users lack a reliable way to quickly verify whether product reviews are trustworthy. Existing shopping platforms usually provide ratings and comments but do not provide transparent fake-review risk detection and sentiment intelligence in one unified interface.

## 1.3 Objective of Project

- Build a practical review intelligence platform for end users.  
- Generate trust score, recommendation level, and sentiment insights.  
- Detect suspicious/fake-review signals and recurring complaints.  
- Provide downloadable reports for decision support and sharing.

## 1.4 Goal of Project

The goal of ResolveAI is to provide a user-friendly and data-driven assistant that improves confidence in online purchase decisions by transforming raw review signals into structured and actionable trust insights.

# Chapter 2 Problem Identification

## 2.1 Existing System

- E-commerce portals show review text and aggregate rating only.  
- No standardized trust index exists across products.  
- Users manually inspect large numbers of reviews, which is time-consuming.  
- Fake-review suspicion is often not clearly surfaced.

## 2.2 Proposed System

- AI-based analysis pipeline for product trust evaluation.  
- Trust score, recommendation category, and sentiment distribution.  
- Fake-review percentage and detection flags.  
- Topic-level and complaint-level intelligence.  
- Dashboard and report history with export capability.

# Chapter 3 Requirements

## 3.1 Software Requirements

| Component | Requirement |
|---|---|
| Operating System | Windows / Linux / macOS |
| Frontend | Next.js 13, React, TypeScript |
| Styling/UI | Tailwind CSS, shadcn/ui, Radix UI |
| Charts | Recharts |
| Backend/DB | Supabase |
| Runtime | Node.js 18+ |

## 3.2 Hardware Requirements

| Component | Minimum |
|---|---|
| Processor | Dual-core 2.0 GHz |
| RAM | 4 GB (8 GB recommended) |
| Storage | 2 GB free space |
| Internet | Stable broadband connection |
| Browser | Latest Chrome / Firefox / Edge |

# Chapter 4 Design and Implementation

## 4.1 Design

ResolveAI follows a client-server architecture:

- **Presentation Layer:** Next.js pages for landing, authentication, dashboard, analysis, reports, and settings.  
- **Business Layer:** AI scoring and transformation logic for trust score, sentiment, complaints, and recommendation classification.  
- **Data Layer:** Supabase tables for users, products, analyses, reports, subscriptions, and saved items.

Data flow begins when a user submits a product URL/name. The system performs analysis, renders visual insights, then optionally saves analysis and report artifacts for future access.

## 4.2 Implementation

- Built with modular React components and typed data models.  
- Dashboard provides aggregate metrics and historical trend visualization.  
- Reports module supports search, favorite toggle, recommendation filter, sorting, in-app preview, and PDF print export.  
- Supabase integration stores structured analysis outputs and report records.

# Chapter 5 Code

## 5.1 Source Code

Key implementation areas:

- `app/dashboard/analyze/page.tsx` - product analysis workflow and insight rendering  
- `app/dashboard/page.tsx` - dashboard statistics and trend charts  
- `app/dashboard/reports/page.tsx` - report management, filtering, sorting, and export  
- `lib/ai-service.ts` - analysis generation logic  
- `lib/types.ts` - domain types for product, analysis, and reports

## 5.2 Screenshot of Application

Suggested screenshots to include in final submission:

1. Landing page  
2. Analyze product screen  
3. Analysis results with trust score  
4. Dashboard charts and summary cards  
5. Reports page with filters and download option

# Chapter 6 Results & Conclusion

## 6.1 Results

The project successfully demonstrates:

- End-to-end product analysis flow from input to saved output.  
- Explainable recommendation and trust scoring.  
- Effective report lifecycle management (save, view, favorite, delete, export).  
- Improved usability with dashboard summaries, advanced filtering, and sorting.

## 6.2 Conclusion

ResolveAI provides a practical foundation for trustworthy shopping intelligence by combining sentiment analysis, fake-review detection, and visual reporting. The current implementation can be further enhanced with live review ingestion APIs, model fine-tuning, and benchmarking against real-world datasets.

# REFERENCES

1. Next.js Documentation - https://nextjs.org/docs  
2. Supabase Documentation - https://supabase.com/docs  
3. React Documentation - https://react.dev  
4. Tailwind CSS Documentation - https://tailwindcss.com/docs  
5. Recharts Documentation - https://recharts.org/en-US

# Appendix

- Database migration file: `supabase/migrations/20261006140822_create_initial_schema.sql`  
- Environment/config examples: `next.config.js`, `netlify.toml`  
- UI component library usage: `components/ui/*`
