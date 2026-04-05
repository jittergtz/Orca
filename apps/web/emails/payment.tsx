interface PaymentEmailProps {
  email: string
  planCode: string
  amount: string
  date: string
  appUrl: string
}

export function PaymentEmail({ email, planCode, amount, date, appUrl }: PaymentEmailProps) {
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', padding: '32px 0', maxWidth: '480px', margin: '0 auto' }}>
      <div style={{ fontSize: '24px', fontWeight: '800', marginBottom: '24px', color: '#111' }}>
        Payment confirmed
      </div>

      <p style={{ fontSize: '15px', lineHeight: '1.6', color: '#555', marginBottom: '24px' }}>
        Your payment for Orca has been processed successfully.
      </p>

      <div style={{ backgroundColor: '#f9f9f9', borderRadius: '8px', padding: '16px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
          <span style={{ color: '#777' }}>Plan</span>
          <span style={{ fontWeight: '600', color: '#111' }}>{planCode}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
          <span style={{ color: '#777' }}>Amount</span>
          <span style={{ fontWeight: '600', color: '#111' }}>{amount}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
          <span style={{ color: '#777' }}>Date</span>
          <span style={{ fontWeight: '600', color: '#111' }}>{date}</span>
        </div>
      </div>

      <p style={{ fontSize: '14px', lineHeight: '1.6', color: '#777', marginBottom: '24px' }}>
        Manage your subscription anytime from your{' '}
        <a href={`${appUrl}/dashboard`} style={{ color: '#3b82f6', textDecoration: 'none' }}>dashboard</a>.
      </p>

      <p style={{ fontSize: '12px', color: '#999', marginTop: '40px', borderTop: '1px solid #eee', paddingTop: '16px' }}>
        Sent to {email}. Questions? Reply to this email.
      </p>
    </div>
  )
}
