# Test Data Factories

## Setup

Factories are in `tests/factories/`:

```typescript
// tests/factories/user.ts
import { faker } from '@faker-js/faker'
import { Factory } from 'fishery'

export const userFactory = Factory.define<User>(() => ({
  id: faker.string.uuid(),
  email: faker.internet.email(),
  name: faker.person.fullName(),
}))
```

## Usage

```typescript
import { userFactory } from '@tests/factories/user'

const user = userFactory.build()
const custom = userFactory.build({ email: 'test@example.com' })
const users = userFactory.buildList(3)
```

## Path Alias

Add to `tsconfig.json`:

```json
{ "compilerOptions": { "paths": { "@tests/*": ["./tests/*"] } } }
```

## Vitest Config

```typescript
optimizeDeps: { include: ['fishery', '@faker-js/faker'] }
```
