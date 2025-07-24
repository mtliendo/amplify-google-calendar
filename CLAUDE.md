# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Essential Commands
- `npm run dev` - Start Vite development server (frontend)
- `npm run build` - Build production bundle
- `npm run lint` - Run ESLint for code quality checks
- `npm run deploy` - Deploy Amplify backend to sandbox using AWS profile "focus-otter-amplify-5"

### Testing
- No test commands configured yet. When adding tests, update package.json scripts.

## Architecture Overview

This is an AWS Amplify Gen2 application that integrates with external services (Google Calendar, Jira) via OAuth.

### Backend Architecture

**Core Stack**: AWS Amplify with CDK, AppSync GraphQL, Lambda, DynamoDB, Cognito

**Key Architectural Patterns**:

1. **OAuth Flow Implementation**:
   - State-based OAuth with CSRF protection
   - Temporary state stored in DynamoDB with 5-minute TTL
   - State format: `{randomUUID}::{userId}::{provider}`
   - Tokens stored encrypted in user's DynamoDB record

2. **Authentication**: 
   - Cognito handles user auth (email/password)
   - Post-confirmation trigger creates user in DB
   - Owner format: `{cognitoSub}::{userName}`

3. **Lambda Functions Structure**:
   - Each OAuth provider has its own directory under `amplify/functions/`
   - Shared utilities in `amplify/functions/oauthUtils.ts`
   - Provider-specific utils in `amplify/functions/{provider}/utils.ts`

4. **Data Model** (`amplify/data/resource.ts`):
   - User model with nested provider credentials
   - OAuthState model for temporary state
   - Custom GraphQL operations for OAuth flows

### Frontend Architecture

- React 18 + TypeScript + Vite
- TailwindCSS for styling
- AWS Amplify Authenticator wrapper
- Type-safe API client generated from GraphQL schema

### Adding New OAuth Providers

1. Create new directory: `amplify/functions/{provider}/`
2. Implement required Lambda functions:
   - `generate-authorization-url/main.ts`
   - `callback/main.ts` 
   - `disconnect/main.ts`
   - Provider-specific operations (e.g., `list{Provider}Items`)
3. Add provider fields to User model in `amplify/data/resource.ts`
4. Update GraphQL schema with provider-specific types and operations
5. Implement frontend connection UI in SettingsPage

### Security Considerations

- OAuth callback uses Lambda function URL (no auth required)
- Always validate OAuth state to prevent CSRF
- Store refresh tokens server-side only
- Use owner-based authorization for all user data queries

### Common Development Tasks

**Updating OAuth Token Logic**:
- Token refresh logic is in provider-specific utils files
- Use `refreshTokenIfNeeded` pattern before API calls

**Adding New GraphQL Operations**:
- Define in `amplify/data/resource.ts`
- Deploy with `npm run deploy` to generate types
- Import generated client for type-safe frontend usage

**Environment Variables**:
- OAuth credentials stored in Lambda environment variables
- Set via Amplify backend configuration
- Never commit credentials to the repository