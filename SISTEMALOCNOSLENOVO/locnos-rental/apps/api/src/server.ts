import Fastify from 'fastify'
import cors from '@fastify/cors'
import swagger from '@fastify/swagger'
import swaggerUi from '@fastify/swagger-ui'
import jwt from '@fastify/jwt'
import { prisma } from './prisma'
import { registerAuthRoutes } from './views/auth'
import { registerEquipmentRoutes } from './views/equipment'
import { registerCustomerRoutes } from './views/customers'
import { registerReservationRoutes } from './views/reservations'
import { registerFinanceRoutes } from './views/finance'

const app = Fastify({ logger: true })

app.register(cors, { origin: true })
app.register(swagger, { openapi: { info: { title: 'Locnos API', version: '0.1.0' } } })
app.register(swaggerUi, { routePrefix: '/docs' })
app.register(jwt, { secret: process.env.JWT_SECRET || 'dev-secret' })

app.get('/health', async () => ({ status: 'ok' }))

app.register(registerAuthRoutes, { prefix: '/auth' })
app.register(registerEquipmentRoutes, { prefix: '/equipment' })
app.register(registerCustomerRoutes, { prefix: '/customers' })
app.register(registerReservationRoutes, { prefix: '/reservations' })
app.register(registerFinanceRoutes, { prefix: '/finance' })

const port = Number(process.env.PORT || 3333)
app
  .listen({ port, host: '0.0.0.0' })
  .then(() => app.log.info(`API running on http://localhost:${port} | docs: /docs`))
  .catch((err) => {
    app.log.error(err)
    process.exit(1)
  })
