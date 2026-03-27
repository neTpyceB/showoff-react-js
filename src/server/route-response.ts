import { NextResponse } from 'next/server'

export const toRouteErrorResponse = (error: unknown) => {
  const message = error instanceof Error ? error.message : 'Request failed.'

  if (/not permitted/i.test(message)) {
    return NextResponse.json({ message }, { status: 403 })
  }

  if (/not found/i.test(message)) {
    return NextResponse.json({ message }, { status: 404 })
  }

  if (/unknown user/i.test(message)) {
    return NextResponse.json({ message }, { status: 400 })
  }

  return NextResponse.json({ message }, { status: 400 })
}
