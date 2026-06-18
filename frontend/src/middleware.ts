import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl
    const token = req.nextauth.token

    if (pathname.startsWith('/admin')) {
      const role = token?.role
      const allowedForSupport = pathname.startsWith('/admin/orders')
      if (role !== 'ADMIN' && !(role === 'SUPPORT' && allowedForSupport)) {
        return NextResponse.redirect(new URL('/', req.url))
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl
        if (pathname.startsWith('/profile')) return !!token
        if (pathname.startsWith('/orders')) return !!token
        if (pathname.startsWith('/wishlist')) return !!token
        if (pathname.startsWith('/addresses')) return !!token
        if (pathname.startsWith('/admin')) return !!token
        return true
      }
    }
  }
)

export const config = {
  matcher: ['/profile/:path*', '/orders/:path*', '/wishlist/:path*', '/addresses/:path*', '/admin/:path*']
}