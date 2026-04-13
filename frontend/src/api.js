const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

async function fetchJSON(url, options) {
  const response = await fetch(url, options);
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    const message = payload.error || 'Request failed';
    throw new Error(message);
  }
  return response.json();
}

// Updated: Accepts 'email' and 'plan' for user targeting
export async function getFlags(email, plan = 'free') {
  const params = new URLSearchParams();
  if (email) params.append('email', email);
  params.append('plan', plan);  // Plan parameter for targeting

  const query = params.toString() ? `?${params.toString()}` : '';
  return fetchJSON(`${API_BASE}/api/flags${query}`);
}

export async function getEvents(email) {
  const query = email ? `?email=${encodeURIComponent(email)}` : '';
  return fetchJSON(`${API_BASE}/api/events${query}`);
}

export async function getPromotions(segment) {
  const query = segment ? `?segment=${encodeURIComponent(segment)}` : '';
  return fetchJSON(`${API_BASE}/api/promotions${query}`);
}

export async function purchaseTickets(payload) {
  return fetchJSON(`${API_BASE}/api/tickets/purchase`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
}

export async function getReviews(email) {
  const query = email ? `?email=${encodeURIComponent(email)}` : '';
  return fetchJSON(`${API_BASE}/api/reviews${query}`);
}

export async function getWeather() {
  return fetchJSON(`${API_BASE}/api/weather`);
}