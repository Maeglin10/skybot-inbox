# Security Best Practices

Comprehensive security guidelines for SkyBot Inbox development and deployment.

---

## Authentication & Authorization

### Password Security

#### Storage
- **Never** store plain-text passwords
- Use `bcrypt` with 10+ rounds (current: 10 rounds)
- Verify implementation:
  ```typescript
  import * as bcrypt from 'bcrypt';

  // Hash password
  const hash = await bcrypt.hash(password, 10);

  // Verify password
  const isValid = await bcrypt.compare(password, hash);
  ```

#### Requirements
- Minimum 8 characters
- Require: uppercase, lowercase, number, special character
- Implement in DTO validation:
  ```typescript
  @IsStrongPassword({
    minLength: 8,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 1
  })
  password: string;
  ```

---

### JWT Tokens

#### Configuration
- **Access Token**: 15 minutes expiry
- **Refresh Token**: 7 days expiry
- **Secret Length**: Minimum 32 characters
- **Algorithm**: HS256

#### Secure Storage
**Frontend**:
- Store access token in memory (React state)
- Store refresh token in httpOnly cookie (preferred) or localStorage
- Never store in plain cookies or sessionStorage

**Backend**:
- Store JWT secrets in environment variables
- Rotate secrets every 90 days
- Use different secrets for dev/staging/prod

#### Token Payload
```typescript
// ✅ Good - minimal payload
{
  sub: userId,
  accountId: accountId,
  role: userRole,
  iat: timestamp,
  exp: timestamp
}

// ❌ Bad - sensitive data in token
{
  sub: userId,
  email: "user@example.com", // Avoid
  password: "...",            // NEVER!
  apiKey: "..."               // NEVER!
}
```

---

### Role-Based Access Control (RBAC)

#### Role Hierarchy
```
ADMIN > USER > AGENT_USER
```

#### Implementation
```typescript
// Controller
@UseGuards(RolesGuard)
@Roles(UserRole.ADMIN)
async adminOnlyEndpoint() {
  // Only ADMIN can access
}

// Prevent last admin deletion
async deleteUser(userId: string, accountId: string) {
  const admins = await this.findAdmins(accountId);

  if (admins.length === 1 && admins[0].id === userId) {
    throw new ConflictException('Cannot delete last admin');
  }
}
```

---

## Secrets Management

### Environment Variables

#### Required Practices
1. **Never commit secrets to git**
   - Use `.gitignore` for all `.env*` files (except `.env.example`)
   - Audit git history for leaked secrets:
     ```bash
     git log --all -- .env
     ```

2. **Use strong secrets**
   ```bash
   # Generate JWT secret (32 bytes = 64 hex chars)
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

   # Generate encryption key
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

   # Generate base64 secret
   node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"
   ```

3. **Separate environments**
   - Different secrets for dev/staging/prod
   - Never reuse production secrets in development

4. **Secret rotation**
   - JWT secrets: Every 90 days
   - API keys: Annually or when compromised
   - Database passwords: Annually

#### Secure Secret Storage

**Development**: `.env` file (gitignored)

**Production**: Use platform secret managers
- **Render.com**: Environment Variables (encrypted at rest)
- **AWS**: AWS Secrets Manager or Parameter Store
- **HashiCorp Vault**: Enterprise secret management

---

### Encryption

#### Token Encryption (AES-256-GCM)

Used for encrypting OAuth tokens in database:

```typescript
// Encryption Service
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits

// Encrypt
function encrypt(plaintext: string, key: Buffer): EncryptedData {
  const iv = randomBytes(12); // 96 bits for GCM
  const cipher = createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final()
  ]);

  const authTag = cipher.getAuthTag();

  return {
    ciphertext: encrypted.toString('base64'),
    iv: iv.toString('base64'),
    authTag: authTag.toString('base64')
  };
}

// Decrypt
function decrypt(data: EncryptedData, key: Buffer): string {
  const decipher = createDecipheriv(
    ALGORITHM,
    key,
    Buffer.from(data.iv, 'base64')
  );

  decipher.setAuthTag(Buffer.from(data.authTag, 'base64'));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(data.ciphertext, 'base64')),
    decipher.final()
  ]);

  return decrypted.toString('utf8');
}
```

**Key Management**:
- Store `TOKENS_ENCRYPTION_KEY` in environment variables
- Generate once, never change (or re-encrypt all tokens)
- 32-byte hex string (64 hex characters)

---

## API Security

### Webhook Validation

#### Meta Webhooks (HMAC SHA256)

```typescript
import { createHmac } from 'crypto';

function validateMetaWebhook(
  payload: string,
  signature: string,
  appSecret: string
): boolean {
  // Meta sends: sha256=<hash>
  const [algorithm, hash] = signature.split('=');

  if (algorithm !== 'sha256') {
    return false;
  }

  const expectedHash = createHmac('sha256', appSecret)
    .update(payload)
    .digest('hex');

  // Constant-time comparison to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(hash),
    Buffer.from(expectedHash)
  );
}
```

**Implementation**:
```typescript
@Post('/webhooks/meta')
async handleMetaWebhook(
  @Body() body: any,
  @Headers('x-hub-signature-256') signature: string
) {
  const payload = JSON.stringify(body);

  if (!this.validateSignature(payload, signature)) {
    throw new UnauthorizedException('Invalid signature');
  }

  // Process webhook
}
```

#### N8N Webhooks (Shared Secret)

```typescript
@Post('/webhooks/n8n')
async handleN8NWebhook(
  @Body() body: any,
  @Headers('x-n8n-secret') secret: string
) {
  const expectedSecret = process.env.N8N_MASTER_ROUTER_SECRET;

  // Constant-time comparison
  if (!crypto.timingSafeEqual(
    Buffer.from(secret || ''),
    Buffer.from(expectedSecret)
  )) {
    throw new UnauthorizedException('Invalid secret');
  }

  // Process webhook
}
```

---

### Rate Limiting

#### Configuration

```typescript
// Global rate limit
@Module({
  imports: [
    ThrottlerModule.forRoot({
      ttl: 60,      // 60 seconds
      limit: 100,   // 100 requests per IP
    }),
  ],
})

// Per-endpoint rate limit
@Throttle(10, 60)  // 10 requests/minute
@Post('/api/auth/login')
async login() { }

// Bypass rate limit for authenticated users
@SkipThrottle()
@UseGuards(JwtAuthGuard)
@Get('/api/conversations')
async getConversations() { }
```

#### Rate Limits by Endpoint

| Endpoint | Limit | Reason |
|----------|-------|--------|
| `/api/auth/login` | 10/min | Prevent brute force |
| `/api/auth/register` | 5/min | Prevent spam accounts |
| `/webhooks/*` | 10,000/min | High webhook volume |
| All other API | 1,000/min (authenticated) | Normal usage |

---

### Input Validation

#### Always Validate DTOs

```typescript
// ✅ Good - validated DTO
export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsStrongPassword()
  @MinLength(8)
  password: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsPhoneNumber()
  phone?: string;
}

// ❌ Bad - no validation
async createUser(email: string, password: string) {
  // Direct DB insertion without validation
  await this.prisma.user.create({ data: { email, password } });
}
```

#### Sanitize HTML

```typescript
import * as sanitizeHtml from 'sanitize-html';

function sanitizeUserInput(input: string): string {
  return sanitizeHtml(input, {
    allowedTags: ['b', 'i', 'em', 'strong'],
    allowedAttributes: {}
  });
}
```

#### SQL Injection Prevention

**Using Prisma** (parameterized queries):
```typescript
// ✅ Safe - Prisma handles parameterization
await prisma.user.findMany({
  where: {
    email: userInput  // Safe, automatically escaped
  }
});

// ❌ Dangerous - Raw SQL
await prisma.$queryRaw`
  SELECT * FROM users WHERE email = '${userInput}'
`;  // SQL injection vulnerable!

// ✅ Safe - Parameterized raw query
await prisma.$queryRaw`
  SELECT * FROM users WHERE email = ${userInput}
`;  // Safe, uses parameters
```

---

## Network Security

### HTTPS Only

```typescript
// Redirect HTTP to HTTPS in production
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      res.redirect(`https://${req.header('host')}${req.url}`);
    } else {
      next();
    }
  });
}
```

### CORS Configuration

```typescript
app.enableCors({
  origin: [
    'http://localhost:3000',           // Dev frontend
    'https://inbox.skybot.com',        // Prod frontend
  ],
  credentials: true,                    // Allow cookies
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});
```

### Security Headers (Helmet.js)

```typescript
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  hsts: {
    maxAge: 31536000,  // 1 year
    includeSubDomains: true,
    preload: true
  },
}));
```

---

## Data Protection

### Multi-Tenancy Isolation

#### Always Scope by accountId

```typescript
// ✅ Good - tenant isolation
async getConversations(userId: string) {
  const user = await this.getUser(userId);

  return this.prisma.conversation.findMany({
    where: {
      accountId: user.accountId  // Enforces tenant isolation
    }
  });
}

// ❌ Bad - no tenant check
async getConversations(conversationId: string) {
  return this.prisma.conversation.findUnique({
    where: { id: conversationId }
    // Missing accountId check! Data leak!
  });
}
```

#### Prisma RLS (Row-Level Security)

```typescript
// Add to Prisma middleware
prisma.$use(async (params, next) => {
  const accountId = getAccountIdFromContext();

  if (params.model === 'Conversation') {
    if (params.action === 'findMany') {
      params.args.where = {
        ...params.args.where,
        accountId: accountId
      };
    }
  }

  return next(params);
});
```

---

### Audit Logging

#### Log All Sensitive Actions

```typescript
enum AuditAction {
  LOGIN_SUCCESS = 'login_success',
  LOGIN_FAILURE = 'login_failure',
  USER_CREATED = 'user_created',
  USER_DELETED = 'user_deleted',
  PASSWORD_CHANGED = 'password_changed',
  PERMISSIONS_CHANGED = 'permissions_changed',
}

async createAuditLog(
  userId: string,
  accountId: string,
  action: AuditAction,
  metadata: Record<string, any>,
  request: Request
) {
  await this.prisma.auditLog.create({
    data: {
      userId,
      accountId,
      action,
      metadata,
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'],
    }
  });
}
```

---

## Vulnerability Prevention

### XSS Prevention

1. **Never use dangerouslySetInnerHTML** in React
2. **Sanitize all user input** before rendering
3. **Escape output** in templates
4. **Use CSP headers** to restrict script sources

### CSRF Prevention

```typescript
// Use SameSite cookies
res.cookie('refreshToken', token, {
  httpOnly: true,
  secure: true,
  sameSite: 'strict',  // Prevents CSRF
  maxAge: 7 * 24 * 60 * 60 * 1000  // 7 days
});
```

### Command Injection Prevention

```typescript
// ❌ Bad - shell injection vulnerable
import { exec } from 'child_process';
exec(`convert ${userFilename} output.png`);

// ✅ Good - use parameterized commands
import { spawn } from 'child_process';
spawn('convert', [userFilename, 'output.png']);
```

---

## Dependency Security

### Audit Dependencies

```bash
# Check for vulnerabilities
npm audit

# Fix automatically (if possible)
npm audit fix

# Check for outdated packages
npm outdated
```

### Automated Security Scanning

GitHub Actions workflow (`.github/workflows/security.yml`):

```yaml
name: Security Audit
on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM
  workflow_dispatch:

jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm audit --audit-level=high

      - name: GitLeaks
        uses: gitleaks/gitleaks-action@v2
```

---

## Incident Response

### If Secrets Are Leaked

1. **Immediate**: Rotate compromised secrets
   - Generate new JWT secrets
   - Update all environment variables
   - Revoke leaked API keys

2. **Remove from git history**:
   ```bash
   # Using git-filter-repo
   git filter-repo --replace-text replacements.txt --force
   git push origin --force --all
   ```

3. **Audit**:
   - Check access logs for unauthorized use
   - Review audit logs for suspicious activity
   - Notify affected users if needed

4. **Prevent**:
   - Add to `.gitignore`
   - Set up pre-commit hooks (e.g., `gitleaks`)
   - Enable GitHub secret scanning

---

## Security Checklist

### Development
- [ ] All secrets in `.env` (never in code)
- [ ] `.env` in `.gitignore`
- [ ] Strong password validation
- [ ] Input validation on all DTOs
- [ ] SQL injection prevention (Prisma parameterized queries)
- [ ] XSS prevention (sanitize HTML)
- [ ] CSRF protection (SameSite cookies)

### Deployment
- [ ] HTTPS enforced
- [ ] Security headers (Helmet.js)
- [ ] CORS configured correctly
- [ ] Rate limiting enabled
- [ ] Secrets in environment variables (not config files)
- [ ] Database backups enabled
- [ ] Audit logging active

### Ongoing
- [ ] Regular `npm audit`
- [ ] Dependency updates
- [ ] Secret rotation (90 days)
- [ ] Security audit (quarterly)
- [ ] Penetration testing (annually)

---

**Last Updated**: 2026-01-30
