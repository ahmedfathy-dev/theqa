import { useEffect, useRef, useState } from 'react';
import { Outlet, useLocation, useNavigate, useOutletContext, useParams, Link } from 'react-router-dom';
import { isAdminEmail, localData, useLocalData } from '../../localData.js';
import { fmtDate, fmtShort, fmtTime, KIND, NOTIF_TYPE } from '../../format.js';
import { AppSidebar, AuthLayout, Bar, Button, ButtonLink, Card, Chip, ClearConversationButton, CommentThread, Empty, ErrorBox, Field, FormError, LinkCard, List, Loading, Page, PasswordInput, Range, StatusChip, Switch, useAction } from '../../components/ui.jsx';
import FeatureRequestCard from './components/RequestCard.jsx';
import PasswordRecovery from '../auth/PasswordRecovery.jsx';

// ---------- الدخول ----------
export function ClientLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [missing, setMissing] = useState('');
  const { state } = useLocation();
  const [loggedOut] = useState(Boolean(state?.loggedOut));
  const { busy, err, run } = useAction();
  const nav = useNavigate();
  const submit = async (e) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setMissing('أدخل بريدًا إلكترونيًا صحيحًا.'); return; }
    if (!password) { setMissing('أدخل كلمة المرور للمتابعة.'); return; }
    const isAdmin = isAdminEmail(email);
    const ok = await run(
      () => localData(isAdmin ? '/admin/login' : '/client/login', { method: 'POST', body: { email, password } }),
      'تم تسجيل الدخول بنجاح',
    );
    if (ok) nav(isAdmin ? '/admin' : '/portal', { replace: true });
  };
  return (
    <AuthLayout
      brand="بوابة المشاريع"
      heading="متابعة مشروعك"
      description="سجّل دخولك لمتابعة تقدم المشروع وقراراته وتحديثاته."
      points={['تحديثات المشروع أولا بأول', 'المراحل والجدول الزمني', 'الطلبات والملفات في مكان واحد']}
      notice={loggedOut ? 'تم تسجيل الخروج بنجاح' : null}
      onSubmit={submit}
    >
      <Field label="البريد الإلكتروني" error={missing || err}>
        <input type="email" className="ltr" dir="ltr" autoFocus autoComplete="email" required value={email} onChange={(e) => { setEmail(e.target.value); setMissing(''); }} placeholder="client@example.test" />
      </Field>
      <Field label="كلمة المرور">
        <PasswordInput autoComplete="current-password" required value={password} onChange={(e) => { setPassword(e.target.value); setMissing(''); }} />
      </Field>
      <Button block loading={busy}>دخول</Button>
      <ButtonLink to="/forgot-password" variant="ghost" size="small" block>هل نسيت كلمة المرور؟</ButtonLink>
    </AuthLayout>
  );
}

export function ClientPasswordRecovery() {
  return <PasswordRecovery role="client" />;
}

// ---------- الإطار ----------
export function ClientLayout() {
  const [unread, setUnread] = useState(0);
  const nav = useNavigate();
  useEffect(() => {
    let alive = true;
    const tick = () =>
      localData('/client/notifications/count')
        .then((d) => alive && setUnread(d.unread))
        .catch((e) => e.status === 401 && nav('/login', { replace: true }));
    tick();
    const t = setInterval(tick, 30000);
    return () => { alive = false; clearInterval(t); };
  }, [nav]);
  const logout = async () => { await localData('/client/logout', { method: 'POST' }); nav('/login', { replace: true, state: { loggedOut: true } }); };
  const items = [
    { to: '/portal', label: 'الرئيسية', icon: 'home' },
    { to: '/portal/updates', label: 'التحديثات', icon: 'updates', end: false },
    { to: '/portal/phases', label: 'المراحل', icon: 'phases', end: false },
    { to: '/portal/requests', label: 'المطلوب منك', icon: 'requests' },
    { to: '/portal/files', label: 'الملفات', icon: 'files' },
    { to: '/portal/notifications', label: 'الإشعارات', icon: 'bell', badgeCount: unread },
  ];
  return (
    <div className="app-shell">
      <AppSidebar items={items} label="التنقل" logoTo="/portal" onLogout={logout} />
      <main className="app-main">
        <Outlet context={{ setUnread }} />
      </main>
    </div>
  );
}

// ---------- الرئيسية ----------
export function Portal() {
  const { data, error, loading, reload } = useLocalData('/client/overview');
  const [msg, setMsg] = useState('');
  const conversationRef = useRef(null);
  const { busy, err, run } = useAction();
  const messages = data?.messages;
  useEffect(() => {
    const conversation = conversationRef.current;
    if (conversation) conversation.scrollTop = conversation.scrollHeight;
  }, [messages]);
  if (loading) return <Loading />;
  if (error) return <ErrorBox error={error} />;
  const { client, phases, requests, updates, files } = data;
  const open = requests.filter((r) => r.status === 'open');
  const send = async (e) => {
    e.preventDefault();
    const ok = await run(() => localData('/client/messages', { method: 'POST', body: { body: msg } }), 'تم إرسال رسالتك');
    if (ok) { setMsg(''); reload(); }
  };
  return (
    <Page title={client.project_name} actions={<Chip tone="green" dot>مشروع نشط</Chip>}>
      {client.brand_name && (
        <Card className="brand-identity">
          <div className="brand-identity-copy">
            <img src="/demo/sidra-mark.svg" width="72" height="72" alt="" className="brand-identity-mark" />
            <div className="col gap-1">
              <span className="brand-identity-label">هوية العلامة</span>
              <h2>{client.brand_name}</h2>
              <p className="brand-identity-tagline">{client.brand_tagline}</p>
              <p className="muted small">{client.brand_description}</p>
            </div>
          </div>
          <div className="brand-palette" aria-label="ألوان الهوية">
            {client.brand_palette.map((color) => (
              <span className="brand-color" key={color.value}>
                <i style={{ backgroundColor: color.value }} aria-hidden="true" />
                <b>{color.name}</b>
                <small dir="ltr">{color.value}</small>
              </span>
            ))}
          </div>
        </Card>
      )}
      <Card hl>
        <div className="row between">
          <h2>التقدم العام</h2>
          <strong className="stat">{client.progress}%</strong>
        </div>
        <Bar value={client.progress} label="التقدم العام" />
        {(client.start_date || client.end_date) && <span className="muted"><Range from={fmtDate(client.start_date)} to={fmtDate(client.end_date)} /></span>}
      </Card>

      {open.length > 0 && (
        <Card title={`مطلوب منك (${open.length})`} hl>
          <List>
            {open.map((r) => (
              <Link key={r.id} to="/portal/requests" className="item">
                <div className="row between"><strong>{r.title}</strong><Chip tone="amber">{KIND[r.kind]}</Chip></div>
                {r.description && <span className="muted">{r.description}</span>}
              </Link>
            ))}
          </List>
        </Card>
      )}

      <div className="cols">
        <Card title="آخر التحديثات" actions={<Link to="/portal/updates" className="small">الكل</Link>}>
          {updates.length ? (
            <List>
              {updates.map((u) => (
                <Link key={u.id} to={`/portal/updates/${u.id}`} className={`item${u.unread ? ' unread' : ''}`}>
                  <strong>{u.title}{u.unread && <> <Chip tone="red">جديد</Chip></>}</strong>
                  <span className="muted small">{fmtTime(u.created_at)}</span>
                </Link>
              ))}
            </List>
          ) : <Empty>لا توجد تحديثات بعد.</Empty>}
        </Card>
        <Card title="المراحل" actions={<Link to="/portal/phases" className="small">الكل</Link>}>
          <List>
            {phases.map((p) => (
              <Link key={p.id} to={`/portal/phases/${p.id}`} className="item">
                <div className="row between"><strong>{p.name}</strong><StatusChip s={p.status} /></div>
                {p.total > 0 && <span className="muted small">{p.done} من {p.total} منجز</span>}
              </Link>
            ))}
          </List>
        </Card>
      </div>

      <div className="cols">
        <Card title="ملفات حديثة" actions={<Link to="/portal/files" className="small">الكل</Link>}>
          {files.length ? (
            <List>
              {files.map((f) => (
                <a key={f.id} className="item" href={f.url} target="_blank" rel="noreferrer">{f.name}</a>
              ))}
            </List>
          ) : <Empty>لا توجد ملفات.</Empty>}
        </Card>
        <Card
          title="تواصل مع الفريق"
          className="conversation-card"
          actions={messages.length > 0 && (
            <ClearConversationButton
              audience="فريق المشروع"
              onClear={async () => {
                await localData('/client/messages', { method: 'DELETE' });
                reload();
              }}
            />
          )}
        >
          <div className="conversation-scroll" ref={conversationRef} role="log" aria-label="المحادثة مع فريق المشروع" aria-live="polite" tabIndex={0}>
            {messages.length > 0 ? (
              <List className="conversation-list col gap-2">
              {messages.map((m) => (
                <div key={m.id} className={`bubble${m.from_client ? ' me' : ''}`}>
                  <span className="who">
                    <bdi>{m.from_client ? 'أنت' : 'فريق المشروع'}</bdi>
                    {m.created_at && <> · <time dateTime={m.created_at}><bdi>{fmtTime(m.created_at)}</bdi></time></>}
                  </span>
                  <span className="whitespace-pre-wrap">{m.body}</span>
                </div>
              ))}
              </List>
            ) : <Empty>ابدأ المحادثة مع فريق المشروع.</Empty>}
          </div>
          <form onSubmit={send} className="col gap-2">
            <textarea rows={2} value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="اكتب رسالتك…" aria-label="رسالتك" />
            <FormError message={err} />
            <Button size="small" loading={busy} disabled={busy || !msg.trim()}>إرسال</Button>
          </form>
        </Card>
      </div>
    </Page>
  );
}

// ---------- التحديثات ----------
export function Updates() {
  const { data, error, loading } = useLocalData('/client/updates');
  if (loading) return <Loading />;
  if (error) return <ErrorBox error={error} />;
  return (
    <Page title="التحديثات" sub="كل ما حدث في مشروعك">
      <Card>
        {data.length ? (
          <List>
            {data.map((u) => (
              <Link key={u.id} to={`/portal/updates/${u.id}`} className={`item${u.unread ? ' unread' : ''}`}>
                <div className="row between">
                  <strong>{u.title}</strong>
                  <span className="row">{u.unread && <Chip tone="red">جديد</Chip>}{u.phase_name && <Chip tone="blue">{u.phase_name}</Chip>}</span>
                </div>
                <span className="muted small">{fmtTime(u.created_at)} · {u.comment_count} تعليق</span>
              </Link>
            ))}
          </List>
        ) : <Empty>لا توجد تحديثات بعد.</Empty>}
      </Card>
    </Page>
  );
}

export function UpdateDetail() {
  const { id } = useParams();
  const { data, error, loading, reload } = useLocalData(`/client/updates/${id}`);
  const { setUnread } = useOutletCtx();
  useEffect(() => {
    if (data) localData('/client/notifications/count').then((d) => setUnread(d.unread)).catch(() => {});
  }, [data, setUnread]);
  if (loading) return <Loading />;
  if (error) return <ErrorBox error={error} />;
  const { update, comments } = data;
  return (
    <Page title={update.title} sub={fmtTime(update.created_at)} back={{ to: '/portal/updates', label: 'كل التحديثات' }}>
      <Card>
        {update.phase_name && <div><Chip tone="blue">{update.phase_name}</Chip></div>}
        <p className="max-w-[72ch] whitespace-pre-wrap leading-[1.9]">{update.body || '—'}</p>
      </Card>
      <Card title={`التعليقات (${comments.length})`}>
        <CommentThread comments={comments} me="client" onSend={async (body) => { await localData(`/client/updates/${id}/comments`, { method: 'POST', body: { body } }); reload(); }} />
      </Card>
    </Page>
  );
}

// ---------- المراحل ----------
export function Phases() {
  const { data, error, loading } = useLocalData('/client/phases');
  if (loading) return <Loading />;
  if (error) return <ErrorBox error={error} />;
  return (
    <Page title="المراحل" sub="خطة المشروع من البداية للنهاية">
      <div className="cols">
        {data.map((p) => (
          <LinkCard key={p.id} to={`/portal/phases/${p.id}`}>
            <div className="row between"><h2>{p.name}</h2><StatusChip s={p.status} /></div>
            {(p.start_date || p.end_date) && <span className="muted"><Range from={fmtShort(p.start_date)} to={fmtShort(p.end_date)} /></span>}
            {p.total > 0 && <><Bar value={Math.round((p.done / p.total) * 100)} label={p.name} /><span className="muted small">{p.done} من {p.total} بند منجز</span></>}
          </LinkCard>
        ))}
      </div>
    </Page>
  );
}

export function PhaseDetail() {
  const { id } = useParams();
  const { data, error, loading, reload } = useLocalData(`/client/phases/${id}`);
  const { setUnread } = useOutletCtx();
  useEffect(() => {
    if (data) localData('/client/notifications/count').then((d) => setUnread(d.unread)).catch(() => {});
  }, [data, setUnread]);
  if (loading) return <Loading />;
  if (error) return <ErrorBox error={error} />;
  const { phase, items } = data;
  return (
    <Page title={phase.name} sub={(phase.start_date || phase.end_date) ? <Range from={fmtShort(phase.start_date)} to={fmtShort(phase.end_date)} /> : undefined} actions={<StatusChip s={phase.status} />} back={{ to: '/portal/phases', label: 'كل المراحل' }}>
      {items.length ? items.map((it) => (
        <Card key={it.id}>
          <div className="row between"><strong>{it.name}</strong><StatusChip s={it.status} /></div>
          {it.status === 'done' ? (
            <>
              {it.done_at && <span className="muted small">اكتمل في {fmtDate(it.done_at)}</span>}
              <CommentThread comments={it.comments} me="client" placeholder="علّق على هذا البند المنجز…"
                onSend={async (body) => { await localData(`/client/items/${it.id}/comments`, { method: 'POST', body: { body } }); reload(); }} />
            </>
          ) : <span className="muted small">يمكنك التعليق بعد اكتمال البند.</span>}
        </Card>
      )) : <Card><Empty>لا توجد بنود في هذه المرحلة بعد.</Empty></Card>}
    </Page>
  );
}

// ---------- الطلبات ----------
export function Requests() {
  const { data, error, loading, reload } = useLocalData('/client/requests');
  if (loading) return <Loading />;
  if (error) return <ErrorBox error={error} />;
  const open = data.filter((r) => r.status === 'open');
  const done = data.filter((r) => r.status !== 'open');
  return (
    <Page title="المطلوب منك" sub="قرارات ومحتوى واعتمادات">
      {open.length === 0 && <Card><Empty>لا يوجد شيء مطلوب منك الآن. شكرا!</Empty></Card>}
      <List className="stack">
        {open.map((r) => <FeatureRequestCard key={r.id} request={r} onDone={reload} />)}
      </List>
      {done.length > 0 && <h2 className="mt-2">تم الرد عليها</h2>}
      <List className="stack">
        {done.map((r) => <FeatureRequestCard key={r.id} request={r} onDone={reload} />)}
      </List>
    </Page>
  );
}

// ---------- الملفات ----------
export function Files() {
  const { data, error, loading } = useLocalData('/client/files');
  if (loading) return <Loading />;
  if (error) return <ErrorBox error={error} />;
  return (
    <Page title="الملفات" sub="كل ملفات مشروعك">
      <Card>
        {data.length ? (
          <List>
            {data.map((f) => (
              <a key={f.id} className="item" href={f.url} target="_blank" rel="noreferrer">
                <strong>{f.name}</strong><span className="muted small">{fmtDate(f.created_at)}</span>
              </a>
            ))}
          </List>
        ) : <Empty>لا توجد ملفات بعد.</Empty>}
      </Card>
    </Page>
  );
}

// ---------- الإشعارات ----------
export function Notifications() {
  const { data, error, loading, reload } = useLocalData('/client/notifications');
  const { setUnread } = useOutletCtx();
  const nav = useNavigate();
  useEffect(() => { if (data) setUnread(data.unread); }, [data, setUnread]);
  if (loading) return <Loading />;
  if (error) return <ErrorBox error={error} />;
  const open = async (n) => {
    if (!n.read) await localData(`/client/notifications/${n.id}/read`, { method: 'POST' }).catch(() => {});
    nav(n.href || '/portal');
  };
  const markAll = async () => { await localData('/client/notifications/read-all', { method: 'POST' }); reload(); };
  const pref = async (k) => { await localData('/client/prefs', { method: 'PATCH', body: { [k]: !data.prefs[k] } }); reload(); };
  return (
    <Page title="الإشعارات" actions={data.unread > 0 && <Button variant="secondary" size="small" onClick={markAll}>تعليم الكل كمقروء</Button>}>
      <Card>
        {data.items.length ? (
          <List>
            {data.items.map((n) => (
              <button key={n.id} onClick={() => open(n)} className={`notification-item${n.read ? '' : ' unread'}`}>
                <div className="row between"><strong>{n.text}</strong><Chip tone={n.read ? 'gray' : 'blue'}>{NOTIF_TYPE[n.type] || n.type}</Chip></div>
                <span className="muted small">{fmtTime(n.created_at)}</span>
              </button>
            ))}
          </List>
        ) : <Empty>لا توجد إشعارات.</Empty>}
      </Card>
      <Card title="كيف تصلك الإشعارات؟">
        <p className="muted">الإشعارات تظهر هنا دائما. يمكنك أيضا استقبالها على:</p>
        {[['notify_email', 'البريد الإلكتروني'], ['notify_telegram', 'تليجرام']].map(([k, label]) => (
          <div key={k} className="row between">
            <span>{label}</span>
            <Switch checked={!!data.prefs[k]} label={label} onChange={() => pref(k)} />
          </div>
        ))}
      </Card>
    </Page>
  );
}

function useOutletCtx() {
  return useOutletContext();
}
