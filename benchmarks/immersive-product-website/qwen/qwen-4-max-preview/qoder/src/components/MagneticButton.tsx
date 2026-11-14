import { useRef, type ButtonHTMLAttributes, type PointerEvent } from 'react';
import { useReducedMotion } from '../lib/hooks';

type Props = ButtonHTMLAttributes<HTMLButtonElement>;

export function MagneticButton({ children, className = '', ...rest }: Props) {
  const btnRef = useRef<HTMLButtonElement>(null);
  const reduced = useReducedMotion();

  const onMove = (e: PointerEvent<HTMLSpanElement>) => {
    const btn = btnRef.current;
    if (!btn || reduced || e.pointerType !== 'mouse') return;
    const r = btn.getBoundingClientRect();
    const mx = ((e.clientX - r.left) / r.width) * 2 - 1;
    const my = ((e.clientY - r.top) / r.height) * 2 - 1;
    btn.style.setProperty('--mx', mx.toFixed(3));
    btn.style.setProperty('--my', my.toFixed(3));
    btn.style.setProperty('--px', `${(((e.clientX - r.left) / r.width) * 100).toFixed(1)}%`);
    btn.style.setProperty('--py', `${(((e.clientY - r.top) / r.height) * 100).toFixed(1)}%`);
  };

  const onLeave = () => {
    const btn = btnRef.current;
    if (!btn) return;
    btn.style.setProperty('--mx', '0');
    btn.style.setProperty('--my', '0');
  };

  return (
    <span className="magnetic" onPointerMove={onMove} onPointerLeave={onLeave}>
      <button ref={btnRef} type="button" className={`btn ${className}`} {...rest}>
        {children}
      </button>
    </span>
  );
}