import { useEffect, useState } from 'react';
import { getEvents, getFlags, getPromotions, purchaseTickets, getReviews } from './api.js';

const ticketOptions = [
  { value: 'day', label: 'Day Pass', price: 59 },
  { value: 'park-hopper', label: 'Park Hopper', price: 89 },
  { value: 'vip', label: 'VIP After Hours', price: 149 }
];

export default function App() {
  // User simulation for testing feature flags
  const [currentUser, setCurrentUser] = useState(localStorage.getItem('theme_park_user') || '');
  const [tempEmail, setTempEmail] = useState('');
  const [userPlan, setUserPlan] = useState('free');

  // Data state
  const [events, setEvents] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [flags, setFlags] = useState(null);
  const [reviews, setReviews] = useState([]);

  // UI state
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState(null);
  const [purchaseState, setPurchaseState] = useState('idle');
  const [form, setForm] = useState({
    ticketType: 'day',
    quantity: 2,
    email: ''
  });

  // Load data on component mount
  useEffect(() => {
    let alive = true;
    const userSegment = 'vip';

    async function load() {
      try {
        // Fetch flags first - always works even during maintenance
        const flagData = await getFlags(currentUser, userPlan);
        if (!alive) return;
        setFlags(flagData);
        console.log('Flags loaded:', flagData);

        // Fetch events and promotions - may fail during maintenance
        try {
          const [eventData, promoData] = await Promise.all([
            getEvents(currentUser),
            getPromotions(userSegment)
          ]);
          if (!alive) return;
          setEvents(eventData);
          setPromotions(promoData);
        } catch (err) {
          // Events/promotions failed (e.g., maintenance mode)
          console.log('Events/promotions unavailable:', err.message);
          setEvents([]);
          setPromotions([]);
        }
      } catch (err) {
        if (!alive) return;
        setError(err.message || 'Unable to load theme park data.');
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    }
    load();
    return () => {
      alive = false;
    };
  }, [currentUser, userPlan]);

  // Load reviews when flag is enabled
  useEffect(() => {
    if (!flags?.enableReviews) return;

    async function loadReviews() {
      try {
        const reviewData = await getReviews(currentUser);
        setReviews(reviewData);
      } catch (err) {
        console.error('Failed to load reviews:', err);
        setReviews([]);
      }
    }
    loadReviews();
  }, [flags, currentUser]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === 'quantity' ? Number(value) : value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setPurchaseState('loading');
    setError('');
    try {
      const response = await purchaseTickets(form);
      setOrder(response);
      setPurchaseState('success');
    } catch (err) {
      setPurchaseState('error');
      setError(err.message || 'Ticket purchase failed.');
    }
  };

  // Handle user login simulation (for testing flag targeting)
  const handleLogin = (e) => {
    e.preventDefault();
    localStorage.setItem('theme_park_user', tempEmail);
    setCurrentUser(tempEmail);
  };

  // Handle user logout
  const handleLogout = () => {
    localStorage.removeItem('theme_park_user');
    setCurrentUser('');
    setTempEmail('');
  };

  return (
    <div className="page">
      {flags?.maintenanceMode && (
        <div style={{
          background: '#ff6b6b',
          color: 'white',
          padding: '20px',
          textAlign: 'center',
          marginBottom: '20px',
          borderRadius: '8px'
        }}>
          <h3 style={{ margin: '0 0 10px 0' }}>Scheduled Maintenance</h3>
          <p style={{ margin: 0 }}>Some features may be temporarily unavailable.</p>
        </div>
      )}
      <header className="hero">
        <div className="hero-content">
          <p className="eyebrow">Skyline Gardens Theme Park</p>
          <h1>Sunset rides, neon parades, and a skyline that never sleeps.</h1>
          <p className="hero-copy">
            Welcome to Skyline Gardens, where every moment is an adventure waiting to unfold.
          </p>
          <div className="hero-actions">
            <button className="primary">Plan your visit</button>
            <button className="ghost">View park map</button>
          </div>
          <div className="hero-badges">
            <span>Live DJ sets</span>
            <span>Glow gardens</span>
            <span>Skyline fireworks</span>
          </div>
        </div>
        <div className="hero-card">
          <div className="ticket-stub">
            <p className="ticket-title">Tonight</p>
            <h2>Fireworks + Drone Ballet</h2>
            <p className="ticket-time">8:45 PM · Main Lagoon</p>
            <div className="ticket-footer">
              <span>Included with every pass</span>
              <button className="secondary">Reserve seats</button>
            </div>
          </div>
        </div>
      </header>

      {/* Login simulation for testing feature flag targeting */}
      <div style={{ padding: '10px', background: 'rgba(0,0,0,0.05)', borderRadius: '8px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
        {currentUser ? (
          <>
            <span className="muted">Logged in as: <strong>{currentUser}</strong></span>
            <button className="ghost" onClick={handleLogout} style={{ padding: '4px 12px' }}>Logout</button>
          </>
        ) : (
          <form onSubmit={handleLogin} style={{ display: 'flex', gap: '10px', width: '100%' }}>
            <input
              type="email"
              placeholder="Enter email to simulate login..."
              value={tempEmail}
              onChange={(e) => setTempEmail(e.target.value)}
              style={{ flex: 1 }}
              required
            />
            <button className="secondary" type="submit" style={{ padding: '4px 12px' }}>Login</button>
          </form>
        )}
      </div>

      <main>
        <section className="grid">
          <div className="panel">
            <h3>Upcoming events</h3>
            {loading && <p className="muted">Loading the park calendar...</p>}
            {!loading && events.length === 0 && (
              <p className="muted">No events scheduled. Check back later.</p>
            )}
            <div className="event-list">
              {events.map((eventItem) => (
                <article key={eventItem.id} className="event-card">
                  <div>
                    <p className="event-name">{eventItem.name}</p>
                    <p className="event-date">{eventItem.date}</p>
                    <p className="event-desc">{eventItem.description}</p>
                  </div>
                  <button className="ghost">Add reminder</button>
                </article>
              ))}
            </div>
          </div>

          <div className="panel alt">
            <h3>Today's promotions</h3>
            <p className="muted">Segment: VIP guest</p>
            {loading && <p className="muted">Loading promotions...</p>}
            {!loading && promotions.length === 0 && (
              <p className="muted">No promotions active for this segment.</p>
            )}
            <div className="promo-list">
              {promotions.map((promo) => (
                <article key={promo.id} className="promo-card">
                  <p className="promo-title">{promo.title}</p>
                  <p className="promo-desc">{promo.description}</p>
                  <p className="promo-segment">{promo.segment.toUpperCase()} OFFER</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="ticket-section">
          <div className="panel">
            <h3>Buy tickets</h3>
            <p className="muted">Choose your pass and complete your purchase.</p>
            <form className="ticket-form" onSubmit={handleSubmit}>
              <label>
                Ticket type
                <select name="ticketType" value={form.ticketType} onChange={handleChange}>
                  {ticketOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label} · ${option.price}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Quantity
                <input
                  name="quantity"
                  type="number"
                  min="1"
                  max="10"
                  value={form.quantity}
                  onChange={handleChange}
                />
              </label>
              <label>
                Email
                <input
                  name="email"
                  type="email"
                  placeholder="guest@themepark.local"
                  value={form.email}
                  onChange={handleChange}
                />
              </label>
              <button className="primary" type="submit" disabled={purchaseState === 'loading'}>
                {purchaseState === 'loading' ? 'Processing...' : 'Complete purchase'}
              </button>
            </form>

            {order && (
              <div className="receipt">
                <h4>Order confirmed</h4>
                <p>
                  Order <strong>{order.orderId}</strong> · {order.quantity}x{' '}
                  {order.ticketType}
                </p>
                <p className="receipt-total">Total ${order.total.toFixed(2)}</p>
              </div>
            )}
          </div>
        </section>
        {/* Reviews Section - Add this before closing </main> */}
        {flags?.enableReviews && reviews.length > 0 && (
          <section style={{ marginTop: '40px' }}>
            <div className="panel">
              <h3>Visitor Reviews</h3>
              <p className="muted">See what other guests are saying about their experience</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
                {reviews.map(review => (
                  <div key={review.id} style={{
                    padding: '15px',
                    background: 'rgba(0,0,0,0.02)',
                    borderRadius: '8px',
                    border: '1px solid rgba(0,0,0,0.05)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <strong>{review.user}</strong>
                      <span style={{ color: '#ffd700', fontWeight: 'bold' }}>
                        {review.rating}/5 stars
                      </span>
                    </div>
                    <p style={{ margin: '0 0 10px 0' }}>{review.text}</p>
                    <p className="muted" style={{ fontSize: '0.85rem', margin: 0 }}>{review.date}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      <footer className="footer">
        <p>Skyline Gardens Theme Park - Built with React and Go</p>
        {error && <p className="error">{error}</p>}
      </footer>
    </div>
  );
}
