import React, { useState, useEffect } from 'react';
import './index.css';

export default function App() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const wpApiUrl = import.meta.env.VITE_WP_API_URL;
  const wpUser = import.meta.env.VITE_WP_USER;
  const wpAppPassword = import.meta.env.VITE_WP_APP_PASSWORD;

  useEffect(() => {
    const fetchWpPosts = async () => {
      if (!wpApiUrl) {
        setError("VITE_WP_API_URL is missing in your environment variables (.env).");
        setLoading(false);
        return;
      }

      const headers = {};
      if (wpUser && wpAppPassword) {
        headers['Authorization'] = 'Basic ' + btoa(`${wpUser}:${wpAppPassword}`);
      }

      try {
        const response = await fetch(`${wpApiUrl}/posts?_embed`, { headers });
        if (!response.ok) {
          throw new Error(`Server returned status ${response.status}: ${response.statusText}`);
        }
        const data = await response.json();
        setPosts(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchWpPosts();
  }, [wpApiUrl, wpUser, wpAppPassword]);

  // Extract domain name cleanly for the header badge
  const siteDomain = wpApiUrl ? new URL(wpApiUrl).hostname : 'WordPress Site';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* Header */}
      <header style={{
        background: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        padding: '20px 0',
        position: 'sticky',
        top: 0,
        zIndex: 10,
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#0f172a', letterSpacing: '-0.025em' }}>
              Headless WP Reader
            </h1>
            <p style={{ fontSize: '0.8rem', color: '#64748b' }}>Powered by React & WordPress REST API</p>
          </div>
          <div style={{
            background: '#f1f5f9',
            padding: '6px 12px',
            borderRadius: '20px',
            fontSize: '0.75rem',
            fontWeight: '500',
            color: '#475569',
            border: '1px solid #e2e8f0'
          }}>
            Connected to: <span style={{ color: '#0284c7', fontWeight: '600' }}>{siteDomain}</span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 24px', width: '100%', flex: 1 }}>
        
        {loading && (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{
              width: '40px',
              height: '40px',
              border: '4px solid #e2e8f0',
              borderTopColor: ' #0284c7',
              borderRadius: '50%',
              margin: '0 auto 16px auto',
              animation: 'spin 1s linear infinite'
            }} />
            <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            <p style={{ color: '#64748b', fontSize: '0.95rem' }}>Fetching latest articles...</p>
          </div>
        )}

        {error && (
          <div style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#991b1b',
            padding: '20px',
            borderRadius: '12px',
            maxWidth: '600px',
            margin: '40px auto',
            textAlign: 'center'
          }}>
            <h3 style={{ marginBottom: '8px', fontSize: '1.1rem' }}>Unable to load articles</h3>
            <p style={{ fontSize: '0.9rem', color: '#b91c1c' }}>{error}</p>
            <p style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '12px' }}>
              Please check your <code>.env</code> settings and ensure your WordPress REST API is accessible.
            </p>
          </div>
        )}

        {!loading && !error && posts.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#64748b' }}>
            <h3>No articles found</h3>
            <p style={{ fontSize: '0.9rem', marginTop: '4px' }}>Make sure your WordPress site has published posts.</p>
          </div>
        )}

        {/* Posts Grid */}
        {!loading && !error && posts.length > 0 && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
            gap: '30px'
          }}>
            {posts.map((post) => {
              const featuredImage = 
                post._embedded?.['wp:featuredmedia']?.[0]?.source_url || null;
              
              const authorName = 
                post._embedded?.['author']?.[0]?.name || 'Editorial Team';

              const formattedDate = new Date(post.date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              });

              return (
                <article 
                  key={post.id}
                  style={{
                    background: '#ffffff',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px -1px rgba(0, 0, 0, 0.02)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 12px 20px -3px rgba(0, 0, 0, 0.08)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px -1px rgba(0, 0, 0, 0.02)';
                  }}
                >
                  {/* Thumbnail */}
                  {featuredImage ? (
                    <div style={{ width: '100%', height: '210px', overflow: 'hidden', background: '#f1f5f9' }}>
                      <img 
                        src={featuredImage} 
                        alt={post.title.rendered} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s ease' }}
                      />
                    </div>
                  ) : (
                    <div style={{ 
                      width: '100%', 
                      height: '210px', 
                      background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ffffff',
                      fontWeight: '600',
                      fontSize: '1.1rem',
                      letterSpacing: '-0.01em',
                      padding: '20px',
                      textAlign: 'center'
                    }}>
                      <span dangerouslySetInnerHTML={{ __html: post.title.rendered }} />
                    </div>
                  )}

                  {/* Body Content */}
                  <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                    
                    {/* Meta Info */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', fontSize: '0.8rem', color: '#64748b' }}>
                      <span>{formattedDate}</span>
                      <span style={{ background: '#f8fafc', padding: '2px 8px', borderRadius: '6px', border: '1px solid #e2e8f0', color: '#475569' }}>
                        By {authorName}
                      </span>
                    </div>

                    {/* Title */}
                    <h2 
                      dangerouslySetInnerHTML={{ __html: post.title.rendered }} 
                      style={{ 
                        fontSize: '1.25rem', 
                        fontWeight: '600', 
                        color: '#0f172a',
                        lineHeight: '1.4',
                        marginBottom: '12px',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}
                    />

                    {/* Excerpt */}
                    <div 
                      dangerouslySetInnerHTML={{ __html: post.excerpt.rendered }} 
                      style={{ 
                        color: '#475569', 
                        fontSize: '0.9rem', 
                        lineHeight: '1.6', 
                        marginBottom: '20px',
                        flex: 1,
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}
                    />

                    {/* Read More Link */}
                    <a 
                      href={post.link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{ 
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        marginTop: 'auto',
                        color: '#0284c7', 
                        fontWeight: '600', 
                        fontSize: '0.9rem',
                        textDecoration: 'none',
                        transition: 'color 0.2s'
                      }}
                      onMouseEnter={(e) => e.target.style.color = '#0369a1'}
                      onMouseLeave={(e) => e.target.style.color = '#0284c7'}
                    >
                      Read full article 
                      <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>&rarr;</span>
                    </a>

                  </div>
                </article>
              );
            })}
          </div>
        )}

      </main>

      {/* Footer */}
      <footer style={{
        background: '#ffffff',
        borderTop: '1px solid #e2e8f0',
        padding: '24px 0',
        textAlign: 'center',
        color: '#64748b',
        fontSize: '0.85rem',
        marginTop: 'auto'
      }}>
        <p>Built with React, Vite, and the WordPress REST API.</p>
      </footer>

    </div>
  );
}