# Stale File Path Audit

**Audited:** 2026-02-19
**Source:** specs/ (pre-v4.0)
**Method:** grep for `packages/web/` references in all spec .md files; verified each against filesystem

## Summary

- Total unique path references found: 87
- Valid paths (file exists): 27
- Stale/missing paths: 60

## Stale Paths

| Spec File | Referenced Path | Notes |
|-----------|----------------|-------|
| `user-system/screens/SCR-USER-01-login.md` | `packages/web/app/auth/callback/route.ts` | Auth callback route missing |
| `discovery/screens/SCR-DISC-04-gallery.md` | `packages/web/app/media/[id]/page.tsx` | Media route missing |
| `user-system/screens/SCR-USER-03-activity.md` | `packages/web/app/profile/activity/page.tsx` | Profile activity sub-page missing |
| `user-system/spec.md` | `packages/web/app/profile/activity/page.tsx` | Profile activity sub-page missing |
| `user-system/screens/SCR-USER-04-earnings.md` | `packages/web/app/profile/earnings/page.tsx` | Profile earnings sub-page missing |
| `user-system/spec.md` | `packages/web/app/profile/earnings/page.tsx` | Profile earnings sub-page missing |
| `user-system/screens/SCR-USER-05-settings.md` | `packages/web/app/profile/settings/page.tsx` | Profile settings sub-page missing |
| `user-system/screens/SCR-USER-01-login.md` | `packages/web/lib/components/auth/LoginButton.tsx` | LoginButton component missing |
| `discovery/screens/SCR-DISC-01-home.md` | `packages/web/lib/components/CardCell.tsx` | CardCell component missing |
| `discovery/screens/SCR-DISC-01-home.md` | `packages/web/lib/components/CardSkeleton.tsx` | CardSkeleton component missing |
| `detail-view/screens/SCR-VIEW-03-items.md` | `packages/web/lib/components/detail/AddVibeModal.tsx` | AddVibeModal missing |
| `detail-view/screens/SCR-VIEW-03-items.md` | `packages/web/lib/components/detail/BuyButton.tsx` | BuyButton missing |
| `detail-view/screens/SCR-VIEW-04-related.md` | `packages/web/lib/components/detail/CommentForm.tsx` | CommentForm missing |
| `detail-view/screens/SCR-VIEW-04-related.md` | `packages/web/lib/components/detail/CommentItem.tsx` | CommentItem missing |
| `detail-view/screens/SCR-VIEW-04-related.md` | `packages/web/lib/components/detail/CommentList.tsx` | CommentList missing |
| `detail-view/screens/SCR-VIEW-04-related.md` | `packages/web/lib/components/detail/CommentSection.tsx` | CommentSection missing |
| `detail-view/screens/SCR-VIEW-03-items.md` | `packages/web/lib/components/detail/DualMatchSection.tsx` | DualMatchSection missing |
| `detail-view/screens/SCR-VIEW-03-items.md` | `packages/web/lib/components/detail/OriginalItemCard.tsx` | OriginalItemCard missing |
| `detail-view/screens/SCR-VIEW-04-related.md` | `packages/web/lib/components/detail/OriginalItemCard.tsx` | OriginalItemCard missing |
| `detail-view/screens/SCR-VIEW-01-detail.md` | `packages/web/lib/components/detail/SmartTags.tsx` | SmartTags missing |
| `detail-view/screens/SCR-VIEW-04-related.md` | `packages/web/lib/components/detail/SmartTags.tsx` | SmartTags missing |
| `detail-view/screens/SCR-VIEW-02-spots.md` | `packages/web/lib/components/detail/SpotMarker.tsx` | SpotMarker missing |
| `detail-view/screens/SCR-VIEW-01-detail.md` | `packages/web/lib/components/detail/SpotMarker.tsx` | SpotMarker missing |
| `detail-view/screens/SCR-VIEW-02-spots.md` | `packages/web/lib/components/detail/SpotOverlay.tsx` | SpotOverlay missing |
| `detail-view/screens/SCR-VIEW-01-detail.md` | `packages/web/lib/components/detail/SpotOverlay.tsx` | SpotOverlay missing |
| `detail-view/screens/SCR-VIEW-02-spots.md` | `packages/web/lib/components/detail/SpotPopup.tsx` | SpotPopup missing |
| `detail-view/screens/SCR-VIEW-04-related.md` | `packages/web/lib/components/detail/TagBreadcrumb.tsx` | TagBreadcrumb missing |
| `detail-view/screens/SCR-VIEW-03-items.md` | `packages/web/lib/components/detail/VibeItemCard.tsx` | VibeItemCard missing |
| `detail-view/screens/SCR-VIEW-03-items.md` | `packages/web/lib/components/detail/VibeVoting.tsx` | VibeVoting missing |
| `detail-view/screens/SCR-VIEW-03-items.md` | `packages/web/lib/components/detail/VoteButton.tsx` | VoteButton missing |
| `detail-view/screens/SCR-VIEW-03-items.md` | `packages/web/lib/components/detail/VotingSection.tsx` | VotingSection missing |
| `discovery/screens/SCR-DISC-02-filter.md` | `packages/web/lib/components/filter/DesktopFilterBar.tsx` | DesktopFilterBar missing |
| `discovery/spec.md` | `packages/web/lib/components/filter/DesktopFilterBar.tsx` | DesktopFilterBar missing |
| `discovery/screens/SCR-DISC-02-filter.md` | `packages/web/lib/components/filter/FilterBreadcrumb.tsx` | FilterBreadcrumb missing |
| `discovery/screens/SCR-DISC-02-filter.md` | `packages/web/lib/components/filter/FilterChip.tsx` | FilterChip missing |
| `discovery/screens/SCR-DISC-02-filter.md` | `packages/web/lib/components/filter/FilterDropdown.tsx` | FilterDropdown missing |
| `discovery/screens/SCR-DISC-02-filter.md` | `packages/web/lib/components/filter/FilterOption.tsx` | FilterOption missing |
| `discovery/screens/SCR-DISC-02-filter.md` | `packages/web/lib/components/filter/HierarchicalFilter.tsx` | HierarchicalFilter missing |
| `discovery/screens/SCR-DISC-02-filter.md` | `packages/web/lib/components/filter/MobileFilterSheet.tsx` | MobileFilterSheet missing |
| `discovery/screens/SCR-DISC-04-gallery.md` | `packages/web/lib/components/grid/ThiingsGrid.tsx` | Moved to lib/components/ThiingsGrid.tsx |
| `discovery/spec.md` | `packages/web/lib/components/grid/ThiingsGrid.tsx` | Moved to lib/components/ThiingsGrid.tsx |
| `discovery/screens/SCR-DISC-01-home.md` | `packages/web/lib/components/HomeClient.tsx` | Moved to app/HomeClient.tsx |
| `user-system/screens/SCR-USER-01-login.md` | `packages/web/lib/components/icons/AppleIcon.tsx` | AppleIcon missing |
| `user-system/screens/SCR-USER-01-login.md` | `packages/web/lib/components/icons/GoogleIcon.tsx` | GoogleIcon missing |
| `user-system/screens/SCR-USER-01-login.md` | `packages/web/lib/components/icons/KakaoIcon.tsx` | KakaoIcon missing |
| `discovery/screens/SCR-DISC-04-gallery.md` | `packages/web/lib/components/media/CastCard.tsx` | CastCard missing |
| `discovery/screens/SCR-DISC-04-gallery.md` | `packages/web/lib/components/media/CastGrid.tsx` | CastGrid missing |
| `discovery/screens/SCR-DISC-04-gallery.md` | `packages/web/lib/components/media/MediaHero.tsx` | MediaHero missing |
| `discovery/screens/SCR-DISC-04-gallery.md` | `packages/web/lib/components/media/RelatedMediaSection.tsx` | RelatedMediaSection missing |
| `user-system/screens/SCR-USER-05-settings.md` | `packages/web/lib/components/modals/DeleteAccountModal.tsx` | DeleteAccountModal missing |
| `user-system/screens/SCR-USER-03-activity.md` | `packages/web/lib/components/modals/DeleteConfirmModal.tsx` | DeleteConfirmModal missing |
| `detail-view/screens/SCR-VIEW-04-related.md` | `packages/web/lib/components/modals/ReportModal.tsx` | ReportModal missing |
| `user-system/screens/SCR-USER-04-earnings.md` | `packages/web/lib/components/modals/WithdrawalConfirmModal.tsx` | WithdrawalConfirmModal missing |
| `user-system/screens/SCR-USER-03-activity.md` | `packages/web/lib/components/profile/AnswerList.tsx` | AnswerList missing |
| `user-system/screens/SCR-USER-04-earnings.md` | `packages/web/lib/components/profile/EarningsCard.tsx` | EarningsCard missing |
| `user-system/screens/SCR-USER-03-activity.md` | `packages/web/lib/components/profile/FavoriteList.tsx` | FavoriteList missing |
| `user-system/screens/SCR-USER-05-settings.md` | `packages/web/lib/components/profile/LanguageSelect.tsx` | LanguageSelect missing |
| `user-system/screens/SCR-USER-03-activity.md` | `packages/web/lib/components/profile/PostList.tsx` | PostList missing |
| `user-system/screens/SCR-USER-05-settings.md` | `packages/web/lib/components/profile/SettingsRow.tsx` | SettingsRow missing |
| `user-system/screens/SCR-USER-05-settings.md` | `packages/web/lib/components/profile/SettingsSection.tsx` | SettingsSection missing |
| `user-system/screens/SCR-USER-05-settings.md` | `packages/web/lib/components/profile/ThemeSelect.tsx` | ThemeSelect missing |
| `user-system/screens/SCR-USER-04-earnings.md` | `packages/web/lib/components/profile/WithdrawalForm.tsx` | WithdrawalForm missing |
| `user-system/screens/SCR-USER-04-earnings.md` | `packages/web/lib/components/profile/WithdrawalHistory.tsx` | WithdrawalHistory missing |
| `user-system/screens/SCR-USER-05-settings.md` | `packages/web/lib/components/ui/Toggle.tsx` | Toggle missing |
| `detail-view/screens/SCR-VIEW-04-related.md` | `packages/web/lib/hooks/useComments.ts` | useComments hook deleted |
| `discovery/screens/SCR-DISC-04-gallery.md` | `packages/web/lib/hooks/useMediaDetail.ts` | useMediaDetail hook missing |
| `detail-view/screens/SCR-VIEW-03-items.md` | `packages/web/lib/hooks/useTrackClick.ts` | useTrackClick hook missing |
| `detail-view/screens/SCR-VIEW-03-items.md` | `packages/web/lib/hooks/useVote.ts` | useVote hook deleted |

## Valid Paths (confirmed present)

| Referenced Path | Present In |
|----------------|-----------|
| `packages/web/app/@modal/(.)images/[id]/page.tsx` | Multiple screen specs |
| `packages/web/app/HomeClient.tsx` | discovery/screens/SCR-DISC-01-home.md |
| `packages/web/app/images/[id]/page.tsx` | Multiple screen specs |
| `packages/web/app/login/page.tsx` | user-system/screens/SCR-USER-01-login.md |
| `packages/web/app/page.tsx` | discovery/screens/SCR-DISC-01-home.md |
| `packages/web/app/profile/page.tsx` | user-system/screens/SCR-USER-02-profile.md |
| `packages/web/app/search/page.tsx` | discovery/screens/SCR-DISC-03-search.md |
| `packages/web/lib/components/auth/LoginCard.tsx` | user-system/screens/SCR-USER-01-login.md |
| `packages/web/lib/components/detail/ConnectorLayer.tsx` | detail-view/screens/ |
| `packages/web/lib/components/detail/ImageDetailContent.tsx` | detail-view/screens/ |
| `packages/web/lib/components/detail/InteractiveShowcase.tsx` | detail-view/screens/ |
| `packages/web/lib/components/detail/ItemDetailCard.tsx` | detail-view/screens/ |
| `packages/web/lib/components/Header.tsx` | Multiple screen specs |
| `packages/web/lib/components/ThiingsGrid.tsx` | discovery/screens/ |
| `packages/web/lib/components/profile/ActivityTabs.tsx` | user-system/screens/ |
| `packages/web/lib/components/profile/BadgeGrid.tsx` | user-system/screens/ |
| `packages/web/lib/components/profile/BadgeModal.tsx` | user-system/screens/ |
| `packages/web/lib/components/profile/ProfileHeader.tsx` | user-system/screens/ |
| `packages/web/lib/components/profile/RankingList.tsx` | user-system/screens/ |
| `packages/web/lib/components/profile/StatsCards.tsx` | user-system/screens/ |
| `packages/web/lib/components/search/EmptySearchState.tsx` | discovery/screens/ |
| `packages/web/lib/components/search/ItemResultSection.tsx` | discovery/screens/ |
| `packages/web/lib/components/search/MediaResultSection.tsx` | discovery/screens/ |
| `packages/web/lib/components/search/PeopleResultSection.tsx` | discovery/screens/ |
| `packages/web/lib/components/search/SearchInput.tsx` | discovery/screens/ |
| `packages/web/lib/components/search/SearchResults.tsx` | discovery/screens/ |
| `packages/web/lib/components/search/SearchSuggestions.tsx` | discovery/screens/ |
| `packages/web/lib/components/search/SearchTabs.tsx` | discovery/screens/ |
| `packages/web/lib/hooks/useSearch.ts` | discovery/screens/ |

## Stale Paths by Spec File

| Spec File | Stale Path Count | Notes |
|-----------|-----------------|-------|
| `detail-view/screens/SCR-VIEW-01-detail.md` | 3 | SmartTags, SpotMarker, SpotOverlay |
| `detail-view/screens/SCR-VIEW-02-spots.md` | 3 | SpotMarker, SpotOverlay, SpotPopup |
| `detail-view/screens/SCR-VIEW-03-items.md` | 10 | VotingSection, VoteButton, VibeVoting, VibeItemCard, BuyButton, AddVibeModal, DualMatchSection, OriginalItemCard, useVote, useTrackClick |
| `detail-view/screens/SCR-VIEW-04-related.md` | 8 | CommentSection, CommentList, CommentItem, CommentForm, SmartTags, OriginalItemCard, TagBreadcrumb, ReportModal, useComments |
| `discovery/screens/SCR-DISC-01-home.md` | 3 | CardCell, CardSkeleton, HomeClient (moved) |
| `discovery/screens/SCR-DISC-02-filter.md` | 7 | All filter/* components |
| `discovery/screens/SCR-DISC-04-gallery.md` | 7 | ThiingsGrid (moved), media/* components, app/media route, useMediaDetail |
| `discovery/spec.md` | 2 | DesktopFilterBar, ThiingsGrid (moved) |
| `user-system/screens/SCR-USER-01-login.md` | 5 | auth/callback, LoginButton, icon components (Apple/Google/Kakao) |
| `user-system/screens/SCR-USER-03-activity.md` | 6 | profile/activity page, AnswerList, FavoriteList, PostList, DeleteConfirmModal |
| `user-system/screens/SCR-USER-04-earnings.md` | 6 | profile/earnings page, EarningsCard, WithdrawalForm, WithdrawalHistory, WithdrawalConfirmModal |
| `user-system/screens/SCR-USER-05-settings.md` | 8 | profile/settings page, LanguageSelect, ThemeSelect, SettingsRow, SettingsSection, Toggle, DeleteAccountModal |
| `user-system/spec.md` | 2 | profile/activity and earnings sub-pages |

## Action Items

- These stale paths will be corrected in v4-04 through v4-07 when screen specs are rewritten
- Priority: Verify existing components have moved vs. planned/removed before updating specs
- Key insight: The `grid/ThiingsGrid.tsx` → `ThiingsGrid.tsx` and `app/HomeClient.tsx` moves are path renames, not deletions
- Most stale detail-view and discovery paths are for unimplemented features (voting, comments, filter components)
- All user-system profile sub-pages are missing — profile uses a single `page.tsx` with tab routing
