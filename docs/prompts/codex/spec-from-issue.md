# Prompt: Convert GitHub Issue into Spec

## Context

You are helping convert a GitHub issue into a structured specification that can be used for implementation planning and tracking.

## Input Format

You will receive:

- **Raw issue text**: Full GitHub issue description
- **Labels**: Issue labels (feature/bugfix/experiment)
- **Title**: Issue title
- **Comments**: Any relevant comments (optional)

## Task

Generate a spec file under `specs/<type>/` using the appropriate template:

- **Feature**: `specs/feature/FEATURE-XXX-<name>.yml`
- **Bugfix**: `specs/bugfix/BUGFIX-XXX-<name>.yml`
- **Experiment**: `specs/experiment/EXPERIMENT-XXX-<name>.yml`

Fill in all sections explicitly, including assumptions and open questions.

## Spec Structure

### Feature Spec Template

```yaml
# FEATURE-XXX: [Feature Name]

## Background
[Why this feature is needed - context and motivation]

## Problem
[What problem does this feature solve - be specific]

## Requirements
[What must be implemented - be specific and measurable]
- [Requirement 1]
- [Requirement 2]
- [Requirement 3]

## Non-Goals
[What is explicitly out of scope - prevent scope creep]
- [Non-goal 1]
- [Non-goal 2]

## Risks
[Potential issues or concerns]
- [Risk 1]: [Mitigation]
- [Risk 2]: [Mitigation]

## Test Plan
[How to verify the feature works]
- [Test case 1]
- [Test case 2]
- [Test case 3]

## Assumptions
[Explicit assumptions made - document all assumptions]
- [Assumption 1]
- [Assumption 2]

## Open Questions
[Questions that need answers before implementation]
- [Question 1]
- [Question 2]

## Dependencies
[Other features or work that must be completed first]
- [Dependency 1]
- [Dependency 2]

## Timeline
[Estimated timeline if available]
- [Phase 1]: [Time estimate]
- [Phase 2]: [Time estimate]
```

### Bugfix Spec Template

```yaml
# BUGFIX-XXX: [Bug Description]

## Problem
[What is broken - describe the bug clearly]

## Root Cause
[Why it's broken - technical explanation]

## Solution
[How to fix it - approach and implementation]

## Test Plan
[How to verify the fix works]
- [Test case 1]
- [Test case 2]

## Regression Tests
[Tests to prevent this bug from returning]
- [Test case 1]
- [Test case 2]

## Assumptions
[Assumptions about the fix]
- [Assumption 1]

## Open Questions
[Questions about the fix]
- [Question 1]

## Related Issues
[Links to related issues or PRs]
- [Issue/PR link]
```

### Experiment Spec Template

```yaml
# EXPERIMENT-XXX: [Experiment Name]

## Hypothesis
[What we're testing - clear hypothesis statement]

## Experiment Design
[How we'll test it - methodology]
- [Step 1]
- [Step 2]
- [Step 3]

## Success Criteria
[What success looks like - measurable criteria]
- [Criterion 1]
- [Criterion 2]

## Risks
[What could go wrong]
- [Risk 1]: [Mitigation]
- [Risk 2]: [Mitigation]

## Rollback Plan
[How to undo if experiment fails]
- [Step 1]
- [Step 2]

## Assumptions
[Assumptions about the experiment]
- [Assumption 1]

## Open Questions
[Questions about the experiment]
- [Question 1]

## Timeline
[Experiment timeline]
- [Start date]
- [End date]
- [Check-in dates]
```

## Guidelines

1. **Be explicit**: Document all assumptions and open questions
2. **Be specific**: Vague requirements lead to confusion
3. **Identify risks**: Always list potential issues
4. **Plan tests**: Include verification approaches
5. **Ask questions**: Don't assume - list open questions
6. **Use proper format**: Follow YAML structure exactly

## Example

### Input

**Issue Title**: Add dark mode support  
**Labels**: feature  
**Description**: Users want a dark mode option for better visibility in low-light conditions.

### Output

```yaml
# FEATURE-001: Dark Mode Support

## Background
Users have requested dark mode support for better visibility in low-light conditions and to reduce eye strain during extended use.

## Problem
The application currently only supports light mode, which can be uncomfortable in low-light environments and causes eye strain for some users.

## Requirements
- Toggle between light and dark modes
- Persist user preference across sessions
- Apply dark mode to all UI components
- Smooth transition between modes
- System preference detection (optional)

## Non-Goals
- Per-component dark mode (all or nothing)
- Custom color schemes (only light/dark)
- Animated transitions (simple fade is sufficient)

## Risks
- CSS variable migration: May require refactoring existing styles
  - Mitigation: Use CSS variables from the start, migrate gradually
- Performance: Theme switching should be instant
  - Mitigation: Preload both themes, use CSS classes
- Accessibility: Ensure sufficient contrast in dark mode
  - Mitigation: Follow WCAG contrast guidelines

## Test Plan
- Toggle dark mode on/off
- Verify preference persists after page reload
- Check all components render correctly in dark mode
- Verify contrast ratios meet WCAG standards
- Test on different browsers

## Assumptions
- CSS variables will be used for theming
- User preference stored in localStorage
- All components can be themed via CSS variables
- No performance impact from theme switching

## Open Questions
- Should we detect system preference automatically?
- Do we need a theme transition animation?
- Which components need custom dark mode styling?
- Should dark mode be a user setting or global toggle?

## Dependencies
- CSS variable infrastructure
- Component styling system

## Timeline
- Phase 1 (Setup): 2 days
- Phase 2 (Implementation): 5 days
- Phase 3 (Testing): 2 days
```

## Output Location

Save the spec file to:

- `specs/feature/FEATURE-XXX-<kebab-case-name>.yml` for features
- `specs/bugfix/BUGFIX-XXX-<kebab-case-name>.yml` for bugfixes
- `specs/experiment/EXPERIMENT-XXX-<kebab-case-name>.yml` for experiments

Use kebab-case for filenames (e.g., `FEATURE-001-dark-mode-support.yml`).
