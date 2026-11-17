import { useEffect, useState, type FormEvent } from 'react';
import './index.css';

// Runtime config (config.js, written at container start) wins over build-time Vite env.
const API: string = ((window as any).__ENV__?.WP_API_URL || import.meta.env.VITE_WP_API_URL || '').replace(/\/$/, '');
const PER = 9;
const COLORS = ['#ffd23f', '#2ec4b6', '#ff5d8f', '#9fb4ff', '#ffb36b'];

const strip = (h = '') => { const d = document.createElement('div'); d.innerHTML = h; return d.textContent || ''; };
const fmt = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
const img = (p: any) => p?._embedded?.['wp:featuredmedia']?.[0]?.source_url as string | undefined;
const author = (p: any) => p?._embedded?.author?.[0];
const terms = (p: any): any[] => (p?._embedded?.['wp:term']?.[0] || []).slice(0, 3);

function useHash() {
  const [h, setH] = useState(location.hash.slice(1) || '/');
  useEffect(() => {
    const f = () => { setH(location.hash.slice(1) || '/'); window.scrollTo(0, 0); };
    addEventListener('hashchange', f);
    return () => removeEventListener('hashchange', f);
  }, []);
  return h;
}

async function wp(path: string) {
  const r = await fetch(`${API}${path}`);
  if (!r.ok) throw new Error(`WordPress returned ${r.status} ${r.statusText}`);
  return r.json();
}

function useWp<T = any>(path: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    if (!path) return;
    let live = true;
    setData(null); setErr(null);
    wp(path).then(d => live && setData(d)).catch(e => live && setErr(e.message));
    return () => { live = false; };
  }, [path]);
  return { data, err };
}

const Loading = () => <div className="state"><div className="spin" />Loading…</div>;
const Fail = ({ m }: { m: string }) => (
  <div className="state"><h3>Couldn’t load this page</h3><p>{m}</p></div>
);

function Thumb({ p, cls }: { p: any; cls: string }) {
  const src = img(p);
  return src
    ? <div className={`img ${cls}`} style={{ backgroundImage: `url(${src})` }} role="img" aria-label={strip(p.title.rendered)} />
    : <div className={`img ph ${cls}`} style={{ background: COLORS[p.id % COLORS.length] }}>{strip(p.title.rendered).charAt(0)}</div>;
}

function Chips({ p }: { p: any }) {
  return <div className="chips">{terms(p).map((t: any, i: number) =>
    <a key={t.id} href={`#/category/${t.id}/${encodeURIComponent(t.name)}`} className="chip" style={{ background: COLORS[(i + t.id) % COLORS.length] }}
      dangerouslySetInnerHTML={{ __html: t.name }} />)}</div>;
}

function Card({ p }: { p: any }) {
  return (
    <article className="card">
      <a href={`#/post/${p.slug}`}><Thumb p={p} cls="" /></a>
      <div className="b">
        <Chips p={p} />
        <h4><a href={`#/post/${p.slug}`} dangerouslySetInnerHTML={{ __html: p.title.rendered }} /></h4>
        <div className="ex" dangerouslySetInnerHTML={{ __html: p.excerpt.rendered }} />
        <div className="meta">{author(p)?.name || 'Editorial team'} on {fmt(p.date)}</div>
      </div>
    </article>
  );
}

function Header({ route }: { route: string }) {
  const { data: cats } = useWp<any[]>('/categories?per_page=6&orderby=count&order=desc&hide_empty=true');
  const { data: pages } = useWp<any[]>('/pages?per_page=4&orderby=menu_order&order=asc');
  const [q, setQ] = useState('');
  const go = (e: FormEvent) => { e.preventDefault(); if (q.trim()) location.hash = `/search/${encodeURIComponent(q.trim())}`; };
  return (
    <header className="hdr"><div className="wrap">
      <a href="#/" className="logo"><i />{API ? new URL(API).hostname.replace('www.', '') : 'Reader'}</a>
      <nav className="nav" aria-label="Main">
        <a href="#/" className={route === '/' ? 'on' : ''}>Latest</a>
        {cats?.filter(c => c.slug !== 'uncategorized').map(c =>
          <a key={c.id} href={`#/category/${c.id}/${encodeURIComponent(c.name)}`} className={route.startsWith(`/category/${c.id}/`) ? 'on' : ''}
            dangerouslySetInnerHTML={{ __html: c.name }} />)}
        {pages?.map(p => <a key={p.id} href={`#/page/${p.slug}`} className={route === `/page/${p.slug}` ? 'on' : ''}
          dangerouslySetInnerHTML={{ __html: p.title.rendered }} />)}
      </nav>
      <form className="search" onSubmit={go} role="search">
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search articles" aria-label="Search articles" />
        <button aria-label="Search">Go</button>
      </form>
    </div></header>
  );
}

// Paginated list used by Home, Category and Search
function Listing({ base, title, hero }: { base: string; title?: string; hero?: boolean }) {
  const [posts, setPosts] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [more, setMore] = useState(true);
  const [busy, setBusy] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => { setPosts([]); setPage(1); setMore(true); }, [base]);
  useEffect(() => {
    let live = true;
    setBusy(true);
    wp(`${base}${base.includes('?') ? '&' : '?'}_embed&per_page=${PER}&page=${page}`)
      .then(d => { if (!live) return; setPosts(p => page === 1 ? d : [...p, ...d]); setMore(d.length === PER); })
      .catch(e => live && (e.message.includes('400') ? setMore(false) : setErr(e.message)))
      .finally(() => live && setBusy(false));
    return () => { live = false; };
  }, [base, page]);

  if (err) return <Fail m={err} />;
  const [first, ...rest] = posts;
  const list = hero ? rest : posts;
  return (
    <div className="wrap">
      {hero && <section className="hero">
        <h1>Fresh stories, served bright.</h1>
        <p>The newest writing from the site, pulled live from WordPress.</p>
      </section>}
      {hero && first && (
        <article className="feature">
          <a href={`#/post/${first.slug}`}><Thumb p={first} cls="" /></a>
          <div className="txt">
            <Chips p={first} />
            <h2><a href={`#/post/${first.slug}`} dangerouslySetInnerHTML={{ __html: first.title.rendered }} /></h2>
            <div className="ex" dangerouslySetInnerHTML={{ __html: first.excerpt.rendered }} />
            <div className="meta">{author(first)?.name || 'Editorial team'} on {fmt(first.date)}</div>
          </div>
        </article>
      )}
      {title && <div className="sec" style={{ marginTop: 48 }}><h3>{title}</h3></div>}
      {hero && <div className="sec"><h3>More to read</h3></div>}
      {!busy && !posts.length && <div className="state"><h3>No articles found</h3><p>Try a different search or category.</p></div>}
      <div className="grid">{list.map(p => <Card key={p.id} p={p} />)}</div>
      {busy && <Loading />}
      {!busy && more && <div className="center"><button className="btn" onClick={() => setPage(n => n + 1)}>Load more articles</button></div>}
    </div>
  );
}

function Single({ slug, type }: { slug: string; type: 'posts' | 'pages' }) {
  const { data, err } = useWp<any[]>(`/${type}?slug=${encodeURIComponent(slug)}&_embed`);
  const post = data?.[0];
  const { data: related } = useWp<any[]>(post && type === 'posts' ? `/posts?_embed&per_page=3&exclude=${post.id}${terms(post)[0] ? `&categories=${terms(post)[0].id}` : ''}` : null);
  if (err) return <Fail m={err} />;
  if (!data) return <Loading />;
  if (!post) return <div className="state"><h3>Not found</h3><p><a href="#/" style={{ color: 'var(--blue)' }}>Back to latest articles</a></p></div>;
  const a = author(post);
  return (
    <div className="wrap">
      <article className="art">
        {type === 'posts' && <Chips p={post} />}
        <h1 dangerouslySetInnerHTML={{ __html: post.title.rendered }} />
        {type === 'posts' && <div className="meta">{a?.name || 'Editorial team'} on {fmt(post.date)}</div>}
        {img(post) && <div className="img cover" style={{ backgroundImage: `url(${img(post)})` }} />}
        <div className="content" dangerouslySetInnerHTML={{ __html: post.content.rendered }} />
        {type === 'posts' && a && (
          <div className="author">
            {a.avatar_urls?.['96'] && <img src={a.avatar_urls['96']} alt="" />}
            <div><strong>Written by {a.name}</strong><div className="ex">{a.description || 'Contributor'}</div></div>
          </div>
        )}
      </article>
      {!!related?.length && <><div className="sec"><h3>Keep reading</h3></div><div className="grid">{related.map(p => <Card key={p.id} p={p} />)}</div></>}
    </div>
  );
}

export default function App() {
  const route = useHash();
  const [, a, b] = route.split('/');
  let view;
  if (!API) view = <Fail m="WP_API_URL is not set. Add it to public/config.js or your .env (VITE_WP_API_URL)." />;
  else if (a === 'post') view = <Single key={b} slug={b} type="posts" />;
  else if (a === 'page') view = <Single key={b} slug={b} type="pages" />;
  else if (a === 'category') view = <Listing base={`/posts?categories=${b}`} title={decodeURIComponent(route.split('/')[3] || '')} />;
  else if (a === 'search') view = <Listing base={`/posts?search=${b}`} title={`Results for “${decodeURIComponent(b)}”`} />;
  else view = <Listing base="/posts?" hero />;
  return (
    <>
      <Header route={route} />
      <main style={{ minHeight: '70vh' }}>{view}</main>
      <footer className="ftr"><div className="wrap">
        <strong>{API ? new URL(API).hostname : 'Reader'}</strong>
        <div><a href="#/">Latest</a><a href="#/search/news">Search</a></div>
      </div></footer>
    </>
  );
}