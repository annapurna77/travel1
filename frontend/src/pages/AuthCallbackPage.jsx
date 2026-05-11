import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'

export default function AuthCallbackPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [error, setError] = useState('')

  useEffect(() => {
    const token = params.get('token')
    const user = params.get('user')
    const authError = params.get('error')

    if (authError) {
      setError(authError)
      return
    }

    if (!token || !user) {
      setError('Google login did not return a valid session.')
      return
    }

    localStorage.setItem('token', token)
    localStorage.setItem('user', user)
    navigate('/', { replace: true })
  }, [navigate, params])

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1e3a5f 0%, #2980b9 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Poppins, sans-serif', padding: '20px',
    }}>
      <div style={{
        background: '#fff', borderRadius: '20px', padding: '34px',
        width: '100%', maxWidth: '420px', textAlign: 'center',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }}>
        <h1 style={{ color: '#1e3a5f', fontSize: '24px', margin: '0 0 10px' }}>
          Signing you in
        </h1>
        {error ? (
          <>
            <p style={{ color: '#c0392b', fontSize: '14px', lineHeight: 1.6 }}>
              {error}
            </p>
            <Link to="/login" style={{ color: '#2980b9', fontWeight: '700', textDecoration: 'none' }}>
              Back to login
            </Link>
          </>
        ) : (
          <p style={{ color: '#666', fontSize: '14px', margin: 0 }}>
            Please wait...
          </p>
        )}
      </div>
    </div>
  )
}
