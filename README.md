# ResumeAI - AI-Powered Resume Analysis & Tailoring Platform

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Visit%20Site-blue)](https://marvelous-kitten-0a36d7.netlify.app)
[![Built with React](https://img.shields.io/badge/Built%20with-React-61DAFB)](https://reactjs.org/)
[![Powered by Supabase](https://img.shields.io/badge/Powered%20by-Supabase-3ECF8E)](https://supabase.com/)
[![Styled with Tailwind](https://img.shields.io/badge/Styled%20with-Tailwind%20CSS-38B2AC)](https://tailwindcss.com/)

Transform your resume with AI-powered analysis and tailoring. Get ATS-optimized resumes that land interviews.

![ResumeAI Dashboard](https://images.pexels.com/photos/590016/pexels-photo-590016.jpeg?auto=compress&cs=tinysrgb&w=1200&h=600&fit=crop)

## ✨ Features

### 🤖 AI-Powered Analysis
- **OpenAI Integration**: Advanced GPT-4 powered resume analysis
- **ATS Optimization**: Improve your resume's compatibility with Applicant Tracking Systems
- **Smart Suggestions**: Get personalized recommendations for improvement
- **Keyword Optimization**: Automatically add relevant keywords from job descriptions

### 💳 Subscription Management
- **Flexible Plans**: Free tier and Premium subscription options
- **Paystack Integration**: Secure payment processing
- **Usage Tracking**: Monitor your monthly analysis limits
- **Auto-renewal**: Seamless subscription management

### 👨‍💼 Admin Dashboard
- **User Management**: View and manage all platform users
- **Package Management**: Create and modify subscription plans
- **Analytics**: Track platform usage and revenue
- **Template Management**: Add and update resume templates

## 🚀 Live Demo

Visit the live application: [https://marvelous-kitten-0a36d7.netlify.app](https://marvelous-kitten-0a36d7.netlify.app)

## 🛠️ Tech Stack

### Frontend
- **React 18** - Modern React with hooks and functional components
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Vite** - Fast build tool and development server
- **Lucide React** - Beautiful icon library

### Backend & Database
- **Supabase** - Backend-as-a-Service with PostgreSQL
- **Row Level Security** - Secure data access policies
- **Real-time subscriptions** - Live data updates
- **Authentication** - Built-in user management

### AI & Payments
- **OpenAI GPT-4** - Advanced language model for resume analysis
- **Paystack** - Payment processing for African markets
- **File Processing** - PDF and DOCX resume parsing

### Deployment
- **Netlify** - Static site hosting with CI/CD
- **Environment Variables** - Secure configuration management

## 📋 Prerequisites

Before running this project, make sure you have:

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **Supabase account** (free tier available)
- **OpenAI API key** (for AI analysis)
- **Paystack account** (for payments)

## ⚡ Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/resumeai.git
cd resumeai
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **Project Settings > API**
3. Copy your **Project URL** and **Public anon key**

### 4. Configure Environment Variables

Create a `.env` file in the root directory:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# OpenAI Configuration (for AI analysis)
VITE_OPENAI_API_KEY=your_openai_api_key

# Paystack Configuration (for payments)
VITE_PAYSTACK_PUBLIC_KEY=your_paystack_public_key
```

### 5. Set Up Database

Run the database migrations in your Supabase SQL editor:

```sql
-- Copy and paste the contents of supabase/migrations/20250628220334_cold_fire.sql
-- This will create all necessary tables, policies, and seed data
```

### 6. Start Development Server

```bash
npm run dev
```

Visit `http://localhost:5173` to see the application running!

## 📁 Project Structure

```
resumeai/
├── src/
│   ├── components/          # React components
│   │   ├── admin/          # Admin dashboard components
│   │   ├── auth/           # Authentication forms
│   │   ├── dashboard/      # Main dashboard components
│   │   ├── layout/         # Layout components
│   │   ├── subscription/   # Subscription management
│   │   └── ui/             # Reusable UI components
│   ├── contexts/           # React contexts
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Library configurations
│   ├── services/           # API service classes
│   ├── types/              # TypeScript type definitions
│   └── utils/              # Utility functions
├── supabase/
│   └── migrations/         # Database migration files
├── public/                 # Static assets
└── dist/                   # Build output
```

## 🗄️ Database Schema

The application uses PostgreSQL with the following main tables:

- **profiles** - Extended user profiles
- **packages** - Subscription packages
- **subscriptions** - User subscriptions
- **resume_templates** - Available resume templates
- **resume_analyses** - AI analysis results
- **usage_tracking** - Usage limits tracking
- **payment_transactions** - Payment history

## 🔐 Authentication & Security

- **Supabase Auth** - Secure user authentication
- **Row Level Security** - Database-level access control
- **JWT Tokens** - Secure session management
- **Environment Variables** - Secure API key storage

## 💰 Subscription Plans

### Free Plan
- 1 Resume Template
- 5 AI Analyses per month
- Basic Support
- PDF Download

### Premium Plan ($19.99/month)
- All Resume Templates
- Unlimited AI Analyses
- Priority Support
- PDF & DOCX Downloads
- Advanced AI Features
- ATS Score Analysis

## 🚀 Deployment

### Deploy to Netlify

1. **Build the project**:
   ```bash
   npm run build
   ```

2. **Deploy to Netlify**:
   - Connect your GitHub repository to Netlify
   - Set build command: `npm run build`
   - Set publish directory: `dist`
   - Add environment variables in Netlify dashboard

### Environment Variables for Production

Make sure to set these in your deployment platform:

```env
VITE_SUPABASE_URL=your_production_supabase_url
VITE_SUPABASE_ANON_KEY=your_production_supabase_key
VITE_OPENAI_API_KEY=your_openai_api_key
VITE_PAYSTACK_PUBLIC_KEY=your_paystack_public_key
```

## 🧪 Testing

### Demo Mode
The application includes demo functionality when API keys are not configured:
- Mock AI analysis responses
- Simulated payment processing
- Sample data for testing

### Manual Testing
1. **User Registration**: Create new accounts
2. **Resume Upload**: Test PDF/DOCX file processing
3. **AI Analysis**: Verify analysis workflow
4. **Subscription**: Test payment flow (sandbox mode)
5. **Admin Features**: Test admin dashboard functionality

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit your changes**: `git commit -m 'Add amazing feature'`
4. **Push to the branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

### Development Guidelines

- Use TypeScript for type safety
- Follow the existing code style
- Add comments for complex logic
- Test your changes thoroughly
- Update documentation as needed

## 📝 API Documentation

### Resume Analysis API

```typescript
// Analyze resume with AI
const analysis = await ResumeService.analyzeResume({
  resumeText: string,
  jobDescription: string,
  templateId: string
});
```

### Subscription API

```typescript
// Initialize payment
const payment = await SubscriptionService.initializePayment(packageId);

// Verify payment
const result = await SubscriptionService.verifyPayment(reference);
```

## 🐛 Troubleshooting

### Common Issues

1. **Supabase Connection Error**
   - Verify your Supabase URL and API key
   - Check if your Supabase project is active

2. **OpenAI API Error**
   - Ensure your OpenAI API key is valid
   - Check your OpenAI account credits

3. **Payment Issues**
   - Verify Paystack public key
   - Ensure you're using the correct environment (test/live)

4. **Build Errors**
   - Clear node_modules and reinstall: `rm -rf node_modules && npm install`
   - Check for TypeScript errors: `npm run lint`

### Getting Help

- **Issues**: Open an issue on GitHub
- **Discussions**: Use GitHub Discussions for questions
- **Email**: Contact support at your-email@domain.com

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **OpenAI** for providing the GPT-4 API
- **Supabase** for the excellent backend platform
- **Paystack** for payment processing
- **Tailwind CSS** for the beautiful styling
- **Lucide** for the icon library
- **Netlify** for hosting and deployment

## 📊 Project Stats

- **Lines of Code**: ~5,000+
- **Components**: 20+
- **Database Tables**: 7
- **API Integrations**: 3 (Supabase, OpenAI, Paystack)
- **Responsive Design**: Mobile-first approach

---

**Built with ❤️ by [eLxis](https://github.com/elxisme)**

[⭐ Star this repo](https://github.com/yourusername/resumeai) if you found it helpful!
