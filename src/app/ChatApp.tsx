'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUp, Copy, Check, Sparkles, Menu, X as XClose, SquarePen } from 'lucide-react';

const MAX_LENGTH = 500;

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

type AnimationPhase =
  | 'idle'
  | 'cursor-moving'
  | 'cursor-clicking'
  | 'typing'
  | 'cursor-to-send'
  | 'send-clicking'
  | 'message-sent'
  | 'ai-responding'
  | 'reveal';

const PA_MESSAGES = [
  { big: 'Was that so hard?', sub: 'Apparently it was.' },
  { big: 'See? ChatGPT knows things.', sub: 'You could have just asked.' },
  { big: "You're welcome.", sub: 'Next time, try asking ChatGPT yourself.' },
  { big: 'If only there was a way to ask ChatGPT directly…', sub: 'Oh wait, there is.' },
  { big: 'That took about 5 seconds.', sub: 'Just saying.' },
  { big: 'ChatGPT: 1, Laziness: 0', sub: 'Share this moment of enlightenment.' },
  { big: 'And now you know.', sub: "Something ChatGPT could've told you all along." },
];

function getRandomPA() {
  return PA_MESSAGES[Math.floor(Math.random() * PA_MESSAGES.length)];
}

/* ------------------------------------------------------------------ */
/* Brand SVG Icons                                                     */
/* ------------------------------------------------------------------ */
function XIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function WhatsAppIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* CursorIcon                                                          */
/* ------------------------------------------------------------------ */
function CursorIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      <path
        d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 01.35-.15h6.87a.5.5 0 00.35-.85L6.35 2.86a.5.5 0 00-.85.35z"
        fill="#fff"
        stroke="#000"
        strokeWidth="1.2"
      />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* AnimatedCursor                                                      */
/* ------------------------------------------------------------------ */
function AnimatedCursor({
  phase,
  inputRef,
  sendButtonRef,
}: {
  phase: AnimationPhase;
  inputRef: React.RefObject<HTMLInputElement | null>;
  sendButtonRef: React.RefObject<HTMLButtonElement | null>;
}) {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [visible, setVisible] = useState(false);
  const [clicking, setClicking] = useState(false);

  useEffect(() => {
    if (phase === 'cursor-moving') {
      setPos({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
      setVisible(true);
      setClicking(false);
      const t = setTimeout(() => {
        const rect = inputRef.current?.getBoundingClientRect();
        if (rect) setPos({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
      }, 100);
      return () => clearTimeout(t);
    }
    if (phase === 'cursor-clicking') {
      setClicking(true);
      const t = setTimeout(() => { setClicking(false); setVisible(false); }, 300);
      return () => clearTimeout(t);
    }
    if (phase === 'cursor-to-send') {
      setVisible(true);
      setClicking(false);
      const inputRect = inputRef.current?.getBoundingClientRect();
      if (inputRect) setPos({ x: inputRect.right - 40, y: inputRect.top + inputRect.height / 2 });
      const t = setTimeout(() => {
        const rect = sendButtonRef.current?.getBoundingClientRect();
        if (rect) setPos({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
      }, 100);
      return () => clearTimeout(t);
    }
    if (phase === 'send-clicking') {
      setClicking(true);
      const t = setTimeout(() => { setClicking(false); setVisible(false); }, 300);
      return () => clearTimeout(t);
    }
    setVisible(false);
  }, [phase, inputRef, sendButtonRef]);

  if (!visible) return null;

  return (
    <motion.div
      style={{ position: 'fixed', pointerEvents: 'none', zIndex: 9999, left: 0, top: 0 }}
      animate={{ x: pos.x, y: pos.y }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className={clicking ? 'cursor-click-anim' : ''} style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.5))' }}>
        <CursorIcon />
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* TypingIndicator                                                     */
/* ------------------------------------------------------------------ */
function TypingIndicator() {
  const dotStyle: React.CSSProperties = { width: 6, height: 6, borderRadius: '50%', background: '#8e8e8e' };
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '20px', maxWidth: '768px', margin: '0 auto 20px' }}>
      <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#000', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Sparkles size={13} color="#c4b5fd" />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', paddingTop: '10px' }}>
        <span className="typing-dot" style={dotStyle} />
        <span className="typing-dot" style={dotStyle} />
        <span className="typing-dot" style={dotStyle} />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* MessageBubble                                                       */
/* ------------------------------------------------------------------ */
/* Simple markdown renderer for AI responses */
function renderMarkdown(text: string): React.ReactNode[] {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeContent = '';
  let codeKey = 0;

  const renderInline = (line: string, key: number): React.ReactNode => {
    // Bold **text** and inline code `text`
    const parts: React.ReactNode[] = [];
    let remaining = line;
    let partKey = 0;

    while (remaining.length > 0) {
      // Inline code
      const codeMatch = remaining.match(/^([\s\S]*?)`([^`]+)`([\s\S]*)$/);
      if (codeMatch) {
        if (codeMatch[1]) {
          parts.push(...renderBold(codeMatch[1], partKey));
          partKey += 10;
        }
        parts.push(
          <code key={`c${key}-${partKey}`} style={{ background: 'rgba(255,255,255,0.08)', padding: '2px 6px', borderRadius: '4px', fontSize: '13px', fontFamily: 'monospace' }}>
            {codeMatch[2]}
          </code>
        );
        partKey++;
        remaining = codeMatch[3];
        continue;
      }
      parts.push(...renderBold(remaining, partKey));
      break;
    }
    return <span key={key}>{parts}</span>;
  };

  const renderBold = (text: string, baseKey: number): React.ReactNode[] => {
    const parts: React.ReactNode[] = [];
    const regex = /\*\*(.+?)\*\*/g;
    let lastIndex = 0;
    let match;
    let k = 0;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(<span key={`b${baseKey}-${k}`}>{text.slice(lastIndex, match.index)}</span>);
        k++;
      }
      parts.push(<strong key={`b${baseKey}-${k}`} style={{ fontWeight: 600, color: '#fff' }}>{match[1]}</strong>);
      k++;
      lastIndex = regex.lastIndex;
    }
    if (lastIndex < text.length) {
      parts.push(<span key={`b${baseKey}-${k}`}>{text.slice(lastIndex)}</span>);
    }
    return parts.length > 0 ? parts : [<span key={`b${baseKey}-0`}>{text}</span>];
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Code block toggle
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        elements.push(
          <pre key={`code-${codeKey}`} style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '14px 16px', margin: '8px 0', overflowX: 'auto', fontSize: '13px', lineHeight: '1.5', fontFamily: 'monospace', color: '#d4d4d4' }}>
            <code>{codeContent.trimEnd()}</code>
          </pre>
        );
        codeContent = '';
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
        codeKey = i;
      }
      continue;
    }

    if (inCodeBlock) {
      codeContent += (codeContent ? '\n' : '') + line;
      continue;
    }

    // Empty line → spacer
    if (line.trim() === '') {
      elements.push(<div key={`sp-${i}`} style={{ height: '8px' }} />);
      continue;
    }

    // Headings
    const h1 = line.match(/^# (.+)$/);
    if (h1) {
      elements.push(<div key={`h-${i}`} style={{ fontSize: '18px', fontWeight: 700, color: '#fff', margin: '12px 0 6px' }}>{renderInline(h1[1], i)}</div>);
      continue;
    }
    const h2 = line.match(/^## (.+)$/);
    if (h2) {
      elements.push(<div key={`h-${i}`} style={{ fontSize: '16px', fontWeight: 600, color: '#fff', margin: '10px 0 4px' }}>{renderInline(h2[1], i)}</div>);
      continue;
    }
    const h3 = line.match(/^### (.+)$/);
    if (h3) {
      elements.push(<div key={`h-${i}`} style={{ fontSize: '15px', fontWeight: 600, color: '#fff', margin: '8px 0 4px' }}>{renderInline(h3[1], i)}</div>);
      continue;
    }

    // Numbered list
    const numList = line.match(/^(\d+)\.\s+(.+)$/);
    if (numList) {
      elements.push(
        <div key={`li-${i}`} style={{ display: 'flex', gap: '8px', marginBottom: '4px', paddingLeft: '4px' }}>
          <span style={{ color: '#8e8e8e', minWidth: '18px', fontVariantNumeric: 'tabular-nums' }}>{numList[1]}.</span>
          <span>{renderInline(numList[2], i)}</span>
        </div>
      );
      continue;
    }

    // Bullet list
    const bullet = line.match(/^[-*]\s+(.+)$/);
    if (bullet) {
      elements.push(
        <div key={`li-${i}`} style={{ display: 'flex', gap: '8px', marginBottom: '4px', paddingLeft: '4px' }}>
          <span style={{ color: '#8e8e8e' }}>•</span>
          <span>{renderInline(bullet[1], i)}</span>
        </div>
      );
      continue;
    }

    // Regular paragraph
    elements.push(<div key={`p-${i}`} style={{ marginBottom: '2px' }}>{renderInline(line, i)}</div>);
  }

  return elements;
}

function MessageBubble({ message, isStreaming }: { message: Message; isStreaming: boolean }) {
  if (message.role === 'user') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px', maxWidth: '768px', margin: '0 auto 24px' }}
      >
        <div style={{ maxWidth: '75%', background: '#303030', borderRadius: '20px', padding: '12px 18px' }}>
          <p style={{ margin: 0, fontSize: '15px', lineHeight: '1.6', whiteSpace: 'pre-wrap', color: '#ececec' }}>
            {message.content}
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', marginBottom: '24px', maxWidth: '768px', margin: '0 auto 24px' }}
    >
      <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#000', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px' }}>
        <Sparkles size={14} color="#a78bfa" />
      </div>
      <div style={{ flex: 1, minWidth: 0, paddingTop: '1px', fontSize: '15px', lineHeight: '1.7', color: '#ececec' }}>
        {renderMarkdown(message.content)}
        {isStreaming && message.content && (
          <span
            className="text-cursor-blink"
            style={{ display: 'inline-block', width: '2px', height: '1em', background: '#ececec', verticalAlign: 'text-bottom', marginLeft: '2px' }}
          />
        )}
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* ShareButtons                                                        */
/* ------------------------------------------------------------------ */
function ShareButtons({ url, variant = 'default' }: { url: string; variant?: 'default' | 'reveal' }) {
  const [copied, setCopied] = useState(false);
  const twitterUrl = `https://x.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent('Let Me ChatGPT That For You')}`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`Let Me ChatGPT That For You ${url}`)}`;

  const copyUrl = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isReveal = variant === 'reveal';
  const btnStyle: React.CSSProperties = isReveal
    ? {
        display: 'inline-flex', alignItems: 'center', gap: '8px',
        padding: '10px 20px', borderRadius: '12px', fontSize: '14px', fontWeight: 500,
        background: '#3a3a3a', color: '#e8e8e8', border: '1px solid rgba(255,255,255,0.1)',
        textDecoration: 'none', cursor: 'pointer', transition: 'background 0.15s',
      }
    : {
        display: 'inline-flex', alignItems: 'center', gap: '6px',
        padding: '8px 14px', borderRadius: '10px', fontSize: '13px', fontWeight: 500,
        background: '#3a3a3a', color: '#d0d0d0', border: '1px solid rgba(255,255,255,0.08)',
        textDecoration: 'none', cursor: 'pointer', transition: 'background 0.15s',
      };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
      <button onClick={copyUrl} style={btnStyle}>
        {copied ? <Check size={14} /> : <Copy size={14} />}
        {copied ? 'Copied!' : 'Copy link'}
      </button>
      <a href={twitterUrl} target="_blank" rel="noopener noreferrer" style={btnStyle}>
        <XIcon size={14} />
        Post
      </a>
      <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" style={btnStyle}>
        <WhatsAppIcon size={14} />
        Share
      </a>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* PassiveAggressiveReveal                                             */
/* ------------------------------------------------------------------ */
function PassiveAggressiveReveal({ show, shareUrl, onDismiss }: { show: boolean; shareUrl: string; onDismiss: () => void }) {
  const [pa] = useState(getRandomPA);

  if (!show) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
        }}
      >
        {/* Backdrop — click to dismiss */}
        <div
          className="overlay-enter"
          onClick={onDismiss}
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            cursor: 'pointer',
          }}
        />

        {/* Card */}
        <div
          className="reveal-card-enter"
          style={{
            position: 'relative',
            zIndex: 1,
            background: 'linear-gradient(145deg, #2a2a2a 0%, #1e1e1e 100%)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '24px',
            padding: '48px 40px 40px',
            maxWidth: '460px',
            width: '100%',
            textAlign: 'center',
            boxShadow: '0 0 80px rgba(124,111,230,0.15), 0 24px 48px rgba(0,0,0,0.4)',
            overflow: 'hidden',
          }}
        >
          {/* Close button */}
          <button
            onClick={onDismiss}
            style={{
              position: 'absolute',
              top: '14px',
              right: '14px',
              background: 'none',
              border: 'none',
              color: '#666',
              cursor: 'pointer',
              padding: '4px',
              lineHeight: 1,
              fontSize: '20px',
              transition: 'color 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#e8e8e8'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#666'; }}
            aria-label="Close"
          >
            <XClose size={20} />
          </button>

          {/* Decorative glow line */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: '20%',
              width: '60%',
              height: '2px',
              background: 'linear-gradient(90deg, transparent, #7c6fe6, transparent)',
              borderRadius: '2px',
            }}
          />

          <h2
            className="display-font"
            style={{ fontSize: 'clamp(28px, 5vw, 40px)', fontWeight: 800, color: '#fff', margin: '0 0 8px', lineHeight: 1.15 }}
          >
            {pa.big}
          </h2>
          <p style={{ fontSize: '17px', color: '#8e8e8e', margin: '0 0 32px' }}>
            {pa.sub}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
            <ShareButtons url={shareUrl} variant="reveal" />
            <button
              onClick={onDismiss}
              style={{
                background: 'none',
                border: 'none',
                color: '#8e8e8e',
                fontSize: '13px',
                cursor: 'pointer',
                padding: '4px 8px',
                transition: 'color 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#e8e8e8'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#8e8e8e'; }}
            >
              View the answer
            </button>
            <a
              href="https://chatgpt.com"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#7c6fe6', fontSize: '14px', fontWeight: 500, textDecoration: 'none' }}
            >
              Ask ChatGPT yourself →
            </a>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

/* ------------------------------------------------------------------ */
/* ChatInput                                                           */
/* ------------------------------------------------------------------ */
function ChatInput({
  value,
  onChange,
  onSubmit,
  placeholder,
  readOnly,
  showCursor,
  inputRef,
  sendButtonRef,
  sendHover,
  sendPressed,
  focusRing,
  charCounter,
}: {
  value: string;
  onChange?: (val: string) => void;
  onSubmit?: () => void;
  placeholder: string;
  readOnly?: boolean;
  showCursor?: boolean;
  inputRef?: React.Ref<HTMLInputElement>;
  sendButtonRef?: React.Ref<HTMLButtonElement>;
  sendHover?: boolean;
  sendPressed?: boolean;
  focusRing?: boolean;
  charCounter?: boolean;
}) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit?.();
    }
  };

  const hasText = value.trim().length > 0;

  // Send button color logic
  let sendBg = '#676767';
  let sendColor = '#e8e8e8';
  let sendScale = 'scale(1)';
  if (hasText || readOnly) {
    sendBg = '#fff';
    sendColor = '#000';
  }
  if (sendHover) sendScale = 'scale(1.08)';
  if (sendPressed) sendScale = 'scale(0.9)';
  if (!hasText && !readOnly) {
    sendBg = '#424242';
    sendColor = '#8e8e8e';
  }

  return (
    <div style={{ width: '100%', maxWidth: '768px', margin: '0 auto', padding: '0 16px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          background: '#303030',
          borderRadius: '24px',
          border: focusRing ? '1px solid #7c6fe6' : '1px solid rgba(255,255,255,0.08)',
          boxShadow: focusRing ? '0 0 0 3px rgba(124,111,230,0.2)' : '0 1px 6px rgba(0,0,0,0.15)',
          transition: 'border-color 0.2s, box-shadow 0.2s',
        }}
      >
        <input
          ref={inputRef as React.Ref<HTMLInputElement>}
          type="text"
          value={value}
          onChange={(e) => onChange?.(e.target.value.slice(0, MAX_LENGTH))}
          onKeyDown={handleKeyDown}
          readOnly={readOnly}
          maxLength={MAX_LENGTH}
          placeholder={placeholder}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: '#e8e8e8',
            fontSize: '15px',
            padding: '14px 0 14px 20px',
            lineHeight: '1.5',
          }}
        />
        {showCursor && (
          <span
            className="text-cursor-blink"
            style={{ display: 'inline-block', width: '2px', height: '20px', background: '#e8e8e8', marginLeft: '-2px' }}
          />
        )}
        <button
          ref={sendButtonRef as React.Ref<HTMLButtonElement>}
          onClick={onSubmit}
          disabled={!hasText && !readOnly}
          style={{
            flexShrink: 0,
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            border: 'none',
            background: sendBg,
            color: sendColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: hasText || readOnly ? 'pointer' : 'default',
            margin: '6px 6px 6px 4px',
            transition: 'all 0.15s ease',
            transform: sendScale,
          }}
        >
          <ArrowUp size={16} strokeWidth={2.5} />
        </button>
      </div>
      {charCounter && value.length > 0 && (
        <div style={{ textAlign: 'right', marginTop: '6px', paddingRight: '16px' }}>
          <span style={{
            fontSize: '11px',
            color: value.length > MAX_LENGTH - 50
              ? value.length >= MAX_LENGTH ? '#f87171' : '#fbbf24'
              : '#666',
          }}>
            {value.length}/{MAX_LENGTH}
          </span>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Sidebar                                                             */
/* ------------------------------------------------------------------ */
function Sidebar({ onClose }: { onClose?: () => void }) {
  return (
    <div
      style={{
        width: '260px',
        background: '#171717',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        flexShrink: 0,
      }}
    >
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 12px 8px' }}>
        {onClose ? (
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#8e8e8e', cursor: 'pointer', padding: '6px' }}>
            <XClose size={18} />
          </button>
        ) : (
          <div style={{ padding: '6px' }} />
        )}
        <button
          style={{
            background: 'none',
            border: 'none',
            color: '#8e8e8e',
            cursor: 'pointer',
            padding: '6px',
            borderRadius: '8px',
            transition: 'background 0.15s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
        >
          <SquarePen size={18} />
        </button>
      </div>

      {/* Chat history */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 8px' }}>
        <p style={{ fontSize: '11px', fontWeight: 600, color: '#666', padding: '8px 8px 4px', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Today
        </p>
        <div
          style={{
            padding: '8px 10px',
            borderRadius: '10px',
            background: 'rgba(255,255,255,0.06)',
            color: '#e8e8e8',
            fontSize: '14px',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            marginBottom: '2px',
          }}
        >
          A very important question…
        </div>

        <p style={{ fontSize: '11px', fontWeight: 600, color: '#666', padding: '12px 8px 4px', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Yesterday
        </p>
        {['How to center a div', 'Best pizza recipe ever'].map((item) => (
          <div
            key={item}
            style={{
              padding: '8px 10px',
              borderRadius: '10px',
              color: '#8e8e8e',
              fontSize: '14px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              marginBottom: '2px',
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            {item}
          </div>
        ))}
      </div>

      {/* Bottom user section */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '10px 12px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '8px',
            borderRadius: '10px',
            cursor: 'pointer',
            transition: 'background 0.15s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
        >
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #7c6fe6 0%, #a78bfa 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            fontWeight: 700,
            color: '#fff',
          }}>
            G
          </div>
          <span style={{ fontSize: '14px', color: '#e8e8e8' }}>Guest</span>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* useIsMobile – replaces broken Tailwind md: responsive classes        */
/* ------------------------------------------------------------------ */
function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < breakpoint);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, [breakpoint]);
  return isMobile;
}

/* ------------------------------------------------------------------ */
/* Main Component                                                      */
/* ------------------------------------------------------------------ */
export default function ChatApp() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q');

  const isMobile = useIsMobile();

  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showShare, setShowShare] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const [animationPhase, setAnimationPhase] = useState<AnimationPhase>('idle');
  const [displayText, setDisplayText] = useState('');
  const [showTypingIndicator, setShowTypingIndicator] = useState(false);
  const [sendHover, setSendHover] = useState(false);
  const [sendPressed, setSendPressed] = useState(false);
  const [focusRing, setFocusRing] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const sendButtonRef = useRef<HTMLButtonElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const animationStarted = useRef(false);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

  useEffect(() => { scrollToBottom(); }, [messages, displayText, showTypingIndicator]);

  const getShareUrl = useCallback(
    (q?: string) => {
      const question = q ?? query ?? inputValue;
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      return `${origin}/?q=${encodeURIComponent(question.trim())}`;
    },
    [query, inputValue],
  );

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  const prefersReducedMotion = () =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Stream AI response */
  const streamAIResponse = useCallback(async (message: string) => {
    setIsStreaming(true);
    setErrorMsg(null);
    const assistantMessage: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content: '' };
    setMessages((prev) => [...prev, assistantMessage]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(err.error || `Error ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader available');

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split('\n').filter((l) => l.trim());
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') break;
            try {
              const parsed = JSON.parse(data);
              if (parsed.error) throw new Error(parsed.error);
              if (parsed.text) {
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMessage.id ? { ...msg, content: msg.content + parsed.text } : msg,
                  ),
                );
              }
            } catch (e) {
              if (e instanceof Error && e.message !== 'Unexpected end of JSON input') throw e;
            }
          }
        }
      }
    } catch (error) {
      console.error('Streaming error:', error);
      const msg = error instanceof Error ? error.message : 'Something went wrong';
      setErrorMsg(msg);
      setMessages((prev) =>
        prev.map((m) => (m.id === assistantMessage.id ? { ...m, content: m.content || `Error: ${msg}` } : m)),
      );
    } finally {
      setIsStreaming(false);
    }
  }, []);

  /* LMGTFY Animation Orchestrator */
  const runDemoAnimation = useCallback(
    async (text: string) => {
      const reduced = prefersReducedMotion();
      if (reduced) {
        const userMessage: Message = { id: Date.now().toString(), role: 'user', content: text };
        setMessages([userMessage]);
        setShowTypingIndicator(true);
        await streamAIResponse(text);
        setShowTypingIndicator(false);
        await sleep(10500);
        setAnimationPhase('reveal');
        return;
      }

      // Phase 0: Setup
      setAnimationPhase('idle');
      await sleep(500);
      // Phase 1: Cursor moves to input
      setAnimationPhase('cursor-moving');
      await sleep(700);
      // Phase 2: Click
      setAnimationPhase('cursor-clicking');
      setFocusRing(true);
      await sleep(300);
      // Phase 3: Typing
      setAnimationPhase('typing');
      for (let i = 0; i <= text.length; i++) {
        setDisplayText(text.slice(0, i));
        await sleep(50 + Math.random() * 30);
      }
      await sleep(600);
      // Phase 4: Cursor to send
      setAnimationPhase('cursor-to-send');
      setSendHover(true);
      await sleep(600);
      // Click send
      setAnimationPhase('send-clicking');
      setSendHover(false);
      setSendPressed(true);
      await sleep(200);
      setSendPressed(false);
      // Phase 5: Message sent
      setAnimationPhase('message-sent');
      const userMessage: Message = { id: Date.now().toString(), role: 'user', content: text };
      setMessages([userMessage]);
      setDisplayText('');
      setFocusRing(false);
      await sleep(500);
      // Phase 6: AI responds
      setAnimationPhase('ai-responding');
      setShowTypingIndicator(true);
      await sleep(800);
      setShowTypingIndicator(false);
      await streamAIResponse(text);
      // Phase 7: Reveal
      await sleep(11000);
      setAnimationPhase('reveal');
    },
    [streamAIResponse],
  );

  useEffect(() => {
    if (query && !animationStarted.current) {
      animationStarted.current = true;
      runDemoAnimation(decodeURIComponent(query));
    }
  }, [query, runDemoAnimation]);

  const generateLink = () => {
    if (!inputValue.trim()) return;
    navigator.clipboard.writeText(getShareUrl(inputValue));
    setShowShare(true);
  };

  /* ================================================================ */
  /* HOMEPAGE                                                          */
  /* ================================================================ */
  if (!query) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: '#212121',
          color: '#e8e8e8',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Ambient glow */}
        <div
          style={{
            position: 'absolute',
            top: '20%',
            left: '50%',
            width: '600px',
            height: '400px',
            transform: 'translate(-50%, -50%)',
            background: 'radial-gradient(ellipse, rgba(124,111,230,0.12) 0%, transparent 70%)',
            pointerEvents: 'none',
            animation: 'gradientOrb 8s ease-in-out infinite',
          }}
        />

        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px', position: 'relative', zIndex: 1 }}>
          <div style={{ width: '100%', maxWidth: '640px' }}>
            {/* Title */}
            <div style={{ textAlign: 'center', marginBottom: '48px' }}>
              <h1
                className="display-font"
                style={{
                  fontSize: 'clamp(36px, 7vw, 64px)',
                  fontWeight: 800,
                  lineHeight: 1.1,
                  margin: '0 0 16px',
                  color: '#fff',
                }}
              >
                Let Me{' '}
                <span style={{
                  color: '#7c6fe6',
                  textShadow: '0 0 40px rgba(124,111,230,0.4)',
                }}>
                  ChatGPT
                </span>
                {' '}That For You
              </h1>
              <p style={{ fontSize: '17px', color: '#8e8e8e', margin: 0, lineHeight: 1.5 }}>
                For all those questions that could have been asked to ChatGPT
              </p>
            </div>

            {/* Input */}
            <ChatInput
              value={inputValue}
              onChange={setInputValue}
              onSubmit={generateLink}
              placeholder="What should they have asked ChatGPT?"
              charCounter
            />

            <p style={{ textAlign: 'center', fontSize: '12px', color: '#666', marginTop: '10px' }}>
              Press Enter to generate a passive-aggressive link
            </p>

            {/* Share panel */}
            <AnimatePresence>
              {showShare && (
                <motion.div
                  initial={{ opacity: 0, y: 16, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  style={{ marginTop: '24px', maxWidth: '480px', marginLeft: 'auto', marginRight: 'auto' }}
                >
                  <div
                    style={{
                      background: '#2a2a2a',
                      border: '1px solid rgba(255,255,255,0.06)',
                      borderRadius: '16px',
                      padding: '20px',
                    }}
                  >
                    {/* URL display */}
                    <div
                      style={{
                        background: '#171717',
                        borderRadius: '10px',
                        padding: '10px 14px',
                        marginBottom: '16px',
                        overflow: 'hidden',
                      }}
                    >
                      <p style={{
                        margin: 0,
                        fontSize: '13px',
                        color: '#8e8e8e',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        userSelect: 'all',
                      }}>
                        {getShareUrl(inputValue)}
                      </p>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      <ShareButtons url={getShareUrl(inputValue)} />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Footer */}
        <footer style={{ textAlign: 'center', padding: '20px', color: '#555', fontSize: '13px', position: 'relative', zIndex: 1 }}>
          Because some questions deserve a little passive aggression
        </footer>
      </div>
    );
  }

  /* ================================================================ */
  /* CHAT MODE                                                         */
  /* ================================================================ */
  return (
    <div style={{ height: '100vh', background: '#212121', color: '#e8e8e8', display: 'flex', overflow: 'hidden' }}>
      <AnimatedCursor phase={animationPhase} inputRef={inputRef} sendButtonRef={sendButtonRef} />

      {/* Sidebar – desktop */}
      {!isMobile && <Sidebar />}

      {/* Mobile header */}
      {isMobile && <div
        style={{
          display: 'flex',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 40,
          background: '#212121',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 16px',
        }}
      >
        <button
          onClick={() => setShowMobileMenu(!showMobileMenu)}
          style={{ background: 'none', border: 'none', color: '#8e8e8e', cursor: 'pointer', padding: '4px' }}
        >
          {showMobileMenu ? <XClose size={20} /> : <Menu size={20} />}
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Sparkles size={15} color="#7c6fe6" />
          <span style={{ fontWeight: 600, fontSize: '14px' }}>LMGPTTFY</span>
        </div>
        <div style={{ width: '28px' }} />
      </div>}

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {isMobile && showMobileMenu && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMobileMenu(false)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 45 }}
            />
            <motion.div
              initial={{ x: -260 }}
              animate={{ x: 0 }}
              exit={{ x: -260 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              style={{ position: 'fixed', top: 0, bottom: 0, left: 0, zIndex: 50 }}
            >
              <Sidebar onClose={() => setShowMobileMenu(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main chat area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Model indicator – desktop */}
        {!isMobile && (
          <div style={{ display: 'flex', padding: '14px 20px', alignItems: 'center' }}>
            <span style={{ fontSize: '15px', fontWeight: 600, color: '#e8e8e8' }}>LMGPTTFY</span>
            <span style={{ fontSize: '11px', color: '#666', marginLeft: '8px', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '6px' }}>demo</span>
          </div>
        )}

        {/* Messages scroll area */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            paddingTop: isMobile ? '56px' : '16px',
            paddingBottom: '16px',
            paddingLeft: '16px',
            paddingRight: '16px',
          }}
        >
          {/* Empty state when no messages yet */}
          {messages.length === 0 && animationPhase === 'idle' && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', opacity: 0.3 }}>
              <Sparkles size={40} color="#7c6fe6" />
            </div>
          )}

          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              isStreaming={isStreaming && message.role === 'assistant'}
            />
          ))}

          {showTypingIndicator && <TypingIndicator />}

          {errorMsg && !isStreaming && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                maxWidth: '768px',
                margin: '0 auto 20px',
                padding: '12px 16px',
                background: 'rgba(220,38,38,0.1)',
                border: '1px solid rgba(220,38,38,0.2)',
                borderRadius: '12px',
                color: '#fca5a5',
                fontSize: '14px',
                textAlign: 'center',
              }}
            >
              {errorMsg}
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div style={{ padding: '8px 0 16px', paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))' }}>
          <ChatInput
            value={displayText}
            readOnly
            placeholder={
              animationPhase === 'reveal'
                ? 'This was a demo — ask ChatGPT yourself next time!'
                : animationPhase === 'idle'
                  ? 'Ask anything…'
                  : ''
            }
            showCursor={animationPhase === 'typing'}
            inputRef={inputRef}
            sendButtonRef={sendButtonRef}
            sendHover={sendHover}
            sendPressed={sendPressed}
            focusRing={focusRing}
          />
          <p style={{ textAlign: 'center', fontSize: '11px', color: '#555', marginTop: '8px' }}>
            LMGPTTFY may produce inaccurate information — but at least it tried
          </p>
        </div>
      </div>

      <PassiveAggressiveReveal show={animationPhase === 'reveal'} shareUrl={getShareUrl()} onDismiss={() => setAnimationPhase('idle')} />
    </div>
  );
}
