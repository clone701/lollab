# Core Steering Guidelines

## Overview

This is the primary steering document that **MUST** be read first before any development work. It defines the fundamental guidelines for managing multilingual documentation, user interactions, and development workflows in Kiro projects.

## Language Usage Rules

### User Interactions
- **AI Assistant Responses**: Always respond to users in Japanese
- **Error Messages**: Display user-facing errors in Japanese
- **UI Text**: All user interface text should be in Japanese

### Technical Documentation
- **Specification Documents**: Create in English first, then provide Japanese translations
- **Code Comments**: Use English for code comments and technical documentation
- **API Documentation**: Maintain in English with Japanese summaries where needed

## Documentation Structure

### Folder Organization
```
.kiro/
├── specs/           # English specifications
├── steering/        # English steering documents (READ FIRST)
└── steering-ja/     # Japanese translations of steering documents

ja/
├── specs/           # Japanese translations of specifications
└── steering/        # Japanese steering documents (READ FIRST)
```

### Synchronization Requirements

1. **Primary Creation**: Always create English versions first
2. **Translation Timing**: Create Japanese translations immediately after English versions
3. **Update Process**: When updating English documents, update Japanese versions simultaneously
4. **Version Control**: Maintain version parity between English and Japanese documents

## Implementation Guidelines

### For AI Assistants
- **MUST** read this steering.md file first before any development work
- Detect user language preference from initial interactions
- Maintain consistent language throughout the session
- Switch to Japanese for user-facing content while keeping technical specs in English
- Follow the 5-phase AI coding workflow defined in `subSteering/ai-coding-workflow.md`

### For Developers
- Write code and technical documentation in English
- Provide Japanese comments for complex business logic
- Create user-facing strings in Japanese with English fallbacks

## Quality Standards

### Translation Quality
- Use natural, professional Japanese
- Maintain technical accuracy
- Preserve formatting and structure from English versions
- Use consistent terminology across all documents

### Documentation Maintenance
- Review translations when English documents change
- Ensure both versions remain functionally equivalent
- Update timestamps and version numbers consistently

## File Naming Conventions

- English files: Standard naming (e.g., `requirements.md`)
- Japanese files: Same naming in respective `ja/` folders (e.g., `requirements.md`)
- Maintain identical folder structures between English and Japanese versions

## Development Workflow Guidelines

### When Starting Development Work:
- **MUST** reference #[[file:subSteering/ai-coding-workflow.md]] for 5-phase workflow guidance
- **MUST** follow the sequential development phases without exception

### Documentation References by Development Phase:
- **Phase 1 (Requirements)**: #[[file:docs/product-requirements.md]], #[[file:docs/glossary.md]]
- **Phase 2 (Design)**: #[[file:docs/architecture.md]], #[[file:docs/functional-design.md]], #[[file:docs/repository-structure.md]]
- **Phase 3 (Testing)**: #[[file:docs/development-guidelines.md]], #[[file:docs/architecture.md]]
- **Phase 4 (Implementation)**: #[[file:docs/development-guidelines.md]], #[[file:docs/glossary.md]]
- **Phase 5 (Review)**: #[[file:docs/development-guidelines.md]], #[[file:docs/architecture.md]]

## Git Operations Guidelines

### When Users Request Git Operations:
- **MUST** reference #[[file:subSteering/git-operations.md]] for standardized Git workflow

## Compliance Requirements

- **MUST** maintain Japanese language for all user interactions
- **MUST** follow the sequential 5-phase development workflow
- **MUST** reference and validate against appropriate documentation
- **MUST** maintain consistency between English and Japanese versions
- **MUST** update both language versions simultaneously when making changes