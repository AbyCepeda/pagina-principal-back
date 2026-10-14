// Checks the compiled CLI-plugin output without connecting to a real database.
require('reflect-metadata');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { Test } = require('@nestjs/testing');
const {
  PATH_METADATA,
  METHOD_METADATA,
  GUARDS_METADATA,
} = require('@nestjs/common/constants');
const { RequestMethod } = require('@nestjs/common');
const request = require('supertest');
const helmet = require('helmet');
const { AppModule } = require('../dist/src/app.module');
const { PrismaService } = require('../dist/src/prisma/prisma.service');
const { createApiDocument, setupSwagger } = require('../dist/src/swagger');

function controllerFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(dir, entry.name);
    return entry.isDirectory()
      ? controllerFiles(file)
      : file.endsWith('.controller.js')
        ? [file]
        : [];
  });
}

async function main() {
  process.env.JWT_SECRET = 'swagger-test-secret-'.repeat(4);
  const module = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(PrismaService)
    .useValue({})
    .compile();
  const app = module.createNestApplication();
  try {
    app.use(helmet());
    const document = createApiDocument(app);
    let expectedCount = 0;
    for (const file of controllerFiles(
      path.resolve(__dirname, '../dist/src'),
    )) {
      for (const Controller of Object.values(require(file))) {
        if (
          typeof Controller !== 'function' ||
          !Reflect.hasMetadata(PATH_METADATA, Controller)
        )
          continue;
        const prefix = Reflect.getMetadata(PATH_METADATA, Controller);
        for (const method of Object.getOwnPropertyNames(Controller.prototype)) {
          const handler = Controller.prototype[method];
          if (
            typeof handler !== 'function' ||
            !Reflect.hasMetadata(METHOD_METADATA, handler)
          )
            continue;
          const route = Reflect.getMetadata(PATH_METADATA, handler);
          const url =
            ('/' + [prefix, route].filter(Boolean).join('/'))
              .replace(/\/+/g, '/')
              .replace(/:(\w+)/g, '{$1}')
              .replace(/\/$/, '') || '/';
          const verb =
            RequestMethod[
              Reflect.getMetadata(METHOD_METADATA, handler)
            ].toLowerCase();
          const operation = document.paths[url]?.[verb];
          assert.ok(operation?.summary, `${verb} ${url} missing documentation`);
          assert.ok(operation.tags?.length, `${url} missing module tag`);
          const guards = [
            ...(Reflect.getMetadata(GUARDS_METADATA, Controller) || []),
            ...(Reflect.getMetadata(GUARDS_METADATA, handler) || []),
          ];
          const authenticated = guards.some(
            (guard) => guard.name === 'JwtAuthGuard',
          );
          assert.equal(
            Boolean(operation.security?.length),
            authenticated,
            `${url} security differs from guards`,
          );
          const roles =
            Reflect.getMetadata('roles', handler) ??
            Reflect.getMetadata('roles', Controller);
          if (roles?.includes('ADMIN'))
            assert.match(operation.description, /ADMIN/);
          expectedCount++;
        }
      }
    }
    const actualCount = Object.values(document.paths).reduce(
      (total, item) =>
        total +
        Object.keys(item).filter((key) =>
          ['get', 'post', 'patch', 'put', 'delete'].includes(key),
        ).length,
      0,
    );
    assert.equal(actualCount, expectedCount);
    for (const [url, item] of Object.entries(document.paths)) {
      for (const operation of Object.values(item)) {
        if (!operation.requestBody) continue;
        const ref =
          operation.requestBody.content['application/json'].schema.$ref;
        const schema = document.components.schemas[ref.split('/').pop()];
        assert.ok(
          Object.keys(schema.properties).length,
          `${url} has an empty body schema`,
        );
      }
    }
    const schemas = document.components.schemas;
    assert.deepEqual(schemas.LoginDto.required.sort(), ['email', 'password']);
    assert.equal(schemas.UpdateProjectDto.required?.length || 0, 0);
    assert.equal(schemas.UpdatePlanDto.required?.length || 0, 0);
    assert.equal(
      schemas.CreateContactDto.properties.quoteExtraIds.type,
      'array',
    );
    assert.equal(
      schemas.CreateContactDto.properties.quoteExtraIds.items.type,
      'string',
    );
    assert.deepEqual(schemas.CreateUserDto.properties.role.enum, [
      'ADMIN',
      'USER',
    ]);
    const filters = document.paths['/users'].get.parameters;
    assert.ok(
      filters.some(
        (parameter) => parameter.name === 'page' && !parameter.required,
      ),
    );
    assert.ok(
      filters.some(
        (parameter) =>
          parameter.name === 'isActive' && parameter.schema.type === 'boolean',
      ),
    );
    setupSwagger(app);
    await app.init();
    const client = request(app.getHttpServer());
    await client
      .get('/docs/')
      .expect(200)
      .expect(/swagger-ui/);
    const response = await client.get('/docs-json').expect(200);
    assert.equal(
      Object.keys(response.body.paths).length,
      Object.keys(document.paths).length,
    );
    await client.get('/health').expect(200);
    await client.get('/users').expect(401);
    console.log(
      `Swagger verified: ${actualCount} endpoints, ${Object.keys(schemas).length} schemas, UI, JSON and JWT protection.`,
    );
  } finally {
    await app.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
