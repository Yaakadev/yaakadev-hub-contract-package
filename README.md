# @yaakadev/hub-contract

Shared **service-to-service contract** between the Yaakadev **hub** and its products
(PASS, Oribam, Formatik…). It makes the integration standard *enforced* rather than
declarative: identical signed auth, one set of validated payload schemas, and
ready-made guards/middleware — so an app physically cannot talk to the hub off-contract.

Published to **GitHub Packages** (public) under the `@yaakadev` scope. Note: even for a public
package, GitHub requires a token with `read:packages` to install — that token is the only setup.

## What's inside

| Import | For | Contents |
| --- | --- | --- |
| `@yaakadev/hub-contract` | everyone (NestJS + Express + plain JS, Node ≥16) | enums, constants, `sign/verifyServiceToken`, zod schemas + inferred types, `ServiceClient` |
| `@yaakadev/hub-contract/nestjs` | hub, PASS, Oribam | `ServiceAuthGuard`, `BaseServiceAuthGuard`, `ZodValidationPipe` |
| `@yaakadev/hub-contract/express` | Formatik | `serviceAuth()` middleware |

The package has **no HTTP dependency** (works on Node 16 without global `fetch`): the
`ServiceClient` takes your existing axios instance via a tiny `HttpClient` port.

## Install

`@yaakadev/*` resolves from GitHub Packages, and GitHub requires auth even for public packages.
Each consumer repo (hub, PASS, and this one) commits an `.npmrc`:

```
@yaakadev:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}
```

Then expose a token with the **`read:packages`** scope as `NODE_AUTH_TOKEN` — one env var, same
name everywhere:

- **Local dev** (fish): `set -Ux NODE_AUTH_TOKEN ghp_xxx`
- **GitHub Actions**: `setup-node` injects `${{ secrets.GITHUB_TOKEN }}` automatically.
- **Clever Cloud**: set the app env var `NODE_AUTH_TOKEN=ghp_xxx` (the committed `.npmrc` already
  maps the scope, so `CC_NPM_REGISTRY` is not needed).

Then, as usual:

```bash
npm install @yaakadev/hub-contract
```

## Usage

### Caller side — the hub calling a product (NestJS)

```ts
import { ServiceClient, DeploymentType } from '@yaakadev/hub-contract';
import axios from 'axios';

const client = new ServiceClient({
  baseUrl: product.serviceUrl,          // add `serviceUrl` to the hub's Product schema
  secret: process.env.HUB_SERVICE_SECRET!,
  issuer: 'hub',
  audience: product.slug,               // e.g. "pass"
  http: axios.create(),
});

const result = await client.provisionDeployment({
  deploymentId: deployment.id,
  productSlug: product.slug,
  client: { id: client.id, name, email },
  admin: { firstName, lastName, email },
});
// result is validated against ProvisionDeploymentResponseSchema
```

### Receiver side — a product exposing the contract (NestJS)

```ts
import { ServiceAuthGuard, ZodValidationPipe } from '@yaakadev/hub-contract/nestjs';
import {
  ProvisionDeploymentRequestSchema,
  ProvisionDeploymentRequest,
  SERVICE_ROUTE_PREFIX,
} from '@yaakadev/hub-contract';

@UseGuards(ServiceAuthGuard)              // reads HUB_SERVICE_SECRET + SERVICE_SLUG from env
@Controller(`${SERVICE_ROUTE_PREFIX}/deployments`)
export class ServiceDeploymentsController {
  @Post()
  provision(
    @Body(new ZodValidationPipe(ProvisionDeploymentRequestSchema))
    dto: ProvisionDeploymentRequest,
  ) {
    // create tenant + first admin, return { tenantId, url, status }
  }
}
```

### Receiver side — Formatik (Express)

```js
const { serviceAuth } = require('@yaakadev/hub-contract/express');
const { ProvisionDeploymentRequestSchema } = require('@yaakadev/hub-contract');

app.post('/service/deployments',
  serviceAuth({ secret: process.env.HUB_SERVICE_SECRET, audience: 'formatik' }),
  (req, res) => {
    const dto = ProvisionDeploymentRequestSchema.parse(req.body);
    // ...
  });
```

## Required env vars (every app)

| Var | Meaning |
| --- | --- |
| `HUB_SERVICE_SECRET` | Shared HMAC secret, **identical** in the hub and every product |
| `SERVICE_SLUG` | This service's own slug (`hub`, `pass`, `oribam`, `formatik`) — the token `aud` |

## Publish

CI publishes to GitHub Packages on a version tag (`.github/workflows/publish.yml`, using the
repo's built-in `GITHUB_TOKEN`):

```bash
npm version patch   # or minor / major
git push --follow-tags
```

To publish by hand instead, export a token with `write:packages` as `NODE_AUTH_TOKEN`, then
`npm run build && npm publish`.

Semver **is** the contract: a breaking change to any schema or to the auth shape is a
**major** bump; the hub and products pin a compatible range.

## Develop

```bash
npm install
npm run build       # tsc -> dist/ (CommonJS, ES2020)
npm run typecheck
```
