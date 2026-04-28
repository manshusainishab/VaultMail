import { useEffect, useState } from 'react';
import Landing from './components/Landing.jsx';
import Inbox from './components/Inbox.jsx';
import EmailDetail from './components/EmailDetail.jsx';
import Transparency from './components/Transparency.jsx';
import { api } from './lib/api.js';

// Routes:
//   #/inbox            -> Inbox
//   #/email/<id>       -> EmailDetail
//   #/transparency     -> Transparency
//   (else)             -> Landing
//
// Auth detection: try /api/inbox; if 200, user is authed. We auto-route
// to inbox after OAuth callback by checking the ?connected=1 query param.

export default function App() {
  const [route, setRoute] = useState(() => parseRoute());
  const [authed, setAuthed] = useState(null); // null = unknown, true/false = known

  // After OAuth callback, the Worker redirects to "/?connected=1". Pick that up.
  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get('connected') === '1') {
      window.history.replaceState({}, '', '/#/inbox');
      setRoute({ name: 'inbox' });
    }
  }, []);

  useEffect(() => {
    function onHash() { setRoute(parseRoute()); }
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  // Probe auth on first paint
  useEffect(() => {
    api.inbox().then(() => setAuthed(true)).catch(() => setAuthed(false));
  }, []);

  // If user lands on / and is authed, send them to inbox automatically
  useEffect(() => {
    if (route.name === 'landing' && authed === true) {
      window.location.hash = '#/inbox';
    }
  }, [route.name, authed]);

  function navTo(path) { window.location.hash = path; }

  if (route.name === 'inbox') return <Inbox onOpen={(id) => navTo(`#/email/${id}`)} />;
  if (route.name === 'email') return <EmailDetail id={route.id} onBack={() => navTo('#/inbox')} />;
  if (route.name === 'transparency') return <Transparency onBack={() => navTo('#/inbox')} />;
  return <Landing />;
}

function parseRoute() {
  const hash = window.location.hash.replace(/^#/, '');
  if (hash === '/inbox') return { name: 'inbox' };
  if (hash === '/transparency') return { name: 'transparency' };
  const m = hash.match(/^\/email\/(.+)$/);
  if (m) return { name: 'email', id: m[1] };
  return { name: 'landing' };
}
