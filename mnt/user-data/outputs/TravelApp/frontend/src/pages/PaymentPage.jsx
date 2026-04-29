// PaymentPage.jsx
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'

const API = 'http://localhost:5000/api'

export default function PaymentPage() {
  const { id }      = useParams()
  const navigate    = useNavigate()
  const token       = localStorage.getItem('token')

  const [booking,  setBooking]  = useState(null)
  const [notFound, setNotFound] = useState(false)
  const [name,     setName]     = useState('')
  const [cardNo,   setCardNo]   = useState('')
  const [expiry,   setExpiry]   = useState('')
  const [cvv,      setCvv]      = useState('')
  const [loading,  setLoading]  = useState(false)
  const [done,     setDone]     = useState(false)
  const [error,    setError]    = useState('')

  // Load booking details
  useEffect(() => {
    fetch(`${API}/bookings`, {
      headers: { authorization: token },
    })
      .then(r => r.json())
      .then(data => {
        const found = data.bookings?.find(b => b._id === id)
        if (found) setBooking(found)
        else setNotFound(true)
      })
      .catch(() => setNotFound(true))
  }, [id])

  async function handlePay(e) {
    e.preventDefault()
    if (!name || !cardNo || !expiry || !cvv) {
      setError('Please fill in all card details')
      return
    }
    setError('')
    setLoading(true)
    try {
      const res = await fetch(`${API}/payment/simulate`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', authorization: token },
        body:    JSON.stringify({ bookingId: id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Payment failed')
      setDone(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // ── Not found ────────────────────────────────────────────────
  if (notFound) return (
    <div style={{ fontFamily: 'Poppins, sans-serif', minHeight: '100vh', background: '#f0f4f8' }}>
      <Navbar />
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <div style={{ fontSize: '50px' }}>❌</div>
        <h2 style={{ color: '#1e3a5f', marginTop: '16px' }}>Booking not found</h2>
        <button onClick={() => navigate('/bookings')}
          style={{ marginTop: '20px', padding: '12px 24px', background: '#1e3a5f', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontFamily: 'Poppins, sans-serif', fontSize: '14px', fontWeight: '600' }}>
          View My Bookings
        </button>
      </div>
    </div>
  )

  // ── Loading ─────────────────────────────────────────────────
  if (!booking) return (
    <div style={{ fontFamily: 'Poppins, sans-serif', minHeight: '100vh', background: '#f0f4f8' }}>
      <Navbar />
      <div style={{ textAlign: 'center', padding: '60px', color: '#888', fontSize: '15px' }}>
        ⏳ Loading booking details...
      </div>
    </div>
  )

  // ── Already paid ─────────────────────────────────────────────
  if (booking.paymentStatus === 'paid' && !done) return (
    <div style={{ fontFamily: 'Poppins, sans-serif', minHeight: '100vh', background: '#f0f4f8' }}>
      <Navbar />
      <div style={{ maxWidth: '500px', margin: '0 auto', padding: '40px 20px', textAlign: 'center' }}>
        <div style={{ background: '#eafaf1', border: '1px solid #a9dfbf', borderRadius: '16px', padding: '40px' }}>
          <div style={{ fontSize: '60px' }}>✅</div>
          <h2 style={{ color: '#1e8449', margin: '16px 0 8px' }}>Already Paid!</h2>
          <p style={{ color: '#555', marginBottom: '24px' }}>This booking has already been paid for.</p>
          <button onClick={() => navigate('/bookings')}
            style={{ padding: '12px 28px', background: '#27ae60', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontFamily: 'Poppins, sans-serif', fontSize: '15px', fontWeight: '600' }}>
            View My Bookings
          </button>
        </div>
      </div>
    </div>
  )

  // ── Success screen ───────────────────────────────────────────
  if (done) return (
    <div style={{ fontFamily: 'Poppins, sans-serif', minHeight: '100vh', background: '#f0f4f8' }}>
      <Navbar />
      <div style={{ maxWidth: '500px', margin: '0 auto', padding: '40px 20px', textAlign: 'center' }}>
        <div style={{ background: '#eafaf1', border: '1px solid #a9dfbf', borderRadius: '16px', padding: '40px' }}>
          <div style={{ fontSize: '70px' }}>✅</div>
          <h2 style={{ color: '#1e8449', margin: '16px 0 8px', fontSize: '24px' }}>Payment Successful!</h2>
          <p style={{ color: '#555', marginBottom: '8px', fontSize: '15px' }}>
            🎫 <strong>{booking.bookingType === 'transport' ? `${booking.transportMode} ${booking.source} to ${booking.destination}` : booking.hotelName}</strong> is booked!
          </p>
          <p style={{ color: '#888', marginBottom: '28px', fontSize: '14px' }}>
            {booking.bookingType === 'transport' ? booking.travelDate : `${booking.checkIn} → ${booking.checkOut}`} · {booking.bookingType === 'transport' ? booking.passengers : booking.guests} {booking.bookingType === 'transport' ? 'passenger' : 'guest'}{(booking.bookingType === 'transport' ? booking.passengers : booking.guests) !== 1 ? 's' : ''}
          </p>
          <button onClick={() => navigate('/bookings')}
            style={{ padding: '14px 32px', background: '#27ae60', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontFamily: 'Poppins, sans-serif', fontSize: '15px', fontWeight: '700' }}>
            🧳 View My Bookings
          </button>
        </div>
      </div>
    </div>
  )

  // ── Main payment page ────────────────────────────────────────
  return (
    <div style={{ fontFamily: 'Poppins, sans-serif', minHeight: '100vh', background: '#f0f4f8' }}>
      <Navbar />
      <div style={{ maxWidth: '540px', margin: '0 auto', padding: '30px 20px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#1e3a5f', marginBottom: '24px' }}>
          💳 Complete Payment
        </h2>

        {/* Booking Summary Card */}
        <div style={{
          background: '#fff', borderRadius: '14px', padding: '20px',
          marginBottom: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.07)',
        }}>
          <h3 style={{ margin: '0 0 14px', color: '#1e3a5f', fontSize: '16px' }}>
            📋 Booking Summary
          </h3>
          {[
            [booking.bookingType === 'transport' ? 'Trip' : 'Hotel', booking.bookingType === 'transport' ? `${booking.transportMode}: ${booking.source} → ${booking.destination}` : booking.hotelName],
            [booking.bookingType === 'transport' ? 'Travel Date' : 'Check-in', booking.bookingType === 'transport' ? booking.travelDate : booking.checkIn],
            [booking.bookingType === 'transport' ? 'Operator' : 'Check-out', booking.bookingType === 'transport' ? booking.provider : booking.checkOut],
            ...(booking.bookingType === 'transport' ? [] : [['Room', booking.roomType ? `${booking.roomType}${booking.roomsBooked ? ` x ${booking.roomsBooked}` : ''}` : 'Classic Room']]),
            [booking.bookingType === 'transport' ? 'Class' : 'Nights', booking.bookingType === 'transport' ? booking.seatClass : booking.nights],
            ...(booking.bookingType === 'transport' ? [['Seat', booking.seatType ? `${booking.seatType} (${booking.seatNumber || 'auto'})` : 'Auto assigned']] : []),
            [booking.bookingType === 'transport' ? 'Passengers' : 'Guests', booking.bookingType === 'transport' ? booking.passengers : booking.guests],
          ].map(([label, value]) => (
            <div key={label} style={{
              display: 'flex', justifyContent: 'space-between',
              padding: '8px 0', borderBottom: '1px solid #f5f5f5', fontSize: '14px',
            }}>
              <span style={{ color: '#888' }}>{label}</span>
              <span style={{ fontWeight: '600', color: '#333' }}>{value}</span>
            </div>
          ))}
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            padding: '12px 0 0', fontSize: '18px', fontWeight: '700', color: '#1e3a5f',
          }}>
            <span>Total Amount</span>
            <span>₹{booking.totalPrice?.toLocaleString()}</span>
          </div>
        </div>

        

        {/* Card Form */}
        <div style={{
          background: '#fff', borderRadius: '14px', padding: '24px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.07)',
        }}>
          {/* Card preview strip */}
          <div style={{
            background: 'linear-gradient(135deg, #1e3a5f, #2980b9)',
            borderRadius: '12px', padding: '20px 24px', marginBottom: '24px', color: '#fff',
          }}>
            <div style={{ fontSize: '12px', opacity: 0.7, marginBottom: '12px', letterSpacing: '1px' }}>CARD NUMBER</div>
            <div style={{ fontSize: '18px', letterSpacing: '4px', fontWeight: '600', marginBottom: '16px' }}>
              {cardNo || '•••• •••• •••• ••••'}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
              <span>{name || 'CARDHOLDER NAME'}</span>
              <span>{expiry || 'MM/YY'}</span>
            </div>
          </div>

          {error && (
            <div style={{
              background: '#ffeaea', border: '1px solid #f5c6c6',
              color: '#c0392b', padding: '10px 14px', borderRadius: '8px',
              fontSize: '13px', marginBottom: '16px',
            }}>
              ❌ {error}
            </div>
          )}

          <form onSubmit={handlePay}>
            {/* Cardholder Name */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#444', marginBottom: '6px' }}>
                Cardholder Name
              </label>
              <input
                type="text" placeholder="Your Name"
                value={name} onChange={e => setName(e.target.value)}
                style={{ width: '100%', padding: '11px 14px', border: '1.5px solid #ddd', borderRadius: '8px', fontSize: '14px', outline: 'none', fontFamily: 'Poppins, sans-serif', boxSizing: 'border-box' }}
              />
            </div>

            {/* Card Number */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#444', marginBottom: '6px' }}>
                Card Number
              </label>
              <input
                type="text" placeholder="1234 5678 9012 3456"
                value={cardNo} onChange={e => setCardNo(e.target.value)} maxLength={19}
                style={{ width: '100%', padding: '11px 14px', border: '1.5px solid #ddd', borderRadius: '8px', fontSize: '14px', outline: 'none', fontFamily: 'Poppins, sans-serif', boxSizing: 'border-box' }}
              />
            </div>

            {/* Expiry + CVV side by side */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#444', marginBottom: '6px' }}>
                  Expiry (MM/YY)
                </label>
                <input
                  type="text" placeholder="12/27"
                  value={expiry} onChange={e => setExpiry(e.target.value)} maxLength={5}
                  style={{ width: '100%', padding: '11px 14px', border: '1.5px solid #ddd', borderRadius: '8px', fontSize: '14px', outline: 'none', fontFamily: 'Poppins, sans-serif', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#444', marginBottom: '6px' }}>
                  CVV
                </label>
                <input
                  type="password" placeholder="123"
                  value={cvv} onChange={e => setCvv(e.target.value)} maxLength={4}
                  style={{ width: '100%', padding: '11px 14px', border: '1.5px solid #ddd', borderRadius: '8px', fontSize: '14px', outline: 'none', fontFamily: 'Poppins, sans-serif', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            <button type="submit" disabled={loading} style={{
              width: '100%', padding: '15px', border: 'none', borderRadius: '10px',
              background: loading ? '#aaa' : 'linear-gradient(135deg, #27ae60, #2ecc71)',
              color: '#fff', fontSize: '16px', fontWeight: '700',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: 'Poppins, sans-serif',
            }}>
              {loading ? '⏳ Processing payment...' : `✅ Pay ₹${booking.totalPrice?.toLocaleString()}`}
            </button>
          </form>

          {/* Trusted icons */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '16px', opacity: 0.5, fontSize: '12px', color: '#888' }}>
            <span>🔒 Secure</span>
            <span>💳 All cards accepted</span>
            <span>🛡️ Protected</span>
          </div>
        </div>

      </div>
    </div>
  )
}
