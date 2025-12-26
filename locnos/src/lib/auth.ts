import { NextAuthOptions, DefaultSession } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import { compare } from "bcryptjs"

declare module "next-auth" {
    interface Session {
        user: {
            id: string
            roleId: string | null
            roleName: string | null
            tenantId: string
            permissions: string[] // Array de "resource:action"
        } & DefaultSession["user"]
    }

    interface User {
        id: string
        roleId: string | null
        roleName: string | null
        tenantId: string
        permissions: string[]
    }
}

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error("Invalid credentials")
                }

                const user = await prisma.user.findUnique({
                    where: { email: credentials.email },
                    include: {
                        role: {
                            include: {
                                permissions: {
                                    where: { granted: true },
                                    include: {
                                        permission: {
                                            include: {
                                                resource: true
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        permissions: {
                            include: {
                                permission: {
                                    include: {
                                        resource: true
                                    }
                                }
                            }
                        }
                    }
                })

                if (!user) {
                    throw new Error("User not found")
                }

                if (!user.isActive || user.status === 'BLOCKED') {
                    throw new Error("User account is inactive or blocked")
                }

                const isPasswordValid = await compare(credentials.password, user.password)

                if (!isPasswordValid) {
                    throw new Error("Invalid password")
                }

                // Combinar permissões do role + custom
                const permissionsMap = new Map<string, boolean>()

                // 1. Permissões do role
                if (user.role) {
                    user.role.permissions.forEach(rp => {
                        const key = `${rp.permission.resource.name}:${rp.permission.action}`
                        permissionsMap.set(key, rp.granted)
                    })
                }

                // 2. Permissões customizadas (override)
                user.permissions.forEach(up => {
                    const key = `${up.permission.resource.name}:${up.permission.action}`
                    permissionsMap.set(key, up.granted)
                })

                // Filtrar apenas granted
                const permissions = Array.from(permissionsMap.entries())
                    .filter(([_, granted]) => granted)
                    .map(([key]) => key)

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    roleId: user.roleId,
                    roleName: user.role?.name || null,
                    tenantId: user.tenantId as string,
                    permissions
                }
            }
        })
    ],
    pages: {
        signIn: '/login',
    },
    session: {
        strategy: "jwt",
    },
    callbacks: {
        async session({ session, token }) {
            if (token) {
                session.user.id = token.id as string
                session.user.roleId = token.roleId as string | null
                session.user.roleName = token.roleName as string | null
                session.user.tenantId = token.tenantId as string
                session.user.permissions = token.permissions as string[]
            }
            return session
        },
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id
                token.roleId = user.roleId
                token.roleName = user.roleName
                token.tenantId = user.tenantId
                token.permissions = user.permissions
            }
            return token
        }
    }
}
