// Fetch (or rotate) a project's client portal URL. Links are token-based, so they
// can't be built from the project id on the client.
export async function getPortalLink(projectId: string, regenerate = false): Promise<string> {
  const res = await fetch('/api/portal-link', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectId, regenerate }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok || !data.url) throw new Error(data.error || 'Could not get portal link')
  return data.url
}
