import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'

import { API } from '../config.js'
const GEOCODE_URL = 'https://geocoding-api.open-meteo.com/v1/search'
const WEATHER_URL = 'https://api.open-meteo.com/v1/forecast'

const INDIA_PLACES = [
  { name:'Goa', state:'Goa', lat:15.2993, lng:74.1240 },
  { name:'Manali', state:'Himachal Pradesh', lat:32.2396, lng:77.1887 },
  { name:'Jaipur', state:'Rajasthan', lat:26.9124, lng:75.7873 },
  { name:'Munnar', state:'Kerala', lat:10.0889, lng:77.0595 },
  { name:'Darjeeling', state:'West Bengal', lat:27.0360, lng:88.2627 },
  { name:'Shillong', state:'Meghalaya', lat:25.5788, lng:91.8933 },
  { name:'Agra', state:'Uttar Pradesh', lat:27.1767, lng:78.0081 },
  { name:'Udaipur', state:'Rajasthan', lat:24.5854, lng:73.7125 },
  { name:'Jaisalmer', state:'Rajasthan', lat:26.9157, lng:70.9083 },
  { name:'Varanasi', state:'Uttar Pradesh', lat:25.3176, lng:82.9739 },
  { name:'Rishikesh', state:'Uttarakhand', lat:30.0869, lng:78.2676 },
  { name:'Ooty', state:'Tamil Nadu', lat:11.4102, lng:76.8950 },
  { name:'Leh Ladakh', state:'Ladakh', lat:34.1526, lng:77.5770 },
]

const WEATHER_CODES = {
  0:'Sunny', 1:'Mostly sunny', 2:'Cloudy', 3:'Cloudy',
  45:'Foggy', 48:'Foggy', 51:'Rainy', 53:'Rainy', 55:'Rainy',
  61:'Rainy', 63:'Rainy', 65:'Heavy rain', 71:'Winter', 73:'Winter', 75:'Winter',
  80:'Rainy', 81:'Rainy', 82:'Heavy rain', 95:'Stormy', 96:'Stormy',
}

const WMO_ICONS = {
  0:'Sunny', 1:'Mostly sunny', 2:'Partly cloudy', 3:'Cloudy',
  45:'Fog', 48:'Fog', 51:'Drizzle', 53:'Drizzle', 55:'Heavy drizzle',
  61:'Light rain', 63:'Rain', 65:'Heavy rain', 71:'Light snow', 73:'Snow', 75:'Heavy snow',
  80:'Showers', 81:'Showers', 82:'Heavy showers', 95:'Storm', 96:'Storm',
}

const TRIP_ATTRACTIONS = {
  Goa: ['Baga Beach', 'Old Goa Churches', 'Dudhsagar Falls', 'Anjuna Market', 'Fort Aguada'],
  Manali: ['Hadimba Temple', 'Solang Valley', 'Rohtang Pass', 'Old Manali', 'Vashisht Hot Springs'],
  Jaipur: ['Amer Fort', 'Hawa Mahal', 'City Palace', 'Jantar Mantar', 'Bapu Bazaar'],
  Munnar: ['Tea Museum', 'Eravikulam National Park', 'Mattupetty Dam', 'Anamudi Peak', 'Echo Point'],
  Darjeeling: ['Tiger Hill', 'Tea Garden Tours', 'Toy Train', 'Batasia Loop', 'Peace Pagoda'],
  Shillong: ['Elephant Falls', 'Shillong Peak', 'Ward Lake', 'Police Bazaar', 'Living Root Bridge'],
  Agra: ['Taj Mahal', 'Agra Fort', 'Mehtab Bagh', 'Fatehpur Sikri', 'Sadar Bazaar'],
  Udaipur: ['City Palace', 'Lake Pichola', 'Jag Mandir', 'Sajjangarh Palace', 'Bagore Ki Haveli'],
  Jaisalmer: ['Jaisalmer Fort', 'Sam Sand Dunes', 'Patwon Ki Haveli', 'Gadisar Lake', 'Camel Safari'],
  Varanasi: ['Ganga Aarti', 'Kashi Vishwanath Temple', 'Sarnath', 'Assi Ghat', 'Banaras Food Walk'],
  Rishikesh: ['Laxman Jhula', 'River Rafting', 'Beatles Ashram', 'Triveni Ghat', 'Neer Garh Waterfall'],
  Ooty: ['Ooty Lake', 'Botanical Gardens', 'Doddabetta Peak', 'Toy Train', 'Rose Garden'],
  'Leh Ladakh': ['Pangong Lake', 'Nubra Valley', 'Hemis Monastery', 'Magnetic Hill', 'Leh Palace'],
}

function parseAiTripIntent(text) {
  const cleaned = text.toLowerCase()
  if (!/\b(plan|plain|create|make|suggest)\b/.test(cleaned) || !/\b(trip|itinerary|travel|tour|holiday|vacation)\b/.test(cleaned)) return null

  const known = INDIA_PLACES.find(p => cleaned.includes(p.name.toLowerCase()))
  const destination = known?.name || 'Goa'
  const daysMatch =
    cleaned.match(/(\d+)\s*[- ]?\s*(?:day|days|d)\b/) ||
    cleaned.match(/(?:for|of)\s*(\d+)\s*(?:day|days|d)\b/) ||
    cleaned.match(/\b(\d+)\s*(?:day|days)\s*(?:plan|plain|trip|itinerary)\b/)
  const budgetMatch = cleaned.match(/(?:under|below|budget|within|rs|₹)\s*(?:rs\.?|₹)?\s*([0-9,]+)/i) || cleaned.match(/([0-9,]+)\s*(?:rs|₹|rupees)/i)
  const peopleMatch = cleaned.match(/(\d+)\s*(?:people|persons|travellers|travelers|friends)/i)

  const parsedDays = Number(daysMatch?.[1])
  const parsedBudget = Number((budgetMatch?.[1] || '20000').replace(/,/g, ''))

  return {
    destination,
    days: Number.isFinite(parsedDays) && parsedDays > 0 ? Math.max(1, Math.min(10, parsedDays)) : 5,
    budget: Number.isFinite(parsedBudget) && parsedBudget > 0 ? parsedBudget : 20000,
    people: Math.max(1, Number(peopleMatch?.[1] || 1)),
  }
}

function makeAiTripPlan({ destination, days, budget, people }) {
  const place = INDIA_PLACES.find(p => p.name.toLowerCase() === destination.toLowerCase()) || INDIA_PLACES[0]
  const attractions = TRIP_ATTRACTIONS[place.name] || ['Local market', 'Main viewpoint', 'Heritage walk', 'Food street', 'Nature stop']
  const perPersonBudget = Math.round(budget / people)
  const nights = Math.max(1, days - 1)
  const targetPerPerson = Math.max(1500, Math.floor(perPersonBudget * 0.96))
  const stayTotalPerPerson = Math.round(targetPerPerson * 0.30)
  const foodTotalPerPerson = Math.round(targetPerPerson * 0.22)
  const localTotalPerPerson = Math.round(targetPerPerson * 0.16)
  const activitiesTotal = Math.round(targetPerPerson * 0.12)
  const transportTotal = Math.max(0, targetPerPerson - stayTotalPerPerson - foodTotalPerPerson - localTotalPerPerson - activitiesTotal)
  const hotelPerNight = Math.max(500, Math.round(stayTotalPerPerson / nights))
  const foodPerDay = Math.max(250, Math.round(foodTotalPerPerson / days))
  const localPerDay = Math.max(180, Math.round(localTotalPerPerson / days))
  const totalEstimate = Math.min(budget, (stayTotalPerPerson + foodTotalPerPerson + localTotalPerPerson + activitiesTotal + transportTotal) * people)

  const itinerary = Array.from({ length: days }, (_, index) => {
    const a = attractions[index % attractions.length]
    const b = attractions[(index + 1) % attractions.length]
    const c = attractions[(index + 2) % attractions.length]
    return {
      day: index + 1,
      title: index === 0 ? `Arrive in ${place.name}` : index === days - 1 ? `Easy final day in ${place.name}` : `${a} and nearby sights`,
      morning: index === 0 ? 'Arrival, hotel check-in, light breakfast' : `Visit ${a}`,
      afternoon: `Explore ${b} with lunch nearby`,
      evening: index === days - 1 ? 'Shopping, packing, departure buffer' : `${c}, sunset point, local dinner`,
    }
  })

  return {
    destination: place.name,
    state: place.state,
    days,
    people,
    budget,
    totalEstimate,
    places: attractions.slice(0, 6),
    hotels: [
      { name:`${place.name} Budget Stay`, type:'Budget', price:hotelPerNight, note:'Best fit for keeping the trip under budget.' },
      { name:`${place.name} Comfort Inn`, type:'Standard', price:Math.round(hotelPerNight * 1.45), note:'Better comfort if you can stretch the budget.' },
      { name:`${place.name} View Resort`, type:'Premium', price:Math.round(hotelPerNight * 2.2), note:'Good for couples or relaxed trips.' },
    ],
    transport: [
      { mode:'Train/Bus', price:Math.round(transportTotal * 0.55), note:'Cheapest option, add more time buffer.' },
      { mode:'Flight + Cab', price:transportTotal, note:'Fastest option for long-distance travel.' },
      { mode:'Self-drive/Cab', price:Math.round(transportTotal * 1.25), note:'Best for groups and flexible sightseeing.' },
    ],
    budgetBreakdown: [
      ['Stay', stayTotalPerPerson * people],
      ['Food', foodTotalPerPerson * people],
      ['Local travel', localTotalPerPerson * people],
      ['Activities', activitiesTotal * people],
      ['Main transport', transportTotal * people],
    ],
    itinerary,
  }
}

function parseTodayVisitIntent(text) {
  const cleaned = text.toLowerCase()
  if (!/\b(visit|see|explore|do|go)\b/.test(cleaned) || !/\b(today|now|this day)\b/.test(cleaned)) return null
  const known = INDIA_PLACES.find(p => cleaned.includes(p.name.toLowerCase()))
  return known?.name || 'Goa'
}

function makeTodayVisitPlan(destination) {
  const place = INDIA_PLACES.find(p => p.name.toLowerCase() === destination.toLowerCase()) || INDIA_PLACES[0]
  const attractions = TRIP_ATTRACTIONS[place.name] || ['Main market', 'Popular viewpoint', 'Local food street', 'Heritage walk']
  return {
    destination: place.name,
    state: place.state,
    morning: attractions[0],
    afternoon: attractions[1],
    evening: attractions[2],
    backup: attractions[3] || attractions[0],
    tip: place.name === 'Manali'
      ? 'Start early for valley routes and keep a jacket even in pleasant weather.'
      : place.name === 'Goa'
        ? 'Keep beach time for morning or sunset and avoid isolated stretches late at night.'
        : 'Start with outdoor places early, keep markets for evening, and check local weather before leaving.',
  }
}

function weatherMood(code, temp) {
  if ([51,53,55,61,63,65,80,81,82,95,96].includes(code)) return { label:'Rainy', icon:'Rain', color:'#2980b9', bg:'#ebf5fb' }
  if ([71,73,75].includes(code) || temp <= 15) return { label:'Winter/Cool', icon:'Cold', color:'#5dade2', bg:'#eaf2ff' }
  if ([0,1].includes(code) || temp >= 28) return { label:'Sunny', icon:'Sun', color:'#e67e22', bg:'#fff3cd' }
  return { label: WEATHER_CODES[code] || 'Pleasant', icon:'Cloud', color:'#64748b', bg:'#f1f5f9' }
}

export default function ChatbotPage() {
  const navigate = useNavigate()
  const [messages, setMessages] = useState([
    { role:'bot', text:"👋 Hi! I'm your Travel Assistant!\n\nI can help you find:\n• Best destinations by season (summer/winter/monsoon)\n• Beach, mountain, heritage, wildlife places\n• Budget & luxury hotels across India\n• Travel tips and advice\n\nWhat kind of trip are you planning? 🌍", results:null }
  ])
  const [input,   setInput]   = useState('')
  const [weatherTerm, setWeatherTerm] = useState('')
  const [loading, setLoading] = useState(false)
  const [listening, setListening] = useState(false)
  const [voiceMode, setVoiceMode] = useState(false)
  const [voiceSupported, setVoiceSupported] = useState(false)
  const [voiceStatus, setVoiceStatus] = useState('Checking voice support...')
  const bottomRef = useRef(null)
  const recognitionRef = useRef(null)
  const lastSpokenRef = useRef(0)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:'smooth' }) }, [messages])

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    setVoiceSupported(Boolean(SpeechRecognition))
    if (!SpeechRecognition) {
      setVoiceStatus('Voice input is not supported in this browser. Use Chrome or Edge, or type your question.')
      return
    }
    setVoiceStatus('Voice mode ready. Press Speak Question and allow microphone access.')

    const recognition = new SpeechRecognition()
    recognition.lang = 'en-IN'
    recognition.interimResults = false
    recognition.continuous = false
    recognition.maxAlternatives = 1
    recognition.onstart = () => {
      setListening(true)
      setVoiceStatus('Listening now. Speak clearly, for example: What should I visit today in Manali?')
    }
    recognition.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript?.trim()
      setListening(false)
      if (transcript) {
        setVoiceStatus(`Heard: "${transcript}"`)
        setVoiceMode(true)
        setInput(transcript)
        sendMessage(transcript)
      } else {
        setVoiceStatus('I could not hear anything. Try again or type your question.')
      }
    }
    recognition.onerror = (event) => {
      setListening(false)
      const messageByError = {
        'not-allowed': 'Microphone permission was blocked. Allow mic access in the browser and try again.',
        'service-not-allowed': 'Speech recognition service is blocked. Try Chrome or Edge on localhost.',
        'no-speech': 'No speech detected. Press Speak Question and try again.',
        network: 'Speech recognition needs browser speech service access. Check internet/browser permissions.',
        aborted: 'Voice input stopped.',
      }
      setVoiceStatus(messageByError[event.error] || `Voice input error: ${event.error || 'unknown error'}`)
    }
    recognition.onend = () => setListening(false)
    recognitionRef.current = recognition

    return () => {
      try { recognition.stop() } catch {}
    }
  }, [])

  useEffect(() => {
    if (!voiceMode || !window.speechSynthesis) return
    const lastIndex = messages.length - 1
    const last = messages[lastIndex]
    if (!last || last.role !== 'bot' || lastIndex <= lastSpokenRef.current) return
    lastSpokenRef.current = lastIndex
    speak(last.text)
  }, [messages, voiceMode])


  const QUICK = [
    'Plan a 5-day trip to Manali under Rs 20000',
    '🌊 Beach destinations in summer',
    '❄️ Best places in winter',
    '🏔️ Hill stations to visit',
    '🐯 Wildlife safari places',
    '🏰 Heritage sites in Rajasthan',
    'I want to go Jaipur',
    'Jaipur weather forecast',
    '💰 Budget travel in India',
    '⛩️ Pilgrimage destinations',
    '🌧️ Monsoon travel places',
  ]

  function extractWeatherCity(text) {
    const cleaned = text.toLowerCase().replace(/[?.!,]/g, ' ')
    const known = INDIA_PLACES.find(p => cleaned.includes(p.name.toLowerCase()))
    if (known) return known.name

    const patterns = [
      /weather\s+(?:forecast\s*)?(?:in|for|at)?\s*([a-z ]+)/i,
      /forecast\s+(?:weather\s*)?(?:in|for|at)?\s*([a-z ]+)/i,
      /(?:in|for|at)\s+([a-z ]+)\s+(?:weather|forecast)/i,
      /(?:weather|forecast)\s*[:\-]?\s*([a-z ]+)/i,
    ]
    for (const pattern of patterns) {
      const match = text.match(pattern)
      if (match?.[1]) return match[1].replace(/\b(today|tomorrow|india|please)\b/gi, '').trim()
    }
    return ''
  }

  function findPlaceName(text) {
    const cleaned = text.toLowerCase().replace(/[?.!,]/g, ' ')
    const known = INDIA_PLACES.find(p => cleaned.includes(p.name.toLowerCase()))
    if (known) return known.name

    const patterns = [
      /(?:to|in)\s+([a-z ]+)/i,
      /(?:book|reserve|stay|hotel|flight|ticket)\s+([a-z ]+)/i,
      /(?:travel|go)\s+to\s+([a-z ]+)/i,
    ]
    for (const pattern of patterns) {
      const match = text.match(pattern)
      if (match?.[1]) {
        const guess = match[1].replace(/\b(today|tomorrow|please|book|booking|flight|hotel|stay|room|ticket)\b/gi, '').trim()
        if (guess) return guess.charAt(0).toUpperCase() + guess.slice(1)
      }
    }
    return ''
  }

  function parseBookingIntent(text) {
    const cleaned = text.toLowerCase()
    if (!/\b(book|booking|reserve|flight|hotel|stay|room|ticket|train|bus|coach|rail)\b/.test(cleaned)) return null

    const destination = findPlaceName(text)
    if (!destination) return null

    const explicitHotel = /\b(hotel|stay|room|accommodation)\b/.test(cleaned)
    const explicitTransport = /\b(flight|ticket|train|rail|bus|coach)\b/.test(cleaned)
    const mode = explicitTransport
      ? /\b(train|rail)\b/.test(cleaned)
        ? 'Train'
        : /\b(bus|coach)\b/.test(cleaned)
          ? 'Bus'
          : 'Flight'
      : null

    const type = explicitHotel && !explicitTransport
      ? 'hotel'
      : explicitTransport && !explicitHotel
        ? 'transport'
        : 'hotel'

    return {
      type,
      mode: type === 'transport' ? mode || 'Flight' : null,
      destination,
    }
  }

  async function fetchIndiaWeather(placeName) {
    let place = INDIA_PLACES.find(p => p.name.toLowerCase() === placeName.toLowerCase())

    if (!place) {
      const geoRes = await fetch(`${GEOCODE_URL}?name=${encodeURIComponent(placeName)}&count=1&countryCode=IN`)
      const geoData = await geoRes.json()
      if (!geoData.results?.length) throw new Error('India place not found')
      const found = geoData.results[0]
      place = { name:found.name, state:found.admin1 || 'India', lat:found.latitude, lng:found.longitude }
    }

    const res = await fetch(
      `${WEATHER_URL}?latitude=${place.lat}&longitude=${place.lng}` +
      `&current=temperature_2m,relative_humidity_2m,weather_code,precipitation,wind_speed_10m` +
      `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum` +
      `&timezone=auto&forecast_days=7`
    )
    const data = await res.json()
    return { ...data, place }
  }

  function weatherReply(data) {
    const cur = data.current || {}
    const label = WMO_ICONS[cur.weather_code] || WEATHER_CODES[cur.weather_code] || 'Weather'
    return `India Weather Forecast for ${data.place.name}, ${data.place.state}\n\nCurrent: ${Math.round(cur.temperature_2m)} C, ${label}\nHumidity: ${cur.relative_humidity_2m}% | Wind: ${Math.round(cur.wind_speed_10m || 0)} km/h | Rain: ${cur.precipitation || 0} mm\n\n7-day forecast is shown below.`
  }

  function speak(text) {
    if (!window.speechSynthesis || !text) return
    window.speechSynthesis.cancel()
    const cleanText = String(text)
      .replace(/[₹•*_#`]/g, '')
      .replace(/\n+/g, '. ')
      .slice(0, 700)
    const utterance = new SpeechSynthesisUtterance(cleanText)
    utterance.lang = 'en-IN'
    utterance.rate = 0.95
    window.speechSynthesis.speak(utterance)
  }

  function startVoiceInput() {
    if (!voiceSupported || !recognitionRef.current) {
      const message = 'Voice input is not supported in this browser. Try Chrome or Edge, or type your question.'
      setVoiceStatus(message)
      setMessages(p => [...p, { role:'bot', text:message, results:null }])
      return
    }
    try {
      window.speechSynthesis?.cancel()
      recognitionRef.current.stop()
      setVoiceMode(true)
      setVoiceStatus('Starting microphone...')
      setTimeout(() => recognitionRef.current?.start(), 120)
    } catch (err) {
      setListening(false)
      setVoiceStatus('Could not start voice input. Allow microphone permission and try again.')
    }
  }

  async function sendWeatherMessage(placeName) {
    const city = placeName.trim()
    if (!city) return
    setWeatherTerm('')
    setInput('')
    setMessages(p => [...p, { role:'user', text:`Weather forecast for ${city}` }])
    setLoading(true)
    try {
      const weather = await fetchIndiaWeather(city)
      setMessages(p => [...p, { role:'bot', text:weatherReply(weather), results:{ weather } }])
    } catch {
      setMessages(p => [...p, { role:'bot', text:'I could not load that India weather forecast right now. Try Jaipur, Goa, Manali, Delhi, or another Indian city.', results:null }])
    } finally {
      setLoading(false)
    }
  }

  async function sendMessage(text) {
    const msg = text || input.trim()
    if (!msg) return

    const todayDestination = parseTodayVisitIntent(msg)
    if (todayDestination) {
      const plan = makeTodayVisitPlan(todayDestination)
      setInput('')
      setMessages(p => [
        ...p,
        { role:'user', text:msg },
        {
          role:'bot',
          text:`Today in ${plan.destination}, ${plan.state}, I suggest:\n\nMorning: Visit ${plan.morning}\nAfternoon: Explore ${plan.afternoon} and have lunch nearby\nEvening: Go to ${plan.evening}\nBackup option: ${plan.backup}\n\nTip: ${plan.tip}`,
          results:{ todayVisitPlan:plan },
        },
      ])
      return
    }

    const aiTripIntent = parseAiTripIntent(msg)
    if (aiTripIntent) {
      const plan = makeAiTripPlan(aiTripIntent)
      setInput('')
      setMessages(p => [
        ...p,
        { role:'user', text:msg },
        {
          role:'bot',
          text:`Here is a smart ${plan.days}-day ${plan.destination} trip plan for ${plan.people} traveler${plan.people > 1 ? 's' : ''} under Rs ${plan.budget.toLocaleString()}.\n\nEstimated total: Rs ${plan.totalEstimate.toLocaleString()}\nIt includes itinerary, budget split, hotel options, transport choices, and places to visit.`,
          results:{ aiTripPlan:plan },
        },
      ])
      return
    }

    const bookingIntent = parseBookingIntent(msg)
    if (bookingIntent) {
      setInput('')
      setMessages(p => [...p, { role:'user', text:msg }])
      if (bookingIntent.type === 'hotel') {
        navigate(`/hotels?search=${encodeURIComponent(bookingIntent.destination)}`)
      } else {
        navigate(`/transport?mode=${bookingIntent.mode || 'Flight'}&destination=${encodeURIComponent(bookingIntent.destination)}`)
      }
      return
    }

    const wantsWeather = /weather|forecast|temperature|rain|rainy|climate/i.test(msg)
    let cityForWeather = extractWeatherCity(msg)
    if (!cityForWeather && wantsWeather && /\bindia\b/i.test(msg)) {
      cityForWeather = 'Goa'
    }
    if (wantsWeather && cityForWeather) {
      await sendWeatherMessage(cityForWeather)
      return
    }
    if (wantsWeather && !cityForWeather) {
      setInput('')
      setMessages(p => [...p, { role:'user', text:msg }])
      setMessages(p => [...p, { role:'bot', text:'Please tell me the Indian city for weather forecast. For example: "Jaipur weather forecast" or "Weather in Goa".', results:null }])
      return
    }
    setInput('')
    setMessages(p => [...p, { role:'user', text:msg }])
    setLoading(true)
    try {
      const res  = await fetch(`${API}/chatbot`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ message:msg }) })
      const data = await res.json()
      setMessages(p => [...p, { role:'bot', text:data.reply, results:data.results }])
    } catch {
      setMessages(p => [...p, { role:'bot', text:'Sorry, I could not connect. Make sure the backend is running!', results:null }])
    } finally { setLoading(false) }
  }

  return (
    <div style={{ minHeight:'100vh', background:'#f0f4f8', fontFamily:'Poppins,sans-serif' }}>
      <Navbar />
      <div style={{ maxWidth:'900px', margin:'0 auto', padding:'20px', height:'calc(100vh - 60px)', display:'flex', flexDirection:'column' }}>

        <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'16px' }}>
          <div style={{ width:'48px', height:'48px', borderRadius:'50%', background:'linear-gradient(135deg,#1e3a5f,#2980b9)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'24px' }}>🤖</div>
          <div>
            <h2 style={{ margin:0, fontSize:'20px', fontWeight:'700', color:'#1e3a5f' }}>Travel Assistant</h2>
            <p style={{ margin:0, fontSize:'13px', color:'#27ae60', fontWeight:'600' }}>● Online · Powered by AI</p>
          </div>
        </div>

        <div style={{ display:'flex', gap:'8px', alignItems:'center', marginBottom:'12px', flexWrap:'wrap' }}>
          <button
            type="button"
            onClick={startVoiceInput}
            disabled={loading || listening}
            style={{ padding:'10px 14px', background:listening?'#c0392b':'#1e3a5f', color:'#fff', border:'none', borderRadius:'10px', fontSize:'13px', fontWeight:'800', cursor:loading?'not-allowed':'pointer', fontFamily:'Poppins,sans-serif' }}
          >
            {listening ? 'Listening...' : 'Speak Question'}
          </button>
          <button
            type="button"
            onClick={() => setVoiceMode(v => !v)}
            style={{ padding:'10px 14px', background:voiceMode?'#e8f8f5':'#fff', color:voiceMode?'#1e8449':'#1e3a5f', border:'1px solid #d8e2ec', borderRadius:'10px', fontSize:'13px', fontWeight:'800', cursor:'pointer', fontFamily:'Poppins,sans-serif' }}
          >
            {voiceMode ? 'Voice Reply On' : 'Voice Reply Off'}
          </button>
          <span style={{ color:listening?'#c0392b':'#64748b', fontSize:'12px', fontWeight:'700' }}>
            {voiceStatus}
          </span>
        </div>

        <div style={{ display:'flex', gap:'10px', marginBottom:'18px', flexWrap:'wrap' }}>
          <input
            style={{ flex:1, minWidth:'240px', padding:'12px 14px', border:'1.5px solid #ddd', borderRadius:'12px', fontSize:'14px', outline:'none', fontFamily:'Poppins,sans-serif' }}
            placeholder="Search India weather forecast... e.g. Goa, Jaipur"
            value={weatherTerm}
            onChange={e => setWeatherTerm(e.target.value)}
            onKeyDown={e => e.key==='Enter' && !loading && sendWeatherMessage(weatherTerm)}
          />
          <button
            type="button"
            disabled={loading || !weatherTerm.trim()}
            onClick={() => sendWeatherMessage(weatherTerm)}
            style={{ padding:'12px 20px', background: loading?'#aaa':'linear-gradient(135deg,#1e3a5f,#2980b9)', color:'#fff', border:'none', borderRadius:'12px', fontSize:'14px', fontWeight:'700', cursor:'pointer', fontFamily:'Poppins,sans-serif' }}
          >
            Search Weather
          </button>
        </div>

        {/* Chat window */}
        <div style={{ flex:1, background:'#fff', borderRadius:'16px', padding:'16px', overflowY:'auto', boxShadow:'0 2px 10px rgba(0,0,0,0.07)', marginBottom:'12px' }}>
          {messages.map((msg, i) => (
            <div key={i} style={{ marginBottom:'16px', display:'flex', flexDirection:'column', alignItems: msg.role==='user' ? 'flex-end' : 'flex-start' }}>
              {/* Bubble */}
              <div style={{
                maxWidth:'80%', padding:'12px 16px', borderRadius: msg.role==='user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                background: msg.role==='user' ? 'linear-gradient(135deg,#1e3a5f,#2980b9)' : '#f8fafc',
                color: msg.role==='user' ? '#fff' : '#333',
                fontSize:'14px', lineHeight:'1.6', whiteSpace:'pre-wrap',
                border: msg.role==='bot' ? '1px solid #eee' : 'none',
              }}>
                {msg.text}
              </div>

              {msg.results?.todayVisitPlan && (
                <div style={{ width:'100%', marginTop:'12px', background:'#fff', border:'1px solid #dbe7f3', borderRadius:'12px', padding:'14px' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', gap:'12px', flexWrap:'wrap', marginBottom:'12px' }}>
                    <div>
                      <div style={{ color:'#1e3a5f', fontSize:'16px', fontWeight:'900' }}>Today in {msg.results.todayVisitPlan.destination}</div>
                      <div style={{ color:'#64748b', fontSize:'12px', marginTop:'2px' }}>{msg.results.todayVisitPlan.state}</div>
                    </div>
                    <button onClick={() => navigate(`/emergency?destination=${encodeURIComponent(msg.results.todayVisitPlan.destination)}`)} style={{ padding:'8px 12px', background:'#fff5f5', color:'#c0392b', border:'1px solid #f5c6c6', borderRadius:'8px', fontSize:'12px', fontWeight:'800', cursor:'pointer', fontFamily:'Poppins,sans-serif' }}>Emergency Help</button>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:'10px' }}>
                    {[
                      ['Morning', msg.results.todayVisitPlan.morning],
                      ['Afternoon', msg.results.todayVisitPlan.afternoon],
                      ['Evening', msg.results.todayVisitPlan.evening],
                      ['Backup', msg.results.todayVisitPlan.backup],
                    ].map(([label, value]) => (
                      <div key={label} style={{ background:'#f8fafc', border:'1px solid #edf2f7', borderRadius:'10px', padding:'10px' }}>
                        <div style={{ color:'#888', fontSize:'11px', fontWeight:'800', textTransform:'uppercase' }}>{label}</div>
                        <div style={{ color:'#1e3a5f', fontSize:'13px', fontWeight:'900', marginTop:'5px' }}>{value}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop:'10px', background:'#fff8e1', border:'1px solid #f7e4a6', borderRadius:'10px', padding:'10px', color:'#7a5a00', fontSize:'12px', fontWeight:'700', lineHeight:'1.5' }}>
                    {msg.results.todayVisitPlan.tip}
                  </div>
                </div>
              )}

              {msg.results?.aiTripPlan && (
                <div style={{ width:'100%', marginTop:'12px', background:'#fff', border:'1px solid #dbe7f3', borderRadius:'12px', padding:'14px' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', gap:'12px', flexWrap:'wrap', marginBottom:'12px' }}>
                    <div>
                      <div style={{ color:'#1e3a5f', fontSize:'16px', fontWeight:'900' }}>{msg.results.aiTripPlan.destination}, {msg.results.aiTripPlan.state}</div>
                      <div style={{ color:'#64748b', fontSize:'12px', marginTop:'2px' }}>{msg.results.aiTripPlan.days} days - {msg.results.aiTripPlan.people} traveler(s)</div>
                    </div>
                    <div style={{ textAlign:'right' }}>
                      <div style={{ color:'#27ae60', fontSize:'16px', fontWeight:'900' }}>Rs {msg.results.aiTripPlan.totalEstimate.toLocaleString()}</div>
                      <div style={{ color:'#888', fontSize:'11px' }}>estimated total</div>
                    </div>
                  </div>

                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(190px,1fr))', gap:'10px', marginBottom:'12px' }}>
                    <div style={{ background:'#f8fafc', borderRadius:'10px', padding:'12px' }}>
                      <div style={{ color:'#888', fontSize:'11px', fontWeight:'800', textTransform:'uppercase' }}>Places</div>
                      <div style={{ display:'flex', flexWrap:'wrap', gap:'5px', marginTop:'8px' }}>
                        {msg.results.aiTripPlan.places.map(place => <span key={place} style={{ background:'#ebf5fb', color:'#1e3a5f', borderRadius:'8px', padding:'4px 7px', fontSize:'10px', fontWeight:'800' }}>{place}</span>)}
                      </div>
                    </div>
                    <div style={{ background:'#f8fafc', borderRadius:'10px', padding:'12px' }}>
                      <div style={{ color:'#888', fontSize:'11px', fontWeight:'800', textTransform:'uppercase' }}>Budget Split</div>
                      {msg.results.aiTripPlan.budgetBreakdown.map(([label, value]) => (
                        <div key={label} style={{ display:'flex', justifyContent:'space-between', color:'#334155', fontSize:'12px', marginTop:'6px' }}>
                          <span>{label}</span><strong>Rs {value.toLocaleString()}</strong>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(210px,1fr))', gap:'10px', marginBottom:'12px' }}>
                    {msg.results.aiTripPlan.hotels.map(hotel => (
                      <div key={hotel.name} style={{ background:'#fff', border:'1px solid #edf2f7', borderRadius:'10px', padding:'10px' }}>
                        <div style={{ color:'#1e3a5f', fontSize:'13px', fontWeight:'900' }}>{hotel.name}</div>
                        <div style={{ color:'#27ae60', fontSize:'12px', fontWeight:'800', marginTop:'3px' }}>Rs {hotel.price.toLocaleString()}/night - {hotel.type}</div>
                        <div style={{ color:'#64748b', fontSize:'11px', marginTop:'4px', lineHeight:'1.4' }}>{hotel.note}</div>
                      </div>
                    ))}
                  </div>

                  <div style={{ display:'grid', gap:'8px', marginBottom:'12px' }}>
                    {msg.results.aiTripPlan.itinerary.map(day => (
                      <div key={day.day} style={{ background:'#f8fafc', border:'1px solid #edf2f7', borderRadius:'10px', padding:'10px' }}>
                        <div style={{ color:'#1e3a5f', fontSize:'13px', fontWeight:'900' }}>Day {day.day}: {day.title}</div>
                        <div style={{ color:'#475569', fontSize:'11px', lineHeight:'1.6', marginTop:'5px' }}>
                          Morning: {day.morning}<br />Afternoon: {day.afternoon}<br />Evening: {day.evening}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
                    <button onClick={() => navigate(`/hotels?search=${encodeURIComponent(msg.results.aiTripPlan.destination)}`)} style={{ padding:'8px 12px', background:'#1e3a5f', color:'#fff', border:'none', borderRadius:'8px', fontSize:'12px', fontWeight:'800', cursor:'pointer', fontFamily:'Poppins,sans-serif' }}>Find Hotels</button>
                    <button onClick={() => navigate(`/transport?destination=${encodeURIComponent(msg.results.aiTripPlan.destination)}`)} style={{ padding:'8px 12px', background:'#fff', color:'#1e3a5f', border:'1px solid #1e3a5f', borderRadius:'8px', fontSize:'12px', fontWeight:'800', cursor:'pointer', fontFamily:'Poppins,sans-serif' }}>Transport</button>
                    <button onClick={() => navigate(`/emergency?destination=${encodeURIComponent(msg.results.aiTripPlan.destination)}`)} style={{ padding:'8px 12px', background:'#fff5f5', color:'#c0392b', border:'1px solid #f5c6c6', borderRadius:'8px', fontSize:'12px', fontWeight:'800', cursor:'pointer', fontFamily:'Poppins,sans-serif' }}>Emergency Help</button>
                  </div>
                </div>
              )}

              {/* Weather forecast cards */}
              {msg.results?.weather?.daily && (
                <div style={{ width:'100%', marginTop:'12px', background:'#fff', border:'1px solid #e0e7ef', borderRadius:'12px', padding:'12px' }}>
                  <p style={{ fontSize:'12px', color:'#1e3a5f', margin:'0 0 10px', fontWeight:'800', textTransform:'uppercase', letterSpacing:'0.05em' }}>
                    7-Day Forecast - {msg.results.weather.place.name}
                  </p>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(92px,1fr))', gap:'8px' }}>
                    {msg.results.weather.daily.time.map((day, index) => (
                      <div key={day} style={{ background:'#f8fafc', border:'1px solid #edf2f7', borderRadius:'10px', padding:'10px 8px', textAlign:'center' }}>
                        <div style={{ color:'#64748b', fontSize:'11px', fontWeight:'700' }}>
                          {new Date(day).toLocaleDateString('en', { weekday:'short' })}
                        </div>
                        <div style={{ color:'#1e3a5f', fontSize:'12px', fontWeight:'800', marginTop:'5px' }}>
                          {WMO_ICONS[msg.results.weather.daily.weather_code[index]] || 'Weather'}
                        </div>
                        <div style={{ color:'#334155', fontSize:'13px', fontWeight:'800', marginTop:'5px' }}>
                          {Math.round(msg.results.weather.daily.temperature_2m_max[index])} C
                        </div>
                        <div style={{ color:'#64748b', fontSize:'11px' }}>
                          Low {Math.round(msg.results.weather.daily.temperature_2m_min[index])} C
                        </div>
                        {msg.results.weather.daily.precipitation_sum[index] > 0 && (
                          <div style={{ color:'#2980b9', fontSize:'11px', fontWeight:'700', marginTop:'4px' }}>
                            Rain {msg.results.weather.daily.precipitation_sum[index]}mm
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Destination cards */}
              {msg.results?.destinations?.length > 0 && (
                <div style={{ width:'100%', marginTop:'12px' }}>
                  <p style={{ fontSize:'12px', color:'#888', margin:'0 0 8px', fontWeight:'600', textTransform:'uppercase', letterSpacing:'0.05em' }}>🌍 Recommended Destinations</p>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:'10px' }}>
                    {msg.results.destinations.map(d => (
                      <div key={d._id} onClick={() => navigate(`/india/${d._id}`)}
                        style={{ background:'linear-gradient(135deg,#1e3a5f,#2980b9)', borderRadius:'12px', padding:'14px', cursor:'pointer', color:'#fff', transition:'transform 0.2s' }}
                        onMouseEnter={e => e.currentTarget.style.transform='translateY(-2px)'}
                        onMouseLeave={e => e.currentTarget.style.transform='none'}>
                        <div style={{ fontWeight:'700', fontSize:'15px' }}>{d.name}</div>
                        <div style={{ fontSize:'12px', opacity:.8, marginTop:'2px' }}>📍 {d.state}</div>
                        <div style={{ fontSize:'12px', opacity:.8, marginTop:'2px' }}>📅 {d.bestSeason?.join(', ')}</div>
                        <div style={{ marginTop:'6px', display:'flex', justifyContent:'space-between', fontSize:'12px' }}>
                          <span>⭐ {d.rating}</span>
                          <span>💰 ₹{d.avgBudgetPerDay}/day</span>
                        </div>
                        <div style={{ marginTop:'6px', background:'rgba(255,255,255,0.2)', borderRadius:'6px', padding:'4px 8px', fontSize:'11px', fontWeight:'600', textAlign:'center' }}>
                          {d.category}
                        </div>
                        {d.topAttractions?.length > 0 && (
                          <div style={{ marginTop:'8px', display:'flex', flexWrap:'wrap', gap:'4px' }}>
                            {d.topAttractions.slice(0, 4).map(place => (
                              <span key={place} style={{ background:'rgba(255,255,255,0.18)', border:'1px solid rgba(255,255,255,0.25)', borderRadius:'6px', padding:'3px 6px', fontSize:'10px', fontWeight:'700' }}>
                                {place}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Places with hotels */}
              {msg.results?.placesToVisit?.length > 0 && (
                <div style={{ width:'100%', marginTop:'12px' }}>
                  <p style={{ fontSize:'12px', color:'#888', margin:'0 0 8px', fontWeight:'600', textTransform:'uppercase', letterSpacing:'0.05em' }}>Places To Visit + Hotels</p>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(250px,1fr))', gap:'10px' }}>
                    {msg.results.placesToVisit.map(place => (
                      <div key={place.name} style={{ background:'#fff', border:'1px solid #e0e7ef', borderRadius:'12px', padding:'12px' }}>
                        <div style={{ display:'flex', justifyContent:'space-between', gap:'8px', alignItems:'flex-start', marginBottom:'6px' }}>
                          <div>
                            <div style={{ color:'#1e3a5f', fontSize:'14px', fontWeight:'800' }}>{place.name}</div>
                            <div style={{ color:'#64748b', fontSize:'11px', marginTop:'2px' }}>{place.area} - {place.type}</div>
                          </div>
                          <span style={{ background:'#fff3cd', color:'#9a6a00', borderRadius:'10px', padding:'3px 7px', fontSize:'10px', fontWeight:'800', whiteSpace:'nowrap' }}>{place.bestTime}</span>
                        </div>
                        <p style={{ color:'#555', fontSize:'12px', lineHeight:'1.5', margin:'0 0 8px' }}>{place.description}</p>
                        {place.hotels?.length > 0 && (
                          <div>
                            <div style={{ color:'#1e3a5f', fontSize:'10px', fontWeight:'800', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:'6px' }}>
                              Hotels Available ({place.hotels.length})
                            </div>
                            <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
                              {place.hotels.map(h => (
                                <div key={`${place.name}-${h._id}`} style={{ background:'#f8fafc', border:'1px solid #edf2f7', borderRadius:'9px', padding:'8px', display:'flex', justifyContent:'space-between', gap:'8px', alignItems:'center' }}>
                                  <div style={{ minWidth:0, flex:1 }}>
                                    <div style={{ color:'#1e3a5f', fontSize:'12px', fontWeight:'700', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{h.name}</div>
                                    <div style={{ color:'#888', fontSize:'11px', marginTop:'2px' }}>₹{h.price?.toLocaleString()}/night · ⭐ {h.rating}</div>
                                    <div style={{ color:'#64748b', fontSize:'10px', lineHeight:'1.4', marginTop:'2px' }}>{h.nearbyNote}</div>
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
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Hotel cards */}
              {msg.results?.hotels?.length > 0 && (
                <div style={{ width:'100%', marginTop:'10px' }}>
                  <p style={{ fontSize:'12px', color:'#888', margin:'0 0 8px', fontWeight:'600', textTransform:'uppercase', letterSpacing:'0.05em' }}>🏨 Available Hotels</p>
                  <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                    {msg.results.hotels.map(h => (
                      <div key={h._id} onClick={() => navigate(`/hotels/${h._id}`)}
                        style={{ background:'#fff', border:'1px solid #e0e0e0', borderRadius:'10px', padding:'12px 14px', cursor:'pointer', display:'flex', justifyContent:'space-between', alignItems:'center', gap:'12px', transition:'all 0.2s', flexWrap:'wrap' }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor='#1e3a5f'; e.currentTarget.style.background='#f0f4f8' }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor='#e0e0e0'; e.currentTarget.style.background='#fff' }}>
                        <div style={{ minWidth:'180px', flex:'1 1 220px' }}>
                          <div style={{ fontWeight:'600', fontSize:'14px', color:'#1e3a5f' }}>🏨 {h.name}</div>
                          <div style={{ fontSize:'12px', color:'#888', marginTop:'2px' }}>📍 {h.location}</div>
                        </div>
                        <div style={{ display:'flex', gap:'8px', flex:'1 1 100%', justifyContent:'flex-end', order:3 }}>
                          <button
                            onClick={e => { e.stopPropagation(); navigate(`/hotels/${h._id}`) }}
                            style={{ padding:'8px 12px', background:'#fff', color:'#1e3a5f', border:'1.5px solid #1e3a5f', borderRadius:'8px', fontSize:'12px', fontWeight:'700', cursor:'pointer', fontFamily:'Poppins,sans-serif' }}
                          >
                            View Details
                          </button>
                          <button
                            onClick={e => { e.stopPropagation(); navigate(`/hotels/${h._id}#booking`) }}
                            style={{ padding:'8px 12px', background:'linear-gradient(135deg,#27ae60,#2ecc71)', color:'#fff', border:'none', borderRadius:'8px', fontSize:'12px', fontWeight:'700', cursor:'pointer', fontFamily:'Poppins,sans-serif' }}
                          >
                            Book & Pay
                          </button>
                        </div>
                        <div style={{ textAlign:'right', flexShrink:0 }}>
                          <div style={{ fontWeight:'700', color:'#1e3a5f', fontSize:'15px' }}>₹{h.price?.toLocaleString()}<span style={{ fontSize:'10px', color:'#888', fontWeight:'400' }}>/night</span></div>
                          <span style={{ fontSize:'10px', padding:'2px 8px', borderRadius:'10px', fontWeight:'600',
                            background: h.category==='Luxury' ? '#f3e5ff' : h.category==='Budget' ? '#e8f8f5' : '#ebf5fb',
                            color:      h.category==='Luxury' ? '#8e44ad' : h.category==='Budget' ? '#27ae60' : '#2980b9',
                          }}>{h.category} ⭐{h.rating}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div style={{ display:'flex', gap:'6px', padding:'12px 16px', background:'#f8fafc', borderRadius:'18px 18px 18px 4px', width:'fit-content', border:'1px solid #eee' }}>
              {[0,1,2].map(i => (
                <div key={i} style={{ width:'8px', height:'8px', borderRadius:'50%', background:'#2980b9', animation:`bounce 1s ${i*0.2}s infinite` }} />
              ))}
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Quick suggestions */}
        <div style={{ display:'flex', gap:'6px', flexWrap:'wrap', marginBottom:'10px' }}>
          {QUICK.map(q => (
            <button key={q} onClick={() => sendMessage(q)} style={{ padding:'6px 12px', background:'#fff', border:'1.5px solid #ddd', borderRadius:'20px', fontSize:'12px', cursor:'pointer', fontFamily:'Poppins,sans-serif', color:'#555', transition:'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor='#1e3a5f'; e.currentTarget.style.color='#1e3a5f' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor='#ddd'; e.currentTarget.style.color='#555' }}>
              {q}
            </button>
          ))}
        </div>

        {/* Input */}
        <div style={{ display:'flex', gap:'10px' }}>
          <input
            style={{ flex:1, padding:'14px 18px', border:'1.5px solid #ddd', borderRadius:'12px', fontSize:'14px', outline:'none', fontFamily:'Poppins,sans-serif' }}
            placeholder="Ask me anything... e.g. 'Best beach places in summer'"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key==='Enter' && !loading && sendMessage()}
          />
          <button onClick={() => sendMessage()} disabled={loading || !input.trim()} style={{ padding:'14px 22px', background: loading?'#aaa':'linear-gradient(135deg,#1e3a5f,#2980b9)', color:'#fff', border:'none', borderRadius:'12px', fontSize:'15px', cursor:'pointer', fontFamily:'Poppins,sans-serif', fontWeight:'700' }}>
            Send ✈️
          </button>
        </div>
      </div>

      <style>{`@keyframes bounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-8px)} }`}</style>
    </div>
  )
}
