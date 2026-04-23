---
title: Gemini Profile
owner: human
status: approved
updated: 2026-04-17
tags: [agent, harness]
---

# Gemini Profile

**Last verified**: 2025-01-27  
**Version**: 1.0

## Primary Use

- **Convert tech changes into human-friendly docs**: Transform code changes into readable documentation
- **Write README sections**: Create and update README content
- **ADR summaries**: Generate Architecture Decision Records summaries
- **How-to guides**: Create step-by-step tutorials
- **Diagrams**: Generate mermaid diagrams for architecture and flows

## Input Format

### From Cursor/Claude

Gemini receives:

- **Diffs**: Code changes with context
- **PR summaries**: Bullet-point summaries of changes
- **Short bullet notes**: Key points from implementation

### Example Input

```markdown
## Changes Summary

### Files Modified

- `src/components/Button.tsx`: Added variant prop
- `src/utils/calculations.ts`: Extracted calculateTotal function

### Key Changes

- Added Button variant support (primary/secondary)
- Extracted calculation logic for better testability

### Breaking Changes

- None
```

## Output Format

### Feature Documentation

Output to `docs/features/<feature-id>.md`:

```markdown
# Feature: [Feature Name]

## Overview

[Brief description of what the feature does]

## User Impact

[How this affects users]

## Technical Details

[Lightweight technical explanation]

## How to Use

[Examples and usage instructions]
```

### Release Notes

Short summary (max 5 lines):

```markdown
- Added Button variant support (primary/secondary)
- Improved calculation logic organization
- Enhanced component testability
```

## Workflow Integration

### With Cursor

1. **Receive summary**: Get change summary from Cursor
2. **Generate docs**: Create feature documentation
3. **Create release notes**: Generate short release notes
4. **Output**: Save to `docs/features/` or update README

### With Claude

1. **Receive spec review**: Get spec review summary
2. **Document decisions**: Create ADR or decision docs
3. **Explain architecture**: Generate architectural explanations
4. **Output**: Save to `docs/adr/` or `docs/architecture/`

## Templates

Use templates from `docs/prompts/gemini/`:

- **feature-doc.md**: Template for feature documentation
- **adr-template.md**: Template for ADR summaries
- **how-to-template.md**: Template for tutorials

## Documentation Types

### 1. Feature Documentation

**Purpose**: Explain new features to users and developers

**Structure**:

- Overview
- User impact
- Technical details (lightweight)
- How to use / Examples

**Output**: `docs/features/<feature-id>.md`

### 2. ADR Summaries

**Purpose**: Document architectural decisions

**Structure**:

- Context
- Decision
- Consequences
- Alternatives considered

**Output**: `docs/adr/ADR-XXXX-*.md`

### 3. How-to Guides

**Purpose**: Step-by-step tutorials

**Structure**:

- Prerequisites
- Steps
- Examples
- Troubleshooting

**Output**: `docs/how-to/<topic>.md`

### 4. Diagrams

**Purpose**: Visual explanations

**Format**: Mermaid diagrams

**Types**:

- Architecture diagrams
- Flow charts
- Sequence diagrams
- State diagrams

**Output**: Embedded in markdown docs

## Best Practices

1. **Keep it simple**: Use clear, everyday language
2. **Show examples**: Include code examples and use cases
3. **Explain why**: Don't just describe what, explain why
4. **Use diagrams**: Visual explanations when helpful
5. **Stay current**: Update docs when code changes
6. **User-focused**: Write for the audience (users vs developers)

## Examples

### Example 1: Feature Documentation

**Input**: Change summary from Cursor about Button variants

**Output**: `docs/features/button-variants.md`

```markdown
# Feature: Button Variants

## Overview

Buttons now support multiple visual variants (primary and secondary) to improve UI consistency.

## User Impact

Users will see more consistent button styling across the application, with primary actions clearly distinguished from secondary actions.

## Technical Details

- Added `variant` prop to Button component
- Uses CSS classes for styling
- Defaults to 'primary' for backward compatibility

## How to Use

\`\`\`tsx
// Primary button (default)
<Button label="Save" onClick={handleSave} />

// Secondary button
<Button label="Cancel" onClick={handleCancel} variant="secondary" />
\`\`\`
```

### Example 2: ADR Summary

**Input**: Decision to extract calculation logic

**Output**: `docs/adr/ADR-0002-calculation-extraction.md`

```markdown
# ADR-0002: Extract Calculation Logic

## Context

Calculation logic was embedded in components, making testing difficult.

## Decision

Extract calculation logic into separate utility functions.

## Consequences

- ✅ Easier to test
- ✅ Better code organization
- ⚠️ Additional file to maintain

## Alternatives Considered

- Keep logic in components (rejected: hard to test)
- Create service class (rejected: over-engineering)
```

## Do NOT

- **Copy code blindly**: Explain and contextualize code
- **Use jargon**: Keep language accessible
- **Skip examples**: Always include usage examples
- **Forget diagrams**: Use visuals when helpful
- **Ignore updates**: Keep docs current with code

## Integration Points

- **Templates**: Use `docs/prompts/gemini/` templates
- **Output**: Save to `docs/features/`, `docs/adr/`, `docs/how-to/`
- **Input**: Receive summaries from Cursor/Claude
- **Format**: Markdown with mermaid diagrams
