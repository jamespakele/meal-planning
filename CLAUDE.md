# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a family-focused meal planning SaaS application that automates weekly meal suggestion collection, enables collaborative family decision-making, and generates organized shopping lists for grocery delivery services. The platform addresses complex household dynamics with multiple adults, teenagers, and children.

## Architecture & Technology Stack

Based on the PRD, this project uses:

- **Frontend**: Modern web application (React/Vue.js/Next.js recommended)
- **Backend**: Supabase (PostgreSQL database + Authentication + Real-time + Edge Functions)
- **Database**: PostgreSQL via Supabase with Row Level Security (RLS)
- **Authentication**: Supabase Auth with social logins and MFA support
- **Real-time Features**: Supabase real-time subscriptions for form responses
- **API Layer**: Supabase Edge Functions (Deno runtime) for custom business logic
- **AI Service**: Integration with OpenAI or similar for meal generation
- **Email Service**: Supabase integrated email or SendGrid/Resend
- **File Storage**: Supabase Storage for meal images and shopping list exports

## Core Domain Concepts

### Household Groups System
The application centers around a sophisticated household group management system:

- **Household Groups**: Custom groups like "Whole House", "Just Kids", "Wife and Kids", "Adults Only"
- **Group Composition**: Defined by demographic count (X adults, Y teens, Z children, W toddlers)
- **Group-Level Dietary Restrictions**: Applied to entire groups rather than individuals
- **Serving Calculations**: Automatic quantity scaling based on group demographics
- **Meal Categories**: Mapped to specific household groups (whole house meals, group-specific meals, etc.)

### Key Business Logic
- Meal suggestions must respect group-level dietary restrictions
- Serving sizes auto-calculate based on group demographic composition
- Shopping lists scale quantities based on finalized group meal assignments
- Form generation is group-aware, showing relevant sections per family member
- Preference weighting operates at both individual and group levels

## Essential Integrations

### Required APIs
- **Walmart+ API**: Primary grocery delivery integration
- **Instacart API**: Alternative grocery delivery option  
- **OpenAI API**: AI meal generation and suggestions
- **Email Service API**: Notification delivery system

### Database Schema Priorities
When implementing the database schema, focus on:
1. **Users & Authentication**: Family member profiles and roles
2. **Household Groups**: Core group management with demographic composition
3. **Dietary Restrictions**: Group-level constraint system
4. **Meal Plans**: Weekly planning with group assignments
5. **Forms & Responses**: Collaborative decision-making system
6. **Shopping Lists**: Auto-generated with group-based quantities

## Development Phases

### Phase 1 (MVP)
- Basic family setup and household group creation
- Simple group-based meal generation  
- Group-aware form creation and sharing
- Manual shopping list creation with group quantities
- Email notifications
- Basic dashboard with group overview

### Phase 2 (Core Features)
- AI meal generation improvements
- Automated shopping list generation
- Grocery service integrations
- Enhanced mobile experience
- Analytics dashboard

## Critical Features

### Real-time Collaboration
- Use Supabase real-time subscriptions for live form updates
- Implement response tracking and conflict resolution
- Enable simultaneous family member form completion

### Group-Based Calculations
- All serving size calculations must account for group demographics
- Shopping list quantities must scale based on finalized group assignments
- Meal suggestions must filter based on group dietary restrictions

### Mobile-First Design
- Forms must be mobile-responsive for busy family members
- Touch-friendly interfaces for meal selection
- Offline capability for viewing meal plans

## Security Requirements

- **Row Level Security**: Implement Supabase RLS to isolate family data
- **Authentication**: Multi-factor authentication via Supabase Auth
- **GDPR Compliance**: Data export/deletion capabilities
- **Children's Privacy**: COPPA compliance for families with minors
- **Food Safety**: Clear disclaimers and allergy management

## Key Success Metrics

- Form completion rate (target: >80%)
- Time from form creation to finalization (target: <48 hours)  
- Shopping list utilization rate (target: >90%)
- Meal satisfaction ratings (target: >4.0/5.0)

## Development Notes

- This project is at the planning stage with only a PRD document
- MCP server configured for Context7 documentation access
- Focus on group-based architecture from the start - this is the core differentiator
- Build with Supabase ecosystem to leverage real-time, auth, and Edge Functions
- Prioritize mobile experience as family members will use phones for form completion