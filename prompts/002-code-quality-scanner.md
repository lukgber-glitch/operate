<objective>
Perform a comprehensive code quality and corruption scan of the Operate codebase. Identify broken files, incomplete implementations, dead code, historical artifacts, and code quality issues.
</objective>

<context>
You are a Code Quality Agent scanning an enterprise SaaS monorepo:
- apps/api/ - NestJS Backend
- apps/web/ - Next.js Frontend
- apps/workers/ - Background jobs
- packages/database/ - Prisma schema
- packages/shared/ - Shared types

The git status shows many modified/deleted files - there may be cleanup in progress.
</context>

<scan_areas>
1. **Corrupted/Broken Files**
   - Files with syntax errors
   - Incomplete implementations (TODO, FIXME, stub functions)
   - Files that import non-existent modules
   - Circular dependencies

2. **Historical Artifacts**
   - Commented-out code blocks
   - Deprecated files not removed
   - Old migration files that should be consolidated
   - Unused dependencies in package.json files

3. **Dead Code**
   - Unused exports
   - Unreachable code paths
   - Unused variables and functions
   - Components never imported

4. **Code Quality Issues**
   - Missing TypeScript types (any, unknown overuse)
   - Inconsistent naming conventions
   - Functions over 50 lines
   - Files over 300 lines
   - Missing error handling

5. **Build/Lint Issues**
   - TypeScript compilation errors
   - ESLint violations
   - Missing dependencies
</scan_areas>

<methodology>
1. Run TypeScript compiler to find type errors:
   `npm run typecheck 2>&1 | head -100`

2. Run ESLint to find code quality issues:
   `npm run lint 2>&1 | head -100`

3. Search for incomplete code patterns:
   - Grep for TODO, FIXME, HACK, XXX
   - Grep for "throw new Error('Not implemented')"
   - Grep for empty function bodies

4. Check for unused exports:
   - Find exports not imported elsewhere
   - Identify orphaned test files

5. Analyze file sizes and complexity:
   - Flag large files (>300 lines)
   - Flag complex functions
</methodology>

<output>
Save findings to: `./audits/code-quality-scan.md`

Structure:
## Executive Summary
[Brief overview of code health]

## Critical Issues (Must Fix)
[List with file paths and line numbers]

## High Priority Issues
[Significant problems affecting reliability]

## Medium Priority Issues
[Code quality improvements]

## Low Priority Issues
[Nice-to-have cleanups]

## Statistics
- Total files scanned: X
- Files with issues: X
- Type errors: X
- Lint violations: X
- TODOs found: X
- Dead code instances: X
</output>

<success_criteria>
- All source directories scanned
- Type and lint errors catalogued
- Dead code identified
- Historical artifacts flagged
- Clear prioritization of issues
</success_criteria>
