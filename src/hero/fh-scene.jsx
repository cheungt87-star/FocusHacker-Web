// fh-scene.jsx — the macOS desktop scene for the FocusHacker hero loop.

import React from "react";
import { clamp as fhClamp, Easing as FE, useTime as fhUseTime } from "./animations.jsx";
import {
  FH,
  CursorArrow,
  FocusMark,
  FocusTile,
  AppleLogo,
  WifiGlyph,
  BatteryGlyph,
  SpotlightGlyph,
  ControlCenterGlyph,
  TrafficLights,
  Flame,
} from "./fh-icons.jsx";

// ── timeline marks (seconds) — total loop is set in mount.jsx ─────────────────
const MARKS = {
  cursorToIcon: [0.4, 0.9],
  iconClick: 0.9,
  panelOpen: [0.9, 1.25],
  cursorToTog1: [1.18, 1.65],
  tog1: 1.52,
  cursorToTog2: [1.62, 1.94],
  tog2: 1.96,
  cursorToDuration: [3.2, 3.7],
  durationPick: 3.75,
  cursorToStart: [3.85, 4.5],
  btnPress: 4.58,
  panelClose: [4.66, 4.92],
  activeOn: 6.38,
  cursorToDock: [8.8, 9.2],
  dockClick: 9.25,
  browserIn: [9.3, 9.8],
  urlTyping: [9.85, 11.05],
  blockedIn: [11.45, 11.85],
  blockedOut: [13.0, 13.35],
  browserOut: [13.2, 13.6],
  work1End: 14.5,
  restIn: 14.5,
  restOut: 16.5,
  focusResume: 16.5,
  work2End: 21.5,
  endingSoonIn: 21.5,
  endingPulse: [21.8, 22.7],
  complete: 23.0,
  completeIn: [23.1, 23.4],
  completeOut: [23.9, 24.22],
  heroIn: [24.0, 24.5],
  heroOut: [27.4, 28.0],
  idleReset: 28.06,
  sessionMins: 50,
  rest: { x: 762, y: 548 },
  iconPt: { x: 1115, y: 15 },
  tog1Pt: { x: 1132, y: 283 },
  tog2Pt: { x: 1132, y: 321 },
  durationPt: { x: 1015, y: 318 },
  startPt: { x: 1015, y: 412 },
  dockPt: { x: 598, y: 838 },
  addressBarPt: { x: 720, y: 164 },
  workCursorPt: { x: 520, y: 420 },
};

const URL_TARGET = 'x.com';

function sessionElapsedSec(t) {
  const M = MARKS;
  const work1P = seg(t, M.activeOn, M.work1End, FE.easeInOutSine);
  let elapsed = Math.round(work1P * 20 * 60);
  if (t >= M.restIn && t < M.focusResume) return Math.round(20 * 60);
  if (t >= M.focusResume && t < M.endingSoonIn) {
    const work2P = seg(t, M.focusResume, M.endingSoonIn, FE.easeInOutSine);
    return Math.round(20 * 60 + work2P * 28 * 60);
  }
  if (t >= M.endingSoonIn && t < M.complete) return 48 * 60;
  return elapsed;
}

function restCountdownSec(t) {
  const M = MARKS;
  const remaining = Math.round((1 - seg(t, M.restIn, M.restOut, FE.linear)) * 300);
  return fhClamp(remaining, 0, 300);
}

function formatElapsed(sec) {
  const mm = String(Math.floor(sec / 60)).padStart(2, '0');
  const ss = String(sec % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}

function urlTypedText(t) {
  const M = MARKS;
  const p = seg(t, M.urlTyping[0], M.urlTyping[1], FE.linear);
  const n = Math.floor(p * URL_TARGET.length);
  return URL_TARGET.slice(0, n);
}

// progress 0..1 within [a,b], optionally eased
function seg(t, a, b, ease) {
  const e = ease || FE.linear;
  return e(fhClamp((t - a) / (b - a), 0, 1));
}
const lerp = (a, b, p) => a + (b - a) * p;

// ── Menubar ───────────────────────────────────────────────────────────────────
function Menubar({ iconState, pulse, timerText, showTimer, iconFlash, inRest }) {
  return (
    <div style={{
      position: 'absolute', top: 0, left: 0, right: 0, height: 30,
      background: 'rgba(248,248,250,0.66)', backdropFilter: 'blur(22px) saturate(150%)',
      WebkitBackdropFilter: 'blur(22px) saturate(150%)',
      borderBottom: '1px solid rgba(0,0,0,0.07)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 14px', zIndex: 60, fontSize: 13.5, color: 'rgba(0,0,0,0.82)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 19 }}>
        <AppleLogo size={15} />
        <span style={{ fontWeight: 700 }}>Draft</span>
        {['File', 'Edit', 'Insert', 'Format', 'View', 'Window', 'Help'].map((m, i) => (
          <span key={m} style={{ fontWeight: 400, opacity: i === 0 ? 0.95 : 0.8 }}>{m}</span>
        ))}
      </div>
      {/* right cluster — system glyphs anchored at far right */}
      <div style={{ position: 'absolute', right: 14, top: 0, height: 30, display: 'flex', alignItems: 'center', gap: 16 }}>
        <BatteryGlyph size={26} />
        <WifiGlyph size={17} />
        <SpotlightGlyph size={15} />
        <ControlCenterGlyph size={16} />
        <span style={{ fontWeight: 500, fontSize: 13.5 }}>Mon&nbsp;2&nbsp;Jun</span>
        <span style={{ fontWeight: 500, fontSize: 13.5, fontVariantNumeric: 'tabular-nums' }}>9:41&nbsp;AM</span>
      </div>
      {/* FocusHacker menubar item — fixed right anchor, lights up orange while active */}
      <div style={{
        position: 'absolute', right: 312, top: 3, height: 24,
        display: 'flex', alignItems: 'center', gap: 6,
        padding: showTimer ? '0 9px' : '0 4px',
        borderRadius: 7,
        background: iconFlash ? 'rgba(0,0,0,0.09)'
          : inRest ? 'rgba(91,141,239,0.16)'
          : iconState === 'active' ? 'rgba(255,107,53,0.16)'
          : iconState === 'complete' ? 'rgba(74,155,111,0.18)' : 'transparent',
        boxShadow: inRest ? `inset 0 0 0 1px ${FH.blue}55`
          : iconState === 'active' ? `inset 0 0 0 1px ${FH.orange}55`
          : iconState === 'complete' ? `inset 0 0 0 1px ${FH.teal}55` : 'none',
        transition: 'background 160ms, box-shadow 160ms',
      }}>
        <FocusMark size={17} state={iconState} pulse={pulse} />
        {showTimer && (
          <span style={{ fontVariantNumeric: 'tabular-nums', fontSize: 13, fontWeight: 700,
            color: iconState === 'complete' ? FH.tealDeep : inRest ? FH.blueDeep : FH.orangeDeep, letterSpacing: '0.01em' }}>
            {timerText}
          </span>
        )}
      </div>
    </div>
  );
}

// ── Pre-session messy desktop ───────────────────────────────────────────────────
function MiniAppWindow({ title, width, height, left, top, zIndex, opacity, children }) {
  return (
    <div style={{
      position: 'absolute', left, top, width, height, zIndex, opacity,
      background: '#fff', borderRadius: 13, overflow: 'hidden',
      boxShadow: '0 2px 1px rgba(0,0,0,0.05), 0 16px 40px rgba(20,20,30,0.18)',
    }}>
      <div style={{ height: 36, display: 'flex', alignItems: 'center', padding: '0 12px',
        borderBottom: '1px solid rgba(0,0,0,0.06)', background: 'rgba(252,252,253,0.95)' }}>
        <TrafficLights />
        <div style={{ flex: 1, textAlign: 'center', fontSize: 12, fontWeight: 600, color: 'rgba(0,0,0,0.45)', marginRight: 40 }}>
          {title}
        </div>
      </div>
      <div style={{ position: 'absolute', top: 36, left: 0, right: 0, bottom: 0, overflow: 'hidden' }}>
        {children}
      </div>
    </div>
  );
}

function MessyMessagesContent() {
  const bubbles = [
    { side: 'left', text: 'You free at 3?', color: '#e8e8ed' },
    { side: 'right', text: 'Maybe — in a bit', color: '#34C759' },
    { side: 'left', text: 'Also this doc 👀', color: '#e8e8ed' },
    { side: 'left', text: 'Ping when you can', color: '#e8e8ed' },
  ];
  return (
    <div style={{ padding: 14, fontFamily: '-apple-system, system-ui, sans-serif', fontSize: 12.5 }}>
      {bubbles.map((b, i) => (
        <div key={i} style={{
          display: 'flex', justifyContent: b.side === 'right' ? 'flex-end' : 'flex-start', marginBottom: 8,
        }}>
          <div style={{
            maxWidth: '78%', padding: '8px 11px', borderRadius: 14,
            background: b.side === 'right' ? b.color : b.color,
            color: b.side === 'right' ? '#fff' : '#1d1d1f',
          }}>{b.text}</div>
        </div>
      ))}
    </div>
  );
}

function MessyMailContent() {
  const rows = ['Re: Q2 deck — thoughts?', 'Invoice #1042', 'Team standup notes', 'Your receipt from…'];
  return (
    <div style={{ padding: '8px 0', fontFamily: '-apple-system, system-ui, sans-serif', fontSize: 12 }}>
      {rows.map((r, i) => (
        <div key={i} style={{
          padding: '9px 14px', borderBottom: '1px solid rgba(0,0,0,0.05)',
          fontWeight: i === 0 ? 600 : 400, color: i === 0 ? '#1d1d1f' : 'rgba(0,0,0,0.65)',
          background: i === 0 ? 'rgba(0,122,255,0.06)' : 'transparent',
        }}>{r}</div>
      ))}
    </div>
  );
}

function MessySafariContent() {
  return (
    <div style={{ padding: 12, fontFamily: '-apple-system, system-ui, sans-serif' }}>
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        {['News', 'Reddit', 'YouTube', 'Twitter'].map((tab, i) => (
          <div key={tab} style={{
            padding: '5px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600,
            background: i === 0 ? 'rgba(0,0,0,0.08)' : 'rgba(0,0,0,0.04)',
            color: 'rgba(0,0,0,0.55)',
          }}>{tab}</div>
        ))}
      </div>
      <div style={{ height: 120, borderRadius: 8, background: 'linear-gradient(180deg, #f0f0f2, #e8e8ec)' }} />
    </div>
  );
}

function MessySlackContent() {
  return (
    <div style={{ display: 'flex', height: '100%' }}>
      <div style={{ width: 52, background: '#4A154B', padding: '10px 6px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {['#', 'G', 'D'].map((c) => (
          <div key={c} style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(255,255,255,0.2)', color: '#fff', fontSize: 11, fontWeight: 700, display: 'grid', placeItems: 'center' }}>{c}</div>
        ))}
      </div>
      <div style={{ flex: 1, padding: 10, fontFamily: '-apple-system, system-ui, sans-serif', fontSize: 11.5 }}>
        <div style={{ fontWeight: 700, color: '#1d1d1f', marginBottom: 8 }}># general</div>
        {['Alex: quick sync?', 'Sam: pushed the PR', 'Jordan: lol same'].map((m) => (
          <div key={m} style={{ marginBottom: 6, color: 'rgba(0,0,0,0.65)' }}>{m}</div>
        ))}
      </div>
    </div>
  );
}

function MessyNotesContent() {
  return (
    <div style={{ padding: 14, fontFamily: '-apple-system, system-ui, sans-serif', fontSize: 12, color: '#3c3c43', lineHeight: 1.5 }}>
      <div style={{ fontWeight: 700, marginBottom: 6 }}>Random</div>
      <div>call dentist</div>
      <div>idea: focus app demo</div>
      <div style={{ marginTop: 8, opacity: 0.6 }}>don’t forget…</div>
    </div>
  );
}

const DESKTOP_ICON_GRID = {
  originX: 1210,
  originY: 96,
  colStep: 100,
  rowStep: 98,
  cellW: 88,
};
const DESKTOP_ICON_ITEMS = [
  { label: 'Screenshot 2026', c: '#5AC8FA', col: 0, row: 0 },
  { label: 'Q2 Report', c: '#34C759', col: 0, row: 1 },
  { label: 'Invoice.pdf', c: '#FF3B30', col: 0, row: 2 },
  { label: 'Ideas', c: '#FFCC00', col: 0, row: 3 },
  { label: 'Downloads', c: '#007AFF', col: 0, row: 4 },
  { label: 'Draft v3', c: '#5856D6', col: 0, row: 5 },
  { label: 'Meeting Notes', c: '#AF52DE', col: 1, row: 0 },
  { label: 'Budget.xlsx', c: '#34C759', col: 1, row: 1 },
  { label: 'Photos', c: '#FF9500', col: 1, row: 2 },
  { label: 'Archive', c: '#8E8E93', col: 1, row: 3 },
  { label: 'Todo', c: '#FF2D55', col: 1, row: 4 },
  { label: 'Links', c: '#32ADE6', col: 1, row: 5 },
];

// Axis-aligned cascade — back to front, stays left of desktop icons
const MESSY_WINDOWS = [
  { title: 'Safari', width: 540, height: 300, left: 160, top: 108, zIndex: 12, opacity: 0.94 },
  { title: 'Mail', width: 400, height: 290, left: 228, top: 148, zIndex: 13, opacity: 0.96 },
  { title: 'Messages', width: 360, height: 310, left: 296, top: 188, zIndex: 14, opacity: 0.98 },
  { title: 'Slack', width: 380, height: 270, left: 364, top: 228, zIndex: 15, opacity: 0.98 },
  { title: 'Notes', width: 300, height: 230, left: 432, top: 268, zIndex: 16, opacity: 1 },
];

function MessyDesktop({ t }) {
  const messyOut = t >= MARKS.activeOn
    ? seg(t, MARKS.activeOn - 0.35, MARKS.activeOn, FE.easeInCubic)
    : 0;
  const messyOp = 1 - messyOut;
  if (messyOp <= 0.001) return null;

  const contentByTitle = {
    Safari: <MessySafariContent />,
    Mail: <MessyMailContent />,
    Messages: <MessyMessagesContent />,
    Slack: <MessySlackContent />,
    Notes: <MessyNotesContent />,
  };

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 14, opacity: messyOp, pointerEvents: 'none' }}>
      {MESSY_WINDOWS.map((w) => (
        <MiniAppWindow key={w.title} {...w}>
          {contentByTitle[w.title]}
        </MiniAppWindow>
      ))}
      {DESKTOP_ICON_ITEMS.map((icon) => (
        <div key={icon.label} style={{
          position: 'absolute',
          left: DESKTOP_ICON_GRID.originX + icon.col * DESKTOP_ICON_GRID.colStep,
          top: DESKTOP_ICON_GRID.originY + icon.row * DESKTOP_ICON_GRID.rowStep,
          width: DESKTOP_ICON_GRID.cellW, textAlign: 'center',
          fontFamily: '-apple-system, system-ui, sans-serif',
        }}>
          <div style={{
            width: 52, height: 52, margin: '0 auto 6px', borderRadius: 12,
            background: `linear-gradient(160deg, ${icon.c}, ${icon.c}cc)`,
            boxShadow: '0 2px 8px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.35)',
          }} />
          <div style={{ fontSize: 10.5, fontWeight: 500, color: 'rgba(0,0,0,0.72)', lineHeight: 1.2, wordBreak: 'break-word' }}>
            {icon.label}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Editor (writing app) ───────────────────────────────────────────────────────
const ESSAY = [
  { h: true, text: 'June 2 — Morning' },
  { text: 'The hardest part of deep work isn’t the work itself. It’s the first quiet minute before it begins — the one where every other tab, ping, and half-thought lines up to pull you somewhere easier.' },
  { text: 'Today that minute came easy. I closed the door, started the timer, and the noise simply went away. Three quiet pages before the world woke up.' },
  { text: 'What I keep relearning is that focus isn’t a feeling I wait for. It’s a decision I make once, at the start, and then defend for twenty-five minutes at a time. The streak helps — I don’t want to be the one who breaks it.' },
  { text: 'There’s a particular kind of sentence that only shows up after the tenth minute, once the surface chatter has drained off and the real thinking starts. You can’t rush to it. You can only clear the road and wait.' },
  { text: 'I used to measure mornings by how busy they felt. Now I measure them by how much got finished while nothing was allowed to interrupt. Busy is loud. Done is quiet.' },
  { text: 'The block list did most of the work. By the time my hand drifted toward the browser, the door was already shut. A small wall, but a wall I built on purpose, in a calmer moment, for this exact one.' },
  { text: 'So: another session in the bank. The page is fuller than it was an hour ago, and the part of me that wanted to check everything is, for now, satisfied with having checked nothing.' },
];
const ESSAY_WORDS = ESSAY.reduce((n, p) => n + (p.h ? 0 : p.text.split(' ').length), 0);

function EditorWindow({ t, dim }) {
  const writeP = seg(t, MARKS.activeOn - 0.1, MARKS.work1End, FE.easeInOutSine);
  const op = t >= MARKS.focusResume - 0.25
    ? 1 - seg(t, MARKS.focusResume - 0.25, MARKS.focusResume, FE.easeInCubic)
    : (t >= MARKS.activeOn - 0.2 ? 1 : 0);
  if (op <= 0.001) return null;
  const totalShown = Math.max(0, Math.round(writeP * ESSAY_WORDS));
  const frozen = t >= MARKS.restIn && t < MARKS.focusResume;
  const caretOn = !frozen && Math.floor(t * 2) % 2 === 0;
  const viewRef = React.useRef(null);
  const innerRef = React.useRef(null);
  React.useLayoutEffect(() => {
    const v = viewRef.current, inner = innerRef.current;
    if (!v || !inner) return;
    const over = inner.scrollHeight - v.clientHeight;
    inner.style.transform = `translateY(${-Math.max(0, over)}px)`;
  });

  // build the revealed text, word by word across paragraphs
  let budget = totalShown;
  const wordCount = Math.max(0, Math.round(writeP * 1284));
  const pages = Math.max(1, Math.ceil(wordCount / 300));

  return (
    <div style={{
      position: 'absolute', left: 280, top: 124, width: 880, height: 640,
      background: '#ffffff', borderRadius: 13,
      boxShadow: '0 2px 1px rgba(0,0,0,0.04), 0 28px 60px rgba(20,20,30,0.20)',
      overflow: 'hidden', zIndex: 20, opacity: op,
      filter: dim || frozen ? 'brightness(0.965)' : 'none',
      transform: dim ? 'scale(0.992)' : 'none', transition: 'filter 220ms, transform 220ms, opacity 220ms',
    }}>
      {/* titlebar */}
      <div style={{ height: 44, display: 'flex', alignItems: 'center', padding: '0 16px',
        borderBottom: '1px solid rgba(0,0,0,0.06)', background: 'rgba(252,252,253,0.9)' }}>
        <TrafficLights />
        <div style={{ flex: 1, textAlign: 'center', fontSize: 13, fontWeight: 600, color: 'rgba(0,0,0,0.5)', marginRight: 52 }}>
          Morning Pages — Draft
        </div>
      </div>
      {/* body viewport */}
      <div ref={viewRef} style={{ position: 'absolute', top: 44, left: 0, right: 0, bottom: 38, overflow: 'hidden' }}>
        <div ref={innerRef} style={{ padding: '46px 92px 40px', fontFamily: 'Georgia, "Iowan Old Style", serif', color: '#23252b', willChange: 'transform' }}>
          {ESSAY.map((para, i) => {
            if (para.h) {
              return <div key={i} style={{ fontSize: 30, fontWeight: 700, marginBottom: 26, fontFamily: '-apple-system, system-ui, sans-serif', letterSpacing: '-0.015em' }}>{para.text}</div>;
            }
            const words = para.text.split(' ');
            const take = fhClamp(budget, 0, words.length);
            budget -= words.length;
            if (take <= 0) return null;
            const isLast = budget <= 0 && take < words.length;
            return (
              <p key={i} style={{ fontSize: 20, lineHeight: 1.72, margin: '0 0 17px' }}>
                {words.slice(0, take).join(' ')}
                {isLast && <span style={{ opacity: caretOn ? 1 : 0, color: FH.orange, fontWeight: 700 }}>|</span>}
              </p>
            );
          })}
        </div>
      </div>
      {/* status bar — climbing word count = "a lot of work done" */}
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 38, display: 'flex', alignItems: 'center',
        padding: '0 18px', gap: 14, borderTop: '1px solid rgba(0,0,0,0.06)', background: 'rgba(250,250,251,0.96)',
        fontFamily: '-apple-system, system-ui, sans-serif', fontSize: 12.5, color: 'rgba(0,0,0,0.5)' }}>
        <span style={{ fontWeight: 700, color: '#23252b', fontVariantNumeric: 'tabular-nums' }}>{wordCount.toLocaleString()}</span>
        <span>words</span>
        <span style={{ opacity: 0.4 }}>·</span>
        <span style={{ fontVariantNumeric: 'tabular-nums' }}>{pages} {pages === 1 ? 'page' : 'pages'}</span>
        <span style={{ flex: 1 }} />
        <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: FH.teal, fontWeight: 600 }}>
          <svg width="13" height="13" viewBox="0 0 24 24"><path d="M6 12.5 L10 16.5 L18 7.5" fill="none" stroke={FH.teal} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
          Saved
        </span>
      </div>
    </div>
  );
}

const SHEET_ROWS = 20;
const SHEET_COLS = 10;

function buildSheetCells() {
  const cells = new Array(SHEET_ROWS * SHEET_COLS).fill('');
  const set = (r, c, v) => { cells[r * SHEET_COLS + c] = v; };
  set(0, 1, 'Q2 2026 — Operating Plan');
  set(1, 1, 'Revenue'); set(1, 3, 'Actual'); set(1, 5, 'Goal'); set(1, 7, 'YTD %');
  ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].forEach((m, i) => {
    const r = 2 + i;
    set(r, 1, m);
    set(r, 3, `${(38 + i * 1.4).toFixed(1)}k`);
    set(r, 5, `${(36 + i * 1.2).toFixed(1)}k`);
    set(r, 7, `${(96 + i * 2)}%`);
  });
  set(8, 1, 'Subtotal'); set(8, 3, '264.2k'); set(8, 5, '255.0k'); set(8, 7, '104%');
  set(9, 1, 'Costs'); set(9, 3, 'Budget'); set(9, 5, 'Spend'); set(9, 7, 'Var');
  ['Hosting', 'Payroll', 'Ads', 'Tools', 'Travel'].forEach((l, i) => {
    const r = 10 + i;
    set(r, 1, l);
    set(r, 3, `${(12 + i * 3.2).toFixed(0)}k`);
    set(r, 5, `${(11 + i * 2.8).toFixed(0)}k`);
    set(r, 7, i % 2 === 0 ? '-3%' : '+2%');
  });
  set(15, 1, 'Headcount'); set(15, 3, 'FTE'); set(15, 5, 'Open'); set(15, 7, 'Hired');
  set(16, 1, 'Eng'); set(16, 3, '14'); set(16, 5, '2'); set(16, 7, '3');
  set(17, 1, 'GTM'); set(17, 3, '8'); set(17, 5, '1'); set(17, 7, '2');
  set(18, 1, 'Pipeline'); set(18, 3, 'Stage'); set(18, 5, 'Amount'); set(18, 7, 'Close');
  set(19, 1, 'Enterprise'); set(19, 3, 'Negotiate'); set(19, 5, '$420k'); set(19, 7, 'Jun 28');
  return cells;
}

const SHEET_CELLS = buildSheetCells();
const SHEET_DATA_INDICES = SHEET_CELLS.map((v, i) => (v ? i : -1)).filter((i) => i >= 0);
const SHEET_DATA_COUNT = SHEET_DATA_INDICES.length;

function SpreadsheetWindow({ t, dim }) {
  const inP = seg(t, MARKS.focusResume - 0.2, MARKS.focusResume + 0.15, FE.easeOutCubic);
  if (inP <= 0.001) return null;
  const animP = seg(t, MARKS.focusResume, MARKS.work2End, FE.easeInOutSine);
  const fillRatio = 0.45 + animP * 0.55;
  const filledCount = Math.round(fillRatio * SHEET_DATA_COUNT);
  const filledSet = new Set(SHEET_DATA_INDICES.slice(0, filledCount));
  const lastIdx = SHEET_DATA_INDICES[Math.max(0, filledCount - 1)];
  const cols = ['', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'];

  return (
    <div style={{
      position: 'absolute', left: 280, top: 124, width: 880, height: 640,
      background: '#ffffff', borderRadius: 13,
      boxShadow: '0 2px 1px rgba(0,0,0,0.04), 0 28px 60px rgba(20,20,30,0.20)',
      overflow: 'hidden', zIndex: 20, opacity: inP,
      filter: dim ? 'brightness(0.965)' : 'none',
      transform: dim ? 'scale(0.992)' : 'none', transition: 'filter 220ms, transform 220ms',
    }}>
      <div style={{ height: 44, display: 'flex', alignItems: 'center', padding: '0 16px',
        borderBottom: '1px solid rgba(0,0,0,0.06)', background: 'rgba(252,252,253,0.9)' }}>
        <TrafficLights />
        <div style={{ flex: 1, textAlign: 'center', fontSize: 13, fontWeight: 600, color: 'rgba(0,0,0,0.5)', marginRight: 52 }}>
          Q2 Targets — Numbers
        </div>
      </div>
      <div style={{ position: 'absolute', top: 44, left: 0, right: 0, bottom: 38, overflow: 'hidden',
        fontFamily: '-apple-system, system-ui, sans-serif', fontSize: 11 }}>
        <div style={{ display: 'grid', gridTemplateColumns: `36px repeat(${SHEET_COLS}, 1fr)`,
          borderBottom: '1px solid rgba(0,0,0,0.08)', background: 'rgba(246,246,248,0.96)' }}>
          {cols.map((c, i) => (
            <div key={i} style={{ padding: '6px 8px', fontWeight: 600, color: 'rgba(0,0,0,0.45)', textAlign: i === 0 ? 'center' : 'left',
              borderRight: '1px solid rgba(0,0,0,0.06)' }}>{c}</div>
          ))}
        </div>
        {Array.from({ length: SHEET_ROWS }, (_, row) => (
          <div key={row} style={{ display: 'grid', gridTemplateColumns: `36px repeat(${SHEET_COLS}, 1fr)`,
            borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
            <div style={{ padding: '5px 6px', textAlign: 'center', fontWeight: 600, color: 'rgba(0,0,0,0.4)', fontSize: 10,
              background: 'rgba(246,246,248,0.7)', borderRight: '1px solid rgba(0,0,0,0.06)' }}>{row + 1}</div>
            {Array.from({ length: SHEET_COLS }, (_, col) => {
              const idx = row * SHEET_COLS + col;
              const val = filledSet.has(idx) ? SHEET_CELLS[idx] : '';
              const isHeader = row <= 1 && val;
              const isTitle = row === 0 && val;
              return (
                <div key={col} style={{
                  padding: '5px 8px', borderRight: '1px solid rgba(0,0,0,0.05)',
                  color: isTitle ? FH.orangeDeep : isHeader ? '#1d1d1f' : 'rgba(0,0,0,0.72)',
                  fontWeight: isHeader || isTitle ? 700 : 400,
                  fontVariantNumeric: 'tabular-nums',
                  background: idx === lastIdx ? 'rgba(255,107,53,0.1)' : 'transparent',
                }}>{val}</div>
              );
            })}
          </div>
        ))}
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 38, display: 'flex', alignItems: 'center',
        padding: '0 18px', gap: 14, borderTop: '1px solid rgba(0,0,0,0.06)', background: 'rgba(250,250,251,0.96)',
        fontSize: 12.5, color: 'rgba(0,0,0,0.5)' }}>
        <span style={{ fontWeight: 600, color: '#23252b' }}>Q2 Actuals</span>
        <span style={{ opacity: 0.4 }}>·</span>
        <span style={{ fontWeight: 600, color: 'rgba(0,0,0,0.45)' }}>Targets</span>
        <span style={{ opacity: 0.4 }}>·</span>
        <span>{filledCount} cells · 6 tables</span>
        <span style={{ flex: 1 }} />
        <span style={{ color: FH.teal, fontWeight: 600 }}>Saved</span>
      </div>
    </div>
  );
}

// ── Mini toggle switch ──────────────────────────────────────────────────────────
function MiniToggle({ on }) {
  return (
    <div style={{ width: 36, height: 21, borderRadius: 11, flexShrink: 0, position: 'relative',
      background: on ? FH.orange : 'rgba(0,0,0,0.16)', transition: 'background 200ms ease',
      boxShadow: on ? `0 0 0 1px ${FH.orangeDeep}55` : 'none' }}>
      <div style={{ position: 'absolute', top: 2.5, left: on ? 17.5 : 2.5, width: 16, height: 16, borderRadius: 8,
        background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.3)', transition: 'left 200ms cubic-bezier(0.34,1.4,0.64,1)' }} />
    </div>
  );
}

// quick-pick block list (favorites). on-state derived from time.
const SITES = [
  { name: 'x.com', sub: 'Social', c: '#1d1d1f', g: 'X', base: true },
  { name: 'Instagram', sub: 'Social', c: '#C9379B', g: '◎', base: true },
  { name: 'Reddit', sub: 'Forums', c: '#FF4500', g: 'r', toggleAt: 'tog1' },
  { name: 'YouTube', sub: 'Video', c: '#FF0000', g: '▶', toggleAt: 'tog2' },
  { name: 'Messages', sub: 'Chat', c: '#34C759', g: '💬', base: false, plain: true },
];

// ── Start / Blocklist panel (menubar dropdown) ───────────────────────────────────
function StartPanel({ t, visible, pressed }) {
  if (!visible) return null;
  const openP = seg(t, MARKS.panelOpen[0], MARKS.panelOpen[1], FE.easeOutCubic);
  const closeP = seg(t, MARKS.panelClose[0], MARKS.panelClose[1], FE.easeInCubic);
  const p = openP * (1 - closeP);
  const onCount = SITES.filter((s) => s.base || (s.toggleAt && t >= MARKS[s.toggleAt])).length;
  return (
    <div style={{
      position: 'absolute', right: 270, top: 36, width: 300, zIndex: 70,
      transformOrigin: '88% 0%',
      transform: `scale(${lerp(0.9, 1, p)}) translateY(${lerp(-8, 0, p)}px)`,
      opacity: p,
    }}>
      <div style={{
        background: 'rgba(250,250,252,0.99)', borderRadius: 18, border: '1px solid rgba(0,0,0,0.08)',
        boxShadow: '0 18px 48px rgba(20,20,30,0.26)', padding: 16,
      }}>
        {/* header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 13 }}>
          <FocusTile size={34} tone="neutral" />
          <div style={{ lineHeight: 1.2, flex: 1 }}>
            <div style={{ fontSize: 14.5, fontWeight: 700, color: '#1d1d1f' }}>New Focus Session</div>
            <div style={{ fontSize: 11.5, color: 'rgba(0,0,0,0.5)' }}>Choose what to block</div>
          </div>
        </div>
        {/* duration chips */}
        <div style={{ display: 'flex', gap: 7, marginBottom: 14 }}>
          {['25 min', '50 min', '90 min'].map((c, i) => {
            const selected = t >= MARKS.durationPick ? i === 1 : i === 0;
            return (
              <div key={c} style={{
                flex: 1, textAlign: 'center', fontSize: 12.5, fontWeight: 600, padding: '7px 0', borderRadius: 9,
                background: selected ? 'rgba(255,107,53,0.12)' : 'rgba(0,0,0,0.045)',
                color: selected ? FH.orangeDeep : 'rgba(0,0,0,0.55)',
                border: selected ? `1px solid ${FH.orange}59` : '1px solid transparent',
              }}>{c}</div>
            );
          })}
        </div>
        {/* block list */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', color: 'rgba(0,0,0,0.4)', textTransform: 'uppercase' }}>Block</span>
          <span style={{ fontSize: 11, fontWeight: 600, color: FH.orangeDeep, fontVariantNumeric: 'tabular-nums' }}>{onCount} selected</span>
        </div>
        <div>
          {SITES.map((s) => {
            const on = s.base || (s.toggleAt && t >= MARKS[s.toggleAt]);
            return (
              <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 2px' }}>
                <div style={{ width: 26, height: 26, borderRadius: 7, flexShrink: 0, background: s.plain ? s.c : `linear-gradient(160deg, ${s.c}, ${s.c}cc)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: s.g.length > 1 ? 13 : 14, fontWeight: 700,
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.25)' }}>{s.g}</div>
                <div style={{ flex: 1, lineHeight: 1.15 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: '#1d1d1f' }}>{s.name}</div>
                </div>
                <MiniToggle on={on} />
              </div>
            );
          })}
        </div>
        {/* start button */}
        <button style={{
          width: '100%', border: 'none', borderRadius: 12, padding: '13px 0', cursor: 'pointer', marginTop: 12,
          background: `linear-gradient(180deg, ${FH.orange}, ${FH.orangeDeep})`,
          color: '#fff', fontSize: 15, fontWeight: 700, fontFamily: 'inherit',
          boxShadow: `0 4px 12px ${FH.orange}66, inset 0 1px 0 rgba(255,255,255,0.3)`,
          transform: pressed ? 'scale(0.97)' : 'scale(1)', transition: 'transform 90ms',
        }}>
          Start {t >= MARKS.durationPick ? '50' : '25'}-min session
        </button>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 11, fontSize: 12.5, color: 'rgba(0,0,0,0.55)' }}>
          <Flame size={14} /> <span style={{ fontWeight: 600 }}>46-day streak</span>
          <span style={{ opacity: 0.5 }}>· don’t break it</span>
        </div>
      </div>
    </div>
  );
}

// ── Browser (Safari-ish): open → type URL → blocked ─────────────────────────────
function BrowserWindow({ t }) {
  const inP = seg(t, MARKS.browserIn[0], MARKS.browserIn[1], FE.easeOutCubic);
  const outP = seg(t, MARKS.browserOut[0], MARKS.browserOut[1], FE.easeInCubic);
  const p = inP * (1 - outP);
  if (p <= 0.001) return null;
  const blockP = seg(t, MARKS.blockedIn[0], MARKS.blockedIn[1] + 0.25, FE.easeOutCubic);
  const isBlocked = t >= MARKS.blockedIn;
  const typed = urlTypedText(t);
  const typing = t >= MARKS.urlTyping[0] && t < MARKS.blockedIn;
  const loadingP = seg(t, MARKS.urlTyping[1], MARKS.blockedIn, FE.easeInOutSine);
  const caretOn = Math.floor(t * 3) % 2 === 0;
  const showLock = typed.length >= URL_TARGET.length || isBlocked;

  return (
    <div style={{
      position: 'absolute', left: 250, top: 138, width: 940, height: 612, zIndex: 40,
      transform: `translateY(${lerp(26, 0, inP) + outP * 16}px) scale(${lerp(0.97, 1, p)})`,
      opacity: p,
      background: '#fff', borderRadius: 13, overflow: 'hidden',
      boxShadow: '0 2px 1px rgba(0,0,0,0.04), 0 34px 70px rgba(20,20,30,0.28)',
    }}>
      <div style={{ height: 52, background: 'rgba(246,246,248,0.96)', borderBottom: '1px solid rgba(0,0,0,0.08)',
        display: 'flex', alignItems: 'center', padding: '0 16px', gap: 14 }}>
        <TrafficLights />
        <div style={{ display: 'flex', gap: 16, color: 'rgba(0,0,0,0.32)', marginLeft: 6 }}>
          <span style={{ fontSize: 19 }}>‹</span><span style={{ fontSize: 19 }}>›</span>
        </div>
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: 420, height: 32, borderRadius: 8, background: '#fff', border: '1px solid rgba(0,0,0,0.12)',
            display: 'flex', alignItems: 'center', padding: '0 14px', gap: 8, fontSize: 13.5 }}>
            {showLock && (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><rect x="5" y="11" width="14" height="9" rx="2" stroke="rgba(0,0,0,0.45)" strokeWidth="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3" stroke="rgba(0,0,0,0.45)" strokeWidth="2"/></svg>
            )}
            <span style={{
              fontWeight: typed ? 500 : 400,
              color: typed ? '#1d1d1f' : 'rgba(0,0,0,0.42)',
              fontFamily: '-apple-system, system-ui, sans-serif',
            }}>
              {typed || 'Search or enter website name'}
              {typing && typed.length < URL_TARGET.length && (
                <span style={{ opacity: caretOn ? 1 : 0, marginLeft: 1 }}>|</span>
              )}
            </span>
          </div>
        </div>
        <div style={{ width: 52 }} />
      </div>
      <div style={{ position: 'absolute', inset: '52px 0 0 0', background: '#fbfbfc' }}>
        {!isBlocked && (
          <div style={{ padding: 28, fontFamily: '-apple-system, system-ui, sans-serif' }}>
            <div style={{ fontSize: 13, color: 'rgba(0,0,0,0.45)', marginBottom: 16 }}>Favorites</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
              {['Apple', 'iCloud', 'Yahoo', 'Bing'].map((site) => (
                <div key={site} style={{ padding: 14, borderRadius: 10, background: '#fff', border: '1px solid rgba(0,0,0,0.06)',
                  fontSize: 12, fontWeight: 600, color: 'rgba(0,0,0,0.55)' }}>{site}</div>
              ))}
            </div>
            {loadingP > 0.2 && loadingP < 1 && (
              <div style={{ marginTop: 24, height: 3, borderRadius: 2, background: 'rgba(0,0,0,0.08)', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${loadingP * 100}%`, background: FH.blue, borderRadius: 2 }} />
              </div>
            )}
          </div>
        )}
        {isBlocked && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
            <div style={{ opacity: blockP, transform: `scale(${lerp(0.94, 1, blockP)})`, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <FocusTile size={64} tone="orange" radius={16} />
              <div style={{ fontSize: 26, fontWeight: 700, color: '#1d1d1f', marginTop: 22, fontFamily: '-apple-system, system-ui, sans-serif', letterSpacing: '-0.02em' }}>
                This site is blocked
              </div>
              <div style={{ fontSize: 17, fontWeight: 600, color: FH.orangeDeep, marginTop: 10, fontFamily: '-apple-system, system-ui, sans-serif' }}>
                x.com is blocked
              </div>
              <div style={{ fontSize: 16, color: 'rgba(0,0,0,0.5)', marginTop: 10, fontFamily: '-apple-system, system-ui, sans-serif' }}>
                You’re in a focus session. Back to it.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Native notification ──────────────────────────────────────────────────────────
function Notification({ tone, title, body, p }) {
  if (p <= 0.001) return null;
  const x = lerp(400, 0, p);
  const accent = tone === 'teal' ? FH.teal : tone === 'blue' ? FH.blue : FH.orange;
  const tileTone = tone === 'teal' ? 'teal' : tone === 'blue' ? 'blue' : 'orange';
  return (
    <div style={{
      position: 'absolute', right: 18, top: 46, width: 366, zIndex: 90,
      transform: `translateX(${x}px)`, opacity: fhClamp(p * 1.4, 0, 1),
    }}>
      <div style={{
        position: 'relative', background: 'rgba(250,250,252,0.97)',
        borderRadius: 18, border: '1px solid rgba(255,255,255,0.5)',
        boxShadow: '0 16px 44px rgba(20,20,30,0.26)', padding: '13px 15px',
        display: 'flex', gap: 12, alignItems: 'flex-start', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: accent }} />
        <FocusTile size={40} tone={tileTone} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ fontSize: 14.5, fontWeight: 700, color: '#1d1d1f', fontFamily: '-apple-system, system-ui, sans-serif' }}>{title}</span>
            <span style={{ fontSize: 11.5, color: 'rgba(0,0,0,0.4)', fontFamily: '-apple-system, system-ui, sans-serif' }}>now</span>
          </div>
          <div style={{ fontSize: 13.5, color: 'rgba(0,0,0,0.62)', marginTop: 3, lineHeight: 1.4, fontFamily: '-apple-system, system-ui, sans-serif' }}>{body}</div>
        </div>
      </div>
    </div>
  );
}

// ── In-session indicators (make "focus is on" unmistakable) ──────────────────────
function FocusEdgeGlow({ p, glowMode, t }) {
  if (p <= 0.001) return null;
  const c = glowMode === 'complete' ? FH.teal
    : glowMode === 'rest' ? FH.blue
    : FH.orange;
  const freq = glowMode === 'rest' ? 1.6 : glowMode === 'ending' ? 4.2 : 2.4;
  const amp = glowMode === 'ending' ? 16 : glowMode === 'rest' ? 5 : 8;
  const breath = 18 + Math.sin(t * freq) * amp;
  const borderW = glowMode === 'ending' ? 4 : 3;
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 52, pointerEvents: 'none', opacity: p,
      boxShadow: `inset 0 0 0 ${borderW}px ${c}, inset 0 0 ${breath + 26}px ${breath}px ${c}55`,
      transition: 'box-shadow 240ms' }} />
  );
}

function FocusStatusPill({ p, phase, timerText, blockedCount }) {
  if (p <= 0.001) return null;
  const c = phase === 'complete' ? FH.teal : phase === 'rest' ? FH.blue : FH.orange;
  const cDeep = phase === 'complete' ? FH.tealDeep : phase === 'rest' ? FH.blueDeep : FH.orangeDeep;
  const label = phase === 'complete' ? 'Focus session complete'
    : phase === 'rest' ? 'Rest break'
    : phase === 'ending' ? 'Focus session ending soon'
    : 'Focus in progress';
  return (
    <div style={{ position: 'absolute', top: 30, left: 0, right: 0, display: 'flex', justifyContent: 'center', zIndex: 58, pointerEvents: 'none' }}>
      <div style={{
        transform: `translateY(${lerp(-46, 10, p)}px)`, opacity: fhClamp(p * 1.3, 0, 1),
        display: 'flex', alignItems: 'center', gap: 11, padding: '9px 16px 9px 14px', borderRadius: 999,
        background: 'rgba(255,255,255,0.98)', border: `1px solid ${c}3d`,
        boxShadow: `0 8px 24px rgba(20,20,30,0.16), 0 0 0 4px ${c}1a`,
        fontFamily: '-apple-system, system-ui, sans-serif',
      }}>
        {/* pulsing status dot */}
        <span style={{ position: 'relative', width: 10, height: 10, flexShrink: 0 }}>
          <span style={{ position: 'absolute', inset: 0, borderRadius: 5, background: c, animation: 'fhpulse 1.6s ease-out infinite' }} />
          <span style={{ position: 'absolute', inset: 0, borderRadius: 5, background: c }} />
        </span>
        <span style={{ fontSize: 13.5, fontWeight: 700, color: '#1d1d1f', letterSpacing: '-0.01em' }}>
          {label}
        </span>
        <span style={{ width: 1, height: 15, background: 'rgba(0,0,0,0.12)' }} />
        {phase === 'complete' ? (
          <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 700, color: cDeep }}>
            <Flame size={14} /> 47-day streak
          </span>
        ) : phase === 'rest' ? (
          <span style={{ fontSize: 13, fontWeight: 700, color: cDeep, fontVariantNumeric: 'tabular-nums' }}>{timerText}</span>
        ) : (
          <React.Fragment>
            <span style={{ fontSize: 13, fontWeight: 700, color: cDeep, fontVariantNumeric: 'tabular-nums' }}>{timerText}</span>
            {phase !== 'ending' && (
              <React.Fragment>
                <span style={{ width: 1, height: 15, background: 'rgba(0,0,0,0.12)' }} />
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 600, color: 'rgba(0,0,0,0.55)' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><rect x="5" y="11" width="14" height="9" rx="2" stroke={cDeep} strokeWidth="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3" stroke={cDeep} strokeWidth="2"/></svg>
                  {blockedCount} sites blocked
                </span>
              </React.Fragment>
            )}
          </React.Fragment>
        )}
      </div>
    </div>
  );
}
function StreakHero({ t, style, accent, flameEmoji }) {
  const inP = seg(t, MARKS.heroIn[0], MARKS.heroIn[1], FE.easeOutBack);
  const outP = seg(t, MARKS.heroOut[0], MARKS.heroOut[1], FE.easeInCubic);
  const vis = inP * (1 - outP);
  if (vis <= 0.001) return null;
  const fade = fhClamp(inP * 1.2, 0, 1) * (1 - outP);
  // number rolls 46 -> 47
  const roll = seg(t, MARKS.heroIn[1] - 0.05, MARKS.heroIn[1] + 0.45, FE.easeOutCubic);
  const num = 46 + roll; // visual lift handled below
  const accentDeep = accent === FH.teal ? FH.tealDeep : accent;

  // ── compact "counter pop" variant ──
  if (style === 'pop') {
    return (
      <div style={{ position: 'absolute', left: 0, right: 0, top: 360, display: 'flex', justifyContent: 'center', zIndex: 95, pointerEvents: 'none' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 16, padding: '18px 30px', borderRadius: 22,
          background: 'rgba(255,255,255,0.97)',
          border: '1px solid rgba(255,255,255,0.6)', boxShadow: `0 18px 50px rgba(20,30,24,0.22), 0 0 0 4px ${accent}1f`,
          transform: `scale(${lerp(0.8, 1, inP)})`, opacity: fade,
        }}>
          <div style={{ filter: `drop-shadow(0 4px 14px ${accent}88)`, transform: `scale(${1 + Math.sin(t * 8) * 0.04 * (1 - outP)})` }}>
            <Flame size={46} emoji={flameEmoji} />
          </div>
          <div style={{ lineHeight: 1 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, color: accentDeep, fontFamily: '-apple-system, system-ui, sans-serif' }}>
              <span style={{ fontSize: 30, fontWeight: 800, opacity: 0.35, textDecoration: 'line-through' }}>46</span>
              <span style={{ fontSize: 56, fontWeight: 800, fontVariantNumeric: 'tabular-nums', transform: `translateY(${(1 - roll) * 10}px)` }}>47</span>
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.14em', color: 'rgba(0,0,0,0.45)', textTransform: 'uppercase' }}>Day streak</div>
          </div>
        </div>
      </div>
    );
  }

  // ── hero / confetti card variant ──
  const particles = style === 'confetti';
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 95, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
      {/* scrim */}
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(20,16,12,0.36)', opacity: fade }} />
      {particles && <Confetti t={t} inP={inP} outP={outP} accent={accent} />}
      <div style={{
        position: 'relative', width: 452, padding: '40px 44px 36px', borderRadius: 30,
        background: 'linear-gradient(180deg, #ffffff, #fbfcfb)',
        border: '1px solid rgba(255,255,255,0.7)',
        boxShadow: `0 30px 80px rgba(20,30,24,0.34), 0 0 0 1px rgba(0,0,0,0.04), 0 0 60px ${accent}33`,
        transform: `scale(${lerp(0.84, 1, inP)}) translateY(${(1 - inP) * 14}px)`, opacity: fade,
        textAlign: 'center', fontFamily: '-apple-system, system-ui, sans-serif',
      }}>
        <div style={{
          width: 76, height: 76, margin: '0 auto', borderRadius: 22,
          background: `radial-gradient(120% 120% at 50% 20%, ${accent}26, ${accent}0c)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          filter: `drop-shadow(0 6px 18px ${accent}66)`,
          transform: `scale(${1 + Math.sin(t * 6.5) * 0.045 * (1 - outP)})`,
        }}>
          <Flame size={46} emoji={flameEmoji} />
        </div>
        <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: '0.04em', color: accentDeep, marginTop: 18 }}>
          SESSION COMPLETE
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 12, marginTop: 6 }}>
          <span style={{ fontSize: 104, fontWeight: 800, lineHeight: 0.92, color: '#1d1d1f', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.04em' }}>47</span>
          <span style={{ fontSize: 19, fontWeight: 700, color: 'rgba(0,0,0,0.45)', textTransform: 'uppercase', letterSpacing: '0.12em', paddingBottom: 16 }}>Day<br />streak</span>
        </div>
        {/* week dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 9, marginTop: 22 }}>
          {[0, 1, 2, 3, 4, 5, 6].map((i) => {
            const isToday = i === 6;
            const pop = isToday ? seg(t, MARKS.heroIn[1], MARKS.heroIn[1] + 0.4, FE.easeOutBack) : 1;
            return (
              <div key={i} style={{
                width: 22, height: 22, borderRadius: 11,
                background: isToday ? accent : `${accent}`,
                opacity: isToday ? 1 : 0.32,
                transform: `scale(${isToday ? lerp(0.4, 1.06, pop) : 1})`,
                boxShadow: isToday ? `0 0 0 4px ${accent}2e` : 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {isToday && <svg width="12" height="12" viewBox="0 0 24 24" style={{ opacity: pop }}><path d="M6 12.5 L10 16.5 L18 7.5" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>}
              </div>
            );
          })}
        </div>
        <div style={{ fontSize: 14.5, color: 'rgba(0,0,0,0.5)', marginTop: 20, fontWeight: 500 }}>
          Longest streak yet. <span style={{ color: accentDeep, fontWeight: 700 }}>+1 today</span>
        </div>
      </div>
    </div>
  );
}

function Confetti({ t, inP, outP, accent }) {
  const colors = [accent, FH.orange, '#FFB02E', '#5B8DEF', accent];
  const seeds = React.useMemo(() => Array.from({ length: 34 }, (_, i) => ({
    a: (i / 34) * Math.PI * 2 + (i % 3),
    dist: 180 + (i * 53 % 160),
    size: 7 + (i * 37 % 9),
    rot: (i * 71 % 360),
    color: colors[i % colors.length],
    delay: (i % 5) * 0.02,
  })), []);
  const burst = seg(t, MARKS.heroIn[0] + 0.1, MARKS.heroIn[0] + 0.85, FE.easeOutCubic);
  if (burst <= 0) return null;
  return (
    <div style={{ position: 'absolute', left: '50%', top: '50%', width: 0, height: 0, opacity: 1 - outP }}>
      {seeds.map((s, i) => {
        const d = burst * s.dist;
        const x = Math.cos(s.a) * d;
        const y = Math.sin(s.a) * d + burst * burst * 60; // slight gravity
        return (
          <div key={i} style={{
            position: 'absolute', left: x, top: y, width: s.size, height: s.size * 0.6,
            background: s.color, borderRadius: 2,
            transform: `rotate(${s.rot + burst * 320}deg)`,
            opacity: fhClamp((1 - burst) * 1.6, 0, 1),
          }} />
        );
      })}
    </div>
  );
}

// ── Dock ────────────────────────────────────────────────────────────────────────
function Dock({ t }) {
  const apps = [
    { c: '#1f9bf0', g: 'S', safari: true, running: true }, { c: '#34c759', g: 'N', running: true },
    { c: '#ff9500', g: 'M', running: true }, { c: '#5e5ce6', g: 'C', running: true },
    { c: '#ff2d55', g: 'P', running: true },
  ];
  const messyPhase = t < MARKS.activeOn;
  const safariBounce = t >= MARKS.dockClick && t < MARKS.browserIn[1];
  const bounce = safariBounce ? 1 + Math.sin((t - MARKS.dockClick) * 14) * 0.12 : 1;
  return (
    <div style={{ position: 'absolute', bottom: 12, left: 0, right: 0, display: 'flex', justifyContent: 'center', zIndex: 10 }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, padding: '8px 12px', borderRadius: 22,
        background: 'rgba(255,255,255,0.42)', backdropFilter: 'blur(26px) saturate(160%)', WebkitBackdropFilter: 'blur(26px) saturate(160%)',
        border: '1px solid rgba(255,255,255,0.55)', boxShadow: '0 10px 34px rgba(20,20,30,0.18)' }}>
        {apps.map((a, i) => (
          <div key={i} style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: `linear-gradient(160deg, ${a.c}, ${a.c}cc)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 19,
              transform: a.safari ? `translateY(${safariBounce ? -10 * bounce : 0}px) scale(${a.safari && safariBounce ? bounce : 1})` : 'none',
              boxShadow: a.safari && safariBounce ? `0 8px 20px ${a.c}66, inset 0 1px 0 rgba(255,255,255,0.4)` : 'inset 0 1px 0 rgba(255,255,255,0.4), 0 2px 5px rgba(0,0,0,0.16)' }}>{a.g}</div>
            {messyPhase && a.running && (
              <div style={{ width: 4, height: 4, borderRadius: 2, background: 'rgba(0,0,0,0.45)', marginTop: 4 }} />
            )}
          </div>
        ))}
        <div style={{ width: 1, height: 38, background: 'rgba(0,0,0,0.12)', margin: '0 2px', alignSelf: 'center' }} />
        <FocusTile size={48} tone="orange" radius={12} />
      </div>
    </div>
  );
}

// ── Desktop (composes everything) ─────────────────────────────────────────────────
export function Desktop({ tw }) {
  const t = fhUseTime();
  const M = MARKS;

  // icon state
  let iconState = 'idle';
  if (t >= M.complete && t < M.idleReset) iconState = 'complete';
  else if (t >= M.activeOn && t < M.complete) iconState = 'active';
  const pulse = (t % 0.95) / 0.95;

  const inRest = t >= M.restIn && t < M.restOut;
  const displayTimer = iconState === 'complete'
    ? '50:00'
    : inRest
      ? formatElapsed(restCountdownSec(t))
      : formatElapsed(sessionElapsedSec(t));
  const timerText = displayTimer;
  const showTimer = t >= M.activeOn && t < M.idleReset;
  const iconFlash = t >= M.iconClick && t < M.iconClick + 0.16;

  // session phase + glow
  const isComplete = iconState === 'complete';
  const inEnding = t >= M.endingSoonIn && t < M.complete;
  let glowMode = 'focus';
  if (isComplete) glowMode = 'complete';
  else if (inEnding) glowMode = 'ending';
  else if (inRest) glowMode = 'rest';

  let pillPhase = 'focus';
  if (isComplete) pillPhase = 'complete';
  else if (inEnding) pillPhase = 'ending';
  else if (inRest) pillPhase = 'rest';

  const sessionIn = seg(t, M.activeOn, M.activeOn + 0.45, FE.easeOutCubic);
  const sessionOut = seg(t, M.heroIn[0] - 0.15, M.heroIn[0] + 0.3, FE.easeInCubic);
  const sessionP = sessionIn * (1 - sessionOut);
  const blockedCount = SITES.filter((s) => s.base || s.toggleAt).length;

  const tintIn = seg(t, M.activeOn, M.activeOn + 0.4, FE.easeOutCubic);
  const tintOut = seg(t, M.heroOut[0], M.heroOut[1], FE.easeInCubic);
  const tint = tintIn * (1 - tintOut);
  const restTint = inRest ? seg(t, M.restIn, M.restIn + 0.35, FE.easeOutCubic) * (1 - seg(t, M.restOut - 0.35, M.restOut, FE.easeInCubic)) : 0;

  const panelVisible = t >= M.panelOpen[0] && t < M.panelClose[1] + 0.05;
  const pressIcon = t >= M.iconClick && t < M.iconClick + 0.16;
  const pressTog1 = t >= M.tog1 - 0.02 && t < M.tog1 + 0.14;
  const pressTog2 = t >= M.tog2 - 0.02 && t < M.tog2 + 0.14;
  const pressDuration = t >= M.durationPick - 0.02 && t < M.durationPick + 0.14;
  const pressBtn = t >= M.btnPress && t < M.btnPress + 0.16;
  const pressDock = t >= M.dockClick - 0.02 && t < M.dockClick + 0.14;
  const inBrowserCursor = t >= M.cursorToDock[0] && t < M.browserOut[1];
  const pressed = pressIcon || pressTog1 || pressTog2 || pressDuration || pressBtn || pressDock;

  const browserDim = t >= M.browserIn[0] && t < M.browserOut[1];

  const blockedP = seg(t, M.blockedIn[0], M.blockedIn[1], FE.easeOutCubic) * (1 - seg(t, M.blockedOut[0], M.blockedOut[1], FE.easeInCubic));
  const restP = seg(t, M.restIn, M.restIn + 0.35, FE.easeOutCubic) * (1 - seg(t, M.focusResume - 0.15, M.focusResume, FE.easeInCubic));
  const focusP = seg(t, M.focusResume, M.focusResume + 0.35, FE.easeOutCubic) * (1 - seg(t, M.focusResume + 1.8, M.focusResume + 2.1, FE.easeInCubic));
  const endingP = seg(t, M.endingSoonIn, M.endingSoonIn + 0.35, FE.easeOutCubic) * (1 - seg(t, M.complete - 0.2, M.complete, FE.easeInCubic));

  const setupSegs = [
    { a: M.cursorToIcon[0], b: M.cursorToIcon[1], from: M.rest, to: M.iconPt },
    { a: M.cursorToTog1[0], b: M.cursorToTog1[1], from: M.iconPt, to: M.tog1Pt },
    { a: M.cursorToTog2[0], b: M.cursorToTog2[1], from: M.tog1Pt, to: M.tog2Pt },
    { a: M.cursorToDuration[0], b: M.cursorToDuration[1], from: M.tog2Pt, to: M.durationPt },
    { a: M.cursorToStart[0], b: M.cursorToStart[1], from: M.durationPt, to: M.startPt },
  ];
  const browserSegs = [
    { a: M.cursorToDock[0], b: M.cursorToDock[1], from: M.workCursorPt, to: M.dockPt },
    { a: M.dockClick, b: M.dockClick + 0.35, from: M.dockPt, to: M.addressBarPt },
  ];

  function walkSegs(segs, defaultPt) {
    let x = defaultPt.x, y = defaultPt.y;
    for (let i = 0; i < segs.length; i++) {
      const s = segs[i];
      if (t < s.a) { x = s.from.x; y = s.from.y; break; }
      if (t <= s.b) {
        const pp = seg(t, s.a, s.b, FE.easeInOutCubic);
        x = lerp(s.from.x, s.to.x, pp);
        y = lerp(s.from.y, s.to.y, pp);
        break;
      }
      x = s.to.x; y = s.to.y;
    }
    return { x, y };
  }

  let cx = M.rest.x, cy = M.rest.y;
  if (inBrowserCursor) {
    ({ x: cx, y: cy } = walkSegs(browserSegs, M.workCursorPt));
  } else if (t >= setupSegs[0].a && t < M.btnPress + 0.5) {
    ({ x: cx, y: cy } = walkSegs(setupSegs, M.startPt));
  }
  if (t >= M.idleReset) { cx = M.rest.x; cy = M.rest.y; }

  let cursorOp = 0;
  if (t < M.cursorToIcon[0]) cursorOp = 1;
  else if (t >= setupSegs[0].a && t < M.btnPress + 0.4) cursorOp = 1;
  else if (inBrowserCursor) cursorOp = 1;
  else if (t >= M.idleReset) cursorOp = seg(t, M.idleReset + 0.05, M.idleReset + 0.35, FE.easeOutCubic);

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', fontFamily: '-apple-system, "SF Pro Display", system-ui, sans-serif' }}>
      {/* wallpaper */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(170deg, #eef0f3 0%, #e6e9ee 52%, #dfe3ea 100%)' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(120% 90% at 50% -10%, rgba(255,255,255,0.7), rgba(255,255,255,0) 60%)' }} />

      <MessyDesktop t={t} />
      <EditorWindow t={t} dim={browserDim} />
      <SpreadsheetWindow t={t} dim={browserDim} />
      <Dock t={t} />
      <BrowserWindow t={t} />

      <div style={{ position: 'absolute', inset: 0, zIndex: 30, pointerEvents: 'none', opacity: tint * (1 - restTint),
        background: 'radial-gradient(120% 100% at 50% 50%, rgba(255,140,70,0.0) 52%, rgba(60,40,20,0.16) 100%)' }} />
      <div style={{ position: 'absolute', inset: 0, zIndex: 30, pointerEvents: 'none', opacity: restTint,
        background: 'radial-gradient(120% 100% at 50% 50%, rgba(90,140,240,0.0) 52%, rgba(30,50,90,0.14) 100%)' }} />

      <FocusEdgeGlow p={sessionP} glowMode={glowMode} t={t} />

      <Menubar iconState={iconState} pulse={pulse} timerText={timerText} showTimer={showTimer} iconFlash={iconFlash} inRest={inRest} />
      <FocusStatusPill p={sessionP} phase={pillPhase} timerText={timerText} blockedCount={blockedCount} />
      <StartPanel t={t} visible={panelVisible} pressed={pressBtn} />

      <Notification tone="orange" title="x.com is blocked" body="You’re in a focus session — stay with it." p={blockedP} />
      <Notification tone="blue" title="Time to rest" body="Step away for a few minutes — you’ve earned it." p={restP} />
      <Notification tone="orange" title="Time to focus" body="Break’s over. Let’s finish strong." p={focusP} />
      <Notification tone="orange" title="Focus session ending soon" body="Wrap up and save your work." p={endingP} />

      <StreakHero t={t} style={tw.payoffStyle} accent={tw.streakAccent} flameEmoji={tw.flameStyle === 'emoji'} />

      {/* cursor */}
      <div style={{ position: 'absolute', left: cx, top: cy, zIndex: 120, opacity: cursorOp, pointerEvents: 'none',
        transform: pressed ? 'scale(0.86)' : 'scale(1)', transition: 'transform 80ms' }}>
        <CursorArrow size={23} />
      </div>
    </div>
  );
}

