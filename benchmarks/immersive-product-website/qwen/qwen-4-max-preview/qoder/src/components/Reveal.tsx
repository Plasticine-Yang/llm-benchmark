import type { CSSProperties, ReactNode } from 'react';
import { useInView } from '../lib/hooks';

interface RevealProps {
  children: ReactNode;
  delay?: number;
  className?: string;
  style?: CSSProperties;
}

export function Reveal({ children, delay = 0, className = '', style }: RevealProps) {
  const { ref, inView } = useInView<HTMLDivElement>({ threshold: 0.15, rootMargin: '0px 0px -6% 0px' });
  return (
    <div
      ref={ref}
      className={`reveal ${inView ? 'is-in' : ''} ${className}`}
      style={{ ...style, '--reveal-delay': `${delay}ms` } as CSSProperties}
    >
      {children}
    </div>
  );
}