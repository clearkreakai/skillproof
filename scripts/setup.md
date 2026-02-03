# SkillProof Setup Guide

## Prerequisites

1. **Supabase Project**: Already created at https://supabase.com/dashboard/project/fdgvahmbnljpirynfhpx
2. **Anthropic API Key**: Required for assessment generation

## Step 1: Create Database Tables

1. Go to: https://supabase.com/dashboard/project/fdgvahmbnljpirynfhpx/sql/new
2. Copy the contents of `create-tables.sql` from this folder
3. Paste and run in the SQL editor

## Step 2: Configure Environment Variables

### Local Development (.env.local)
Add this to your `.env.local` file:
```
ANTHROPIC_API_KEY=your-anthropic-api-key-here
```

### Vercel Production
1. Go to: https://vercel.com/clearkreakai/skillproof-three/settings/environment-variables
2. Add: `ANTHROPIC_API_KEY` with your Anthropic API key

## Step 3: Verify Setup

Run locally:
```bash
npm run dev
```

Visit:
- http://localhost:3000 - Landing page
- http://localhost:3000/assess - Start assessment

## Troubleshooting

### "Assessment generation failed"
- Check ANTHROPIC_API_KEY is set
- Verify API key has credits

### "Table not found" errors
- Run the SQL migration script in Supabase

### Build errors
```bash
npm run build
```
Should complete without errors.
