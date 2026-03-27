'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { revalidatePath, revalidateTag } from 'next/cache'
import type { ScopeContext } from '../lib/platform-types'
import { sessionCookieName } from './auth'
import { platformStore } from './platform-store'
import { makeScopeTag } from './tags'

const getSession = async () => {
  const cookieStore = await cookies()
  const sessionId = cookieStore.get(sessionCookieName)?.value
  const session = platformStore.getSession(sessionId)
  if (!session || !sessionId) {
    throw new Error('Authentication required.')
  }
  return { session, sessionId }
}

const readScope = (formData: FormData): ScopeContext => ({
  orgSlug: String(formData.get('orgSlug') ?? ''),
  workspaceSlug: String(formData.get('workspaceSlug') ?? ''),
  productSlug: String(formData.get('productSlug') ?? ''),
  environmentSlug: String(formData.get('environmentSlug') ?? ''),
})

const readLocale = (formData: FormData) => String(formData.get('locale') ?? 'en')

const revalidateScopedPath = (scope: ScopeContext, module: string) => {
  for (const locale of ['en', 'de']) {
    revalidatePath(`/${locale}/app/${scope.orgSlug}/${scope.workspaceSlug}/${scope.productSlug}/${scope.environmentSlug}/${module}`)
  }
}

export async function switchContextAction(formData: FormData) {
  const { sessionId } = await getSession()
  const nextScope = readScope(formData)
  const locale = readLocale(formData)
  platformStore.switchContext(sessionId, nextScope)
  redirect(`/${locale}/app/${nextScope.orgSlug}/${nextScope.workspaceSlug}/${nextScope.productSlug}/${nextScope.environmentSlug}/feed`)
}

export async function acknowledgeNotificationAction(formData: FormData) {
  const { session } = await getSession()
  const notificationId = String(formData.get('notificationId') ?? '')
  platformStore.acknowledgeNotification(session, notificationId)
  revalidateTag(makeScopeTag(session.currentContext, 'notifications'), 'max')
  revalidateScopedPath(session.currentContext, 'notifications')
}

export async function createCommentAction(formData: FormData) {
  const { session } = await getSession()
  const threadId = String(formData.get('threadId') ?? '')
  const body = String(formData.get('body') ?? '').trim()
  if (!body) {
    throw new Error('Comment body is required.')
  }
  platformStore.addComment(session, threadId, body)
  revalidateTag(makeScopeTag(session.currentContext, 'feed'), 'max')
  revalidateTag(makeScopeTag(session.currentContext, 'collaboration'), 'max')
  revalidateScopedPath(session.currentContext, 'feed')
  revalidateScopedPath(session.currentContext, 'collaboration')
}

export async function retryJobAction(formData: FormData) {
  const { session } = await getSession()
  const jobId = String(formData.get('jobId') ?? '')
  platformStore.retryJob(session, jobId)
  revalidateTag(makeScopeTag(session.currentContext, 'jobs'), 'max')
  revalidateTag(makeScopeTag(session.currentContext, 'feed'), 'max')
  revalidateTag(makeScopeTag(session.currentContext, 'notifications'), 'max')
  revalidateScopedPath(session.currentContext, 'jobs')
  revalidateScopedPath(session.currentContext, 'feed')
}

export async function rolloutExperimentAction(formData: FormData) {
  const { session } = await getSession()
  const experimentId = String(formData.get('experimentId') ?? '')
  platformStore.rolloutExperiment(session, experimentId)
  revalidateTag(makeScopeTag(session.currentContext, 'experiments'), 'max')
  revalidateTag(makeScopeTag(session.currentContext, 'feed'), 'max')
  revalidateTag(makeScopeTag(session.currentContext, 'notifications'), 'max')
  revalidateScopedPath(session.currentContext, 'experiments')
  revalidateScopedPath(session.currentContext, 'feed')
}

export async function pauseExperimentAction(formData: FormData) {
  const { session } = await getSession()
  const experimentId = String(formData.get('experimentId') ?? '')
  platformStore.pauseExperiment(session, experimentId)
  revalidateTag(makeScopeTag(session.currentContext, 'experiments'), 'max')
  revalidateTag(makeScopeTag(session.currentContext, 'feed'), 'max')
  revalidateScopedPath(session.currentContext, 'experiments')
  revalidateScopedPath(session.currentContext, 'feed')
}

export async function pinFeedNoteAction(formData: FormData) {
  const { session } = await getSession()
  const feedId = String(formData.get('feedId') ?? '')
  platformStore.pinFeedNote(session, feedId)
  revalidateTag(makeScopeTag(session.currentContext, 'feed'), 'max')
  revalidatePath('.')
}
