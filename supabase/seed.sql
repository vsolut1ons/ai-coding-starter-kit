-- Seed data for local development / demo
-- Requires: a valid user UUID from auth.users
-- Usage:
--   1. Register a user in your app
--   2. Find their UUID in Supabase Dashboard → Authentication → Users
--   3. Replace 'YOUR-USER-UUID-HERE' with the actual UUID
--   4. Run this in Supabase Dashboard → SQL Editor

DO $$
DECLARE
  demo_user_id UUID := 'YOUR-USER-UUID-HERE';
BEGIN
  INSERT INTO ideas (title, description, status, vote_count, comment_count, author_id) VALUES
  (
    'Dark Mode Support',
    'Add a dark mode toggle so users can switch between light and dark themes. This would reduce eye strain and is especially useful for night-time users.',
    'Planned', 18, 3, demo_user_id
  ),
  (
    'CSV Export for Portfolio',
    'Allow users to export their portfolio data as a CSV file for further analysis in Excel or Google Sheets.',
    'In Progress', 34, 7, demo_user_id
  ),
  (
    'Price Alerts via Email',
    'Send email notifications when a stock hits a user-defined price target, both upper and lower bounds.',
    'Planned', 27, 5, demo_user_id
  ),
  (
    'Mobile App (iOS & Android)',
    'Build a native mobile app so users can track their portfolio on the go without needing a browser.',
    'Planned', 51, 12, demo_user_id
  ),
  (
    'Multi-currency Support',
    'Support portfolios in multiple currencies with automatic exchange rate conversion.',
    'Done', 22, 4, demo_user_id
  ),
  (
    'Dividend Tracking',
    'Track dividend payments and show dividend yield per stock and for the whole portfolio.',
    'Planned', 15, 2, demo_user_id
  );
END $$;
