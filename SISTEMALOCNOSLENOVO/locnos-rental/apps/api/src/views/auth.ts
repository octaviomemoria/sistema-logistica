import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../prisma'
import bcrypt from 'bcryptjs'

export async function registerAuthRoutes(app: FastifyInstance) {
  app.post('/login', async (req, reply) => {
    const schema = z.object({ email: z.string().email(), password: z.string().min(3) })
    const body = schema.parse((req as any).body)
    const user = await prisma.user.findUnique({ where: { email: body.email } })
    if (!user) return reply.code(401).send({ message: 'Credenciais inválidas' })
    const ok = await bcrypt.compare(body.password, user.password)
    if (!ok) return reply.code(401).send({ message: 'Credenciais inválidas' })
    const token = (app as any).jwt.sign({ sub: user.id, role: user.role, unitId: user.unitId })
    return { token }
  })
}
