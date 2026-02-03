# AI Coding Workflow Guidelines

## Overview

This steering document defines the systematic workflow for AI-assisted software development, based on the practical AI coding methodology. This workflow ensures consistent, high-quality code generation through a structured approach.

## Core Development Workflow

### Phase 1: Product Requirements Specification Creation
**Objective**: Collaborate with users to concretize requirements and specifications

#### Process
1. **User Interaction**: Engage in iterative dialogue to understand needs
2. **Requirements Gathering**: Extract functional and non-functional requirements
3. **Specification Documentation**: Create comprehensive requirements documents
4. **Validation**: Confirm requirements accuracy with stakeholders

#### Key Documents
- Reference: `docs/product-requirements.md` for structure and format
- Reference: `docs/glossary.md` for consistent terminology
- Output: `requirements.md` in spec directory

#### Quality Gates
- [ ] All user stories have clear acceptance criteria
- [ ] Non-functional requirements are quantified
- [ ] Requirements are testable and verifiable
- [ ] Stakeholder approval obtained

### Phase 2: Design Generation from Requirements
**Objective**: Transform requirements into technical design specifications

#### Process
1. **Architecture Planning**: Define system architecture and components
2. **Technical Design**: Create detailed technical specifications
3. **API Design**: Define interfaces and data models
4. **Component Design**: Specify individual component behaviors

#### Key Documents
- Reference: `docs/architecture.md` for technical constraints
- Reference: `docs/functional-design.md` for design patterns
- Reference: `docs/repository-structure.md` for file organization
- Output: `design.md` in spec directory

#### Quality Gates
- [ ] Architecture aligns with requirements
- [ ] Design is technically feasible
- [ ] Components are well-defined and cohesive
- [ ] Interfaces are clearly specified

### Phase 3: Test Specification and Test Code Generation
**Objective**: Support Test-Driven Development through comprehensive test generation

#### Process
1. **Test Strategy**: Define testing approach and frameworks
2. **Property-Based Testing**: Generate correctness properties
3. **Unit Test Generation**: Create comprehensive unit tests
4. **Integration Test Planning**: Design system-level tests

#### Key Documents
- Reference: `docs/development-guidelines.md` for testing standards
- Reference: `docs/architecture.md` for testing frameworks
- Output: Test specifications in `design.md` and test code files

#### Quality Gates
- [ ] All requirements have corresponding tests
- [ ] Property-based tests cover correctness properties
- [ ] Test coverage meets quality standards (80%+)
- [ ] Tests are executable and maintainable

### Phase 4: Consistent Implementation Generation
**Objective**: Generate correctly functioning code across multiple files

#### Process
1. **Implementation Planning**: Break down design into implementation tasks
2. **Code Generation**: Generate consistent, working code
3. **Integration**: Ensure components work together correctly
4. **Validation**: Verify implementation against design

#### Key Documents
- Reference: `docs/development-guidelines.md` for coding standards
- Reference: `docs/glossary.md` for naming conventions
- Output: Implementation code files and `tasks.md`

#### Quality Gates
- [ ] Code follows established patterns and conventions
- [ ] All components integrate correctly
- [ ] Implementation satisfies design specifications
- [ ] Code is maintainable and well-documented

### Phase 5: Review and Improvement
**Objective**: Ensure code quality through systematic feedback and improvement

#### Process
1. **Code Review**: Systematic review of generated code
2. **Quality Assessment**: Evaluate against quality metrics
3. **Feedback Integration**: Incorporate improvement suggestions
4. **Iterative Refinement**: Continuous improvement cycle

#### Key Documents
- Reference: `docs/development-guidelines.md` for review criteria
- Reference: `docs/architecture.md` for quality standards
- Output: Improved code and documentation updates

#### Quality Gates
- [ ] Code passes all quality checks
- [ ] Performance requirements are met
- [ ] Security requirements are satisfied
- [ ] Documentation is complete and accurate

## Workflow Enforcement Rules

### Mandatory 5-Phase Sequential Execution
This workflow **MUST** be followed in strict sequential order. No phase may be skipped or executed out of order:

1. **プロダクト要求仕様書を作成する** - Collaborate with users to concretize requirements and specifications
2. **プロダクト要求仕様書から設計を起こす** - Transform requirements into technical design specifications  
3. **設計からテスト仕様・テストコードを生成する** - Generate test specifications and test code from design
4. **一貫性のある実装を生成する** - Generate consistent implementation across multiple files
5. **レビューと改善を行う** - Review and improve generated code quality through feedback

### Sequential Execution Requirements
- **MUST** complete each phase entirely before proceeding to the next
- **MUST** obtain user approval/validation before phase transition
- **MUST** maintain complete traceability between phases
- **MUST NOT** skip phases or execute them out of order
- **MUST NOT** proceed to implementation without completing design and testing phases

### Mandatory Documentation References
- **MUST** reference and follow guidance from relevant `docs/` files before starting each phase
- **MUST** maintain strict consistency with established patterns in docs
- **MUST** validate all outputs against reference documentation standards
- **MUST** update documentation when introducing new patterns or approaches

### Required docs/ File References by Phase:
- **Phase 1 (Requirements)**: `docs/product-requirements.md`, `docs/glossary.md`
- **Phase 2 (Design)**: `docs/architecture.md`, `docs/functional-design.md`, `docs/repository-structure.md`
- **Phase 3 (Testing)**: `docs/development-guidelines.md`, `docs/architecture.md`
- **Phase 4 (Implementation)**: `docs/development-guidelines.md`, `docs/glossary.md`
- **Phase 5 (Review)**: `docs/development-guidelines.md`, `docs/architecture.md`

### Quality Assurance Requirements
- **MUST** meet all quality gates before phase completion
- **MUST** validate outputs against phase objectives and reference docs
- **MUST** maintain quality metrics throughout development
- **MUST** ensure all generated artifacts conform to established standards

## Phase Transition Criteria

### Requirements → Design
- [ ] Requirements are complete and approved
- [ ] All acceptance criteria are testable
- [ ] Technical constraints are identified

### Design → Testing
- [ ] Design is technically sound and complete
- [ ] All components and interfaces are specified
- [ ] Architecture decisions are documented

### Testing → Implementation
- [ ] Test specifications are comprehensive
- [ ] Property-based tests are defined
- [ ] Testing framework is established

### Implementation → Review
- [ ] All code is generated and integrated
- [ ] Implementation passes initial validation
- [ ] Documentation is updated

### Review → Completion
- [ ] All quality gates are satisfied
- [ ] Code review feedback is addressed
- [ ] Final validation is successful

## Continuous Improvement

### Feedback Integration
- Collect feedback from each phase
- Identify improvement opportunities
- Update workflow guidelines as needed

### Quality Metrics Tracking
- Monitor quality metrics across phases
- Identify trends and patterns
- Adjust processes based on data

### Knowledge Capture
- Document lessons learned
- Update reference materials
- Share best practices across projects

## Reference Documentation

### Core Documents
- `docs/product-requirements.md`: Requirements structure and format
- `docs/functional-design.md`: Design patterns and architecture
- `docs/architecture.md`: Technical specifications and constraints
- `docs/development-guidelines.md`: Coding standards and practices
- `docs/repository-structure.md`: File organization and naming
- `docs/glossary.md`: Terminology and naming conventions

### Usage Guidelines
- **Always** reference appropriate docs before starting each phase
- **Maintain** consistency with established patterns
- **Update** documentation when introducing new patterns
- **Validate** outputs against reference standards