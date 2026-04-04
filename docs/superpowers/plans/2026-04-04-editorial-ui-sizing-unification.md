# Editorial UI Sizing Unification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Unify artist profile, item image, and brand logo sizing across explore-preview panel, full editorial page, mobile, and desktop.

**Architecture:** CSS class changes only in 2 files. No logic, prop, or structural changes. Artist profile switches from horizontal left-aligned to vertical centered layout.

**Tech Stack:** Tailwind CSS classes, React/TSX

---

### Task 1: Artist Profile — explore-preview (right panel)

**Files:**
- Modify: `packages/web/lib/components/detail/ImageDetailContent.tsx:295-313`

- [ ] **Step 1: Update explore-preview artist profile layout and sizes**

Change the artist profile section at line 288-313. Replace the existing render block:

```tsx
{isExplorePreview && (() => {
  const profile =
    artistProfiles?.[imageWithOwner.artist_name?.toLowerCase() ?? ""] ||
    artistProfiles?.[imageWithOwner.group_name?.toLowerCase() ?? ""];
  const displayName = profile?.name || imageWithOwner.artist_name || imageWithOwner.group_name;
  if (!displayName) return null;
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-5">
      {profile?.profileImageUrl ? (
        <img
          src={`/api/v1/image-proxy?url=${encodeURIComponent(profile.profileImageUrl)}`}
          alt=""
          className="w-12 h-12 rounded-full object-cover border border-white/10"
        />
      ) : (
        <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-base font-bold text-white/50">
          {displayName.charAt(0).toUpperCase()}
        </div>
      )}
      <div className="text-center">
        <p className="text-lg font-semibold text-foreground">{displayName}</p>
        <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Artist</p>
      </div>
    </div>
  );
})()}
```

Key changes:
- Layout: `flex items-center gap-3 px-6 py-3` → `flex flex-col items-center gap-2 px-6 py-5`
- Image: `w-8 h-8` → `w-12 h-12`
- Fallback: `w-8 h-8 text-xs` → `w-12 h-12 text-base`
- Name: `text-sm` → `text-lg`
- Label: `text-[10px]` → `text-[11px]`
- Text wrapper: add `text-center`

---

### Task 2: Artist Profile — full page

**Files:**
- Modify: `packages/web/lib/components/detail/ImageDetailContent.tsx:347-372`

- [ ] **Step 1: Update full page artist profile (identical to Task 1)**

Change the full page artist profile section at line 347-372. Replace the existing render block:

```tsx
{!isExplorePreview && (() => {
  const profile =
    artistProfiles?.[imageWithOwner.artist_name?.toLowerCase() ?? ""] ||
    artistProfiles?.[imageWithOwner.group_name?.toLowerCase() ?? ""];
  const displayName = profile?.name || imageWithOwner.artist_name || imageWithOwner.group_name;
  if (!displayName) return null;
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-5">
      {profile?.profileImageUrl ? (
        <img
          src={`/api/v1/image-proxy?url=${encodeURIComponent(profile.profileImageUrl)}`}
          alt=""
          className="w-12 h-12 rounded-full object-cover border border-white/10"
        />
      ) : (
        <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-base font-bold text-white/50">
          {displayName.charAt(0).toUpperCase()}
        </div>
      )}
      <div className="text-center">
        <p className="text-lg font-semibold text-foreground">{displayName}</p>
        <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Artist</p>
      </div>
    </div>
  );
})()}
```

- [ ] **Step 2: Verify both profiles are now identical**

Run: `grep -n 'w-12 h-12' packages/web/lib/components/detail/ImageDetailContent.tsx`
Expected: 4 matches (2 img + 2 fallback div)

---

### Task 3: Magazine Items — image size + brand logo

**Files:**
- Modify: `packages/web/lib/components/detail/magazine/MagazineItemsSection.tsx:198,257,261`

- [ ] **Step 1: Increase compact item image width**

Line 198 — change compact image wrapper size:

```tsx
// Before:
<div className={`w-full shrink-0 ${compact ? "md:w-36 lg:w-40" : "md:w-60 lg:w-64"}`}>

// After:
<div className={`w-full shrink-0 ${compact ? "md:w-48 lg:w-52" : "md:w-60 lg:w-64"}`}>
```

- [ ] **Step 2: Increase brand logo size**

Line 257 — change brand profile image:

```tsx
// Before:
className="w-5 h-5 rounded-full object-cover flex-shrink-0"

// After:
className="w-7 h-7 rounded-full object-cover flex-shrink-0"
```

- [ ] **Step 3: Unify brand text style**

Line 261 — remove compact text override:

```tsx
// Before:
<p className={`typography-overline text-muted-foreground ${compact ? "text-[10px]" : ""}`}>

// After:
<p className="typography-overline text-muted-foreground">
```

---

### Task 4: Build Verification + Commit

- [ ] **Step 1: Type check**

Run: `cd packages/web && npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors in modified files

- [ ] **Step 2: Build check**

Run: `cd packages/web && bun run build 2>&1 | tail -10`
Expected: Build success

- [ ] **Step 3: Commit**

```bash
git add packages/web/lib/components/detail/ImageDetailContent.tsx packages/web/lib/components/detail/magazine/MagazineItemsSection.tsx
git commit -m "style(detail): unify artist profile, item image, and brand sizing

- Artist profile: 48px centered layout (both explore-preview and full page)
- Magazine items: compact image md:w-48, brand logo 28px
- Brand text: unified typography-overline across compact/full"
```
