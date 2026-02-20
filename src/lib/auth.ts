import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

const secret = new TextEncoder().encode(
    process.env.JWT_SECRET || 'powerfossil-secret-key-2024'
)

export interface TokenPayload {
    id: string
    email: string
    name: string
    role: string
}

export async function signToken(payload: TokenPayload): Promise<string> {
    return await new SignJWT({ ...payload })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('7d')
        .sign(secret)
}

export async function verifyToken(token: string): Promise<TokenPayload | null> {
    try {
        const { payload } = await jwtVerify(token, secret)
        return payload as unknown as TokenPayload
    } catch {
        return null
    }
}

export async function getSession(): Promise<TokenPayload | null> {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth_token')?.value
    if (!token) return null
    return verifyToken(token)
}
