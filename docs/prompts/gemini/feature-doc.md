# Prompt: Generate Feature Documentation

## Context

You are helping document a new feature that has been implemented. Use this template to create comprehensive, user-friendly documentation.

## Input Format

You will receive:

- **Spec file (YAML)**: Feature specification from `specs/feature/`
- **Implementation summary (bullet list)**: Summary of changes from Cursor/Claude
- **Key files touched**: List of modified files

## Task

Transform the input into comprehensive documentation:

### 1. Feature Documentation

Create `docs/features/<feature-id>.md` with:

#### Overview

- Brief description of what the feature does
- Why it was added
- Who benefits from it

#### User Impact

- How this affects end users
- What they can now do
- Any UI/UX changes

#### Technical Details (Lightweight)

- High-level technical approach
- Key components/files involved
- Dependencies or requirements
- Performance considerations (if relevant)

#### How to Use / Examples

- Step-by-step usage instructions
- Code examples (if applicable)
- Screenshots or diagrams (if helpful)
- Common use cases

### 2. Release Notes Summary

Create a short summary (max 5 lines) for release notes:

- Focus on user-facing changes
- Use clear, non-technical language
- Highlight key benefits

## Output Format

### Feature Documentation Template

```markdown
# Feature: [Feature Name]

**Feature ID**: [FEATURE-XXX]  
**Date**: [YYYY-MM-DD]  
**Status**: [Implemented/In Progress]

## Overview

[Brief description - 2-3 sentences]

## User Impact

[How users benefit - bullet points]

## Technical Details

[Lightweight technical explanation - keep it accessible]

### Key Components

- [Component 1]
- [Component 2]

### Dependencies

- [Dependency 1]
- [Dependency 2]

## How to Use

### Basic Usage

[Step-by-step instructions]

### Code Example

\`\`\`typescript
[Example code]
\`\`\`

### Advanced Usage

[Optional advanced examples]

## Examples

[Real-world use cases]

## Related Documentation

- [Link to related docs]
- [Link to API docs if applicable]
```

### Release Notes Template

```markdown
## [Feature Name]

[One-line description of what users can now do]

- [Benefit 1]
- [Benefit 2]
- [Benefit 3]
```

## Guidelines

1. **Keep it simple**: Use clear, everyday language
2. **User-focused**: Write for end users, not just developers
3. **Show examples**: Include practical code examples
4. **Visual aids**: Use diagrams (mermaid) when helpful
5. **Stay current**: Reflect actual implementation
6. **Be concise**: Don't overwhelm with details

## Example

### Input

**Spec**: FEATURE-001 Button Variants  
**Summary**: Added variant prop to Button component (primary/secondary)  
**Files**: `src/components/Button.tsx`

### Output

```markdown
# Feature: Button Variants

**Feature ID**: FEATURE-001  
**Date**: 2025-01-27  
**Status**: Implemented

## Overview

Buttons now support multiple visual variants to improve UI consistency and provide clearer visual hierarchy for user actions.

## User Impact

- More consistent button styling across the application
- Primary actions are clearly distinguished from secondary actions
- Improved visual hierarchy makes interfaces easier to scan

## Technical Details

The Button component now accepts a `variant` prop that controls its visual style. The implementation uses CSS classes for styling and maintains backward compatibility by defaulting to 'primary'.

### Key Components

- `Button.tsx`: Main component with variant support
- `button.css`: Styles for primary and secondary variants

### Dependencies

- None (uses existing styling system)

## How to Use

### Basic Usage

\`\`\`tsx
// Primary button (default)
<Button label="Save" onClick={handleSave} />

// Secondary button
<Button label="Cancel" onClick={handleCancel} variant="secondary" />
\`\`\`

## Examples

**Primary action**: Use for main actions like "Save", "Submit", "Continue"  
**Secondary action**: Use for less important actions like "Cancel", "Back", "Skip"
```

**Release Notes**:

```markdown
## Button Variants

Buttons now support primary and secondary variants for clearer visual hierarchy.

- Primary buttons highlight main actions
- Secondary buttons for less critical actions
- Improved UI consistency across the app
```
