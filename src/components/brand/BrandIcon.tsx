// The Mahalli app mark: green-gradient bag with an "M" and a coral handle.
// Kept in sync with /public/brand/icon.svg (which drives the PWA / favicon).
// Inline so it scales crisply in the header lockup without an extra request.
export function BrandIcon({ size = 30 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      fill="none"
      role="img"
      aria-label="Mahalli"
      style={{ display: "block", flex: "none" }}
    >
      <defs>
        <linearGradient id="mahalliMark" x1="256" y1="0" x2="256" y2="512" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#37a767" />
          <stop offset="1" stopColor="#288a4f" />
        </linearGradient>
      </defs>
      <rect width="512" height="512" rx="116" fill="url(#mahalliMark)" />
      <path d="M206 214 V176 a50 50 0 0 1 100 0 V214" fill="none" stroke="#ec7148" strokeWidth="30" strokeLinecap="round" />
      <rect x="150" y="196" width="212" height="202" rx="46" fill="#f7f3ea" />
      <path d="M200 346 V260 Q200 251 209 257 L250 293 Q256 298 262 293 L303 257 Q312 251 312 260 V346" fill="none" stroke="#2b8f55" strokeWidth="30" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
