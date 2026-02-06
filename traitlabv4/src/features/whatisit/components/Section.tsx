/**
 * Section Component
 * Reusable wrapper for content sections with fade-in animation
 */

import { useScrollAnimation } from '../hooks/useScrollAnimation';

interface SectionProps {
  id: string;
  title?: string;
  emoji?: string;
  children: React.ReactNode;
  className?: string;
}

export function Section({ id, title, emoji, children, className = '' }: SectionProps) {
  const ref = useScrollAnimation();

  return (
    <section
      id={id}
      ref={ref}
      className={`fade-in mb-20 ${className}`}
    >
      {title && (
        <h2 className="mb-8 text-4xl font-bold text-foreground">
          {emoji && <span className="mr-3 text-5xl">{emoji}</span>}
          {title}
        </h2>
      )}
      {children}
    </section>
  );
}
