# Contributing to SkyBot Inbox

Thank you for your interest in contributing to SkyBot Inbox! This document provides guidelines and instructions for contributing.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Commit Messages](#commit-messages)
- [Pull Request Process](#pull-request-process)
- [Testing Requirements](#testing-requirements)

---

## Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help create a welcoming environment
- Report unacceptable behavior to support@skybot-inbox.com

---

## Getting Started

### Prerequisites

- Node.js v20.x+
- PostgreSQL 15+
- Git
- Basic knowledge of NestJS and TypeScript

### Setup

1. Fork the repository
2. Clone your fork:
```bash
git clone https://github.com/YOUR_USERNAME/skybot-inbox.git
cd skybot-inbox
```

3. Install dependencies:
```bash
npm install
cd skybot-inbox-ui && npm install && cd ..
```

4. Set up environment:
```bash
cp .env.example .env
# Edit .env with your configuration
```

5. Run migrations:
```bash
npx prisma migrate dev
```

6. Start development server:
```bash
npm run start:dev
```

---

## Development Workflow

### Branch Strategy

- `main` - Production-ready code
- `develop` - Integration branch
- `feature/*` - New features
- `fix/*` - Bug fixes
- `docs/*` - Documentation updates

### Workflow Steps

1. **Create a branch**:
```bash
git checkout -b feature/your-feature-name
```

2. **Make changes**:
   - Write code following [coding standards](#coding-standards)
   - Add tests for new functionality
   - Update documentation as needed

3. **Test locally**:
```bash
npm run lint
npm run test
npm run build
```

4. **Commit changes**:
```bash
git add .
git commit -m "feat: add your feature"
```

5. **Push to your fork**:
```bash
git push origin feature/your-feature-name
```

6. **Open Pull Request**:
   - Go to GitHub and create a PR
   - Fill out the PR template
   - Link any related issues

---

## Coding Standards

### TypeScript

- Use TypeScript strict mode
- Add type annotations for all function parameters and return values
- Avoid `any` type - use `unknown` or specific types
- Use interfaces for object shapes, types for unions/intersections

**Good**:
```typescript
interface CreateUserDto {
  email: string;
  name: string;
  role: UserRole;
}

async function createUser(dto: CreateUserDto): Promise<User> {
  // Implementation
}
```

**Bad**:
```typescript
async function createUser(dto: any) {
  // Implementation
}
```

### NestJS Conventions

- Use dependency injection via constructor
- Add decorators for guards, interceptors, pipes
- Use DTOs for request validation
- Separate concerns: controllers handle HTTP, services handle business logic

**Example Controller**:
```typescript
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async findAll(@CurrentUser() user: any): Promise<User[]> {
    return this.usersService.findAll(user.accountId);
  }

  @Post()
  async create(
    @CurrentUser() user: any,
    @Body() dto: CreateUserDto,
  ): Promise<User> {
    return this.usersService.create(user.accountId, dto);
  }
}
```

### Code Style

- **Indentation**: 2 spaces
- **Line length**: Max 100 characters
- **Quotes**: Single quotes for strings
- **Semicolons**: Required
- **Trailing commas**: Yes (for multi-line)

Run formatter before committing:
```bash
npm run format
```

### File Naming

- **Controllers**: `users.controller.ts`
- **Services**: `users.service.ts`
- **DTOs**: `create-user.dto.ts`
- **Interfaces**: `user.interface.ts`
- **Guards**: `jwt-auth.guard.ts`
- **Modules**: `users.module.ts`

### Documentation

- Add JSDoc comments for public APIs
- Document complex logic with inline comments
- Update README.md if adding new features
- Add examples for new endpoints

**Example**:
```typescript
/**
 * Creates a new user account
 *
 * @param accountId - The account ID for multi-tenant isolation
 * @param dto - User creation data
 * @returns The created user object (without password hash)
 * @throws ConflictException if user already exists
 */
async create(accountId: string, dto: CreateUserDto): Promise<User> {
  // Implementation
}
```

---

## Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/) format:

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, no logic change)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Maintenance tasks, dependency updates

### Examples

```
feat(auth): add magic link authentication

Implement passwordless login via email magic links.
Users receive a one-time login link valid for 15 minutes.

Closes #123
```

```
fix(webhooks): validate WhatsApp signature before processing

Added WhatsAppSignatureGuard to prevent unauthorized webhook calls.
Uses HMAC-SHA256 signature verification.

Fixes #456
```

---

## Pull Request Process

### Before Submitting

1. **Rebase on latest main**:
```bash
git fetch upstream
git rebase upstream/main
```

2. **Run all checks**:
```bash
npm run lint
npm run test
npm run build
```

3. **Update documentation**:
   - Update README.md if needed
   - Add/update API docs
   - Add migration guide if breaking changes

### PR Template

When creating a PR, include:

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] E2E tests added/updated
- [ ] Manual testing performed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No new warnings
- [ ] Tests pass locally

## Related Issues
Closes #123
```

### Review Process

- At least 1 approval required
- All CI checks must pass
- No merge conflicts
- Documentation updated
- Tests added for new features

---

## Testing Requirements

### Unit Tests

- Write unit tests for all services
- Test happy path and error cases
- Mock external dependencies
- Aim for >80% coverage

**Example**:
```typescript
describe('UsersService', () => {
  let service: UsersService;
  let prisma: PrismaService;

  beforeEach(() => {
    const module = Test.createTestingModule({
      providers: [UsersService, PrismaService],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should create a user', async () => {
    const dto = { email: 'test@example.com', name: 'Test User' };
    const user = await service.create('account-123', dto);

    expect(user.email).toBe(dto.email);
    expect(user.accountId).toBe('account-123');
  });

  it('should throw on duplicate email', async () => {
    // Test error case
  });
});
```

### E2E Tests

- Test full request/response cycles
- Use real database (test database)
- Test authentication and authorization
- Test error responses

**Example**:
```typescript
describe('Users API (e2e)', () => {
  it('POST /users (authenticated)', () => {
    return request(app.getHttpServer())
      .post('/users')
      .set('Authorization', `Bearer ${token}`)
      .send({ email: 'test@example.com', name: 'Test User' })
      .expect(201)
      .expect((res) => {
        expect(res.body.email).toBe('test@example.com');
      });
  });

  it('POST /users (unauthenticated) - 401', () => {
    return request(app.getHttpServer())
      .post('/users')
      .send({ email: 'test@example.com', name: 'Test User' })
      .expect(401);
  });
});
```

### Running Tests

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Coverage report
npm run test:cov

# Watch mode (development)
npm run test:watch
```

---

## Questions?

- **Documentation**: Check [docs/](docs/)
- **Issues**: Open a GitHub issue
- **Email**: support@skybot-inbox.com

Thank you for contributing to SkyBot Inbox!
