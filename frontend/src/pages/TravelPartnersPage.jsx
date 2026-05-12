import { useEffect, useMemo, useRef, useState } from 'react'
import Navbar from '../components/Navbar.jsx'
import { API } from '../config.js'

const tripStyles = ['Flexible', 'Budget', 'Backpacking', 'Family', 'Adventure', 'Luxury']

export default function TravelPartnersPage() {
  const token = localStorage.getItem('token')
  const user = useMemo(() => JSON.parse(localStorage.getItem('user') || '{}'), [])
  const [posts, setPosts] = useState([])
  const [rooms, setRooms] = useState([])
  const [selectedRoom, setSelectedRoom] = useState(null)
  const [messages, setMessages] = useState([])
  const [messageText, setMessageText] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [chatLoading, setChatLoading] = useState(false)
  const [form, setForm] = useState({
    destination: '',
    startDate: '',
    endDate: '',
    travelersNeeded: 1,
    budget: '',
    tripStyle: 'Flexible',
    notes: '',
  })
  const bottomRef = useRef(null)

  useEffect(() => {
    loadPosts()
    loadRooms()
  }, [])

  useEffect(() => {
    if (!selectedRoom?._id) return
    loadMessages(selectedRoom._id)
    const interval = setInterval(() => loadMessages(selectedRoom._id, true), 5000)
    return () => clearInterval(interval)
  }, [selectedRoom?._id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function apiFetch(path, options = {}) {
    const res = await fetch(`${API}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        authorization: token,
        ...(options.headers || {}),
      },
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.message || 'Something went wrong')
    return data
  }

  async function loadPosts(term = search) {
    setLoading(true)
    try {
      const query = term.trim() ? `?search=${encodeURIComponent(term.trim())}` : ''
      const data = await apiFetch(`/travel-partners${query}`)
      setPosts(data.posts || [])
    } catch (err) {
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function loadRooms() {
    try {
      const data = await apiFetch('/chat/rooms')
      setRooms(data.rooms || [])
      if (!selectedRoom && data.rooms?.length) setSelectedRoom(data.rooms[0])
    } catch {
      setRooms([])
    }
  }

  async function loadMessages(roomId, quiet = false) {
    if (!quiet) setChatLoading(true)
    try {
      const data = await apiFetch(`/chat/rooms/${roomId}/messages`)
      setMessages(data.messages || [])
    } catch (err) {
      if (!quiet) alert(err.message)
    } finally {
      if (!quiet) setChatLoading(false)
    }
  }

  async function createPost(event) {
    event.preventDefault()
    if (!form.destination.trim()) return alert('Add a destination first')
    setSaving(true)
    try {
      const data = await apiFetch('/travel-partners', {
        method: 'POST',
        body: JSON.stringify(form),
      })
      setForm({ destination: '', startDate: '', endDate: '', travelersNeeded: 1, budget: '', tripStyle: 'Flexible', notes: '' })
      setPosts(prev => [data.post, ...prev])
      await loadRooms()
      setSelectedRoom(data.room)
    } catch (err) {
      alert(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function joinPost(post) {
    try {
      const data = await apiFetch(`/travel-partners/${post._id}/join`, { method: 'POST' })
      setPosts(prev => prev.map(item => item._id === post._id ? data.post : item))
      await loadRooms()
      setSelectedRoom(data.room)
    } catch (err) {
      alert(err.message)
    }
  }

  async function sendMessage(event) {
    event.preventDefault()
    const text = messageText.trim()
    if (!text || !selectedRoom?._id) return
    setMessageText('')
    try {
      const data = await apiFetch(`/chat/rooms/${selectedRoom._id}/messages`, {
        method: 'POST',
        body: JSON.stringify({ text }),
      })
      setMessages(prev => [...prev, data.message])
      await loadRooms()
    } catch (err) {
      setMessageText(text)
      alert(err.message)
    }
  }

  return (
    <div style={pageStyle}>
      <Navbar />
      <main style={contentStyle}>
        <section style={headerStyle}>
          <div>
            <h1 style={titleStyle}>Travel Partners</h1>
            <p style={subtitleStyle}>Find people going to the same place, join a group, and plan the trip together.</p>
          </div>
          <div style={statRowStyle}>
            <Stat label="Open trips" value={posts.length} />
            <Stat label="My chats" value={rooms.length} />
          </div>
        </section>

        <div style={layoutStyle}>
          <section style={leftColumnStyle}>
            <form onSubmit={createPost} style={formStyle}>
              <h2 style={sectionTitleStyle}>Post Your Trip</h2>
              <div style={formGridStyle}>
                <Field label="Destination">
                  <input style={inputStyle} value={form.destination} onChange={e => setForm({ ...form, destination: e.target.value })} placeholder="Goa, Manali, Jaipur..." />
                </Field>
                <Field label="Trip style">
                  <select style={inputStyle} value={form.tripStyle} onChange={e => setForm({ ...form, tripStyle: e.target.value })}>
                    {tripStyles.map(style => <option key={style}>{style}</option>)}
                  </select>
                </Field>
                <Field label="Start date">
                  <input type="date" style={inputStyle} value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} />
                </Field>
                <Field label="End date">
                  <input type="date" style={inputStyle} value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} />
                </Field>
                <Field label="Partners needed">
                  <input type="number" min="1" style={inputStyle} value={form.travelersNeeded} onChange={e => setForm({ ...form, travelersNeeded: e.target.value })} />
                </Field>
                <Field label="Budget">
                  <input type="number" min="0" style={inputStyle} value={form.budget} onChange={e => setForm({ ...form, budget: e.target.value })} placeholder="Optional" />
                </Field>
              </div>
              <Field label="Plan notes">
                <textarea style={textareaStyle} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Route, interests, hotel preference, safety rules, meeting point..." />
              </Field>
              <button style={primaryButtonStyle} disabled={saving}>{saving ? 'Posting...' : 'Create Partner Trip'}</button>
            </form>

            <div style={boardHeaderStyle}>
              <h2 style={sectionTitleStyle}>Open Partner Trips</h2>
              <div style={searchStyle}>
                <input style={searchInputStyle} value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && loadPosts()} placeholder="Search destination" />
                <button style={smallButtonStyle} onClick={() => loadPosts()}>Search</button>
              </div>
            </div>

            {loading ? (
              <div style={emptyStyle}>Loading partner trips...</div>
            ) : posts.length === 0 ? (
              <div style={emptyStyle}>No partner trips yet. Create one and start the first travel group.</div>
            ) : (
              <div style={postsGridStyle}>
                {posts.map(post => (
                  <PartnerPost key={post._id} post={post} onJoin={joinPost} />
                ))}
              </div>
            )}
          </section>

          <aside style={chatShellStyle}>
            <div style={roomsStyle}>
              <h2 style={sectionTitleStyle}>Trip Chats</h2>
              {rooms.length === 0 && <div style={smallEmptyStyle}>Join or create a trip to open a chat room.</div>}
              {rooms.map(room => (
                <button key={room._id} onClick={() => setSelectedRoom(room)} style={roomButtonStyle(selectedRoom?._id === room._id)}>
                  <span style={{ fontWeight: 800, color: '#1e3a5f' }}>{room.title}</span>
                  <span style={{ color: '#64748b', fontSize: '12px' }}>{room.members?.length || 0} members</span>
                  {room.lastMessage && <span style={lastMessageStyle}>{room.lastMessage.senderName}: {room.lastMessage.text}</span>}
                </button>
              ))}
            </div>

            <div style={chatPanelStyle}>
              {selectedRoom ? (
                <>
                  <div style={chatHeaderStyle}>
                    <div>
                      <div style={{ color: '#1e3a5f', fontWeight: 900 }}>{selectedRoom.title}</div>
                      <div style={{ color: '#64748b', fontSize: '12px' }}>{selectedRoom.destination}</div>
                    </div>
                    <span style={pillStyle}>{selectedRoom.members?.length || selectedRoom.memberIds?.length || 0} travelers</span>
                  </div>

                  <div style={messagesStyle}>
                    {chatLoading && <div style={smallEmptyStyle}>Loading messages...</div>}
                    {!chatLoading && messages.length === 0 && <div style={smallEmptyStyle}>No messages yet. Say hello and share your travel plan.</div>}
                    {messages.map(message => {
                      const mine = String(message.senderId) === String(user.id || user._id)
                      return (
                        <div key={message._id} style={messageRowStyle(mine)}>
                          <div style={bubbleStyle(mine)}>
                            <div style={{ fontSize: '11px', fontWeight: 800, opacity: 0.8 }}>{mine ? 'You' : message.senderName}</div>
                            <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.45 }}>{message.text}</div>
                            <div style={{ fontSize: '10px', opacity: 0.7, marginTop: '5px' }}>{formatTime(message.createdAt)}</div>
                          </div>
                        </div>
                      )
                    })}
                    <div ref={bottomRef} />
                  </div>

                  <form onSubmit={sendMessage} style={chatInputStyle}>
                    <input style={messageInputStyle} value={messageText} onChange={e => setMessageText(e.target.value)} placeholder="Message your travel group..." />
                    <button style={sendButtonStyle} disabled={!messageText.trim()}>Send</button>
                  </form>
                </>
              ) : (
                <div style={emptyChatStyle}>Select a trip chat to start planning.</div>
              )}
            </div>
          </aside>
        </div>
      </main>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <label style={{ display: 'grid', gap: '7px', color: '#334155', fontSize: '12px', fontWeight: 800 }}>
      {label}
      {children}
    </label>
  )
}

function Stat({ label, value }) {
  return (
    <div style={statStyle}>
      <div style={{ fontSize: '22px', fontWeight: 900, color: '#1e3a5f' }}>{value}</div>
      <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 800 }}>{label}</div>
    </div>
  )
}

function PartnerPost({ post, onJoin }) {
  const ownerName = post.createdBy?.name || 'Traveler'
  return (
    <article style={postCardStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'flex-start' }}>
        <div>
          <h3 style={{ margin: 0, color: '#1e3a5f', fontSize: '18px' }}>{post.destination}</h3>
          <div style={{ color: '#64748b', fontSize: '12px', marginTop: '4px' }}>Posted by {ownerName}</div>
        </div>
        <span style={pillStyle}>{post.tripStyle}</span>
      </div>

      <div style={infoGridStyle}>
        <Info label="Dates" value={dateRange(post)} />
        <Info label="Need" value={`${post.travelersNeeded || 1} partner${Number(post.travelersNeeded) === 1 ? '' : 's'}`} />
        <Info label="Budget" value={post.budget > 0 ? `Rs ${Number(post.budget).toLocaleString('en-IN')}` : 'Flexible'} />
        <Info label="Joined" value={`${post.membersCount || 0} travelers`} />
      </div>

      {post.notes && <p style={notesStyle}>{post.notes}</p>}
      <button style={post.hasJoined ? outlineButtonStyle : primaryButtonStyle} onClick={() => onJoin(post)}>
        {post.hasJoined ? 'Open Trip Chat' : 'Join and Chat'}
      </button>
    </article>
  )
}

function Info({ label, value }) {
  return (
    <div style={{ background: '#f8fafc', border: '1px solid #edf2f7', borderRadius: '8px', padding: '9px' }}>
      <div style={{ color: '#94a3b8', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase' }}>{label}</div>
      <div style={{ color: '#334155', fontSize: '12px', fontWeight: 800, marginTop: '3px' }}>{value}</div>
    </div>
  )
}

function dateRange(post) {
  if (post.startDate && post.endDate) return `${post.startDate} to ${post.endDate}`
  if (post.startDate) return `From ${post.startDate}`
  return 'Flexible'
}

function formatTime(value) {
  if (!value) return ''
  return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

const pageStyle = { minHeight: '100vh', background: '#eef3f8', fontFamily: 'Poppins, sans-serif' }
const contentStyle = { maxWidth: '1240px', margin: '0 auto', padding: '26px 18px 36px' }
const headerStyle = { display: 'flex', justifyContent: 'space-between', gap: '18px', alignItems: 'flex-end', marginBottom: '22px', flexWrap: 'wrap' }
const titleStyle = { margin: 0, color: '#1e3a5f', fontSize: '28px', fontWeight: 900 }
const subtitleStyle = { margin: '7px 0 0', color: '#64748b', fontSize: '14px', maxWidth: '620px', lineHeight: 1.5 }
const statRowStyle = { display: 'flex', gap: '10px', flexWrap: 'wrap' }
const statStyle = { background: '#fff', border: '1px solid #dbe7f3', borderRadius: '8px', padding: '12px 16px', minWidth: '115px' }
const layoutStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,420px),1fr))', gap: '18px', alignItems: 'start' }
const leftColumnStyle = { display: 'grid', gap: '18px', minWidth: 0 }
const formStyle = { background: '#fff', border: '1px solid #dbe7f3', borderRadius: '8px', padding: '18px', boxShadow: '0 4px 16px rgba(30,58,95,0.07)' }
const sectionTitleStyle = { margin: 0, color: '#1e3a5f', fontSize: '16px', fontWeight: 900 }
const formGridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(155px,1fr))', gap: '12px', margin: '14px 0 12px' }
const inputStyle = { width: '100%', boxSizing: 'border-box', border: '1.5px solid #dbe7f3', borderRadius: '8px', padding: '10px 11px', color: '#1f2937', fontSize: '13px', fontFamily: 'Poppins,sans-serif', outline: 'none', background: '#fff' }
const textareaStyle = { ...inputStyle, minHeight: '82px', resize: 'vertical', lineHeight: 1.5 }
const primaryButtonStyle = { marginTop: '12px', width: '100%', border: 'none', borderRadius: '8px', background: '#1e3a5f', color: '#fff', padding: '11px 14px', fontWeight: 800, fontSize: '13px', cursor: 'pointer', fontFamily: 'Poppins,sans-serif' }
const outlineButtonStyle = { ...primaryButtonStyle, background: '#fff', color: '#1e3a5f', border: '1.5px solid #1e3a5f' }
const boardHeaderStyle = { display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }
const searchStyle = { display: 'flex', gap: '8px', flex: '1 1 260px', justifyContent: 'flex-end' }
const searchInputStyle = { ...inputStyle, maxWidth: '260px' }
const smallButtonStyle = { border: '1.5px solid #1e3a5f', background: '#fff', color: '#1e3a5f', borderRadius: '8px', padding: '9px 12px', fontWeight: 800, cursor: 'pointer', fontFamily: 'Poppins,sans-serif' }
const postsGridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: '14px' }
const postCardStyle = { background: '#fff', border: '1px solid #dbe7f3', borderRadius: '8px', padding: '16px', boxShadow: '0 4px 16px rgba(30,58,95,0.06)' }
const pillStyle = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: '#e8f8f5', color: '#157347', borderRadius: '999px', padding: '5px 9px', fontSize: '11px', fontWeight: 900, whiteSpace: 'nowrap' }
const infoGridStyle = { display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: '8px', marginTop: '14px' }
const notesStyle = { color: '#475569', fontSize: '13px', lineHeight: 1.5, margin: '13px 0 0', whiteSpace: 'pre-wrap' }
const emptyStyle = { background: '#fff', border: '1px dashed #cbd5e1', borderRadius: '8px', padding: '28px', color: '#64748b', textAlign: 'center', fontWeight: 700 }
const chatShellStyle = { display: 'grid', gridTemplateRows: 'auto minmax(420px, 62vh)', gap: '12px', position: 'sticky', top: '78px', minWidth: 0 }
const roomsStyle = { background: '#fff', border: '1px solid #dbe7f3', borderRadius: '8px', padding: '14px', display: 'grid', gap: '9px', maxHeight: '240px', overflow: 'auto' }
const roomButtonStyle = active => ({ textAlign: 'left', display: 'grid', gap: '4px', border: active ? '1.5px solid #1e3a5f' : '1px solid #edf2f7', background: active ? '#f0f6fb' : '#fff', borderRadius: '8px', padding: '10px', cursor: 'pointer', fontFamily: 'Poppins,sans-serif' })
const lastMessageStyle = { color: '#94a3b8', fontSize: '11px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }
const chatPanelStyle = { background: '#fff', border: '1px solid #dbe7f3', borderRadius: '8px', display: 'grid', gridTemplateRows: 'auto minmax(0,1fr) auto', minHeight: '420px', overflow: 'hidden', boxShadow: '0 4px 16px rgba(30,58,95,0.07)' }
const chatHeaderStyle = { padding: '14px 16px', borderBottom: '1px solid #edf2f7', display: 'flex', justifyContent: 'space-between', gap: '10px', alignItems: 'center' }
const messagesStyle = { padding: '14px', overflowY: 'auto', background: '#f8fafc' }
const messageRowStyle = mine => ({ display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start', marginBottom: '10px' })
const bubbleStyle = mine => ({ maxWidth: '82%', background: mine ? '#1e3a5f' : '#fff', color: mine ? '#fff' : '#1f2937', border: mine ? 'none' : '1px solid #e2e8f0', borderRadius: mine ? '14px 14px 4px 14px' : '14px 14px 14px 4px', padding: '10px 12px', fontSize: '13px', boxShadow: '0 2px 8px rgba(15,23,42,0.05)' })
const chatInputStyle = { display: 'flex', gap: '9px', padding: '12px', borderTop: '1px solid #edf2f7', background: '#fff' }
const messageInputStyle = { ...inputStyle, flex: 1 }
const sendButtonStyle = { border: 'none', borderRadius: '8px', background: '#1e3a5f', color: '#fff', padding: '0 16px', fontWeight: 900, cursor: 'pointer', fontFamily: 'Poppins,sans-serif' }
const smallEmptyStyle = { color: '#64748b', fontSize: '12px', lineHeight: 1.5, padding: '10px', background: '#f8fafc', borderRadius: '8px' }
const emptyChatStyle = { display: 'grid', placeItems: 'center', color: '#64748b', fontWeight: 800, background: '#f8fafc', minHeight: '420px' }
