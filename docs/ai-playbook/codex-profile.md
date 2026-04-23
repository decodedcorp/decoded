---
title: Codex Profile
owner: human
status: stale
updated: 2026-04-17
tags: [agent, harness, deprecated]
---

# Codex Profile

**Last verified**: 2025-01-27  
**Version**: 1.0

## Primary Use

- **Generate spec templates**: Create feature/bugfix/experiment spec templates
- **Create checklists**: Generate implementation and review checklists
- **Update runbooks**: Create or update operational runbooks
- **Convert issues to specs**: Transform GitHub issues into structured specs

## Output Targets

- **Feature specs**: `specs/feature/FEATURE-*.yml`
- **Bugfix specs**: `specs/bugfix/BUGFIX-*.yml`
- **Experiment specs**: `specs/experiment/EXPERIMENT-*.yml`
- **Checklists**: `docs/checklists/`
- **Runbooks**: `docs/runbooks/`

## Workflow Integration

### With GitHub Issues

1. **Read issue**: Parse GitHub issue text and labels
2. **Identify type**: Determine if feature/bugfix/experiment
3. **Generate spec**: Create spec using appropriate template
4. **Fill assumptions**: Explicitly note assumptions and open questions
5. **Output**: Save to `specs/<type>/`

### With Requirements

1. **Parse requirements**: Understand user or stakeholder requirements
2. **Create template**: Use template from `docs/prompts/codex/`
3. **Structure spec**: Fill in Background, Requirements, Non-Goals, Risks, Test Plan
4. **Output**: Save to `specs/feature/`

## Templates

Use templates from `docs/prompts/codex/`:

- **spec-from-issue.md**: Template for converting issues to specs
- **feature-template.md**: Template for feature specs
- **bugfix-template.md**: Template for bugfix specs
- **experiment-template.md**: Template for experiment specs

## Spec Structure

### Feature Spec Template

```yaml
# FEATURE-001: [Feature Name]

## Background
[Why this feature is needed]

## Problem
[What problem does this solve]

## Requirements
[What must be implemented]

## Non-Goals
[What is explicitly out of scope]

## Risks
[Potential issues or concerns]

## Test Plan
[How to verify the feature works]

## Assumptions
[Explicit assumptions made]

## Open Questions
[Questions that need answers]
```

### Bugfix Spec Template

```yaml
# BUGFIX-002: [Bug Description]

## Problem
[What is broken]

## Root Cause
[Why it's broken]

## Solution
[How to fix it]

## Test Plan
[How to verify the fix]

## Regression Tests
[Tests to prevent regression]

## Assumptions
[Assumptions about the fix]
```

### Experiment Spec Template

```yaml
# EXPERIMENT-003: [Experiment Name]

## Hypothesis
[What we're testing]

## Experiment Design
[How we'll test it]

## Success Criteria
[What success looks like]

## Risks
[What could go wrong]

## Rollback Plan
[How to undo if needed]

## Assumptions
[Assumptions about the experiment]
```

## Checklist Generation

### Implementation Checklist

```markdown
# Implementation Checklist: [Feature Name]

## Prerequisites

- [ ] Spec reviewed and approved
- [ ] Dependencies identified
- [ ] Test plan created

## Implementation

- [ ] Core functionality implemented
- [ ] Tests written and passing
- [ ] Documentation updated
- [ ] Code reviewed

## Verification

- [ ] Feature works as specified
- [ ] Tests cover edge cases
- [ ] No breaking changes (or documented)
- [ ] Performance acceptable
```

### Review Checklist

```markdown
# Review Checklist: [Spec Name]

## Completeness

- [ ] Background clearly explained
- [ ] Requirements are specific
- [ ] Non-goals are explicit
- [ ] Risks are identified

## Technical

- [ ] Architecture is sound
- [ ] Dependencies are clear
- [ ] Test plan is adequate
- [ ] Performance considered

## Process

- [ ] Assumptions documented
- [ ] Open questions listed
- [ ] Stakeholders identified
- [ ] Timeline estimated
```

## Best Practices

1. **Be explicit**: Document all assumptions and open questions
2. **Use templates**: Follow templates for consistency
3. **Structure clearly**: Use clear sections and formatting
4. **Include context**: Provide enough background for understanding
5. **Identify risks**: Always list potential issues
6. **Plan tests**: Include test plans in specs

## Examples

### Example 1: Issue to Spec

**Input**: GitHub issue "Add dark mode support"

**Process**:

1. Identify as feature
2. Parse issue description
3. Generate spec using feature template
4. Fill in Background, Requirements, etc.
5. Note assumptions (e.g., "CSS variables will be used")
6. List open questions (e.g., "Which components need dark mode?")

**Output**: `specs/feature/FEATURE-001-dark-mode.yml`

### Example 2: Requirements to Spec

**Input**: Stakeholder requirements for "User authentication"

**Process**:

1. Parse requirements
2. Create feature spec template
3. Structure requirements into spec format
4. Identify non-goals (e.g., "Social login not included")
5. List risks (e.g., "Security concerns")
6. Create test plan

**Output**: `specs/feature/FEATURE-002-user-auth.yml`

## Do NOT

- **Skip assumptions**: Always document assumptions explicitly
- **Ignore templates**: Use templates for consistency
- **Forget risks**: Always identify potential issues
- **Skip test plans**: Include verification approaches
- **Be vague**: Be specific and clear in specs

## Integration Points

- **Templates**: Use `docs/prompts/codex/` templates
- **Output**: Save to `specs/feature/`, `specs/bugfix/`, `specs/experiment/`
- **Input**: GitHub issues, requirements, user stories
- **Format**: YAML for specs, Markdown for checklists

## Workflow with Other Tools

### With Claude

- **Generate spec**: Codex creates spec template
- **Claude reviews**: Claude reviews and refines spec
- **Output**: Refined spec ready for implementation

### With Cursor

- **Generate spec**: Codex creates spec
- **Cursor implements**: Cursor reads spec and implements
- **Output**: Implemented feature matching spec

### With Gemini

- **Generate spec**: Codex creates spec
- **Gemini documents**: Gemini documents the feature
- **Output**: Feature documentation
