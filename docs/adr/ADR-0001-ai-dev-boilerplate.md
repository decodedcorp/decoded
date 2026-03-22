# ADR-0001: Multi-AI Development Boilerplate

## Status

Accepted (v1.0)

## Context

We use multiple AI tools in our development workflow:

- **Claude** (via Speckit): For small refactors, code analysis, and spec reviews
- **Cursor**: Main coding assistant for feature implementation
- **Gemini**: Documentation generation
- **Codex**: Spec templates and checklists

Each tool has different strengths and should be used intentionally. Without clear guidelines, developers may:

- Use the wrong tool for a task
- Waste time figuring out which tool to use
- Create inconsistent workflows
- Duplicate effort across tools

## Decision

We will create a dedicated AI playbook structure with:

1. **Shared principles** (`docs/ai-playbook/01-principles.md`):
   - Language conventions (Korean conversation, English code)
   - Code quality standards
   - Safety guidelines
   - Workflow principles

2. **Tool-specific profiles** (`docs/ai-playbook/*-profile.md`):
   - Clear role definition for each tool
   - Usage guidelines and examples
   - Integration points with other tools
   - Do's and don'ts

3. **Workflow overview** (`docs/ai-playbook/02-workflow-overview.md`):
   - How tools work together
   - Typical workflows for common tasks
   - Integration with existing infrastructure

4. **Configuration files**:
   - `.cursor/rules/`: Cursor-specific rules (JSONC format)
   - `.speckit/speckit.config.json`: Speckit configuration
   - `.codex/config.json`: Codex CLI configuration

5. **Prompt templates** (`docs/prompts/`):
   - Templates for Gemini documentation generation
   - Templates for Codex spec generation

6. **Integration with existing infrastructure**:
   - Preserve existing `.specify/` Speckit infrastructure
   - Integrate with `.claude/commands/` workflow
   - Reference `.specify/memory/constitution.md`

## Consequences

### Positive

- **Clear mental model**: Developers know which tool to use when
- **Faster onboarding**: New team members understand the workflow quickly
- **Consistency**: Standardized approach across the team
- **Better collaboration**: Clear handoffs between tools
- **Reduced confusion**: Less time spent deciding which tool to use

### Negative

- **Additional maintenance**: More documentation files to keep updated
- **Learning curve**: Team needs to learn the new structure
- **Potential rigidity**: May feel restrictive if not balanced with flexibility

### Risks

- **Documentation drift**: Docs may become outdated if not maintained
- **Over-engineering**: Too much structure can slow down simple tasks
- **Tool version changes**: Tool updates may require doc updates

### Mitigation

- **Version tracking**: Each profile includes "Last verified with" date
- **Kill-switch**: If setup time exceeds work time, simplify to core principles
- **Regular review**: Update docs when tools or workflows change
- **Flexibility**: Structure is advisory, not mandatory

## Alternatives Considered

### A: Single Source of Truth (Single File)

**Approach**: One `docs/ai-playbook/ai-roles.md` file with all rules

**Rejected because**:

- Less optimized for each tool's format
- Harder to maintain tool-specific guidance
- Doesn't leverage tool-specific configuration formats

### B: Tool-Specific Profiles + Shared Principles (Selected)

**Approach**: Separate profiles with shared principles

**Selected because**:

- Best balance of consistency and tool optimization
- Easier to maintain tool-specific guidance
- Supports tool-specific configuration formats

### C: Task Pipeline Approach

**Approach**: Process-based documentation (e.g., "small-refactor-claude.md")

**Rejected because**:

- Harder to maintain when tools change
- Less reusable across different tasks
- Doesn't provide clear tool roles

## Implementation

### Phase 1: Structure Creation (v1.0)

- Create directory structure
- Write core principles and tool profiles
- Create configuration files
- Set up prompt templates

### Phase 2: Integration (v1.0)

- Integrate with existing `.specify/` infrastructure
- Update workflow overview with integration points
- Create ADR document

### Phase 3: Experimentation (v1.1)

- Track usage in `docs/ai-playbook/usage-log.md`
- Gather feedback from team
- Refine based on actual usage

### Phase 4: Refinement (v1.1+)

- Update profiles based on learnings
- Simplify if needed (kill-switch criteria)
- Maintain version information

## Success Criteria

- **Time to first commit**: Reduced by 50%+ for new tasks
- **Tool switching frequency**: Reduced confusion about which tool to use
- **Confusion score**: "Which AI to use when?" score improves (1-5 scale)
- **Workflow clarity**: Team feels workflow is clear and helpful

## Version History

- **v1.0** (2025-01-27): Initial boilerplate structure
- **v1.1** (TBD): Updates based on Week 1 usage and feedback

## References

- `docs/ai-playbook/01-principles.md`: Core principles
- `docs/ai-playbook/02-workflow-overview.md`: Workflow integration
- `.specify/memory/constitution.md`: Project constitution
- `.cursor/rules/`: Cursor configuration

## Notes

This ADR documents the decision to create a multi-AI development boilerplate. The structure is designed to be:

- **Flexible**: Can adapt to tool changes
- **Maintainable**: Clear version tracking and update process
- **Practical**: Based on actual workflow needs
- **Evolvable**: Can be simplified if needed (kill-switch criteria)

The boilerplate complements, rather than replaces, existing infrastructure like `.specify/` and `.claude/commands/`.
