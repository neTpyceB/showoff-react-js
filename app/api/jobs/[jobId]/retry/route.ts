import { NextResponse } from 'next/server'
import { getSessionCookieValue } from '../../../../../src/server/auth'
import { platformStore } from '../../../../../src/server/platform-store'
import { toRouteErrorResponse } from '../../../../../src/server/route-response'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const session = platformStore.getSession(await getSessionCookieValue())
  if (!session) {
    return NextResponse.json({ message: 'Authentication is required.' }, { status: 401 })
  }
  const { jobId } = await params
  let job
  try {
    job = platformStore.retryJob(session, jobId)
  } catch (error) {
    return toRouteErrorResponse(error)
  }
  return NextResponse.json(job, { status: 201 })
}
