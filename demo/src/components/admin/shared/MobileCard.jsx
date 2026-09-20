import React from 'react';

/**
 * Mobile card primitives - the sub-`md` stand-in for the admin data tables.
 *
 * Each table site keeps its <table> inside a `hidden md:block` wrapper and maps
 * the same rows through <MobileCard> inside <MobileCardList>, so both views are
 * fed by one array and one set of handlers.
 */

const ACCENTS = {
  purple: 'border-purple-500/30 shadow-[0_0_18px_rgba(147,51,234,0.12)]',
  cyan: 'border-cyan-500/30 shadow-[0_0_18px_rgba(0,240,255,0.12)]',
  emerald: 'border-emerald-500/30 shadow-[0_0_18px_rgba(16,185,129,0.12)]',
  amber: 'border-amber-500/30 shadow-[0_0_18px_rgba(245,158,11,0.12)]',
  red: 'border-red-500/30 shadow-[0_0_18px_rgba(239,68,68,0.12)]',
  slate: 'border-white/10',
};

export function MobileCardList({ children, className = '' }) {
  return <div className={`md:hidden space-y-2.5 ${className}`}>{children}</div>;
}

export function MobileCard({
  title,
  subtitle,
  badge,
  accent = 'purple',
  children,
  footer,
  onClick,
  className = '',
}) {
  const Wrapper = onClick ? 'button' : 'div';

  return (
    <Wrapper
      onClick={onClick}
      className={`w-full text-left glass-panel bg-[#0C0A1D]/80 border rounded-2xl p-3.5 space-y-2.5 ${
        ACCENTS[accent] || ACCENTS.purple
      } ${onClick ? 'cursor-pointer active:bg-purple-950/30 transition-colors' : ''} ${className}`}
    >
      {(title || badge || subtitle) && (
        <div className="flex items-start justify-between gap-2.5">
          <div className="min-w-0">
            {title && (
              <div className="font-cyber text-xs font-bold text-white uppercase tracking-wider break-words">
                {title}
              </div>
            )}
            {subtitle && (
              <div className="text-[11px] text-gray-400 mt-0.5 break-words">{subtitle}</div>
            )}
          </div>
          {badge && <div className="shrink-0">{badge}</div>}
        </div>
      )}

      {children && <div className="space-y-1 pt-0.5 border-t border-white/5">{children}</div>}

      {footer && <div className="pt-2 border-t border-white/5">{footer}</div>}
    </Wrapper>
  );
}

export function MobileCardRow({ label, value, className = '' }) {
  return (
    <div className="flex items-start justify-between gap-3 py-0.5">
      <span className="text-[10px] font-mono uppercase tracking-wider text-gray-500 shrink-0 pt-0.5">
        {label}
      </span>
      <div className={`text-xs text-gray-200 text-right min-w-0 break-words ${className}`}>
        {value}
      </div>
    </div>
  );
}

/** Footer button row - stacks to full-width taps on the narrowest phones. */
export function MobileCardActions({ children, className = '' }) {
  return (
    <div className={`flex flex-wrap items-center gap-2 [&>*]:flex-1 [&>*]:min-w-[7rem] ${className}`}>
      {children}
    </div>
  );
}

/** Empty state matching the tables' "no rows" cell. */
export function MobileCardEmpty({ icon: Icon, children }) {
  return (
    <div className="md:hidden text-center py-8 space-y-2 glass-panel rounded-2xl border border-white/10">
      {Icon && <Icon className="w-7 h-7 text-gray-600 mx-auto opacity-50" />}
      <p className="text-xs text-gray-500 font-mono">{children}</p>
    </div>
  );
}
