# AI Usage Log

**Purpose**: Track AI tool usage for experiment evaluation and workflow optimization

## Experiment: "Boilerplate v1.0" Validation

### H1 (Hypothesis)

This AI boilerplate reduces tool selection and prompt setup time by 50%+ when starting new work.

### KPI

- **Quantitative**: Time from "work start" → "first commit" (compare before/after)
- **Qualitative**: "Which AI to use when?" confusion score (1-5 scale)

### Kill-Switch

If three consecutive tasks feel like "reading workflow docs takes longer than coding", reduce to 2-3 core principles + examples.

## Usage Log Format

```markdown
## [Date] - [Task Type]: [Task Name]

### Tools Used

- **Tool**: [Purpose] - [Time] - [Outcome]

### Tools NOT Used

- **Tool**: [Why not used]

### Workflow

1. [Step 1]
2. [Step 2]

### Notes

- What worked: [observation]
- What was confusing: [observation]

### Confusion Score

[1-5, where 1 = very clear, 5 = very confusing]
```

## Example Entries

### Example 1: Feature Implementation

```markdown
## 2025-01-27 - Feature: User Filter on Item List

### Tools Used

- **Codex**: Generate spec from issue - 5 min - Created FEATURE-001.yml
- **Claude**: Review spec - 10 min - Found missing edge case for empty results
- **Cursor**: Implement feature - 30 min - Working filter component
- **Gemini**: Generate docs - 5 min - Feature doc + release notes

### Tools NOT Used

- None (used full pipeline)

### Workflow

1. Codex created spec from GitHub issue
2. Claude reviewed spec, caught edge case
3. Cursor implemented following spec
4. Gemini documented the feature

### Notes

- What worked: Cursor rules felt clear, spec review caught issues early
- What was confusing: Gemini prompt still too vague, need tighter template

### Confusion Score

2 (mostly clear, minor prompt tuning needed)
```

### Example 2: Small Refactor

```markdown
## 2025-01-27 - Refactor: Auth Lifecycle

### Tools Used

- **Claude**: Analyze code flow - 15 min - Mapped auth lifecycle
- **Cursor**: Apply refactor - 20 min - Extracted auth hooks

### Tools NOT Used

- **Codex**: Skipped spec (too small for spec)
- **Gemini**: Skipped docs (internal refactor only)

### Workflow

1. Claude analyzed existing auth code
2. Claude proposed refactor plan
3. Cursor implemented refactor

### Notes

- What worked: Claude helped map the flow clearly
- What was confusing: Which tests to add? Need test guidelines in principles

### Confusion Score

3 (unclear about test requirements)
```

## Week 1 Summary

**Tasks Completed**: [Number]

**Average Time to First Commit**: [Time]

**Average Confusion Score**: [1-5]

**Observations**:

- [What worked well]
- [What needs improvement]
- [Common tools NOT used and why]

## Version History

- **v1.0** (2025-01-27): Initial boilerplate setup
- **v1.1** (TBD): Updates based on Week 1 usage
