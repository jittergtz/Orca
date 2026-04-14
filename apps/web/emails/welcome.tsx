interface WelcomeEmailProps {
  email: string
  planCode: string
  appUrl: string
}

export function WelcomeEmail({ email, planCode, appUrl }: WelcomeEmailProps) {
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', padding: '32px 0', maxWidth: '480px', margin: '0 auto' }}>
      <div style={{ fontSize: '24px', fontWeight: '800', marginBottom: '24px', color: '#111' }}>
        Welcome to Orca
      </div>

      <p style={{ fontSize: '15px', lineHeight: '1.6', color: '#555', marginBottom: '24px' }}>
        Hey there — your Orca account is set up and ready to go.
      </p>

      <p style={{ fontSize: '15px', lineHeight: '1.6', color: '#555', marginBottom: '24px' }}>
        Plan: <strong>{planCode}</strong>
      </p>

      <p style={{ fontSize: '15px', lineHeight: '1.6', color: '#555', marginBottom: '32px' }}>
        Download the desktop app, sign in, and set up your first topic. We'll handle the rest.
      </p>

      <a
        href={`${appUrl}/subscribe`}
        style={{
          display: 'inline-block',
          padding: '12px 28px',
          backgroundColor: '#111',
          color: '#fff',
          textDecoration: 'none',
          borderRadius: '6px',
          fontSize: '14px',
          fontWeight: '600',
        }}
      >
        Open Orca
      </a>

      <p style={{ fontSize: '12px', color: '#999', marginTop: '40px', borderTop: '1px solid #eee', paddingTop: '16px' }}>
        Sent to {email}. You're receiving this because you signed up for Orca.
      </p>
    </div>
  )
}
