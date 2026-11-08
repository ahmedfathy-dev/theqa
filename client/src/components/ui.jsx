import { cloneElement, isValidElement, useEffect, useId, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, m, useReducedMotion } from 'motion/react';
import { useAutoAnimate } from '@formkit/auto-animate/react';
import { gooeyToast } from 'goey-toast';
import { STATUS, STATUS_TONE } from '../format.js';
import { EASE_OUT, SPRING, reveal, rise, swap } from '../lib/motion.js';
import logoColor from '../assets/logo.png';
import logoWhite from '../assets/logo-white.png';

const cx = (...parts) => parts.filter(Boolean).join(' ');

// ---------- icons (one stroke weight, currentColor, mirrored under RTL when direction-bearing) ----------
const ICONS = {
  back: { d: 'M19 12H5m6-6-6 6 6 6', flip: true },
  next: { d: 'm9 6 6 6-6 6', flip: true },
  check: { d: 'm5 12.5 4.5 4.5L19 7.5' },
  copy: { d: 'M8 8h11v11H8zM16 8V5H5v11h3' },
  eye: { d: 'M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z' },
  'eye-off': { d: 'M3 3l18 18M10.6 5.1A10 10 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3.2 4.2M6.5 6.6C3.7 8.4 2 12 2 12s3.6 7 10 7c1.7 0 3.2-.4 4.5-1M9.9 9.9a3 3 0 0 0 4.2 4.2' },
  logout: { d: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9', flip: true },
  bell: { d: 'M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0' },
  alert: { d: 'M12 8v5m0 3.5h.01M10.3 3.9 2.4 17.5a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z' },
  trash: { d: 'M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6m5 4v6m4-6v6' },
  home: { d: 'm3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z' },
  updates: { d: 'M12 8v4l2.5 2.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z' },
  phases: { d: 'M4 6h16M4 12h16M4 18h16M7 6h.01M7 12h.01M7 18h.01' },
  requests: { d: 'M8 5H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-3M8 5a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2M8 5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2M8 12h8M8 16h6' },
  files: { d: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M8 13h8M8 17h8' },
  clients: { d: 'M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M10 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM20 8v6M23 11h-6' },
  settings: { d: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-1.6 2.77-.08-.02a1.7 1.7 0 0 0-1.76.5l-.05.06h-3.2l-.04-.07a1.7 1.7 0 0 0-1.56-.9 1.7 1.7 0 0 0-.68.14l-.08.03-2.77-1.6.02-.08a1.7 1.7 0 0 0-.5-1.76l-.06-.05v-3.2l.07-.04a1.7 1.7 0 0 0 .76-2.24l-.03-.08 1.6-2.77.08.02a1.7 1.7 0 0 0 1.76-.5l.05-.06h3.2l.04.07a1.7 1.7 0 0 0 2.24.76l.08-.03 2.77 1.6-.02.08a1.7 1.7 0 0 0 .5 1.76l.06.05v3.2z' },
  add: { d: 'M12 5v14M5 12h14' },
  chevron: { d: 'm6 9 6 6 6-6' },
};

export function Icon({ name, className = 'size-4' }) {
  const { d, flip } = ICONS[name];
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={cx('flex-none', flip && 'rtl:-scale-x-100', className)} aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

// Cross-fades between two icons on an infrequent state change (copy -> copied, show -> hide).
export function SwapIcon({ name }) {
  return (
    <span className="relative grid size-4 place-items-center">
      <AnimatePresence initial={false} mode="popLayout">
        <m.span key={name} className="absolute inset-0 grid place-items-center" {...swap}>
          <Icon name={name} />
        </m.span>
      </AnimatePresence>
    </span>
  );
}

// Brand logo. Intrinsic size (251x200) is set so the browser reserves space and never distorts it;
// height comes from className, width follows. Use variant="white" on brand-colored backgrounds.
export function Logo({ variant = 'color', className = 'h-10', alt = '' }) {
  return <img src={variant === 'white' ? logoWhite : logoColor} width={251} height={200} alt={alt} draggable={false} className={cx('w-auto max-w-none flex-none select-none object-contain', className)} />;
}

// ---------- status ----------
export const Chip = ({ tone = 'gray', dot = false, live = false, children }) => (
  <span className={`chip ${tone}`}>
    {dot && <span className={cx('chip-dot', live && 'live')} aria-hidden="true" />}
    {children}
  </span>
);
export const StatusChip = ({ s }) => <Chip tone={STATUS_TONE[s]} dot live={s === 'current'}>{STATUS[s]}</Chip>;

// ---------- buttons ----------
// Variants: primary, secondary, outline, ghost, danger, success. Sizes: medium (44px), small (40px).
// `icon` makes a square icon-only button: always pass aria-label.
const BUTTON_VARIANTS = { primary: 'btn-primary', secondary: 'btn-secondary', outline: 'btn-outline', ghost: 'btn-ghost', quiet: 'btn-ghost', danger: 'btn-danger', success: 'btn-success' };
const BUTTON_SIZES = { medium: 'btn-md', small: 'btn-sm' };
const buttonClass = ({ variant, size, icon, block, className }) =>
  cx('btn', BUTTON_VARIANTS[variant] || BUTTON_VARIANTS.primary, BUTTON_SIZES[size] || BUTTON_SIZES.medium, icon && 'btn-icon', block && 'btn-block', className);

// While `loading`, the button stays focusable (aria-disabled) but swallows clicks and implicit form submits.
export function Button({ variant = 'primary', size = 'medium', icon = false, block = false, loading = false, disabled = false, className = '', onClick, children, ...props }) {
  return (
    <button
      className={buttonClass({ variant, size, icon, block, className })}
      disabled={disabled && !loading}
      aria-disabled={loading || undefined}
      aria-busy={loading || undefined}
      onClick={loading ? (e) => e.preventDefault() : onClick}
      {...props}
    >
      {loading && <span className="spinner" aria-hidden="true" />}
      {!(loading && icon) && children}
    </button>
  );
}

export function ButtonLink({ to, variant = 'primary', size = 'medium', icon = false, block = false, className = '', children, ...props }) {
  return <Link to={to} className={buttonClass({ variant, size, icon, block, className })} {...props}>{children}</Link>;
}

// ---------- forms ----------
const isControlElement = (el) => isValidElement(el) && (['input', 'select', 'textarea'].includes(el.type) || el.type?.isControl);

export function Field({ label, children, error, hint }) {
  const id = useId();
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const isControl = isControlElement(children);
  const Label = isControl ? 'label' : 'span';
  const controlId = isControl ? children.props.id || id : undefined;
  const describedBy = [error && errorId, hint && hintId].filter(Boolean).join(' ') || undefined;
  return (
    <div className="field">
      <Label className="field-label" htmlFor={controlId}>{label}</Label>
      {isControl ? cloneElement(children, { id: controlId, 'aria-invalid': error ? true : undefined, 'aria-describedby': describedBy }) : children}
      {hint && <p id={hintId} className="field-hint">{hint}</p>}
      <FormError id={errorId} message={error} />
    </div>
  );
}

export function Select({ id, value, onChange, options, disabled = false, ...props }) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [placement, setPlacement] = useState('bottom');
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const optionRefs = useRef([]);
  const listboxId = useId();
  const selectedIndex = options.findIndex((option) => option.value === value);
  const activeOption = options[activeIndex];
  const invalid = props['aria-invalid'] === true;

  useEffect(() => {
    if (!open) return undefined;
    const closeOnOutsideClick = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener('pointerdown', closeOnOutsideClick);
    return () => document.removeEventListener('pointerdown', closeOnOutsideClick);
  }, [open]);

  useEffect(() => {
    if (open) optionRefs.current[activeIndex]?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex, open]);

  const showOptions = (index = selectedIndex >= 0 ? selectedIndex : 0) => {
    const bounds = triggerRef.current?.getBoundingClientRect();
    if (bounds) {
      const menuHeight = Math.min(256, options.length * 44 + 12);
      setPlacement(window.innerHeight - bounds.bottom < menuHeight && bounds.top > window.innerHeight - bounds.bottom ? 'top' : 'bottom');
    }
    setActiveIndex(index);
    setOpen(true);
  };
  const choose = (option) => {
    onChange(option.value);
    setOpen(false);
    triggerRef.current?.focus();
  };
  const onKeyDown = (event) => {
    if (disabled) return;
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const direction = event.key === 'ArrowDown' ? 1 : -1;
      if (!open) showOptions();
      else setActiveIndex((index) => (index + direction + options.length) % options.length);
    } else if (event.key === 'Home' && open) {
      event.preventDefault();
      setActiveIndex(0);
    } else if (event.key === 'End' && open) {
      event.preventDefault();
      setActiveIndex(options.length - 1);
    } else if ((event.key === 'Enter' || event.key === ' ') && open) {
      event.preventDefault();
      if (activeOption) choose(activeOption);
    } else if (event.key === 'Escape' && open) {
      event.preventDefault();
      setOpen(false);
    } else if ((event.key === 'Enter' || event.key === ' ') && !open) {
      event.preventDefault();
      showOptions();
    }
  };

  return (
    <div className="select-control" ref={rootRef}>
      <button
        {...props}
        ref={triggerRef}
        id={id}
        type="button"
        role="combobox"
        className="select-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-activedescendant={open && activeOption ? `${listboxId}-option-${activeIndex}` : undefined}
        aria-invalid={invalid || undefined}
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : showOptions())}
        onKeyDown={onKeyDown}
      >
        <span className={selectedIndex < 0 ? 'select-placeholder' : undefined}>
          {selectedIndex >= 0 ? options[selectedIndex].label : 'اختر خيارًا'}
        </span>
        <Icon name="chevron" className="select-chevron size-4" />
      </button>
      <div
        className="select-menu"
        id={listboxId}
        role="listbox"
        aria-labelledby={id}
        data-placement={placement}
        hidden={!open}
      >
        {options.map((option, index) => (
          <div
            key={option.value}
            id={`${listboxId}-option-${index}`}
            ref={(element) => { optionRefs.current[index] = element; }}
            role="option"
            aria-selected={value === option.value}
            className="select-option"
            data-active={index === activeIndex}
            data-selected={value === option.value}
            onPointerMove={() => setActiveIndex(index)}
            onClick={() => choose(option)}
          >
            <span>{option.label}</span>
            {value === option.value && <Icon name="check" className="size-4" />}
          </div>
        ))}
      </div>
    </div>
  );
}
Select.isControl = true;

export function PasswordInput(props) {
  const [show, setShow] = useState(false);
  return (
    <div className="input-wrap">
      <input {...props} type={show ? 'text' : 'password'} />
      <Button type="button" variant="ghost" size="small" icon aria-label={show ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'} aria-pressed={show} onClick={() => setShow((v) => !v)}>
        <SwapIcon name={show ? 'eye-off' : 'eye'} />
      </Button>
    </div>
  );
}
PasswordInput.isControl = true;

export function FormError({ message, id }) {
  return (
    <AnimatePresence initial={false}>
      {message && (
        <m.p key="error" id={id} role="alert" className="field-error" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2, ease: EASE_OUT }}>
          <Icon name="alert" />
          <span>{message}</span>
        </m.p>
      )}
    </AnimatePresence>
  );
}

export function ChoiceGroup({ name, options, value, onChange, ariaLabel }) {
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,10rem),1fr))] gap-2.5" role="radiogroup" aria-label={ariaLabel}>
      {options.map((option) => (
        <label className="choice" data-checked={value === option.value} key={option.value}>
          <input type="radio" name={name} value={option.value} checked={value === option.value} onChange={() => onChange(option.value)} className="sr-only" />
          <span className="choice-dot" aria-hidden="true" />
          <span className="text-base font-medium">{option.label}</span>
          {option.description && <span className="w-full text-sm font-normal text-muted">{option.description}</span>}
        </label>
      ))}
    </div>
  );
}

export function Switch({ checked, onChange, label }) {
  return (
    <button type="button" className="switch" role="switch" aria-checked={checked} aria-label={label} onClick={onChange}>
      <span className="switch-track"><m.span layout transition={SPRING} className="switch-thumb" /></span>
      <span>{checked ? 'مفعّل' : 'متوقف'}</span>
    </button>
  );
}

// Date range with a direction-aware separator (replaces the "←" glyph).
export const Range = ({ from, to }) => (
  <span className="inline-flex items-center gap-1.5">{from}<Icon name="next" className="size-3.5" />{to}</span>
);

// ---------- progress ----------
export function Bar({ value = 0, label }) {
  const reduce = useReducedMotion();
  const pct = Math.min(100, Math.max(0, value));
  return (
    <div className="bar" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
      <m.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={reduce ? { duration: 0 } : { duration: 0.7, ease: EASE_OUT }} />
    </div>
  );
}

// ---------- structure ----------
// Reveal: one staggered entrance per route. Cards inside inherit the variants.
export const Reveal = ({ className = 'stack', children }) => (
  <m.div className={className} variants={reveal} initial="hidden" animate="show">{children}</m.div>
);

export const Page = ({ title, sub, children, actions, back }) => (
  <Reveal>
    <m.header variants={rise} className="page-head row between">
      <div>
        {back && <Link to={back.to} className="page-back"><Icon name="back" />{back.label}</Link>}
        {sub && <div className="muted">{sub}</div>}
        <h1>{title}</h1>
      </div>
      {actions}
    </m.header>
    {children}
  </Reveal>
);

const CARD_TAGS = { section: m.section, form: m.form, div: m.div };
export function Card({ as = 'section', title, children, hl, actions, className, ...props }) {
  const Tag = CARD_TAGS[as];
  return (
    <Tag variants={rise} className={cx('card', hl && 'hl', className)} {...props}>
      {(title || actions) && (
        <div className="row between">
          {title && <h2>{title}</h2>}
          {actions}
        </div>
      )}
      {children}
    </Tag>
  );
}

const MotionLink = m.create(Link);
export const LinkCard = ({ className, ...props }) => <MotionLink variants={rise} className={cx('card', className)} {...props} />;

// Auto-animated container for lists whose rows are added, removed or reordered.
export function List({ className = 'list', children, ...props }) {
  const [ref] = useAutoAnimate({ duration: 200, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' });
  return <div ref={ref} className={className} {...props}>{children}</div>;
}

// Rendering is paused inside a view-transition callback, so wait on a timer, never requestAnimationFrame.
const settle = () => new Promise((resolve) => setTimeout(resolve, 60));

export function NavTabs({ items, id, label, start, end }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  // Wrap plain left-clicks in a View Transition; modified clicks, same-page clicks,
  // unsupported browsers and reduced-motion users get the normal navigation.
  const go = (e, to) => {
    if (!document.startViewTransition || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (to === pathname || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    e.preventDefault();
    document.startViewTransition(async () => {
      flushSync(() => navigate(to));
      await settle(); // let the route's data resolve so the new snapshot is the real page
    });
  };
  const tabsRef = useRef(null);
  useEffect(() => {
    tabsRef.current?.querySelector('.active')?.scrollIntoView({ inline: 'nearest', block: 'nearest' });
  }, [pathname]);
  return (
    <nav className="nav" aria-label={label} style={{ viewTransitionName: id }}>
      {start}
      <div className="nav-tabs" ref={tabsRef}>
        {items.map(({ to, label: text, end: exact = true, badge }) => (
          <NavLink key={to} to={to} end={exact} className="nav-link" onClick={(e) => go(e, to)}>
            {({ isActive }) => (
              <>
                {isActive && <m.span layoutId={id} className="nav-pill" transition={SPRING} />}
                <span className="nav-label">{text}{badge}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
      {end && <div className="nav-actions">{end}</div>}
    </nav>
  );
}

export function AppSidebar({ items, logoTo, onLogout, trailing, label }) {
  const [logoutOpen, setLogoutOpen] = useState(false);
  return (
    <aside className="app-sidebar">
      <Link to={logoTo} className="sidebar-brand" aria-label="ثقة، الصفحة الرئيسية">
        <Logo className="h-12" />
      </Link>
      <nav className="sidebar-nav" aria-label={label}>
        {items.map(({ to, label: text, icon, end = true, badgeCount = 0 }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className="sidebar-link"
            title={badgeCount > 0 ? `${text}، ${badgeCount} غير مقروء` : text}
            aria-label={badgeCount > 0 ? `${text}، ${badgeCount} غير مقروء` : text}
          >
            <Icon name={icon} className="size-5" />
            <span className="sidebar-label">{text}</span>
            {badgeCount > 0 && <span className="sidebar-count" aria-hidden="true">{badgeCount > 99 ? '99+' : badgeCount}</span>}
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-footer">
        <button type="button" className="sidebar-logout" onClick={() => setLogoutOpen(true)}>
          <Icon name="logout" className="size-5" />
          <span className="sidebar-label">تسجيل الخروج</span>
        </button>
      </div>
      <LogoutDialog open={logoutOpen} onClose={() => setLogoutOpen(false)} onLogout={onLogout} />
    </aside>
  );
}

// Logo that links home, for the start of the nav bar.
export const NavLogo = ({ to }) => (
  <Link to={to} className="nav-logo" aria-label="ثقة، الصفحة الرئيسية"><Logo className="h-9" /></Link>
);

// Modal on the native <dialog>: focus trap, Esc and inert background come from the platform;
// Motion only animates the overlay and panel in and out.
function DialogShell({ title, description, icon = 'logout', tone, confirmLabel, cancelLabel, busy, error, onConfirm, onCancel }) {
  const ref = useRef(null);
  const titleId = useId();
  const descId = useId();
  useEffect(() => {
    const dialog = ref.current;
    dialog.showModal();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = overflow;
      if (dialog.open) dialog.close();
    };
  }, []);
  const cancel = () => { if (!busy) onCancel(); };
  return (
    <dialog ref={ref} className="dialog" aria-labelledby={titleId} aria-describedby={descId} onCancel={(e) => { e.preventDefault(); cancel(); }}>
      <m.div className="dialog-overlay" onClick={cancel} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} />
      <div className="dialog-wrap" onClick={(e) => { if (e.target === e.currentTarget) cancel(); }}>
        <m.div
          className="dialog-panel"
          initial={{ opacity: 0, scale: 0.96, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: 4 }}
          transition={{ duration: 0.2, ease: EASE_OUT }}
        >
          <span className={cx('dialog-icon', tone === 'danger' && 'danger')}><Icon name={icon} className="size-5" /></span>
          <div className="flex flex-col gap-1">
            <h2 id={titleId}>{title}</h2>
            <p id={descId} className="muted">{description}</p>
          </div>
          <FormError message={error} />
          <div className="dialog-actions">
            <Button variant="secondary" type="button" autoFocus disabled={busy} onClick={cancel}>{cancelLabel}</Button>
            <Button variant={tone === 'danger' ? 'danger' : 'primary'} type="button" loading={busy} onClick={onConfirm}>{confirmLabel}</Button>
          </div>
        </m.div>
      </div>
    </dialog>
  );
}

export const ConfirmDialog = ({ open, ...props }) => (
  <AnimatePresence>{open && <DialogShell key="dialog" {...props} />}</AnimatePresence>
);

export function ClearConversationButton({ onClear, audience }) {
  const [open, setOpen] = useState(false);
  const { busy, err, run } = useAction();
  const confirmClear = async () => {
    if (await run(onClear, 'تم مسح المحادثة')) setOpen(false);
  };
  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="small"
        className="text-bad-700 hover:bg-bad-50"
        onClick={() => setOpen(true)}
      >
        <Icon name="trash" />
        مسح الشات
      </Button>
      <ConfirmDialog
        open={open}
        title="مسح المحادثة؟"
        description={`سيتم حذف جميع الرسائل بينك وبين ${audience} نهائيًا، ولا يمكن استعادتها.`}
        icon="trash"
        tone="danger"
        confirmLabel="مسح المحادثة"
        cancelLabel="إلغاء"
        busy={busy}
        error={err}
        onConfirm={confirmClear}
        onCancel={() => setOpen(false)}
      />
    </>
  );
}

export function LogoutDialog({ open, onClose, onLogout }) {
  const { busy, err, run } = useAction();
  return (
    <ConfirmDialog
      open={open}
      title="تسجيل الخروج؟"
      description="ستنتهي جلستك على هذا الجهاز، ويمكنك الدخول مرة أخرى في أي وقت."
      confirmLabel="تسجيل خروج"
      cancelLabel="البقاء"
      busy={busy}
      error={err}
      onConfirm={() => run(onLogout)}
      onCancel={onClose}
    />
  );
}

export function LogoutButton({ onLogout }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button type="button" variant="secondary" size="small" onClick={() => setOpen(true)}>
        <Icon name="logout" />
        تسجيل خروج
      </Button>
      <LogoutDialog open={open} onClose={() => setOpen(false)} onLogout={onLogout} />
    </>
  );
}

// Shared sign-in shell for client and admin: brand panel (wide screens) + form.
export function AuthLayout({ brand, heading, description, points, preview, mobilePreview, notice, onSubmit, children }) {
  return (
    <Reveal className="auth">
      <m.div variants={rise} className="auth-card">
        <aside className="auth-aside">
          <Logo variant="white" className="h-20 self-start" />
          {preview && <div className="auth-preview-desktop">{preview}</div>}
          <div className="col gap-4">
            <h2>{brand}</h2>
            <ul className="auth-points">
              {points.map((point) => <li key={point}><Icon name="check" className="size-4" />{point}</li>)}
            </ul>
          </div>
        </aside>
        <form className="auth-form" onSubmit={onSubmit} noValidate>
          <Logo className="h-16 self-start lg:hidden" alt="ثقة" />
          <div className="flex flex-col gap-3">
            <h1>{heading}</h1>
            {description && <p className="muted">{description}</p>}
          </div>
          {mobilePreview && <div className="auth-preview-mobile">{mobilePreview}</div>}
          {notice && <p className="notice" role="status"><Icon name="check" />{notice}</p>}
          {children}
        </form>
      </m.div>
    </Reveal>
  );
}

// ---------- states ----------
export const Loading = () => (
  <div className="stack" role="status" aria-live="polite">
    <span className="sr-only">جارٍ التحميل…</span>
    <div className="flex min-h-16 flex-col justify-center gap-2" aria-hidden="true">
      <div className="skeleton h-4 w-28" />
      <div className="skeleton h-7 w-60 max-w-full" />
    </div>
    <div className="card" aria-hidden="true">
      <div className="skeleton h-5 w-40" />
      <div className="skeleton h-2 w-full" />
      <div className="skeleton h-4 w-2/3" />
    </div>
    <div className="cols" aria-hidden="true">
      {[0, 1].map((i) => (
        <div className="card" key={i}>
          <div className="skeleton h-5 w-32" />
          <div className="skeleton h-4 w-full" />
          <div className="skeleton h-4 w-3/4" />
        </div>
      ))}
    </div>
  </div>
);
export const ErrorBox = ({ error }) => <p className="card err" role="alert">{error?.message || 'تعذر التحميل'}</p>;
export const Empty = ({ children }) => <p className="empty">{children}</p>;

// يشغّل إجراء مع حالة انشغال ورسالة خطأ
export function useAction() {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const run = async (fn, successMessage) => {
    setBusy(true);
    setErr('');
    try {
      await fn();
      if (successMessage) {
        gooeyToast.success(successMessage, {
          fillColor: '#ffffff',
          borderColor: '#dce6e9',
          preset: 'subtle',
          showTimestamp: false,
        });
      }
      return true;
    } catch (e) {
      setErr(e.message);
      return false;
    } finally {
      setBusy(false);
    }
  };
  return { busy, err, run };
}

// خيط تعليقات. me = من يشاهد: 'client' أو 'team'
export function CommentThread({ comments = [], me = 'client', onSend, canSend = true, placeholder = 'اكتب تعليقك…', button = 'إرسال' }) {
  const [body, setBody] = useState('');
  const { busy, err, run } = useAction();
  const submit = async (e) => {
    e.preventDefault();
    if (!body.trim()) return;
    const ok = await run(() => onSend(body), 'تم إرسال التعليق');
    if (ok) setBody('');
  };
  const name = (a) => (a === me ? 'أنت' : a === 'team' ? 'فريق المشروع' : 'العميل');
  return (
    <div className="col">
      {comments.length > 0 && (
        <List className="col gap-2">
          {comments.map((c) => (
            <div key={c.id} className={`bubble${c.author === me ? ' me' : ''}`}>
              <span className="who">{name(c.author)}</span>
              <span className="whitespace-pre-wrap">{c.body}</span>
            </div>
          ))}
        </List>
      )}
      {canSend && (
        <form onSubmit={submit} className="col gap-2">
          <textarea rows={2} value={body} onChange={(e) => setBody(e.target.value)} placeholder={placeholder} aria-label={placeholder} />
          <FormError message={err} />
          <Button size="small" loading={busy} disabled={busy || !body.trim()}>{button}</Button>
        </form>
      )}
    </div>
  );
}

export function Gantt({ phases, start, end }) {
  const dated = phases.filter((p) => p.start_date && p.end_date);
  if (!dated.length) return <p className="muted">أضف تواريخ للمراحل لتظهر على الجدول الزمني.</p>;
  const t = (d) => new Date(d).getTime();
  const min = Math.min(...dated.map((p) => t(p.start_date)), start ? t(start) : Infinity);
  const max = Math.max(...dated.map((p) => t(p.end_date)), end ? t(end) : -Infinity);
  const span = Math.max(max - min, 1);
  return (
    <div className="gantt">
      {dated.map((p, i) => (
        <div className="gantt-row" key={p.id}>
          <span title={p.name}>{p.name}</span>
          <div className="gantt-track">
            <m.div
              className={`gantt-bar ${p.status}`}
              style={{ insetInlineStart: `${((t(p.start_date) - min) / span) * 100}%`, width: `${((t(p.end_date) - t(p.start_date)) / span) * 100}%` }}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.5, ease: EASE_OUT, delay: 0.08 + i * 0.05 }}
              title={`${p.start_date} – ${p.end_date}`}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
