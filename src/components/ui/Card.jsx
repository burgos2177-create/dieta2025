export default function Card({ children, className = '', title, right, pad = true }) {
  return (
    <div
      className={`bg-card border border-border rounded-card shadow-[0_2px_16px_rgba(0,0,0,0.3)] ${
        pad ? 'p-4 sm:p-5' : ''
      } ${className}`}
    >
      {(title || right) && (
        <div className="flex items-center justify-between mb-3">
          {title && <h3 className="font-display text-lg text-white/90 tracking-wide">{title}</h3>}
          {right}
        </div>
      )}
      {children}
    </div>
  );
}
