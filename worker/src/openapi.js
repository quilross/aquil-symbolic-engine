// OpenAPI specification content
export const openapi = `openapi: 3.0.3
info:
  title: Signal Q API
  version: 1.0.0
  description: API used by my custom GPT to check health, get version, and perform actions.
servers:
  - url: https://signal-q.me
    description: Production
  - url: http://127.0.0.1:8787
    description: Local dev (Wrangler)
components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
  schemas:
    Problem:
      type: object
      properties:
        type: { type: string }
        title: { type: string }
        status: { type: integer }
        detail: { type: string }
        instance: { type: string }
    Health:
      type: object
      properties:
        ok: { type: boolean }
        ts: { type: string, format: date-time }
    Version:
      type: object
      properties:
        version: { type: string }
        commit: { type: string }
    ActionList:
      type: object
      properties:
        actions:
          type: array
          items: { type: string }
    DeployRequest:
      type: object
      properties:
        env: { type: string, enum: [preview, production] }
      required: [env]
    IdentityProbe:
      type: object
      properties:
        who: { type: string }
    RecalibrateRequest:
      type: object
      properties:
        mode: { type: string, enum: [light, full] }
      required: [mode]
security:
  - bearerAuth: []
paths:
  /system/health:
    get:
      operationId: getSystemHealth
      summary: Health check
      responses:
        '200': { description: OK, content: { application/json: { schema: { $ref: '#/components/schemas/Health' } } } }
        '4XX': { description: Client error, content: { application/problem+json: { schema: { $ref: '#/components/schemas/Problem' } } } }
        '5XX': { description: Server error, content: { application/problem+json: { schema: { $ref: '#/components/schemas/Problem' } } } }
  /version:
    get:
      operationId: getVersion
      summary: Service version
      responses:
        '200': { description: OK, content: { application/json: { schema: { $ref: '#/components/schemas/Version' } } } }
        '4XX': { description: Client error, content: { application/problem+json: { schema: { $ref: '#/components/schemas/Problem' } } } }
        '5XX': { description: Server error, content: { application/problem+json: { schema: { $ref: '#/components/schemas/Problem' } } } }
  /actions/list:
    post:
      operationId: listActions
      summary: List available actions
      security: [ { bearerAuth: [] } ]
      responses:
        '200': { description: OK, content: { application/json: { schema: { $ref: '#/components/schemas/ActionList' } } } }
        '401': { description: Unauthorized, content: { application/problem+json: { schema: { $ref: '#/components/schemas/Problem' } } } }
  /actions/probe_identity:
    post:
      operationId: probeIdentity
      summary: Probe identity
      security: [ { bearerAuth: [] } ]
      responses:
        '200': { description: OK, content: { application/json: { schema: { $ref: '#/components/schemas/IdentityProbe' } } } }
        '401': { description: Unauthorized, content: { application/problem+json: { schema: { $ref: '#/components/schemas/Problem' } } } }
  /actions/recalibrate_state:
    post:
      operationId: recalibrateState
      summary: Recalibrate server state
      security: [ { bearerAuth: [] } ]
      requestBody:
        required: true
        content:
          application/json:
            schema: { $ref: '#/components/schemas/RecalibrateRequest' }
      responses:
        '200': { description: OK }
        '401': { description: Unauthorized, content: { application/problem+json: { schema: { $ref: '#/components/schemas/Problem' } } } }
  /actions/trigger_deploy:
    post:
      operationId: triggerDeploy
      summary: Trigger a deploy
      security: [ { bearerAuth: [] } ]
      requestBody:
        required: true
        content:
          application/json:
            schema: { $ref: '#/components/schemas/DeployRequest' }
      responses:
        '200': { description: OK }
        '401': { description: Unauthorized, content: { application/problem+json: { schema: { $ref: '#/components/schemas/Problem' } } } }`;