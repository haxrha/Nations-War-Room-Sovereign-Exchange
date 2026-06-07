import type {
  ProfileAnalyticsRequest,
  ProfileAnalyticsResponse,
} from './profile-analytics-types'

export async function fetchProfileAnalytics(
  payload: ProfileAnalyticsRequest,
): Promise<ProfileAnalyticsResponse> {
  const res = await fetch('/api/profile/analytics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return res.json() as Promise<ProfileAnalyticsResponse>
}
