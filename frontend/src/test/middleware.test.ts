import { describe, it, expect } from 'vitest'
import { middleware } from '@/middleware'
import { NextRequest } from 'next/server'

function makeRequest(url: string, cookieHeader?: string): NextRequest {
  const headers = new Headers()
  if (cookieHeader) {
    headers.set('cookie', cookieHeader)
  }
  return new NextRequest(new URL(url, 'http://localhost:3000'), { headers })
}

describe('middleware', () => {
  it('redirects to /login when refresh_token cookie is absent', () => {
    const req = makeRequest('http://localhost:3000/account/profile')
    const res = middleware(req)
    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toContain('/login')
  })

  it('passes through when refresh_token cookie is present', () => {
    const req = makeRequest(
      'http://localhost:3000/account/profile',
      'refresh_token=abc123'
    )
    const res = middleware(req)
    expect(res.status).toBe(200)
  })

  it('redirects to /login for /admin route without cookie', () => {
    const req = makeRequest('http://localhost:3000/admin/dashboard')
    const res = middleware(req)
    expect(res.status).toBe(307)
  })

  it('passes through /admin route with cookie', () => {
    const req = makeRequest(
      'http://localhost:3000/admin/dashboard',
      'refresh_token=abc123'
    )
    const res = middleware(req)
    expect(res.status).toBe(200)
  })
})
