import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'

const DESTINATIONS = ['Goa', 'Manali', 'Jaipur', 'Munnar', 'Agra', 'Udaipur', 'Rishikesh', 'Ooty', 'Leh Ladakh', 'Varanasi', 'Kolkata', 'Puri']

const LOCAL_HELP = {
  Goa: { hospital:'Goa Medical College, Bambolim', police:'Goa Police Control Room', embassy:'Consular help via your national embassy in New Delhi', tip:'Use licensed taxis at night and avoid isolated beach stretches after dark.' },
  Manali: { hospital:'Civil Hospital Manali', police:'Manali Police Station', embassy:'Consular help via your national embassy in New Delhi', tip:'Check road and weather alerts before Rohtang/Solang routes.' },
  Jaipur: { hospital:'SMS Hospital Jaipur', police:'Tourist Police Station Jaipur', embassy:'Consular help via your national embassy in New Delhi', tip:'Keep valuables close in crowded markets and use registered guides.' },
  Munnar: { hospital:'Tata General Hospital Munnar', police:'Munnar Police Station', embassy:'Consular help via your national embassy in New Delhi', tip:'Avoid waterfall edges during monsoon and confirm hill-road conditions.' },
  Agra: { hospital:'SN Medical College Agra', police:'Tourist Police Agra', embassy:'Consular help via your national embassy in New Delhi', tip:'Use official ticket counters and be careful around touts near monuments.' },
  Udaipur: { hospital:'Maharana Bhupal Government Hospital', police:'Udaipur Tourist Police', embassy:'Consular help via your national embassy in New Delhi', tip:'Book lake activities through verified operators only.' },
  Rishikesh: { hospital:'Government Hospital Rishikesh', police:'Rishikesh Police Station', embassy:'Consular help via your national embassy in New Delhi', tip:'Raft only with certified operators and wear safety gear.' },
  Ooty: { hospital:'Government Headquarters Hospital Ooty', police:'Ooty Police Station', embassy:'Consular help via your national embassy in New Delhi', tip:'Hill roads can be foggy; avoid late-night self-driving.' },
  'Leh Ladakh': { hospital:'SNM Hospital Leh', police:'Leh Police Station', embassy:'Consular help via your national embassy in New Delhi', tip:'Acclimatize for 24-48 hours and watch for altitude sickness.' },
  Varanasi: { hospital:'Sir Sunderlal Hospital BHU', police:'Varanasi Tourist Police', embassy:'Consular help via your national embassy in New Delhi', tip:'Use boats with life jackets and avoid overcrowded ghats during festivals.' },
  Kolkata: { hospital:'SSKM Hospital Kolkata', police:'Kolkata Police Control Room', embassy:'Consular help via your national embassy in New Delhi', tip:'Use app taxis late at night and plan extra time during festivals.' },
  Puri: { hospital:'District Headquarters Hospital Puri', police:'Puri Sea Beach Police Station', embassy:'Consular help via your national embassy in New Delhi', tip:'Swim only in marked zones and follow lifeguard flags.' },
}

const NUMBERS = [
  ['National Emergency', '112'],
  ['Ambulance', '108'],
  ['Police', '100'],
  ['Fire', '101'],
  ['Women Helpline', '1091'],
  ['Tourist Helpline', '1363'],
]

export default function EmergencyHelpPage() {
  const [params] = useSearchParams()
  const initial = params.get('destination') || 'Goa'
  const [destination, setDestination] = useState(DESTINATIONS.includes(initial) ? initial : 'Goa')
  const info = useMemo(() => LOCAL_HELP[destination] || LOCAL_HELP.Goa, [destination])

  return (
    <div style={{ minHeight:'100vh', background:'#f0f4f8', fontFamily:'Poppins,sans-serif' }}>
      <Navbar />
      <div style={{ maxWidth:'980px', margin:'0 auto', padding:'28px 20px' }}>
        <div style={{ background:'linear-gradient(135deg,#c0392b,#e74c3c)', color:'#fff', borderRadius:'16px', padding:'24px', marginBottom:'18px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', gap:'14px', flexWrap:'wrap', alignItems:'center' }}>
            <div>
              <h2 style={{ margin:'0 0 6px', fontSize:'24px' }}>Emergency Travel Help</h2>
              <p style={{ margin:0, opacity:.9, fontSize:'13px' }}>SOS contacts, local help points, and destination safety tips.</p>
            </div>
            <a href="tel:112" style={{ background:'#fff', color:'#c0392b', padding:'13px 20px', borderRadius:'12px', textDecoration:'none', fontWeight:'900' }}>SOS 112</a>
          </div>
        </div>

        <div style={{ display:'flex', gap:'10px', alignItems:'center', marginBottom:'16px', flexWrap:'wrap' }}>
          <label style={{ color:'#1e3a5f', fontWeight:'800', fontSize:'13px' }}>Destination</label>
          <select value={destination} onChange={e => setDestination(e.target.value)} style={input}>
            {DESTINATIONS.map(d => <option key={d}>{d}</option>)}
          </select>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(210px,1fr))', gap:'14px', marginBottom:'16px' }}>
          {NUMBERS.map(([label, number]) => (
            <a key={label} href={`tel:${number}`} style={numberCard}>
              <span style={{ color:'#64748b', fontSize:'11px', fontWeight:'800', textTransform:'uppercase' }}>{label}</span>
              <strong style={{ color:'#1e3a5f', fontSize:'22px' }}>{number}</strong>
            </a>
          ))}
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))', gap:'16px' }}>
          <InfoCard title="Nearby Hospital" value={info.hospital} detail="Go here for urgent medical care, injury, dehydration, food poisoning, or altitude symptoms." />
          <InfoCard title="Police Help" value={info.police} detail="Contact for lost items, harassment, unsafe transport, scams, or route safety." />
          <InfoCard title="Embassy / Consular Help" value={info.embassy} detail="For passport loss, legal emergencies, or foreign citizen assistance." />
          <InfoCard title="Safety Tip" value={info.tip} detail="Share your live location with a trusted contact before remote sightseeing." />
        </div>

        <div style={{ ...panel, marginTop:'16px' }}>
          <h3 style={title}>Quick Safety Checklist</h3>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:'10px' }}>
            {['Keep ID proof and hotel address offline', 'Save cab/driver details before starting', 'Carry basic medicine and water', 'Avoid isolated places late at night', 'Check weather alerts before outdoor trips', 'Use official booking counters and verified operators'].map(item => (
              <div key={item} style={{ background:'#f8fafc', border:'1px solid #edf2f7', borderRadius:'10px', padding:'10px', color:'#475569', fontSize:'12px', fontWeight:'700' }}>{item}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function InfoCard({ title, value, detail }) {
  return (
    <div style={panel}>
      <div style={{ color:'#888', fontSize:'11px', fontWeight:'800', textTransform:'uppercase', marginBottom:'6px' }}>{title}</div>
      <div style={{ color:'#1e3a5f', fontSize:'16px', fontWeight:'900', marginBottom:'8px' }}>{value}</div>
      <p style={{ color:'#64748b', fontSize:'12px', lineHeight:'1.6', margin:0 }}>{detail}</p>
    </div>
  )
}

const input = { padding:'10px 12px', border:'1px solid #d8e2ec', borderRadius:'9px', minWidth:'220px', fontFamily:'Poppins,sans-serif', color:'#1e3a5f', fontWeight:'800' }
const panel = { background:'#fff', borderRadius:'14px', padding:'18px', boxShadow:'0 2px 10px rgba(0,0,0,0.07)' }
const title = { margin:'0 0 12px', color:'#1e3a5f', fontSize:'16px' }
const numberCard = { background:'#fff', borderRadius:'14px', padding:'16px', boxShadow:'0 2px 10px rgba(0,0,0,0.07)', textDecoration:'none', display:'flex', flexDirection:'column', gap:'5px' }
