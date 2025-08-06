# Family Meal Planning SaaS

A collaborative family meal planning application that automates weekly meal suggestion collection, enables collaborative family decision-making, and generates organized shopping lists for grocery delivery services.

## Features

### Core Functionality
- **Household Group Management**: Create custom groups like "Whole House", "Just Kids", "Adults Only" with their own dietary restrictions
- **AI-Powered Meal Generation**: Generate meal suggestions using OpenAI based on group preferences and dietary restrictions
- **Collaborative Form System**: Family members can share preferences through mobile-responsive forms
- **Decision Management Dashboard**: Real-time response tracking and analytics
- **Smart Shopping Lists**: Auto-generated lists with group-based quantity calculations
- **Grocery Service Integration**: Export to Walmart+ and Instacart (Walmart+ integration ready)

### Technical Features
- **Real-time Collaboration**: Live form updates using Supabase subscriptions
- **Row Level Security**: Complete data isolation between families
- **Mobile-First Design**: Responsive interface optimized for mobile devices
- **Progressive Web App**: Offline capability for viewing meal plans
- **Group-Based Calculations**: Automatic serving size adjustments based on group demographics

## Technology Stack

- **Frontend**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components
- **Backend**: Supabase (PostgreSQL, Authentication, Real-time, Edge Functions)
- **AI Service**: OpenAI GPT-4 for meal generation
- **Deployment**: Vercel (frontend) + Supabase (backend)

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account
- OpenAI API key

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd meal-planning
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.local.example .env.local
   ```
   
   Fill in your environment variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   OPENAI_API_KEY=your_openai_api_key
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. **Set up Supabase**
   
   Install Supabase CLI:
   ```bash
   npm install -g supabase
   ```
   
   Run the database migrations:
   ```bash
   supabase db push
   ```
   
   Deploy the Edge Functions:
   ```bash
   supabase functions deploy generate-meals
   supabase functions deploy generate-shopping-list
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Schema

### Core Tables
- **households**: Family groups with subscription info
- **user_profiles**: Extended user information with roles and demographics
- **household_groups**: Custom meal planning groups with dietary restrictions
- **household_group_members**: Junction table for group membership
- **meals**: Recipe database with AI-generated and manual entries
- **meal_plans**: Weekly meal planning records
- **meal_plan_entries**: Individual meal assignments with group targeting
- **meal_forms**: Preference collection forms with shareable links
- **meal_form_responses**: Family member response data
- **shopping_lists**: Auto-generated shopping lists with group-based quantities

### Security
- Row Level Security (RLS) enabled on all tables
- Data isolation by household_id
- User authentication via Supabase Auth
- Secure form sharing via unique tokens

## Architecture

### Frontend Structure
```
src/
├── app/                    # Next.js App Router pages
│   ├── dashboard/         # Main dashboard
│   ├── groups/           # Household group management
│   ├── meals/            # Meal browsing and generation
│   ├── meal-plans/       # Meal plan creation and management
│   ├── forms/            # Form response interface
│   └── shopping-lists/   # Shopping list generation
├── components/           # Reusable UI components
│   ├── ui/              # Base UI components (shadcn/ui)
│   ├── forms/           # Form-specific components
│   └── dashboard/       # Dashboard components
├── lib/                 # Utility libraries
│   ├── auth/           # Authentication context
│   ├── supabase/       # Supabase client configuration
│   └── database.ts     # Database service functions
└── types/              # TypeScript type definitions
```

### Backend Structure (Supabase)
```
supabase/
├── migrations/          # Database schema migrations
│   ├── 001_initial_schema.sql
│   ├── 002_row_level_security.sql
│   └── 003_sample_data.sql
└── functions/          # Edge Functions
    ├── generate-meals/
    └── generate-shopping-list/
```

## Key Features Deep Dive

### Household Groups System
The core differentiator of this application is the sophisticated household group management:

- **Flexible Group Creation**: Define groups like "Whole House", "Just Kids", "Adults Only"
- **Demographic Composition**: Track adults, teens, children, and toddlers per group
- **Group-Level Dietary Restrictions**: Apply restrictions to entire groups rather than individuals
- **Serving Calculations**: Automatic quantity scaling based on group demographics
- **Meal Category Mapping**: Different meal types target specific groups

### AI Meal Generation
Powered by OpenAI GPT-4 with context-aware prompts:
- Respects all group dietary restrictions
- Calculates appropriate serving sizes
- Generates complete recipes with ingredients and instructions
- Categorizes meals by target groups
- Learns from family feedback over time

### Collaborative Form System
Mobile-first preference collection:
- **Shareable Links**: Unique tokens for easy family sharing
- **Real-time Updates**: Live response tracking via Supabase subscriptions
- **Progressive Completion**: Save and continue later functionality
- **Deadline Management**: Automatic reminders and status tracking
- **Conflict Resolution**: Identify and suggest solutions for preference conflicts

### Smart Shopping Lists
Group-aware quantity calculations:
- **Automatic Aggregation**: Combine ingredients from multiple meals
- **Group-Based Scaling**: Adjust quantities based on assigned groups
- **Category Organization**: Sort by store sections for efficient shopping
- **Export Options**: Print-friendly and grocery service integration
- **Cost Estimation**: Approximate total shopping cost

## Development Phases

### Phase 1 (MVP) ✅ COMPLETED
- [x] Basic family setup and household group creation
- [x] Simple group-based meal generation
- [x] Group-aware form creation and sharing
- [x] Shopping list creation with group quantities
- [x] Email notifications
- [x] Basic dashboard with group overview

### Phase 2 (Planned)
- [ ] Enhanced AI meal generation with learning
- [ ] Walmart+ API integration
- [ ] Advanced analytics dashboard
- [ ] Mobile app (React Native)
- [ ] Nutrition tracking by group

### Phase 3 (Future)
- [ ] Smart home integration
- [ ] Calendar synchronization
- [ ] Recipe rating and review system
- [ ] Meal prep planning
- [ ] Budget tracking and optimization

## API Documentation

### Edge Functions

#### `/functions/generate-meals`
Generates AI-powered meal suggestions based on household groups and dietary restrictions.

**Request:**
```json
{
  "householdId": "uuid",
  "groupIds": ["uuid1", "uuid2"],
  "mealCategories": ["whole_house", "group_specific"],
  "preferences": ["comfort food", "healthy"],
  "excludeIngredients": ["nuts", "tomatoes"],
  "mealCount": 5
}
```

#### `/functions/generate-shopping-list`
Creates shopping lists from finalized meal plans with group-based quantity calculations.

**Request:**
```json
{
  "mealPlanId": "uuid",
  "householdId": "uuid"
}
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Deployment

### Vercel Deployment
1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Supabase Setup
1. Create new Supabase project
2. Run database migrations
3. Deploy Edge Functions
4. Configure authentication settings

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, email support@mealplanner.com or join our Discord community.

## Acknowledgments

- [Supabase](https://supabase.com/) for the excellent backend platform
- [OpenAI](https://openai.com/) for AI meal generation capabilities
- [shadcn/ui](https://ui.shadcn.com/) for beautiful UI components
- [Vercel](https://vercel.com/) for seamless deployment