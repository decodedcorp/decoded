---
phase: quick-055
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - packages/web/lib/components/auth/OnboardingSheet.tsx
autonomous: true
requirements: [QUICK-055]

must_haves:
  truths:
    - "OnboardingSheet displays a bio textarea field during onboarding"
    - "User-entered bio is saved to the database via updateProfile"
    - "Bio field pre-fills from existing profile data"
  artifacts:
    - path: "packages/web/lib/components/auth/OnboardingSheet.tsx"
      provides: "Bio textarea in onboarding form"
      contains: "bio"
  key_links:
    - from: "OnboardingSheet.tsx"
      to: "authStore.updateProfile"
      via: "bio field included in updateProfile call"
      pattern: "updateProfile.*bio"
---

<objective>
Add a bio textarea field to the OnboardingSheet so users can set their bio during initial profile setup.

Purpose: The `users` table has a `bio` column and `authStore.updateProfile()` already accepts `bio`, but the OnboardingSheet UI only collects `username` and `display_name`. This completes the onboarding data collection.

Output: Updated OnboardingSheet.tsx with bio textarea
</objective>

<execution_context>
@/Users/kiyeol/.claude-pers/get-shit-done/workflows/execute-plan.md
@/Users/kiyeol/.claude-pers/get-shit-done/templates/summary.md
</execution_context>

<context>
@packages/web/lib/components/auth/OnboardingSheet.tsx
@packages/web/lib/stores/authStore.ts
</context>

<interfaces>
<!-- From authStore.ts — updateProfile already accepts bio -->
```typescript
updateProfile: (
  updates: Partial<Pick<UserProfile, "username" | "display_name" | "bio">>
) => Promise<boolean>;

interface UserProfile {
  // ...
  bio: string | null;
  // ...
}
```
</interfaces>

<tasks>

<task type="auto">
  <name>Task 1: Add bio textarea to OnboardingSheet</name>
  <files>packages/web/lib/components/auth/OnboardingSheet.tsx</files>
  <action>
    1. Add `bio` state: `const [bio, setBio] = useState("")`
    2. Pre-fill bio from profile in the existing useEffect: `setBio(profile.bio ?? "")`
    3. Add a textarea field AFTER the Display Name input, BEFORE the action buttons:
       - Label: "Bio"
       - Placeholder: "Tell us about yourself..."
       - maxLength: 160
       - 3 rows
       - Same styling as existing inputs but using `textarea` element:
         `w-full px-3 py-2.5 bg-[#1a1a1a] border border-[#3D3D3D] rounded-lg text-white placeholder:text-gray-500 text-sm focus:outline-none focus:border-white/40 transition-colors resize-none`
       - Add a character count hint below: `<p className="mt-1 text-xs text-gray-500">{bio.length}/160</p>`
    4. Include `bio` in the updateProfile call within handleComplete:
       ```typescript
       const success = await updateProfile({
         username,
         display_name: displayName || username,
         bio: bio || null,
       });
       ```
    5. Add `bio` to the handleComplete useCallback dependency array.
  </action>
  <verify>
    <automated>cd /Users/kiyeol/development/decoded/decoded-app && yarn build 2>&1 | tail -5</automated>
  </verify>
  <done>
    - OnboardingSheet shows bio textarea between Display Name and action buttons
    - Bio value is sent to updateProfile on submit
    - Bio pre-fills from existing profile data
    - Character count displays below textarea
    - Build passes with no type errors
  </done>
</task>

</tasks>

<verification>
- `yarn build` completes without errors
- OnboardingSheet.tsx contains bio state, textarea, and updateProfile call with bio
</verification>

<success_criteria>
- Bio textarea visible in OnboardingSheet UI
- Bio data persisted to database on form submission
- No TypeScript or build errors
</success_criteria>

<output>
After completion, create `.planning/quick/55-onboardingsheet-user/55-SUMMARY.md`
</output>
