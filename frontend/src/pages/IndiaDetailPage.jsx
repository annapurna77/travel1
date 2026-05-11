import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'

import { API } from '../config.js'
const CAT_ICONS = { Beach:'🏖️', Mountain:'🏔️', Heritage:'🏰', Wildlife:'🐯', Adventure:'🧗', Pilgrimage:'⛩️', Nature:'🌿', City:'🌆' }
const SEA_COLORS = { Summer:'#e67e22', Winter:'#2980b9', Monsoon:'#27ae60', 'All Year':'#8e44ad' }
const SEASON_MONTHS = {
  Summer: ['March', 'April', 'May', 'June'],
  Winter: ['October', 'November', 'December', 'January', 'February'],
  Monsoon: ['July', 'August', 'September'],
  'All Year': ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
}
const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December']
const FESTIVAL_SEASONS = {
  Goa: 'Sunburn and Christmas-New Year beach season in December',
  Manali: 'Winter snow trips in December-January and summer holiday rush in May-June',
  'Kerala Backwaters': 'Onam season around August-September and houseboat peak season in winter',
  Jaipur: 'Jaipur Literature Festival in January and Diwali shopping season',
  Varanasi: 'Dev Deepawali and Ganga Mahotsav around November',
  Darjeeling: 'Tea tourism and clear Himalayan views around March-May and October-November',
  Agra: 'Taj Mahotsav around February and winter heritage season',
  'Andaman Islands': 'Island tourism peak around December-February',
  Rishikesh: 'International Yoga Festival around March and rafting season',
  Udaipur: 'Mewar Festival around March-April and winter wedding season',
  Coorg: 'Coffee blossom season around March-April and post-monsoon greenery',
  Mangalore: 'Dasara/Navratri temple season and beach visits in winter',
  Chikmagalur: 'Coffee harvest and cool hill weather around November-February',
  'Spiti Valley': 'Road-trip season from June-September',
  Mysore: 'Mysore Dasara around September-October',
  'Leh Ladakh': 'Hemis Festival and road-trip season around June-September',
  Munnar: 'Peak tea-garden weather in winter and summer hill-station season',
  Hampi: 'Hampi Utsav and winter heritage walks',
  Ooty: 'Summer Festival around May and holiday season in April-June',
  'Jim Corbett': 'Safari season from November-June, strongest in winter and early summer',
  Amritsar: 'Baisakhi in April and winter pilgrimage season',
  Kolkata: 'Durga Puja around September-October',
  Khajuraho: 'Khajuraho Dance Festival around February',
  'Rann of Kutch': 'Rann Utsav from winter into early spring',
  Shillong: 'Cherry Blossom Festival around November',
  Jaisalmer: 'Desert Festival around February',
  Puri: 'Rath Yatra around June-July',
}

function unique(items) {
  return [...new Set(items.filter(Boolean))]
}

function bestMonthsFor(dest) {
  return unique((dest.bestSeason || []).flatMap(season => SEASON_MONTHS[season] || []))
}

function monthSeason(monthIndex) {
  if ([2, 3, 4, 5].includes(monthIndex)) return 'Summer'
  if ([6, 7, 8].includes(monthIndex)) return 'Monsoon'
  return 'Winter'
}

function weatherSummary(dest) {
  const state = String(dest.state || '').toLowerCase()
  if (dest.category === 'Beach') return state.includes('andaman') ? 'Warm island weather, best with calmer seas outside heavy rains.' : 'Warm coastal weather with humid afternoons and pleasant winter evenings.'
  if (dest.category === 'Mountain') return 'Cool hill weather, clear views in preferred months, and colder nights in winter.'
  if (dest.category === 'Adventure') return 'Route access and outdoor conditions matter most; check rain, snow, and road updates.'
  if (dest.category === 'Heritage') return 'Dry, pleasant sightseeing weather is best because most visits involve walking outdoors.'
  if (dest.category === 'Wildlife') return 'Safari visibility is usually better in dry months, with early mornings preferred.'
  if (dest.category === 'Pilgrimage') return 'Morning and evening visits are most comfortable, especially outside peak heat.'
  if (dest.category === 'City') return 'Comfortable winter weather is best for markets, food walks, and heritage routes.'
  return 'Pleasant weather in the recommended season, with monsoon adding greener views in nature places.'
}

function bestVisitInfo(dest) {
  const months = bestMonthsFor(dest)
  const perDay = Number(dest.avgBudgetPerDay || 0)
  const low = Math.round(perDay * 0.85 / 100) * 100
  const high = Math.round(perDay * 1.35 / 100) * 100
  return {
    months: months.length ? months : ['October', 'November', 'December', 'January', 'February'],
    weather: weatherSummary(dest),
    costRange: `Rs ${low.toLocaleString()} - Rs ${high.toLocaleString()} per person/day`,
    festival: FESTIVAL_SEASONS[dest.name] || `${dest.bestSeason?.join(', ') || 'Winter'} is the main travel season for this place.`,
  }
}

function crowdPrediction(dest, dateValue) {
  const date = dateValue ? new Date(`${dateValue}T12:00:00`) : new Date()
  const month = date.getMonth()
  const day = date.getDay()
  const season = monthSeason(month)
  const bestSeason = dest.bestSeason || []
  const isWeekend = day === 0 || day === 6
  const isPeakSeason = bestSeason.includes(season) || bestSeason.includes('All Year')
  const festivalText = FESTIVAL_SEASONS[dest.name] || ''
  const festivalHit = festivalText.toLowerCase().includes(MONTH_NAMES[month].toLowerCase()) ||
    (['September', 'October'].includes(MONTH_NAMES[month]) && /dasara|durga|navratri/i.test(festivalText)) ||
    (['December', 'January'].includes(MONTH_NAMES[month]) && /christmas|new year|winter/i.test(festivalText))

  let score = 25
  score += Math.max(0, Number(dest.rating || 4) - 4) * 18
  score += isPeakSeason ? 24 : -6
  score += isWeekend ? 14 : 0
  score += festivalHit ? 16 : 0
  score += ['Goa', 'Agra', 'Jaipur', 'Manali', 'Leh Ladakh', 'Rann of Kutch', 'Mysore', 'Puri'].includes(dest.name) ? 8 : 0
  score = Math.max(8, Math.min(98, Math.round(score)))

  const level = score >= 75 ? 'Very High' : score >= 58 ? 'High' : score >= 38 ? 'Moderate' : 'Low'
  const color = score >= 75 ? '#c0392b' : score >= 58 ? '#e67e22' : score >= 38 ? '#f1c40f' : '#27ae60'
  const reasons = [
    isPeakSeason ? `${season} is a recommended season` : `${season} is outside the main recommended season`,
    isWeekend ? 'weekend travel usually increases crowds' : 'weekday travel is usually calmer',
    festivalHit ? 'festival or event season may increase demand' : 'no major festival spike detected for this date',
    Number(dest.rating || 0) >= 4.7 ? 'high destination popularity' : 'steady destination popularity',
  ]

  return { score, level, color, reasons, monthName: MONTH_NAMES[month], season }
}

function todayValue() {
  const d = new Date()
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 10)
}

export default function IndiaDetailPage() {
  const { id }   = useParams()
  const navigate = useNavigate()
  const [dest,   setDest]   = useState(null)
  const [hotels, setHotels] = useState([])
  const [placesToVisit, setPlacesToVisit] = useState([])
  const [travelDate, setTravelDate] = useState(todayValue())

  useEffect(() => {
    fetch(`${API}/india-destinations/${id}`)
      .then(r=>r.json())
      .then(d=>{ setDest(d.destination); setHotels(d.hotels||[]); setPlacesToVisit(d.placesToVisit||[]) })
      .catch(()=>{})
  }, [id])

  if (!dest) return (
    <div style={{ fontFamily:'Poppins,sans-serif', minHeight:'100vh', background:'#f0f4f8' }}>
      <Navbar />
      <div style={{ textAlign:'center', padding:'80px', color:'#888' }}>⏳ Loading destination...</div>
    </div>
  )

  const bestInfo = bestVisitInfo(dest)
  const crowd = crowdPrediction(dest, travelDate)

  return (
    <div style={{ minHeight:'100vh', background:'#f0f4f8', fontFamily:'Poppins,sans-serif' }}>
      <Navbar />
      <div style={{ maxWidth:'900px', margin:'0 auto', padding:'30px 20px' }}>
        <button onClick={() => navigate('/india')} style={{ background:'none', border:'none', color:'#2980b9', fontSize:'14px', cursor:'pointer', marginBottom:'16px', fontFamily:'Poppins,sans-serif', fontWeight:'600' }}>← Back to India Destinations</button>

        {/* Hero card */}
        <div style={{ background:'linear-gradient(135deg,#1e3a5f,#2980b9)', borderRadius:'18px', padding:'32px', color:'#fff', marginBottom:'20px', position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', top:'-20px', right:'-20px', fontSize:'120px', opacity:.1 }}>{CAT_ICONS[dest.category]}</div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:'16px' }}>
            <div>
              <div style={{ fontSize:'14px', opacity:.8, marginBottom:'4px' }}>📍 {dest.state}, India</div>
              <h1 style={{ fontSize:'32px', fontWeight:'700', margin:'0 0 8px' }}>{dest.name}</h1>
              <div style={{ display:'flex', gap:'6px', flexWrap:'wrap', marginBottom:'12px' }}>
                {dest.bestSeason?.map(s => (
                  <span key={s} style={{ background:SEA_COLORS[s]||'#888', color:'#fff', fontSize:'12px', fontWeight:'700', padding:'4px 12px', borderRadius:'12px' }}>{s}</span>
                ))}
                <span style={{ background:'rgba(255,255,255,0.2)', fontSize:'12px', fontWeight:'700', padding:'4px 12px', borderRadius:'12px' }}>{dest.category}</span>
              </div>
              <p style={{ fontSize:'15px', opacity:.9, lineHeight:'1.7', maxWidth:'520px', margin:0 }}>{dest.description}</p>
            </div>
            <div style={{ textAlign:'center', background:'rgba(255,255,255,0.15)', borderRadius:'16px', padding:'20px 28px' }}>
              <div style={{ fontSize:'42px', marginBottom:'4px' }}>{CAT_ICONS[dest.category]}</div>
              <div style={{ fontSize:'28px', fontWeight:'700' }}>⭐ {dest.rating}</div>
              <div style={{ fontSize:'12px', opacity:.8 }}>Rating</div>
              <div style={{ marginTop:'12px', fontSize:'18px', fontWeight:'700' }}>₹{dest.avgBudgetPerDay?.toLocaleString()}</div>
              <div style={{ fontSize:'11px', opacity:.8 }}>per day avg</div>
            </div>
          </div>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))', gap:'16px', marginBottom:'16px' }}>
          <div style={{ background:'#fff', borderRadius:'14px', padding:'20px', boxShadow:'0 2px 10px rgba(0,0,0,0.07)' }}>
            <h3 style={{ color:'#1e3a5f', margin:'0 0 14px', fontSize:'17px' }}>Best Time To Visit</h3>
            <div style={{ display:'flex', flexWrap:'wrap', gap:'6px', marginBottom:'14px' }}>
              {bestInfo.months.map(month => (
                <span key={month} style={{ background:'#ebf5fb', color:'#1e3a5f', border:'1px solid #d5e8f7', borderRadius:'18px', padding:'5px 10px', fontSize:'11px', fontWeight:'800' }}>{month}</span>
              ))}
            </div>
            <div style={{ display:'grid', gap:'10px' }}>
              <div style={{ background:'#f8fafc', borderRadius:'10px', padding:'12px' }}>
                <div style={{ color:'#888', fontSize:'11px', fontWeight:'800', textTransform:'uppercase', letterSpacing:'0.05em' }}>Weather</div>
                <div style={{ color:'#334155', fontSize:'13px', lineHeight:'1.6', marginTop:'4px' }}>{bestInfo.weather}</div>
              </div>
              <div style={{ background:'#f8fafc', borderRadius:'10px', padding:'12px' }}>
                <div style={{ color:'#888', fontSize:'11px', fontWeight:'800', textTransform:'uppercase', letterSpacing:'0.05em' }}>Average Cost</div>
                <div style={{ color:'#1e3a5f', fontSize:'14px', fontWeight:'800', marginTop:'4px' }}>{bestInfo.costRange}</div>
              </div>
              <div style={{ background:'#f8fafc', borderRadius:'10px', padding:'12px' }}>
                <div style={{ color:'#888', fontSize:'11px', fontWeight:'800', textTransform:'uppercase', letterSpacing:'0.05em' }}>Festival Season</div>
                <div style={{ color:'#334155', fontSize:'13px', lineHeight:'1.6', marginTop:'4px' }}>{bestInfo.festival}</div>
              </div>
            </div>
          </div>

          <div style={{ background:'#fff', borderRadius:'14px', padding:'20px', boxShadow:'0 2px 10px rgba(0,0,0,0.07)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', gap:'12px', alignItems:'flex-start', marginBottom:'14px', flexWrap:'wrap' }}>
              <div>
                <h3 style={{ color:'#1e3a5f', margin:'0 0 4px', fontSize:'17px' }}>Crowd Level Predictor</h3>
                <p style={{ color:'#888', margin:0, fontSize:'12px' }}>Based on season, weekend, festivals, and popularity.</p>
              </div>
              <input type="date" value={travelDate} onChange={e => setTravelDate(e.target.value)} style={{ border:'1px solid #d8e2ec', borderRadius:'9px', padding:'8px 10px', color:'#1e3a5f', fontWeight:'700', fontFamily:'Poppins,sans-serif' }} />
            </div>

            <div style={{ display:'flex', alignItems:'center', gap:'16px', marginBottom:'14px', flexWrap:'wrap' }}>
              <div style={{ width:'108px', height:'108px', borderRadius:'50%', background:`conic-gradient(${crowd.color} ${crowd.score * 3.6}deg,#edf2f7 0deg)`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <div style={{ width:'78px', height:'78px', borderRadius:'50%', background:'#fff', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
                  <div style={{ color:crowd.color, fontSize:'24px', fontWeight:'900' }}>{crowd.score}</div>
                  <div style={{ color:'#888', fontSize:'10px', fontWeight:'800' }}>score</div>
                </div>
              </div>
              <div>
                <div style={{ color:crowd.color, fontSize:'26px', fontWeight:'900', lineHeight:1.1 }}>{crowd.level}</div>
                <div style={{ color:'#64748b', fontSize:'13px', marginTop:'6px' }}>{crowd.monthName} is treated as {crowd.season} season for {dest.name}.</div>
              </div>
            </div>

            <div style={{ display:'grid', gap:'8px' }}>
              {crowd.reasons.map(reason => (
                <div key={reason} style={{ display:'flex', gap:'8px', alignItems:'flex-start', color:'#475569', fontSize:'12px', lineHeight:'1.5', background:'#f8fafc', borderRadius:'9px', padding:'9px 10px' }}>
                  <span style={{ width:'7px', height:'7px', borderRadius:'50%', background:crowd.color, marginTop:'5px', flexShrink:0 }} />
                  <span>{reason}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {placesToVisit.length > 0 && (
          <div style={{ background:'#fff', borderRadius:'14px', padding:'20px', marginBottom:'16px', boxShadow:'0 2px 10px rgba(0,0,0,0.07)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:'12px', flexWrap:'wrap', marginBottom:'14px' }}>
              <div>
                <h3 style={{ color:'#1e3a5f', margin:'0 0 4px', fontSize:'18px' }}>Places to Visit in {dest.name}</h3>
                <p style={{ color:'#888', margin:0, fontSize:'13px' }}>{placesToVisit.length} places with available hotel options</p>
              </div>
              <button onClick={() => navigate(`/hotels?search=${encodeURIComponent(dest.name)}`)} style={{ padding:'8px 14px', background:'#f8fafc', color:'#1e3a5f', border:'1px solid #d8e2ec', borderRadius:'8px', fontSize:'12px', fontWeight:'700', cursor:'pointer', fontFamily:'Poppins,sans-serif' }}>
                All {dest.name} Hotels
              </button>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:'12px' }}>
              {placesToVisit.map(place => (
                <div key={place.name} style={{ background:'#f8fafc', border:'1px solid #e5edf5', borderRadius:'12px', padding:'14px' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:'8px', marginBottom:'8px' }}>
                    <div>
                      <div style={{ fontWeight:'800', color:'#1e3a5f', fontSize:'15px' }}>{place.name}</div>
                      <div style={{ color:'#64748b', fontSize:'12px', marginTop:'2px' }}>{place.area} - {place.type}</div>
                    </div>
                    <span style={{ background:'#fff3cd', color:'#9a6a00', borderRadius:'10px', padding:'3px 8px', fontSize:'10px', fontWeight:'800', whiteSpace:'nowrap' }}>{place.bestTime}</span>
                  </div>
                  <p style={{ color:'#555', fontSize:'12px', lineHeight:'1.6', margin:'0 0 10px' }}>{place.description}</p>
                  {place.hotels?.length > 0 && (
                    <div>
                      <div style={{ color:'#1e3a5f', fontSize:'11px', fontWeight:'800', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:'6px' }}>
                        Hotels Available Near This Place ({place.hotels.length})
                      </div>
                      <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
                        {place.hotels.map(h => (
                          <div key={`${place.name}-${h._id}`} style={{ background:'#fff', border:'1px solid #e8eef5', borderRadius:'9px', padding:'9px', display:'flex', justifyContent:'space-between', alignItems:'center', gap:'8px' }}>
                            <div style={{ minWidth:0, flex:1 }}>
                              <div style={{ color:'#1e3a5f', fontSize:'12px', fontWeight:'700', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{h.name}</div>
                              <div style={{ color:'#888', fontSize:'11px', marginTop:'2px' }}>Rs {h.price?.toLocaleString()}/night - {h.rating} rating</div>
                              <div style={{ color:'#64748b', fontSize:'10px', marginTop:'3px', lineHeight:'1.4' }}>{h.nearbyNote}</div>
                            </div>
                            <div style={{ display:'flex', flexDirection:'column', gap:'5px', flexShrink:0 }}>
                              <button onClick={() => navigate(`/hotels/${h._id}`)} style={{ padding:'5px 8px', background:'#fff', color:'#1e3a5f', border:'1px solid #1e3a5f', borderRadius:'7px', fontSize:'10px', fontWeight:'700', cursor:'pointer', fontFamily:'Poppins,sans-serif' }}>
                                View
                              </button>
                              <button onClick={() => navigate(`/hotels/${h._id}#booking`)} style={{ padding:'5px 8px', background:'#1e3a5f', color:'#fff', border:'none', borderRadius:'7px', fontSize:'10px', fontWeight:'700', cursor:'pointer', fontFamily:'Poppins,sans-serif' }}>
                                Book
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {(!place.hotels || place.hotels.length === 0) && (
                    <div style={{ background:'#fff', border:'1px solid #e8eef5', borderRadius:'9px', padding:'10px', color:'#64748b', fontSize:'12px', lineHeight:'1.5' }}>
                      No hotel is linked to this exact place yet.
                      <button onClick={() => navigate(`/hotels?search=${encodeURIComponent(dest.name)}`)} style={{ marginTop:'8px', display:'block', padding:'7px 10px', background:'#1e3a5f', color:'#fff', border:'none', borderRadius:'7px', fontSize:'11px', fontWeight:'700', cursor:'pointer', fontFamily:'Poppins,sans-serif' }}>
                        See {dest.name} Hotels
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top attractions */}
        {dest.topAttractions?.length > 0 && (
          <div style={{ background:'#fff', borderRadius:'14px', padding:'20px', marginBottom:'16px', boxShadow:'0 2px 10px rgba(0,0,0,0.07)' }}>
            <h3 style={{ color:'#1e3a5f', margin:'0 0 14px', fontSize:'17px' }}>🎯 Top Attractions</h3>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:'10px' }}>
              {dest.topAttractions.map((a,i) => (
                <div key={i} style={{ background:'#f0f4f8', borderRadius:'10px', padding:'12px', display:'flex', alignItems:'center', gap:'8px' }}>
                  <span style={{ color:'#f39c12', fontSize:'18px' }}>★</span>
                  <span style={{ fontSize:'13px', fontWeight:'500', color:'#333' }}>{a}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Travel info */}
        <div style={{ background:'#fff', borderRadius:'14px', padding:'20px', marginBottom:'16px', boxShadow:'0 2px 10px rgba(0,0,0,0.07)' }}>
          <h3 style={{ color:'#1e3a5f', margin:'0 0 14px', fontSize:'17px' }}>ℹ️ Travel Information</h3>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:'12px' }}>
            {[
              { icon:'📅', label:'Best Season', value:dest.bestSeason?.join(', ') },
              { icon:'🏷️', label:'Category',    value:dest.category },
              { icon:'💰', label:'Avg Budget',  value:`₹${dest.avgBudgetPerDay?.toLocaleString()}/day` },
              { icon:'⭐', label:'Rating',      value:`${dest.rating}/5.0` },
              { icon:'📍', label:'State',       value:dest.state },
              { icon:'🗺️', label:'Coordinates', value:`${dest.lat?.toFixed(2)}°N, ${dest.lng?.toFixed(2)}°E` },
            ].map(r => (
              <div key={r.label} style={{ background:'#f8fafc', borderRadius:'10px', padding:'14px' }}>
                <div style={{ fontSize:'20px', marginBottom:'4px' }}>{r.icon}</div>
                <div style={{ fontSize:'11px', color:'#888', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:'2px' }}>{r.label}</div>
                <div style={{ fontWeight:'600', fontSize:'14px', color:'#1e3a5f' }}>{r.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Hotels nearby */}
        {hotels.length > 0 && (
          <div style={{ background:'#fff', borderRadius:'14px', padding:'20px', boxShadow:'0 2px 10px rgba(0,0,0,0.07)' }}>
            <h3 style={{ color:'#1e3a5f', margin:'0 0 14px', fontSize:'17px' }}>🏨 Hotels in {dest.name}</h3>
            <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
              {hotels.map(h => (
                <div key={h._id} onClick={() => navigate(`/hotels/${h._id}`)}
                  style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'14px', border:'1.5px solid #eee', borderRadius:'12px', cursor:'pointer', gap:'12px', flexWrap:'wrap', transition:'all 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor='#1e3a5f'; e.currentTarget.style.background='#f0f4f8' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor='#eee'; e.currentTarget.style.background='#fff' }}>
                  <div style={{ display:'flex', gap:'12px', alignItems:'center' }}>
                    <div style={{ fontSize:'28px' }}>🏨</div>
                    <div>
                      <div style={{ fontWeight:'600', fontSize:'14px', color:'#1e3a5f' }}>{h.name}</div>
                      <div style={{ fontSize:'12px', color:'#888', marginTop:'2px' }}>📍 {h.location}</div>
                      <div style={{ display:'flex', gap:'4px', marginTop:'4px' }}>
                        {h.amenities?.slice(0,3).map(a => <span key={a} style={{ background:'#ebf5fb', color:'#2980b9', fontSize:'10px', padding:'2px 7px', borderRadius:'6px' }}>{a}</span>)}
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontWeight:'700', fontSize:'18px', color:'#1e3a5f' }}>₹{h.price?.toLocaleString()}<span style={{ fontSize:'11px', color:'#888', fontWeight:'400' }}>/night</span></div>
                    <div style={{ fontSize:'11px', color:'#f39c12', marginTop:'2px' }}>⭐ {h.rating} · {h.category}</div>
                    <button onClick={e => { e.stopPropagation(); navigate(`/hotels/${h._id}#booking`) }} style={{ marginTop:'8px', padding:'6px 14px', background:'#1e3a5f', color:'#fff', border:'none', borderRadius:'8px', fontSize:'12px', fontWeight:'600', cursor:'pointer', fontFamily:'Poppins,sans-serif' }}>Book Now</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ display:'flex', gap:'12px', marginTop:'20px', flexWrap:'wrap' }}>
          <button onClick={() => navigate('/chatbot')} style={{ padding:'12px 24px', background:'linear-gradient(135deg,#1e3a5f,#2980b9)', color:'#fff', border:'none', borderRadius:'12px', fontSize:'14px', fontWeight:'700', cursor:'pointer', fontFamily:'Poppins,sans-serif' }}>
            🤖 Ask Travel Assistant
          </button>
          <button onClick={() => navigate('/hotels')} style={{ padding:'12px 24px', background:'#fff', color:'#1e3a5f', border:'2px solid #1e3a5f', borderRadius:'12px', fontSize:'14px', fontWeight:'700', cursor:'pointer', fontFamily:'Poppins,sans-serif' }}>
            🏨 Browse All Hotels
          </button>
        </div>
      </div>
    </div>
  )
}
