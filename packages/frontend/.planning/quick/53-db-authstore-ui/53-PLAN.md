---
phase: quick
plan: 53
type: execute
wave: 1
depends_on: []
files_modified:
  - supabase/migrations/new_enhance_handle_new_user.sql
  - packages/web/lib/stores/authStore.ts
  - packages/web/lib/components/auth/OnboardingSheet.tsx
  - packages/web/app/layout.tsx
autonomous: false
requirements: [ONBOARDING-01]
must_haves:
  truths:
    - "New OAuth user gets avatar_url and display_name from provider metadata in DB"
    - "Username collision on signup is handled gracefully with random suffix"
    - "authStore exposes profile data from public.users and detects first-time users"
    - "First-time user sees onboarding BottomSheet to set username and display name"
    - "Onboarding saves changes to public.users via Supabase direct update"
  artifacts:
    - path: "supabase/migrations/*_enhance_handle_new_user.sql"
      provides: "Improved trigger function"
    - path: "packages/web/lib/stores/authStore.ts"
      provides: "Profile state, isNewUser, needsOnboarding"
    - path: "packages/web/lib/components/auth/OnboardingSheet.tsx"
      provides: "Onboarding BottomSheet UI"
  key_links:
    - from: "authStore.ts"
      to: "public.users"
      via: "supabaseBrowserClient.from('users').select()"
      pattern: "from\\(\"users\"\\)"
    - from: "OnboardingSheet.tsx"
      to: "authStore.ts"
      via: "useAuthStore hook"
      pattern: "useAuthStore|needsOnboarding"
    - from: "OnboardingSheet.tsx"
      to: "public.users"
      via: "supabaseBrowserClient.from('users').update()"
      pattern: "from\\(\"users\"\\)\\.update"
---

<objective>
First user profile initialization: enhance DB trigger to capture OAuth metadata, connect authStore to public.users with new-user detection, and build onboarding BottomSheet UI.

Purpose: Currently new OAuth users get bare-minimum DB records (email prefix as username, no avatar). This creates a complete first-login experience.
Output: Enhanced trigger, enriched authStore, onboarding UI component.
</objective>

<execution_context>
@/Users/kiyeol/.claude-pers/get-shit-done/workflows/execute-plan.md
@/Users/kiyeol/.claude-pers/get-shit-done/templates/summary.md
</execution_context>

<context>
@packages/web/lib/stores/authStore.ts
@packages/web/lib/design-system/bottom-sheet.tsx
@packages/web/lib/supabase/admin.ts
@packages/web/app/api/v1/users/me/route.ts

<interfaces>
<!-- Key types and contracts the executor needs -->

From packages/web/lib/stores/authStore.ts:
```typescript
export type OAuthProvider = "kakao" | "google" | "apple";

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  createdAt: string;
}

interface AuthState {
  user: User | null;
  isAdmin: boolean;
  isGuest: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  loadingProvider: OAuthProvider | null;
  error: string | null;
  initialize: () => Promise<void>;
  signInWithOAuth: (provider: OAuthProvider) => Promise<void>;
  guestLogin: () => void;
  logout: () => Promise<void>;
  clearError: () => void;
  setUser: (supabaseUser: SupabaseUser | null) => Promise<void>;
}
```

From packages/web/lib/design-system/bottom-sheet.tsx:
```typescript
export interface BottomSheetProps {
  isOpen: boolean;
  onClose?: () => void;
  snapPoints?: number[];
  defaultSnapPoint?: number;
  children: ReactNode;
  header?: ReactNode;
  title?: string;
  onSnapChange?: (snapPoint: number) => void;
  className?: string;
  contentCenter?: boolean;
}
```

DB table public.users columns:
- id (UUID PK, matches auth.users.id)
- email, username (UNIQUE), display_name, avatar_url, bio
- rank, total_points, is_admin
- created_at, updated_at
- style_dna (JSONB), ink_credits (INT), studio_config (JSONB)
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Enhance handle_new_user() DB trigger + authStore profile connection</name>
  <files>
    supabase/migrations/*_enhance_handle_new_user.sql
    packages/web/lib/stores/authStore.ts
  </files>
  <action>
**Part A: DB Trigger Enhancement**

Create a new Supabase migration using `mcp__supabase__apply_migration` that replaces the `handle_new_user()` function:

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  base_username TEXT;
  final_username TEXT;
  suffix TEXT;
BEGIN
  -- Extract base username from metadata or email
  base_username := COALESCE(
    NEW.raw_user_meta_data->>'preferred_username',
    split_part(NEW.email, '@', 1)
  );

  -- Sanitize: lowercase, alphanumeric + underscore only, max 20 chars
  base_username := lower(regexp_replace(base_username, '[^a-zA-Z0-9_]', '', 'g'));
  base_username := left(base_username, 20);

  -- If empty after sanitization, use 'user'
  IF base_username = '' THEN
    base_username := 'user';
  END IF;

  -- Handle UNIQUE collision: try base, then append random 4-char suffix
  final_username := base_username;
  WHILE EXISTS (SELECT 1 FROM public.users WHERE username = final_username) LOOP
    suffix := substr(md5(random()::text), 1, 4);
    final_username := left(base_username, 16) || '_' || suffix;
  END LOOP;

  INSERT INTO public.users (id, email, username, display_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    final_username,
    COALESCE(
      NEW.raw_user_meta_data->>'nickname',    -- Kakao
      NEW.raw_user_meta_data->>'full_name',   -- Google
      NEW.raw_user_meta_data->>'name',         -- Generic
      split_part(NEW.email, '@', 1)
    ),
    COALESCE(
      NEW.raw_user_meta_data->>'avatar_url',  -- Standard
      NEW.raw_user_meta_data->>'picture'       -- Google
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

Also save this SQL to a local migration file for reference: `supabase/migrations/YYYYMMDDHHMMSS_enhance_handle_new_user.sql` (use current timestamp).

**Part B: authStore Enhancement**

Modify `packages/web/lib/stores/authStore.ts`:

1. Add `UserProfile` interface for public.users data:
```typescript
export interface UserProfile {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  rank: string | null;
  total_points: number;
  is_admin: boolean;
  style_dna: Record<string, unknown> | null;
  ink_credits: number;
  created_at: string;
  updated_at: string;
}
```

2. Add to AuthState interface:
```typescript
profile: UserProfile | null;
needsOnboarding: boolean;
fetchProfile: () => Promise<void>;
updateProfile: (updates: Partial<Pick<UserProfile, 'username' | 'display_name' | 'bio'>>) => Promise<boolean>;
completeOnboarding: () => void;
```

3. Add `fetchProfile` implementation that queries `supabaseBrowserClient.from('users').select('*').eq('id', user.id).single()`. If the record has `username` equal to email prefix AND `display_name` equal to email prefix (meaning trigger defaults), set `needsOnboarding: true`.

4. Add `updateProfile` that does `supabaseBrowserClient.from('users').update(updates).eq('id', user.id)` and re-fetches profile on success. Return boolean for success/failure.

5. Add `completeOnboarding` that sets `needsOnboarding: false`.

6. Call `fetchProfile()` inside `setUser()` after mapping the Supabase user (when user is not null). Also call it at end of `initialize()` when session exists.

7. Update `fetchIsAdmin` to be removed as a standalone function -- use profile.is_admin from the fetched profile instead (set isAdmin from profile data).

8. Add selectors:
```typescript
export const selectProfile = (state: AuthState) => state.profile;
export const selectNeedsOnboarding = (state: AuthState) => state.needsOnboarding;
```
  </action>
  <verify>
    <automated>cd /Users/kiyeol/development/decoded/decoded-app && yarn tsc --noEmit 2>&1 | head -30</automated>
  </verify>
  <done>
    - handle_new_user() extracts avatar_url and display_name from OAuth metadata
    - Username collision handled with random suffix loop
    - authStore.profile populated from public.users after login
    - needsOnboarding true when username/display_name are email-prefix defaults
    - updateProfile writes to public.users via Supabase client
    - TypeScript compiles without errors
  </done>
</task>

<task type="auto">
  <name>Task 2: Onboarding BottomSheet UI component</name>
  <files>
    packages/web/lib/components/auth/OnboardingSheet.tsx
    packages/web/app/layout.tsx
  </files>
  <action>
Create `packages/web/lib/components/auth/OnboardingSheet.tsx`:

- Import `BottomSheet` from `@/lib/design-system`
- Import `useAuthStore`, `selectNeedsOnboarding`, `selectProfile`, `selectUser`
- Component: `OnboardingSheet` (default export)

**State:**
- `username` (string, pre-filled from `profile?.username`)
- `displayName` (string, pre-filled from `profile?.display_name`)
- `isSubmitting` (boolean)
- `usernameError` (string | null) for validation feedback

**Layout (BottomSheet with snapPoints={[0.55]} defaultSnapPoint={0.55}):**
1. Avatar preview: circular 80px image from `user?.avatarUrl`, fallback to first letter of displayName in a colored circle
2. Username input: `<input>` with label "Username", value from state, onChange validates:
   - 3-20 chars, alphanumeric + underscore only
   - Show inline error if invalid
3. Display Name input: `<input>` with label "Display Name", value from state
4. Two buttons at bottom:
   - "Skip" (ghost style) -- calls `completeOnboarding()` to dismiss without saving
   - "Complete" (primary style) -- calls `updateProfile({ username, display_name: displayName })`, on success calls `completeOnboarding()`
   - Disable "Complete" while `isSubmitting` or username is invalid

**Styling:** Follow existing dark theme (#242424 background from BottomSheet). Use Tailwind classes consistent with the design system. Inputs: bg-[#1a1a1a] border border-[#3D3D3D] rounded-lg text-white. Buttons: primary = bg-white text-black, ghost = text-gray-400.

**Error handling:** If `updateProfile` returns false (e.g., username taken due to unique constraint), show "Username already taken" error on the username input.

**Wire into layout:**
- In `packages/web/app/layout.tsx`, import `OnboardingSheet` and render it inside the body (after other providers/wrappers). It is self-contained -- it reads `needsOnboarding` from the store to control its own visibility. No props needed.
- Use dynamic import with `next/dynamic` and `ssr: false` since it uses browser-only Zustand store.
  </action>
  <verify>
    <automated>cd /Users/kiyeol/development/decoded/decoded-app && yarn tsc --noEmit 2>&1 | head -30</automated>
  </verify>
  <done>
    - OnboardingSheet renders when needsOnboarding is true
    - Username and display name inputs pre-filled from OAuth metadata
    - Avatar preview shown from OAuth provider
    - Skip dismisses without saving
    - Complete saves to DB and dismisses
    - Username validation (3-20 chars, alphanumeric + underscore)
    - Unique constraint violation shows user-friendly error
    - Component mounted in root layout via dynamic import
  </done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <what-built>
    Complete first-user onboarding flow:
    1. Enhanced DB trigger captures OAuth avatar and handles username collisions
    2. authStore fetches public.users profile and detects new users
    3. OnboardingSheet shows for first-time users with pre-filled OAuth data
  </what-built>
  <how-to-verify>
    1. Run `yarn dev` and open http://localhost:3000
    2. Log in with an OAuth provider (Kakao or Google)
    3. If first-time user: OnboardingSheet should appear with:
       - Avatar from OAuth provider
       - Username pre-filled (editable)
       - Display name pre-filled (editable)
    4. Try submitting with a too-short username (< 3 chars) -- should show validation error
    5. Click "Complete" with valid data -- sheet should close, profile saved
    6. Refresh page -- onboarding should NOT reappear (username/display_name no longer defaults)
    7. Check Supabase Dashboard > users table -- avatar_url should be populated for new users
  </how-to-verify>
  <resume-signal>Type "approved" or describe issues</resume-signal>
</task>

</tasks>

<verification>
- `yarn tsc --noEmit` passes (TypeScript)
- `yarn lint` passes (ESLint)
- DB trigger function replaced successfully in Supabase
- authStore.profile populated after OAuth login
- OnboardingSheet visible for new users, hidden for existing users
</verification>

<success_criteria>
- New OAuth signups get avatar_url and smart display_name in public.users
- Username UNIQUE collisions resolved automatically with suffix
- authStore exposes profile, needsOnboarding, updateProfile
- First-time users see onboarding BottomSheet after login
- Users can set username and display name, saved to DB
- Skip option available to dismiss without changes
</success_criteria>

<output>
After completion, create `.planning/quick/53-db-authstore-ui/53-SUMMARY.md`
</output>
