interface DigestEmailProps {
  email: string
  topicName: string
  articles: Array<{ title: string; sourceUrl: string; sourceName: string; tldrBullets?: string[] }>
  appUrl: string
}

export function DigestEmail({ email, topicName, articles, appUrl }: DigestEmailProps) {
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', padding: '32px 0', maxWidth: '480px', margin: '0 auto' }}>
      <div style={{ fontSize: '24px', fontWeight: '800', marginBottom: '8px', color: '#111' }}>
        {topicName}
      </div>

      <p style={{ fontSize: '14px', color: '#777', marginBottom: '24px' }}>
        {articles.length} article{articles.length !== 1 ? 's' : ''} — {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
      </p>

      {articles.slice(0, 10).map((article, i) => (
        <div
          key={i}
          style={{
            borderTop: i === 0 ? 'none' : '1px solid #eee',
            paddingTop: i === 0 ? '0' : '20px',
            paddingBottom: '20px',
          }}
        >
          <a
            href={article.sourceUrl}
            style={{ fontSize: '15px', fontWeight: '600', color: '#111', textDecoration: 'none' }}
          >
            {article.title}
          </a>

          {article.tldrBullets && article.tldrBullets.length > 0 && (
            <ul style={{ margin: '8px 0 0 0', paddingLeft: '18px', fontSize: '13px', lineHeight: '1.6', color: '#555' }}>
              {article.tldrBullets.map((bullet, j) => (
                <li key={j} style={{ marginBottom: '4px' }}>{bullet}</li>
              ))}
            </ul>
          )}

          <div style={{ fontSize: '12px', color: '#999', marginTop: '6px' }}>
            {article.sourceName}
          </div>
        </div>
      ))}

      {articles.length > 10 && (
        <p style={{ fontSize: '14px', color: '#777', marginTop: '8px' }}>
          + {articles.length - 10} more. Read the full briefing in the{' '}
          <a href={appUrl} style={{ color: '#3b82f6', textDecoration: 'none' }}>Orca app</a>.
        </p>
      )}

      <p style={{ fontSize: '12px', color: '#999', marginTop: '40px', borderTop: '1px solid #eee', paddingTop: '16px' }}>
        Sent to {email}. Manage your topic preferences in the app.
      </p>
    </div>
  )
}
