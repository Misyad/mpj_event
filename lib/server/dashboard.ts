import type { Event, EventScope, Participant } from '@/types'
import { AUTH_ROLES } from '@/lib/auth/roles'
import { getAdminParticipantsFromDb, getEventsFromDb, getUserCertificatesFromDb, getUserEventHistoryFromDb, type UserEventHistoryItem } from '@/lib/server/events'
import { getFinanceSummary, listPaymentMonitoring } from '@/lib/server/finance'
import { getPublicUserProfile, listRegionals, type AdminSession } from '@/lib/server/rbac'
import { getEventTimestamp } from '@/utils/dateFormatter'

function status(value: unknown) {
  return String(value ?? '').toLowerCase()
}

function isPaidParticipant(participant: Participant) {
  return participant.payment_status === 'Paid' || participant.payment_status === 'Free'
}

function isPendingPayment(participant: Participant) {
  return participant.payment_status === 'Unpaid' || participant.payment_status === 'Pending_Approval'
}

function isAttended(participant: Participant) {
  return status(participant.attendance_status) === 'attended' || status(participant.status) === 'attended'
}

function isOpenEvent(event: Event) {
  const eventStatus = status(event.status)
  return event.status_pendaftaran !== 'closed' && !['finished', 'completed', 'rejected'].includes(eventStatus)
}

function isUpcomingOrActive(event: Event) {
  const eventStatus = status(event.status)
  return event.isPublished && event.isPublic && !['finished', 'completed', 'rejected'].includes(eventStatus)
}

function byNewestEventDate(a: Event, b: Event) {
  return getEventTimestamp(b.dateStart ?? b.start_date) - getEventTimestamp(a.dateStart ?? a.start_date)
}

function bySoonestEventDate(a: Event, b: Event) {
  return getEventTimestamp(a.dateStart ?? a.start_date) - getEventTimestamp(b.dateStart ?? b.start_date)
}

function buildParticipantSummary(participants: Participant[]) {
  const attended = participants.filter(isAttended).length
  const paid = participants.filter(isPaidParticipant).length
  const pendingPayment = participants.filter(isPendingPayment).length

  return {
    total: participants.length,
    attended,
    paid,
    pendingPayment,
  }
}

function buildEventSummary(events: Event[]) {
  return {
    total: events.length,
    pendingApproval: events.filter((event) => status(event.status) === 'pending').length,
    published: events.filter((event) => event.isPublished).length,
    live: events.filter((event) => status(event.status) === 'live' || status(event.status) === 'approved').length,
    finished: events.filter((event) => ['finished', 'completed'].includes(status(event.status))).length,
    open: events.filter(isOpenEvent).length,
  }
}

function eventScope(event: Event): EventScope {
  return event.scope ?? 'pusat'
}

export async function getAdminPusatDashboard(session: AdminSession) {
  if (session.role !== AUTH_ROLES.superAdmin) throw new Error('Unauthorized')

  const [events, participants, financeSummary, recentPayments, regionals] = await Promise.all([
    getEventsFromDb(),
    getAdminParticipantsFromDb(),
    getFinanceSummary(session),
    listPaymentMonitoring(session, {}),
    listRegionals(),
  ])

  const eventSummary = buildEventSummary(events)
  const participantSummary = buildParticipantSummary(participants)
  const regionalBreakdown = regionals.map((regional) => {
    const regionalEvents = events.filter((event) => eventScope(event) === 'regional' && event.regionId === regional.id)
    const regionalParticipants = participants.filter((participant) => participant.event?.regionId === regional.id)
    return {
      ...regional,
      eventCount: regionalEvents.length,
      participantCount: regionalParticipants.length,
      paidCount: regionalParticipants.filter(isPaidParticipant).length,
    }
  })

  return {
    role: session.role,
    generatedAt: new Date().toISOString(),
    summary: {
      ...eventSummary,
      participants: participantSummary.total,
      attended: participantSummary.attended,
      paid: participantSummary.paid,
      pendingPayment: participantSummary.pendingPayment,
      regionalCount: regionals.length,
      finance: financeSummary,
    },
    pendingEvents: events.filter((event) => status(event.status) === 'pending').sort(byNewestEventDate).slice(0, 5),
    recentEvents: [...events].sort(byNewestEventDate).slice(0, 6),
    recentPayments: recentPayments.slice(0, 6),
    regionalBreakdown,
  }
}

export async function getRegionalDashboard(session: AdminSession) {
  if (session.role !== AUTH_ROLES.regionalAdmin || !session.regionalId) throw new Error('Admin Regional tidak memiliki regional_id')

  const [allEvents, participants, financeSummary, recentPayments] = await Promise.all([
    getEventsFromDb(),
    getAdminParticipantsFromDb({ scope: 'regional', regionId: session.regionalId }),
    getFinanceSummary(session),
    listPaymentMonitoring(session, {}),
  ])
  const events = allEvents.filter((event) => eventScope(event) === 'regional' && event.regionId === session.regionalId)
  const eventSummary = buildEventSummary(events)
  const participantSummary = buildParticipantSummary(participants)

  return {
    role: session.role,
    regionalId: session.regionalId,
    generatedAt: new Date().toISOString(),
    summary: {
      ...eventSummary,
      participants: participantSummary.total,
      attended: participantSummary.attended,
      paid: participantSummary.paid,
      pendingPayment: participantSummary.pendingPayment,
      finance: financeSummary,
    },
    recentEvents: [...events].sort(byNewestEventDate).slice(0, 5),
    recentParticipants: participants.slice(0, 6),
    recentPayments: recentPayments.slice(0, 6),
  }
}

export async function getUserDashboard(session: AdminSession) {
  if (session.role !== AUTH_ROLES.user) throw new Error('Unauthorized')

  const [profile, eventHistory, certificates, publicEvents] = await Promise.all([
    getPublicUserProfile(session.userId),
    getUserEventHistoryFromDb(session.userId),
    getUserCertificatesFromDb(session.userId),
    getEventsFromDb({ publicOnly: true }),
  ])

  const profileComplete = Boolean(profile?.fullName && profile.whatsapp && profile.institution)
  const activeHistory = eventHistory.filter((item) => !['finished', 'completed', 'cancelled'].includes(status(item.event.status)))
  const recommendedEvents = publicEvents
    .filter(isUpcomingOrActive)
    .filter((event) => !eventHistory.some((item) => item.event.id === event.id))
    .sort(bySoonestEventDate)
    .slice(0, 4)

  return {
    role: session.role,
    generatedAt: new Date().toISOString(),
    profile,
    profileComplete,
    summary: {
      events: eventHistory.length,
      activeEvents: activeHistory.length,
      certificates: certificates.length,
      eligibleCertificates: eventHistory.filter((item: UserEventHistoryItem) => item.certificateEligible).length,
      recommendations: recommendedEvents.length,
    },
    eventHistory: eventHistory.slice(0, 6),
    certificates: certificates.slice(0, 6),
    recommendedEvents,
  }
}
