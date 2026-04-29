// PackingListPage.jsx - Feature 3: Smart Packing Checklist
import { useState } from 'react'
import Navbar from '../components/Navbar.jsx'

const PRESET_ITEMS = {
  'Essential Documents': ['Passport','Visa documents','Travel insurance','Hotel bookings printout','Flight tickets','Emergency contacts','Driving license','Vaccination certificate'],
  'Clothing':            ['T-shirts (5)','Pants/Jeans (3)','Underwear (7)','Socks (7)','Light jacket','Swimwear','Comfortable walking shoes','Sandals','Formal outfit','Rain jacket'],
  'Toiletries':          ['Toothbrush & paste','Shampoo','Body wash','Sunscreen SPF 50','Deodorant','Razor','Face wash','Moisturizer','Hand sanitizer','First aid kit'],
  'Electronics':         ['Phone charger','Power bank (10000mAh)','Universal adapter','Camera + memory card','Laptop + charger','Earphones/Headphones','Travel pillow'],
  'Health & Safety':     ['Prescription medicines','Pain relievers','Anti-diarrhea pills','Band-aids','Insect repellent','Face masks','Hand sanitizer'],
  'Comfort & Extras':    ['Travel pillow','Eye mask','Earplugs','Snacks','Reusable water bottle','Luggage lock','Dry bags','Small backpack'],
}

export default function PackingListPage() {
  const [checked,  setChecked]  = useState({})
  const [custom,   setCustom]   = useState('')
  const [extras,   setExtras]   = useState([])
  const [filter,   setFilter]   = useState('All')
  const [tripType, setTripType] = useState('Beach')

  const tripSuggestions = {
    Beach:     ['Sunscreen SPF 50','Swimwear','Sandals','Beach towel','Snorkeling gear','Flip flops'],
    Mountain:  ['Hiking boots','Warm jacket','Gloves','Thermal wear','Trekking poles','Rain poncho'],
    City:      ['Comfortable shoes','City map','Metro card','Formal outfit','Camera','Guidebook'],
    Business:  ['Formal suits','Laptop','Business cards','Presentation materials','Iron-free shirts'],
    Adventure: ['First aid kit','Water purifier tablets','Compass','Emergency whistle','Rope','Multitool'],
  }

  const allItems = { ...PRESET_ITEMS, 'My Extra Items': extras }
  const totalItems  = Object.values(allItems).flat().length
  const checkedCount = Object.values(checked).filter(Boolean).length
  const pct = totalItems > 0 ? Math.round((checkedCount / totalItems) * 100) : 0

  function toggle(key) {
    setChecked(p => ({ ...p, [key]: !p[key] }))
  }

  function addExtra(e) {
    e.preventDefault()
    if (!custom.trim()) return
    setExtras(p => [...p, custom.trim()])
    setCustom('')
  }

  function clearChecked() {
    setChecked({})
  }

  const categories = ['All', ...Object.keys(PRESET_ITEMS)]

  return (
    <div style={{ minHeight:'100vh', background:'#f0f4f8', fontFamily:'Poppins,sans-serif' }}>
      <Navbar />
      <div style={{ maxWidth:'900px', margin:'0 auto', padding:'30px 20px' }}>
        <h2 style={{ fontSize:'24px', fontWeight:'700', color:'#1e3a5f', marginBottom:'6px' }}>
          🎒 Packing Checklist
        </h2>
        <p style={{ color:'#888', marginBottom:'24px', fontSize:'14px' }}>
          Never forget anything on your trip again
        </p>

        {/* Progress bar */}
        <div style={{ background:'#fff', borderRadius:'14px', padding:'20px', marginBottom:'20px', boxShadow:'0 2px 10px rgba(0,0,0,0.07)' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'10px' }}>
            <div>
              <span style={{ fontWeight:'700', fontSize:'18px', color:'#1e3a5f' }}>{checkedCount}</span>
              <span style={{ color:'#888', fontSize:'14px' }}> / {totalItems} items packed</span>
            </div>
            <div style={{ display:'flex', gap:'10px', alignItems:'center' }}>
              <span style={{ fontWeight:'700', fontSize:'20px', color: pct===100?'#27ae60':pct>60?'#e67e22':'#1e3a5f' }}>{pct}%</span>
              <button onClick={clearChecked} style={{ padding:'6px 14px', background:'#ffeaea', color:'#e74c3c', border:'1px solid #f5c6c6', borderRadius:'8px', cursor:'pointer', fontSize:'12px', fontWeight:'600', fontFamily:'Poppins,sans-serif' }}>
                Reset All
              </button>
            </div>
          </div>
          <div style={{ height:'12px', background:'#f0f0f0', borderRadius:'6px', overflow:'hidden' }}>
            <div style={{ height:'100%', width:`${pct}%`, background: pct===100?'#27ae60':pct>60?'#e67e22':'#2980b9', borderRadius:'6px', transition:'width 0.4s' }} />
          </div>
          {pct === 100 && (
            <div style={{ textAlign:'center', marginTop:'12px', fontSize:'15px', color:'#27ae60', fontWeight:'700' }}>
              🎉 All packed! Have a great trip!
            </div>
          )}
        </div>

        {/* Trip type suggestions */}
        <div style={{ background:'#fff', borderRadius:'14px', padding:'20px', marginBottom:'20px', boxShadow:'0 2px 10px rgba(0,0,0,0.07)' }}>
          <h3 style={{ color:'#1e3a5f', margin:'0 0 12px', fontSize:'15px' }}>💡 Smart Suggestions by Trip Type</h3>
          <div style={{ display:'flex', gap:'8px', flexWrap:'wrap', marginBottom:'14px' }}>
            {Object.keys(tripSuggestions).map(type => (
              <button key={type} onClick={() => setTripType(type)} style={{
                padding:'7px 16px', borderRadius:'20px', border:'1.5px solid',
                borderColor: tripType===type ? '#1e3a5f' : '#ddd',
                background:  tripType===type ? '#1e3a5f' : '#fff',
                color:       tripType===type ? '#fff' : '#555',
                cursor:'pointer', fontSize:'13px', fontWeight:'500', fontFamily:'Poppins,sans-serif',
              }}>{type}</button>
            ))}
          </div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:'8px' }}>
            {tripSuggestions[tripType].map(item => (
              <div key={item} onClick={() => toggle('suggest_'+item)} style={{
                padding:'8px 14px', borderRadius:'20px', cursor:'pointer', fontSize:'13px',
                border:'1.5px solid', transition:'all 0.15s',
                borderColor: checked['suggest_'+item] ? '#27ae60' : '#ddd',
                background:  checked['suggest_'+item] ? '#eafaf1' : '#f8f9fa',
                color:       checked['suggest_'+item] ? '#27ae60' : '#555',
                textDecoration: checked['suggest_'+item] ? 'line-through' : 'none',
              }}>
                {checked['suggest_'+item] ? '✅' : '○'} {item}
              </div>
            ))}
          </div>
        </div>

        {/* Category filter */}
        <div style={{ display:'flex', gap:'8px', flexWrap:'wrap', marginBottom:'16px' }}>
          {categories.map(c => (
            <button key={c} onClick={() => setFilter(c)} style={{
              padding:'6px 14px', borderRadius:'20px', border:'1.5px solid',
              borderColor: filter===c ? '#1e3a5f' : '#ddd',
              background:  filter===c ? '#1e3a5f' : '#fff',
              color:       filter===c ? '#fff' : '#555',
              cursor:'pointer', fontSize:'12px', fontWeight:'500', fontFamily:'Poppins,sans-serif',
            }}>{c}</button>
          ))}
        </div>

        {/* Items grid */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:'16px', marginBottom:'20px' }}>
          {Object.entries(allItems)
            .filter(([cat]) => filter === 'All' || cat === filter)
            .map(([category, items]) => {
              const catChecked = items.filter(item => checked[category+item]).length
              return (
                <div key={category} style={{ background:'#fff', borderRadius:'14px', padding:'18px', boxShadow:'0 2px 10px rgba(0,0,0,0.07)' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'12px' }}>
                    <h3 style={{ color:'#1e3a5f', fontSize:'14px', fontWeight:'700', margin:0 }}>{category}</h3>
                    <span style={{ fontSize:'12px', color:'#888' }}>{catChecked}/{items.length}</span>
                  </div>
                  {items.map(item => {
                    const key     = category + item
                    const isDone  = checked[key]
                    return (
                      <div key={item} onClick={() => toggle(key)} style={{
                        display:'flex', alignItems:'center', gap:'10px',
                        padding:'9px 0', borderBottom:'1px solid #f5f5f5', cursor:'pointer',
                      }}>
                        <div style={{
                          width:'20px', height:'20px', borderRadius:'5px', flexShrink:0,
                          border:'1.5px solid', borderColor: isDone ? '#27ae60' : '#ddd',
                          background: isDone ? '#27ae60' : '#fff',
                          display:'flex', alignItems:'center', justifyContent:'center',
                          transition:'all 0.15s',
                        }}>
                          {isDone && <span style={{ color:'#fff', fontSize:'12px', fontWeight:'700' }}>✓</span>}
                        </div>
                        <span style={{
                          fontSize:'13px', color: isDone ? '#aaa' : '#333',
                          textDecoration: isDone ? 'line-through' : 'none',
                          transition:'all 0.15s',
                        }}>{item}</span>
                      </div>
                    )
                  })}
                </div>
              )
            })
          }
        </div>

        {/* Add custom item */}
        <div style={{ background:'#fff', borderRadius:'14px', padding:'20px', boxShadow:'0 2px 10px rgba(0,0,0,0.07)' }}>
          <h3 style={{ color:'#1e3a5f', margin:'0 0 12px', fontSize:'15px' }}>➕ Add Custom Item</h3>
          <form onSubmit={addExtra} style={{ display:'flex', gap:'10px' }}>
            <input
              style={{ flex:1, padding:'11px 14px', border:'1.5px solid #ddd', borderRadius:'10px', fontSize:'14px', outline:'none', fontFamily:'Poppins,sans-serif' }}
              placeholder="e.g. Snorkel mask, Travel journal..."
              value={custom}
              onChange={e => setCustom(e.target.value)}
            />
            <button type="submit" style={{ padding:'11px 20px', background:'#1e3a5f', color:'#fff', border:'none', borderRadius:'10px', fontSize:'14px', fontWeight:'600', cursor:'pointer', fontFamily:'Poppins,sans-serif' }}>
              Add
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
