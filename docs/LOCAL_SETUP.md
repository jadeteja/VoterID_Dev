# Local Setup & Verification Guide
## Ward 81 Voter Search (వార్డు 81 ఓటర్ల శోధన)

### 1. Step-by-Step Local Setup

1. **Clone & Install**:
   ```bash
   cd c:\Users\jadet\Documents\code\VoterId_Dev
   npm install
   ```

2. **Environment Variables Configuration**:
   Create a `.env` file in the root directory:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```
   *(Note: The application has built-in offline/demo fallbacks and works even before Supabase is connected).*

3. **Run Development Server**:
   ```bash
   npm run dev
   ```

4. **Verify Production Build**:
   ```bash
   npm run build
   ```
