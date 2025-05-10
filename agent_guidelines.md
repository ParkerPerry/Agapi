# AI Agent Guidelines for CircleTube Codebase

This file provides guidance for AI assistants working with this codebase. Follow these guidelines to ensure you're referencing current, authoritative code and documentation.

## Directory Priorities

When analyzing this codebase, prioritize these directories:

1. `/docs/agent_rules/*` - Primary guidelines for AI behavior and project patterns
2. `/client/src/*` - Frontend React application code
3. `/server/*` - Backend Express server code
4. `/shared/*` - Shared types and utilities
5. `/contracts/*` - Smart contract code

## Directories to Avoid

1. **Any directory or file listed in `.gitignore` or `.agentignore`**
   - The `.agentignore` file contains specific patterns for directories AI agents should not reference
   - This includes the entire `/archive/*` directory and its subdirectories
   - Also includes any test reports, temporary files, and legacy code patterns
2. Any directory prefixed with `_` or `.` (except for standard config files)
3. Any directory or file containing the terms `old`, `deprecated`, or `legacy` in their name

## File Type Priorities

When referencing code examples:
1. TypeScript (.ts, .tsx) files represent the current implementation
2. Markdown (.md) files in the /docs directory provide current documentation
3. Schema files in /shared directory define the data model

## Documentation Hierarchy

When providing guidance on project functionality:
1. First reference files in `/docs/agent_rules/`
2. Then consider primary source code
3. README.md provides general project overview but may not reflect latest details

## Special Considerations

1. **Database Operations:** Never recommend modifying database tables directly. Always use Drizzle ORM as described in documentation.

2. **API Structure:** The API follows RESTful conventions as defined in `/docs/agent_rules/api.md`

3. **AI Follower Logic:** When working with AI follower functionality, refer to the detailed flow diagrams in `/docs/agent_rules/flows.md` and `/docs/agent_rules/ai-follower-response-logic.md`

## Maintenance

These guidelines are managed alongside the codebase. If you find inconsistencies or need clarification, suggest updates to this file rather than creating alternative guidance documents.

## File Verification Tool

A utility script is available to verify if specific files should be referenced:

```bash
node tools/agent-file-checker.js path/to/check
```

This tool analyzes the path against .gitignore, .agentignore, and project conventions to determine if the file should be referenced by AI agents.