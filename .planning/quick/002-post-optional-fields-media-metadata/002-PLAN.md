---
phase: quick
plan: 002
type: execute
wave: 1
depends_on: []
files_modified:
  - packages/web/lib/api/types.ts
  - packages/web/lib/stores/requestStore.ts
  - packages/web/lib/components/request/DetailsStep.tsx
  - packages/web/lib/components/request/DescriptionInput.tsx
  - packages/web/lib/hooks/useCreatePost.ts
  - packages/web/app/api/v1/posts/extract-metadata/route.ts
autonomous: true

must_haves:
  truths:
    - "User can enter optional description in post creation flow"
    - "When description is provided, AI extracts metadata (title, platform, season, etc.)"
    - "Extracted metadata is sent with CreatePostRequest as media_metadata"
  artifacts:
    - path: "packages/web/lib/components/request/DescriptionInput.tsx"
      provides: "Description textarea with AI extraction trigger"
    - path: "packages/web/app/api/v1/posts/extract-metadata/route.ts"
      provides: "AI metadata extraction endpoint"
  key_links:
    - from: "DetailsStep.tsx"
      to: "DescriptionInput.tsx"
      via: "component import"
    - from: "useCreatePost.ts"
      to: "CreatePostRequest"
      via: "includes description and media_metadata"
---

<objective>
Add optional `description` field to post creation flow with AI-based metadata extraction.

Purpose: Allow users to provide a brief description (e.g., "Netflix drama OOO season 2 episode 3...") and automatically extract structured metadata (title, platform, season, episode) from it using AI.

Output:
- New DescriptionInput component in DetailsStep
- AI metadata extraction API endpoint
- Updated types and store to support description + media_metadata
</objective>

<context>
@.planning/PROJECT.md
@packages/web/lib/api/types.ts
@packages/web/lib/stores/requestStore.ts
@packages/web/lib/components/request/DetailsStep.tsx
@packages/web/lib/hooks/useCreatePost.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add description and media_metadata types + store state</name>
  <files>
    packages/web/lib/api/types.ts
    packages/web/lib/stores/requestStore.ts
  </files>
  <action>
1. In `packages/web/lib/api/types.ts`:
   - Add `MediaMetadataItem` interface:
     ```typescript
     export interface MediaMetadataItem {
       key: string;   // e.g., "platform", "season", "episode"
       value: string; // e.g., "Netflix", "2", "3"
     }
     ```
   - Add `ExtractMetadataRequest` and `ExtractMetadataResponse`:
     ```typescript
     export interface ExtractMetadataRequest {
       description: string;
     }

     export interface ExtractMetadataResponse {
       title?: string;
       media_metadata: MediaMetadataItem[];
     }
     ```
   - Update `CreatePostRequest` to include:
     ```typescript
     description?: string;
     media_metadata?: MediaMetadataItem[];
     ```

2. In `packages/web/lib/stores/requestStore.ts`:
   - Add to state: `description: string` (initial: "")
   - Add to state: `extractedMetadata: MediaMetadataItem[]` (initial: [])
   - Add to state: `isExtractingMetadata: boolean` (initial: false)
   - Add action: `setDescription: (description: string) => void`
   - Add action: `setExtractedMetadata: (metadata: MediaMetadataItem[]) => void`
   - Add action: `setIsExtractingMetadata: (extracting: boolean) => void`
   - Add selectors: `selectDescription`, `selectExtractedMetadata`, `selectIsExtractingMetadata`
   - Reset these in `resetRequestFlow`
  </action>
  <verify>
    - `yarn tsc --noEmit` passes without errors
    - New types are exported from types.ts
    - Store has new state and actions
  </verify>
  <done>
    - `MediaMetadataItem`, `ExtractMetadataRequest`, `ExtractMetadataResponse` types exist
    - `CreatePostRequest` includes `description` and `media_metadata`
    - Store manages description, extractedMetadata, isExtractingMetadata state
  </done>
</task>

<task type="auto">
  <name>Task 2: Create DescriptionInput component and AI extraction endpoint</name>
  <files>
    packages/web/lib/components/request/DescriptionInput.tsx
    packages/web/app/api/v1/posts/extract-metadata/route.ts
    packages/web/lib/api/posts.ts
  </files>
  <action>
1. Create `packages/web/app/api/v1/posts/extract-metadata/route.ts`:
   - POST endpoint that proxies to backend `${API_BASE_URL}/api/v1/posts/extract-metadata`
   - No auth required (similar to analyze endpoint)
   - Request: `{ description: string }`
   - Response: `{ title?: string, media_metadata: [{key, value}] }`
   - Handle errors gracefully

2. Add to `packages/web/lib/api/posts.ts`:
   ```typescript
   export async function extractMetadata(description: string): Promise<ExtractMetadataResponse> {
     return apiClient<ExtractMetadataResponse>({
       path: "/api/v1/posts/extract-metadata",
       method: "POST",
       body: { description },
       requiresAuth: false,
     });
   }
   ```
   - Export from `packages/web/lib/api/index.ts`

3. Create `packages/web/lib/components/request/DescriptionInput.tsx`:
   - Textarea for description input (max 500 chars)
   - Label: "Description" with "(Optional)" badge
   - Placeholder: "예: 넷플릭스 드라마 OOO 시즌2 3화에서 주인공이 카페에서 입은 옷..."
   - On blur or debounced change (500ms), if description.length > 10:
     - Call `extractMetadata(description)`
     - Update store with extracted metadata
     - If title extracted, auto-fill MediaSource title if empty
   - Show loading spinner during extraction
   - Show extracted metadata as chips/tags below textarea (read-only display)
   - Use Tailwind styling consistent with MediaSourceInput.tsx
  </action>
  <verify>
    - `yarn lint` passes
    - API route file exists and compiles
    - Component renders without errors
    - Network request goes to /api/v1/posts/extract-metadata when description changes
  </verify>
  <done>
    - DescriptionInput.tsx component created with textarea and metadata display
    - extract-metadata API route proxies to backend
    - extractMetadata function added to posts.ts
  </done>
</task>

<task type="auto">
  <name>Task 3: Integrate DescriptionInput into DetailsStep and update useCreatePost</name>
  <files>
    packages/web/lib/components/request/DetailsStep.tsx
    packages/web/lib/hooks/useCreatePost.ts
    packages/web/lib/api/index.ts
  </files>
  <action>
1. Update `packages/web/lib/components/request/DetailsStep.tsx`:
   - Import DescriptionInput component
   - Add DescriptionInput section BEFORE Media Source section:
     ```tsx
     {/* Description (Optional) - AI extracts metadata */}
     <div className="p-4 rounded-xl bg-foreground/[0.02] border border-border">
       <DescriptionInput />
     </div>
     ```
   - Description goes first because AI can auto-fill Media Source from it

2. Update `packages/web/lib/hooks/useCreatePost.ts`:
   - Import `selectDescription`, `selectExtractedMetadata` selectors
   - Add to store reads:
     ```typescript
     const description = useRequestStore(selectDescription);
     const extractedMetadata = useRequestStore(selectExtractedMetadata);
     ```
   - Update CreatePostRequest construction to include:
     ```typescript
     ...(description && { description }),
     ...(extractedMetadata.length > 0 && { media_metadata: extractedMetadata }),
     ```

3. Update `packages/web/lib/api/index.ts`:
   - Export `extractMetadata` function
   - Export `ExtractMetadataRequest`, `ExtractMetadataResponse`, `MediaMetadataItem` types
  </action>
  <verify>
    - `yarn tsc --noEmit` passes
    - `yarn lint` passes
    - DetailsStep shows DescriptionInput component
    - Post creation includes description and media_metadata when provided
  </verify>
  <done>
    - DescriptionInput appears in DetailsStep UI (before Media Source)
    - useCreatePost sends description and media_metadata to API
    - All types properly exported from api/index.ts
  </done>
</task>

</tasks>

<verification>
1. Type check: `yarn tsc --noEmit` - no errors
2. Lint: `yarn lint` - passes
3. Manual test:
   - Navigate to /request (post creation flow)
   - Reach Step 3 (Details)
   - See Description textarea before Media Source
   - Enter description: "넷플릭스 드라마 더글로리 시즌1 2화"
   - Wait for AI extraction (loading spinner appears)
   - Extracted metadata displays as chips (platform: Netflix, season: 1, episode: 2)
   - Media Source title may auto-fill with "더글로리"
   - Submit post - verify request payload includes description and media_metadata
</verification>

<success_criteria>
- [ ] Description textarea renders in DetailsStep before Media Source
- [ ] AI extraction triggers automatically on description input (debounced)
- [ ] Extracted metadata displays as read-only chips
- [ ] CreatePostRequest includes description and media_metadata fields
- [ ] TypeScript compiles without errors
- [ ] ESLint passes
</success_criteria>

<output>
After completion, create `.planning/quick/002-post-optional-fields-media-metadata/002-SUMMARY.md`
</output>
