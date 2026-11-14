import { useState, useRef, useEffect } from "react";

/* ─────────────────────────────────────────────────────────
   Types
───────────────────────────────────────────────────────── */
type FieldSize = "sm" | "md" | "lg";
type FieldVariant = "outlined" | "filled" | "underline";

interface FieldConfig {
  size: FieldSize;
  variant: FieldVariant;
  label: boolean;
  placeholder: boolean;
  required: boolean;
  disabled: boolean;
  readOnly: boolean;
  error: boolean;
  success: boolean;
  helperText: boolean;
  startIcon: boolean;
  endIcon: boolean;
  clearable: boolean;
}

/* ─────────────────────────────────────────────────────────
   Static data
───────────────────────────────────────────────────────── */
const COUNTRIES = [
  { code: "US", name: "United States", flag: "🇺🇸", dialCode: "+1" },
  { code: "GB", name: "United Kingdom", flag: "🇬🇧", dialCode: "+44" },
  { code: "IN", name: "India", flag: "🇮🇳", dialCode: "+91" },
  { code: "DE", name: "Germany", flag: "🇩🇪", dialCode: "+49" },
  { code: "FR", name: "France", flag: "🇫🇷", dialCode: "+33" },
  { code: "JP", name: "Japan", flag: "🇯🇵", dialCode: "+81" },
  { code: "CN", name: "China", flag: "🇨🇳", dialCode: "+86" },
  { code: "AU", name: "Australia", flag: "🇦🇺", dialCode: "+61" },
  { code: "CA", name: "Canada", flag: "🇨🇦", dialCode: "+1" },
  { code: "BR", name: "Brazil", flag: "🇧🇷", dialCode: "+55" },
  { code: "SG", name: "Singapore", flag: "🇸🇬", dialCode: "+65" },
  { code: "AE", name: "UAE", flag: "🇦🇪", dialCode: "+971" },
  { code: "NL", name: "Netherlands", flag: "🇳🇱", dialCode: "+31" },
  { code: "SE", name: "Sweden", flag: "🇸🇪", dialCode: "+46" },
  { code: "NO", name: "Norway", flag: "🇳🇴", dialCode: "+47" },
  { code: "CH", name: "Switzerland", flag: "🇨🇭", dialCode: "+41" },
  { code: "IT", name: "Italy", flag: "🇮🇹", dialCode: "+39" },
  { code: "ES", name: "Spain", flag: "🇪🇸", dialCode: "+34" },
  { code: "KR", name: "South Korea", flag: "🇰🇷", dialCode: "+82" },
  { code: "NZ", name: "New Zealand", flag: "🇳🇿", dialCode: "+64" },
];

const SELECT_OPTIONS = [
  "Product Designer",
  "Frontend Engineer",
  "Backend Engineer",
  "Full Stack Engineer",
  "DevOps Engineer",
  "Product Manager",
  "Data Scientist",
  "UX Researcher",
  "Engineering Manager",
  "CTO",
];

const COMBOBOX_FLAT = [
  { value: "connect", label: "Connect", icon: "💬" },
  { value: "flow", label: "Flow", icon: "📋" },
  { value: "atlas", label: "Atlas", icon: "📄" },
  { value: "pulse", label: "Pulse", icon: "📅" },
  { value: "cadence", label: "Cadence", icon: "🎯" },
  { value: "nexus", label: "Nexus AI", icon: "✨" },
  { value: "analytics", label: "Analytics", icon: "📊" },
  { value: "integrations", label: "Integrations", icon: "🔗" },
];

const COMBOBOX_HIERARCHY = [
  {
    value: "engineering",
    label: "Engineering",
    children: [
      { value: "frontend", label: "Frontend" },
      { value: "backend", label: "Backend" },
      { value: "devops", label: "DevOps" },
      { value: "mobile", label: "Mobile" },
    ],
  },
  {
    value: "design",
    label: "Design",
    children: [
      { value: "product-design", label: "Product Design" },
      { value: "ux-research", label: "UX Research" },
      { value: "brand", label: "Brand & Visual" },
    ],
  },
  {
    value: "product",
    label: "Product",
    children: [
      { value: "product-management", label: "Product Management" },
      { value: "growth", label: "Growth" },
      { value: "data", label: "Data & Analytics" },
    ],
  },
];

const COMBOBOX_GROUPED = [
  {
    heading: "Active Members",
    options: [
      { value: "jane", label: "Jane Smith", sub: "jane@company.com" },
      { value: "alex", label: "Alex Johnson", sub: "alex@company.com" },
      { value: "priya", label: "Priya Sharma", sub: "priya@company.com" },
    ],
  },
  {
    heading: "Pending Invite",
    options: [
      { value: "mike", label: "Mike Chen", sub: "mike@company.com" },
      { value: "sara", label: "Sara Patel", sub: "sara@company.com" },
    ],
  },
];

/* ─────────────────────────────────────────────────────────
   Helpers
───────────────────────────────────────────────────────── */
function useClickOutside(ref: React.RefObject<HTMLElement | null>, cb: () => void) {
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) cb();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [cb]);
}

const sizeMap: Record<FieldSize, { px: string; py: string; text: string; iconSize: number }> = {
  sm: { px: "px-3", py: "py-1.5", text: "text-xs", iconSize: 14 },
  md: { px: "px-4", py: "py-2.5", text: "text-sm", iconSize: 16 },
  lg: { px: "px-5", py: "py-3.5", text: "text-base", iconSize: 18 },
};

/* ─────────────────────────────────────────────────────────
   Field wrapper — label, helper, error
───────────────────────────────────────────────────────── */
function FieldWrapper({
  label,
  required,
  error,
  success,
  helperText,
  errorText,
  showLabel,
  showHelper,
  children,
}: {
  label: string;
  required: boolean;
  error: boolean;
  success: boolean;
  helperText: string;
  errorText: string;
  showLabel: boolean;
  showHelper: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      {showLabel && (
        <label className="flex items-center gap-1 text-sm font-semibold text-slate-700">
          {label}
          {required && <span style={{ color: "#dc2626" }}>*</span>}
        </label>
      )}
      {children}
      {(showHelper || error) && (
        <p
          className="text-xs flex items-center gap-1"
          style={{ color: error ? "#dc2626" : success ? "#059669" : "#94a3b8" }}
        >
          {error ? (
            <>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {errorText}
            </>
          ) : success ? (
            <>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Looks good!
            </>
          ) : (
            showHelper && helperText
          )}
        </p>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Base input style resolver
───────────────────────────────────────────────────────── */
function baseInputStyle(
  cfg: FieldConfig,
  focused: boolean,
  hasValue: boolean
): React.CSSProperties {
  const errBorder = "#dc2626";
  const okBorder = "#059669";
  const focusBorder = "#036c5f";
  const defaultBorder = "#e2e8f0";

  const border = cfg.error ? errBorder : cfg.success ? okBorder : focused ? focusBorder : defaultBorder;
  const shadow = focused
    ? `0 0 0 3px ${cfg.error ? "rgba(220,38,38,0.12)" : "rgba(3,108,95,0.12)"}`
    : "none";

  if (cfg.variant === "filled") {
    return {
      backgroundColor: cfg.disabled ? "#f8fafc" : focused ? "white" : "#f1f5f9",
      border: `1px solid ${border}`,
      borderRadius: "10px",
      boxShadow: shadow,
      transition: "all 0.15s",
    };
  }
  if (cfg.variant === "underline") {
    return {
      backgroundColor: "transparent",
      border: "none",
      borderBottom: `2px solid ${border}`,
      borderRadius: "0",
      boxShadow: "none",
      transition: "all 0.15s",
    };
  }
  return {
    backgroundColor: cfg.disabled ? "#f8fafc" : "white",
    border: `1px solid ${border}`,
    borderRadius: "10px",
    boxShadow: shadow,
    transition: "all 0.15s",
  };
}

/* ─────────────────────────────────────────────────────────
   Icons
───────────────────────────────────────────────────────── */
const SearchIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);
const UserIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
  </svg>
);
const MailIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);
const LockIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <rect x="3" y="11" width="18" height="11" rx="2" />
    <path d="M7 11V7a5 5 0 0110 0v4" />
  </svg>
);
const PhoneIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.22 1.18 2 2 0 012.18 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.91a16 16 0 006.72 6.72l1.28-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
  </svg>
);
const GlobeIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20" />
  </svg>
);
const EyeIcon = ({ size = 16, off = false }: { size?: number; off?: boolean }) =>
  off ? (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  ) : (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
    </svg>
  );
const ChevronIcon = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);
const XIcon = ({ size = 12 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
const CheckIcon = ({ size = 12 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const HashIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="4" y1="9" x2="20" y2="9" /><line x1="4" y1="15" x2="20" y2="15" />
    <line x1="10" y1="3" x2="8" y2="21" /><line x1="16" y1="3" x2="14" y2="21" />
  </svg>
);

/* ─────────────────────────────────────────────────────────
   1. TextField
───────────────────────────────────────────────────────── */
function TextField({ cfg }: { cfg: FieldConfig }) {
  const [value, setValue] = useState("");
  const [focused, setFocused] = useState(false);
  const sz = sizeMap[cfg.size];

  return (
    <FieldWrapper
      label="Full name"
      required={cfg.required}
      error={cfg.error}
      success={cfg.success && value.length > 0}
      helperText="Enter your legal full name as it appears on official documents"
      errorText="Full name is required"
      showLabel={cfg.label}
      showHelper={cfg.helperText}
    >
      <div
        className={`flex items-center gap-2 w-full ${sz.px} ${sz.py}`}
        style={baseInputStyle(cfg, focused, value.length > 0)}
      >
        {cfg.startIcon && (
          <span className="flex-shrink-0 text-slate-400">
            <UserIcon size={sz.iconSize} />
          </span>
        )}
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          disabled={cfg.disabled}
          readOnly={cfg.readOnly}
          placeholder={cfg.placeholder ? "Jane Smith" : undefined}
          className={`flex-1 bg-transparent outline-none ${sz.text} text-slate-900 placeholder:text-slate-400 disabled:cursor-not-allowed disabled:text-slate-400`}
        />
        {cfg.clearable && value && (
          <button onClick={() => setValue("")} className="flex-shrink-0 text-slate-400 hover:text-slate-600 transition-colors">
            <XIcon size={14} />
          </button>
        )}
        {cfg.endIcon && !cfg.clearable && (
          <span className="flex-shrink-0 text-slate-400"><SearchIcon size={sz.iconSize} /></span>
        )}
      </div>
    </FieldWrapper>
  );
}

/* ─────────────────────────────────────────────────────────
   2. NumberField
───────────────────────────────────────────────────────── */
function NumberField({ cfg }: { cfg: FieldConfig }) {
  const [value, setValue] = useState<number | "">("");
  const [focused, setFocused] = useState(false);
  const sz = sizeMap[cfg.size];

  const step = (dir: 1 | -1) => {
    const cur = typeof value === "number" ? value : 0;
    setValue(Math.max(0, cur + dir));
  };

  return (
    <FieldWrapper
      label="Seat count"
      required={cfg.required}
      error={cfg.error}
      success={cfg.success && value !== ""}
      helperText="Number of licensed seats (1–999)"
      errorText="Please enter a valid number"
      showLabel={cfg.label}
      showHelper={cfg.helperText}
    >
      <div
        className={`flex items-center gap-2 w-full`}
        style={baseInputStyle(cfg, focused, value !== "")}
      >
        {cfg.startIcon && (
          <span className={`flex-shrink-0 text-slate-400 pl-3`}><HashIcon size={sz.iconSize} /></span>
        )}
        <input
          type="number"
          value={value}
          onChange={(e) => setValue(e.target.value === "" ? "" : Number(e.target.value))}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          disabled={cfg.disabled}
          readOnly={cfg.readOnly}
          placeholder={cfg.placeholder ? "0" : undefined}
          className={`flex-1 bg-transparent outline-none ${sz.text} ${sz.py} ${cfg.startIcon ? "" : sz.px} text-slate-900 placeholder:text-slate-400 disabled:cursor-not-allowed [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
        />
        {!cfg.disabled && !cfg.readOnly && (
          <div className="flex flex-col border-l" style={{ borderColor: "#e2e8f0" }}>
            <button
              onClick={() => step(1)}
              className="px-2.5 py-1 text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors"
              style={{ borderBottom: "1px solid #e2e8f0", lineHeight: 1 }}
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="18 15 12 9 6 15" /></svg>
            </button>
            <button
              onClick={() => step(-1)}
              className="px-2.5 py-1 text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors"
              style={{ lineHeight: 1 }}
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="6 9 12 15 18 9" /></svg>
            </button>
          </div>
        )}
      </div>
    </FieldWrapper>
  );
}

/* ─────────────────────────────────────────────────────────
   3. PhoneField
───────────────────────────────────────────────────────── */
function PhoneField({ cfg }: { cfg: FieldConfig }) {
  const [value, setValue] = useState("");
  const [focused, setFocused] = useState(false);
  const [country, setCountry] = useState(COUNTRIES[2]); // India default
  const [countryOpen, setCountryOpen] = useState(false);
  const [search, setSearch] = useState("");
  const wrapRef = useRef<HTMLDivElement>(null);
  const sz = sizeMap[cfg.size];

  useClickOutside(wrapRef, () => { setCountryOpen(false); setSearch(""); });

  const filtered = COUNTRIES.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) || c.dialCode.includes(search)
  );

  return (
    <FieldWrapper
      label="Phone number"
      required={cfg.required}
      error={cfg.error}
      success={cfg.success && value.length >= 7}
      helperText="Include country code for international numbers"
      errorText="Please enter a valid phone number"
      showLabel={cfg.label}
      showHelper={cfg.helperText}
    >
      <div ref={wrapRef} className="relative">
        <div
          className={`flex items-center gap-0 w-full`}
          style={baseInputStyle(cfg, focused, value.length > 0)}
        >
          {/* Country code button */}
          <button
            onClick={() => { if (!cfg.disabled && !cfg.readOnly) setCountryOpen(!countryOpen); }}
            disabled={cfg.disabled}
            className={`flex items-center gap-1.5 ${sz.px} ${sz.py} border-r flex-shrink-0 hover:bg-slate-50 transition-colors rounded-l-[10px] disabled:cursor-not-allowed`}
            style={{ borderColor: "#e2e8f0" }}
          >
            <span className="text-base leading-none">{country.flag}</span>
            <span className={`${sz.text} text-slate-700 font-medium`}>{country.dialCode}</span>
            <ChevronIcon size={12} />
          </button>
          {/* Phone input */}
          <input
            type="tel"
            value={value}
            onChange={(e) => setValue(e.target.value.replace(/[^\d\s\-().+]/g, ""))}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            disabled={cfg.disabled}
            readOnly={cfg.readOnly}
            placeholder={cfg.placeholder ? "98765 43210" : undefined}
            className={`flex-1 bg-transparent outline-none ${sz.text} ${sz.py} px-3 text-slate-900 placeholder:text-slate-400 disabled:cursor-not-allowed`}
          />
          {cfg.clearable && value && (
            <button onClick={() => setValue("")} className="pr-3 text-slate-400 hover:text-slate-600">
              <XIcon size={14} />
            </button>
          )}
        </div>

        {/* Country dropdown */}
        {countryOpen && (
          <div
            className="absolute z-50 top-full mt-1 w-72 rounded-xl overflow-hidden"
            style={{ backgroundColor: "white", border: "1px solid #e2e8f0", boxShadow: "0 8px 32px rgba(0,0,0,0.12)" }}
          >
            <div className="p-2 border-b" style={{ borderColor: "#f1f5f9" }}>
              <input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search countries..."
                className="w-full px-3 py-2 text-sm rounded-lg outline-none bg-slate-50 text-slate-900 placeholder:text-slate-400"
              />
            </div>
            <div className="max-h-52 overflow-y-auto">
              {filtered.map((c) => (
                <button
                  key={c.code}
                  onClick={() => { setCountry(c); setCountryOpen(false); setSearch(""); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-slate-50 transition-colors"
                >
                  <span className="text-lg">{c.flag}</span>
                  <span className="flex-1 text-sm text-slate-800">{c.name}</span>
                  <span className="text-xs font-mono text-slate-400">{c.dialCode}</span>
                  {c.code === country.code && (
                    <span style={{ color: "#036c5f" }}><CheckIcon size={14} /></span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </FieldWrapper>
  );
}

/* ─────────────────────────────────────────────────────────
   4. CountryField
───────────────────────────────────────────────────────── */
function CountryField({ cfg }: { cfg: FieldConfig }) {
  const [selected, setSelected] = useState<typeof COUNTRIES[0] | null>(null);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [focused, setFocused] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const sz = sizeMap[cfg.size];

  useClickOutside(wrapRef, () => { setOpen(false); setSearch(""); });

  const filtered = COUNTRIES.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <FieldWrapper
      label="Country"
      required={cfg.required}
      error={cfg.error}
      success={cfg.success && !!selected}
      helperText="Select your country of residence"
      errorText="Please select a country"
      showLabel={cfg.label}
      showHelper={cfg.helperText}
    >
      <div ref={wrapRef} className="relative">
        <button
          disabled={cfg.disabled}
          onClick={() => { if (!cfg.readOnly) setOpen(!open); setFocused(true); }}
          onBlur={() => setFocused(false)}
          className={`flex items-center gap-2 w-full ${sz.px} ${sz.py} text-left disabled:cursor-not-allowed`}
          style={baseInputStyle(cfg, open, !!selected)}
        >
          {cfg.startIcon && <span className="text-slate-400"><GlobeIcon size={sz.iconSize} /></span>}
          {selected ? (
            <span className="flex items-center gap-2 flex-1">
              <span className="text-base">{selected.flag}</span>
              <span className={`${sz.text} text-slate-900`}>{selected.name}</span>
            </span>
          ) : (
            <span className={`flex-1 ${sz.text} text-slate-400`}>
              {cfg.placeholder ? "Select country..." : ""}
            </span>
          )}
          <div className="flex items-center gap-1 ml-auto">
            {cfg.clearable && selected && (
              <span
                role="button"
                onClick={(e) => { e.stopPropagation(); setSelected(null); }}
                className="text-slate-400 hover:text-slate-600"
              >
                <XIcon size={14} />
              </span>
            )}
            <span className={`text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}>
              <ChevronIcon size={sz.iconSize} />
            </span>
          </div>
        </button>

        {open && (
          <div
            className="absolute z-50 top-full mt-1 w-full rounded-xl overflow-hidden"
            style={{ backgroundColor: "white", border: "1px solid #e2e8f0", boxShadow: "0 8px 32px rgba(0,0,0,0.12)" }}
          >
            <div className="p-2 border-b" style={{ borderColor: "#f1f5f9" }}>
              <input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search countries..."
                className="w-full px-3 py-2 text-sm rounded-lg outline-none bg-slate-50 text-slate-900 placeholder:text-slate-400"
              />
            </div>
            <div className="max-h-56 overflow-y-auto">
              {filtered.map((c) => (
                <button
                  key={c.code}
                  onClick={() => { setSelected(c); setOpen(false); setSearch(""); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-slate-50 transition-colors"
                >
                  <span className="text-lg">{c.flag}</span>
                  <span className="flex-1 text-sm text-slate-800">{c.name}</span>
                  {selected?.code === c.code && (
                    <span style={{ color: "#036c5f" }}><CheckIcon size={14} /></span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </FieldWrapper>
  );
}

/* ─────────────────────────────────────────────────────────
   5. EmailField
───────────────────────────────────────────────────────── */
function EmailField({ cfg }: { cfg: FieldConfig }) {
  const [value, setValue] = useState("");
  const [focused, setFocused] = useState(false);
  const [touched, setTouched] = useState(false);
  const sz = sizeMap[cfg.size];

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  const showError = cfg.error || (touched && !isValidEmail && value.length > 0);
  const showSuccess = cfg.success && isValidEmail;

  return (
    <FieldWrapper
      label="Work email"
      required={cfg.required}
      error={showError}
      success={showSuccess}
      helperText="We'll send a verification link to this address"
      errorText={value.length === 0 ? "Email is required" : "Enter a valid email address"}
      showLabel={cfg.label}
      showHelper={cfg.helperText}
    >
      <div
        className={`flex items-center gap-2 w-full ${sz.px} ${sz.py}`}
        style={baseInputStyle(cfg, focused, value.length > 0)}
      >
        {cfg.startIcon && <span className="flex-shrink-0 text-slate-400"><MailIcon size={sz.iconSize} /></span>}
        <input
          type="email"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => { setFocused(false); setTouched(true); }}
          disabled={cfg.disabled}
          readOnly={cfg.readOnly}
          placeholder={cfg.placeholder ? "you@company.com" : undefined}
          className={`flex-1 bg-transparent outline-none ${sz.text} text-slate-900 placeholder:text-slate-400 disabled:cursor-not-allowed`}
        />
        {cfg.clearable && value && (
          <button onClick={() => { setValue(""); setTouched(false); }} className="flex-shrink-0 text-slate-400 hover:text-slate-600"><XIcon size={14} /></button>
        )}
        {!cfg.clearable && showSuccess && (
          <span style={{ color: "#059669" }}><CheckIcon size={14} /></span>
        )}
        {cfg.endIcon && !cfg.clearable && !showSuccess && (
          <span className="flex-shrink-0 text-slate-400"><MailIcon size={sz.iconSize} /></span>
        )}
      </div>
    </FieldWrapper>
  );
}

/* ─────────────────────────────────────────────────────────
   6. PasswordField
───────────────────────────────────────────────────────── */
function PasswordField({ cfg }: { cfg: FieldConfig }) {
  const [value, setValue] = useState("");
  const [show, setShow] = useState(false);
  const [focused, setFocused] = useState(false);
  const sz = sizeMap[cfg.size];

  const strength = (() => {
    if (!value) return 0;
    let s = 0;
    if (value.length >= 8) s++;
    if (/[A-Z]/.test(value)) s++;
    if (/[0-9]/.test(value)) s++;
    if (/[^A-Za-z0-9]/.test(value)) s++;
    return s;
  })();

  const strengthColors = ["", "#ef4444", "#f59e0b", "#3b82f6", "#036c5f"];
  const strengthLabels = ["", "Weak", "Fair", "Good", "Strong"];

  return (
    <FieldWrapper
      label="Password"
      required={cfg.required}
      error={cfg.error}
      success={cfg.success && strength === 4}
      helperText="Minimum 8 characters with uppercase, number, and symbol"
      errorText="Password must be at least 8 characters"
      showLabel={cfg.label}
      showHelper={cfg.helperText}
    >
      <div
        className={`flex items-center gap-2 w-full ${sz.px} ${sz.py}`}
        style={baseInputStyle(cfg, focused, value.length > 0)}
      >
        {cfg.startIcon && <span className="flex-shrink-0 text-slate-400"><LockIcon size={sz.iconSize} /></span>}
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          disabled={cfg.disabled}
          readOnly={cfg.readOnly}
          placeholder={cfg.placeholder ? "••••••••" : undefined}
          className={`flex-1 bg-transparent outline-none ${sz.text} text-slate-900 placeholder:text-slate-400 disabled:cursor-not-allowed`}
        />
        {cfg.clearable && value && (
          <button onClick={() => setValue("")} className="flex-shrink-0 text-slate-400 hover:text-slate-600"><XIcon size={14} /></button>
        )}
        <button
          type="button"
          onClick={() => setShow(!show)}
          className="flex-shrink-0 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <EyeIcon size={sz.iconSize} off={show} />
        </button>
      </div>
      {value && (
        <div className="space-y-1 mt-1">
          <div className="flex gap-1">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-1 flex-1 rounded-full transition-all duration-300"
                style={{ backgroundColor: i <= strength ? strengthColors[strength] : "#e2e8f0" }}
              />
            ))}
          </div>
          <p className="text-xs font-medium" style={{ color: strengthColors[strength] }}>
            {strengthLabels[strength]}
          </p>
        </div>
      )}
    </FieldWrapper>
  );
}

/* ─────────────────────────────────────────────────────────
   7. SelectMenu — custom card dropdown
───────────────────────────────────────────────────────── */
function SelectMenu({ cfg }: { cfg: FieldConfig }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const sz = sizeMap[cfg.size];

  useClickOutside(wrapRef, () => setOpen(false));

  return (
    <FieldWrapper
      label="Job title"
      required={cfg.required}
      error={cfg.error}
      success={cfg.success && !!selected}
      helperText="Select the role that best describes your position"
      errorText="Please select a job title"
      showLabel={cfg.label}
      showHelper={cfg.helperText}
    >
      <div ref={wrapRef} className="relative">
        <button
          disabled={cfg.disabled}
          onClick={() => { if (!cfg.readOnly) setOpen(!open); setFocused(true); }}
          onBlur={() => { setFocused(false); }}
          className={`flex items-center gap-2 w-full ${sz.px} ${sz.py} text-left disabled:cursor-not-allowed`}
          style={baseInputStyle(cfg, open, !!selected)}
        >
          {cfg.startIcon && (
            <span className="flex-shrink-0 text-slate-400">
              <svg width={sz.iconSize} height={sz.iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
              </svg>
            </span>
          )}
          <span className={`flex-1 ${sz.text} ${selected ? "text-slate-900" : "text-slate-400"}`}>
            {selected || (cfg.placeholder ? "Select a role..." : "")}
          </span>
          <div className="flex items-center gap-1">
            {cfg.clearable && selected && (
              <span role="button" onClick={(e) => { e.stopPropagation(); setSelected(null); }} className="text-slate-400 hover:text-slate-600">
                <XIcon size={14} />
              </span>
            )}
            <span className={`text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}><ChevronIcon size={sz.iconSize} /></span>
          </div>
        </button>

        {/* Card menu dropdown */}
        {open && (
          <div
            className="absolute z-50 top-full mt-1.5 w-full rounded-2xl overflow-hidden"
            style={{
              backgroundColor: "white",
              border: "1px solid #e2e8f0",
              boxShadow: "0 12px 40px rgba(0,0,0,0.14)",
            }}
          >
            <div className="p-1.5">
              {SELECT_OPTIONS.map((opt, i) => (
                <button
                  key={opt}
                  onClick={() => { setSelected(opt); setOpen(false); }}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm text-left transition-all group"
                  style={{
                    backgroundColor: selected === opt ? "#e6f4f2" : "transparent",
                    color: selected === opt ? "#036c5f" : "#0f172a",
                  }}
                  onMouseOver={(e) => {
                    if (selected !== opt) (e.currentTarget as HTMLElement).style.backgroundColor = "#f8fafc";
                  }}
                  onMouseOut={(e) => {
                    if (selected !== opt) (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
                  }}
                >
                  <span className="font-medium">{opt}</span>
                  {selected === opt && <CheckIcon size={14} />}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </FieldWrapper>
  );
}

/* ─────────────────────────────────────────────────────────
   8. Combobox — three variants
───────────────────────────────────────────────────────── */

// Variant A: flat list with checkboxes + chips
function ComboboxFlat({ cfg }: { cfg: FieldConfig }) {
  const [selected, setSelected] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const wrapRef = useRef<HTMLDivElement>(null);
  const sz = sizeMap[cfg.size];

  useClickOutside(wrapRef, () => { setOpen(false); setSearch(""); });

  const toggle = (v: string) =>
    setSelected((s) => s.includes(v) ? s.filter((x) => x !== v) : [...s, v]);

  const filtered = COMBOBOX_FLAT.filter((o) =>
    o.label.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <FieldWrapper
      label="Apps access"
      required={cfg.required}
      error={cfg.error}
      success={cfg.success && selected.length > 0}
      helperText="Select apps this user can access"
      errorText="Select at least one app"
      showLabel={cfg.label}
      showHelper={cfg.helperText}
    >
      <div ref={wrapRef} className="relative">
        <div
          className="flex flex-wrap items-center gap-1.5 min-h-[42px] cursor-text"
          style={{ ...baseInputStyle(cfg, open, selected.length > 0), padding: "6px 12px" }}
          onClick={() => !cfg.disabled && !cfg.readOnly && setOpen(true)}
        >
          {cfg.startIcon && !selected.length && (
            <span className="text-slate-400"><SearchIcon size={sz.iconSize} /></span>
          )}
          {selected.map((v) => {
            const opt = COMBOBOX_FLAT.find((o) => o.value === v)!;
            return (
              <span
                key={v}
                className="flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold"
                style={{ backgroundColor: "#e6f4f2", color: "#036c5f" }}
              >
                {opt.icon} {opt.label}
                <button
                  onClick={(e) => { e.stopPropagation(); toggle(v); }}
                  className="hover:text-red-500 transition-colors ml-0.5"
                >
                  <XIcon size={10} />
                </button>
              </span>
            );
          })}
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => setOpen(true)}
            disabled={cfg.disabled}
            readOnly={cfg.readOnly}
            placeholder={selected.length === 0 && cfg.placeholder ? "Search apps..." : ""}
            className="flex-1 min-w-[120px] bg-transparent outline-none text-sm text-slate-900 placeholder:text-slate-400 disabled:cursor-not-allowed"
            style={{ minWidth: selected.length ? 60 : 120 }}
          />
          {cfg.clearable && selected.length > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); setSelected([]); }}
              className="text-slate-400 hover:text-slate-600 ml-auto"
            >
              <XIcon size={14} />
            </button>
          )}
        </div>

        {open && (
          <div
            className="absolute z-50 top-full mt-1.5 w-full rounded-2xl overflow-hidden"
            style={{ backgroundColor: "white", border: "1px solid #e2e8f0", boxShadow: "0 12px 40px rgba(0,0,0,0.14)" }}
          >
            <div className="p-1.5">
              {filtered.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">No options found</p>
              ) : (
                filtered.map((opt) => {
                  const isSelected = selected.includes(opt.value);
                  return (
                    <button
                      key={opt.value}
                      onClick={() => toggle(opt.value)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all"
                      style={{ backgroundColor: isSelected ? "#f0fbf9" : "transparent" }}
                      onMouseOver={(e) => { if (!isSelected) (e.currentTarget as HTMLElement).style.backgroundColor = "#f8fafc"; }}
                      onMouseOut={(e) => { if (!isSelected) (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"; }}
                    >
                      <div
                        className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0 transition-all"
                        style={{
                          backgroundColor: isSelected ? "#036c5f" : "white",
                          border: `1.5px solid ${isSelected ? "#036c5f" : "#cbd5e1"}`,
                        }}
                      >
                        {isSelected && <CheckIcon size={10} />}
                      </div>
                      <span className="text-sm">{opt.icon}</span>
                      <span className="text-sm text-slate-800 font-medium">{opt.label}</span>
                    </button>
                  );
                })
              )}
            </div>
            {selected.length > 0 && (
              <div className="px-3 py-2 border-t text-xs text-slate-400 flex items-center justify-between" style={{ borderColor: "#f1f5f9" }}>
                <span>{selected.length} selected</span>
                <button onClick={() => setSelected([])} className="hover:text-slate-600 transition-colors">Clear all</button>
              </div>
            )}
          </div>
        )}
      </div>
    </FieldWrapper>
  );
}

// Variant B: hierarchical (tree) combobox
function ComboboxHierarchy({ cfg }: { cfg: FieldConfig }) {
  const [selected, setSelected] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<string[]>(["engineering"]);
  const wrapRef = useRef<HTMLDivElement>(null);

  useClickOutside(wrapRef, () => setOpen(false));

  const toggle = (v: string) =>
    setSelected((s) => s.includes(v) ? s.filter((x) => x !== v) : [...s, v]);

  const toggleExpand = (v: string) =>
    setExpanded((s) => s.includes(v) ? s.filter((x) => x !== v) : [...s, v]);

  const allChildValues = (parent: typeof COMBOBOX_HIERARCHY[0]) =>
    parent.children.map((c) => c.value);

  const toggleGroup = (parent: typeof COMBOBOX_HIERARCHY[0]) => {
    const children = allChildValues(parent);
    const allSelected = children.every((c) => selected.includes(c));
    if (allSelected) {
      setSelected((s) => s.filter((v) => !children.includes(v)));
    } else {
      setSelected((s) => [...new Set([...s, ...children])]);
    }
  };

  const allLabels = COMBOBOX_HIERARCHY.flatMap((g) =>
    g.children.filter((c) => selected.includes(c.value))
  );

  return (
    <FieldWrapper
      label="Department"
      required={cfg.required}
      error={cfg.error}
      success={cfg.success && selected.length > 0}
      helperText="Select one or more teams/departments"
      errorText="Select at least one department"
      showLabel={cfg.label}
      showHelper={cfg.helperText}
    >
      <div ref={wrapRef} className="relative">
        <div
          className="flex flex-wrap items-center gap-1.5 min-h-[42px] cursor-text"
          style={{ ...baseInputStyle(cfg, open, selected.length > 0), padding: "6px 12px" }}
          onClick={() => !cfg.disabled && !cfg.readOnly && setOpen(true)}
        >
          {allLabels.map((item) => (
            <span
              key={item.value}
              className="flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold"
              style={{ backgroundColor: "#e6f4f2", color: "#036c5f" }}
            >
              {item.label}
              <button onClick={(e) => { e.stopPropagation(); toggle(item.value); }} className="hover:text-red-500 ml-0.5">
                <XIcon size={10} />
              </button>
            </span>
          ))}
          <span className={`${!allLabels.length && cfg.placeholder ? "text-slate-400" : "text-transparent"} text-sm select-none`}>
            {!allLabels.length && cfg.placeholder ? "Select departments..." : "_"}
          </span>
          {cfg.clearable && selected.length > 0 && (
            <button onClick={(e) => { e.stopPropagation(); setSelected([]); }} className="text-slate-400 hover:text-slate-600 ml-auto">
              <XIcon size={14} />
            </button>
          )}
        </div>

        {open && (
          <div
            className="absolute z-50 top-full mt-1.5 w-full rounded-2xl overflow-hidden"
            style={{ backgroundColor: "white", border: "1px solid #e2e8f0", boxShadow: "0 12px 40px rgba(0,0,0,0.14)" }}
          >
            <div className="p-1.5 max-h-72 overflow-y-auto">
              {COMBOBOX_HIERARCHY.map((group) => {
                const children = allChildValues(group);
                const allSel = children.every((c) => selected.includes(c));
                const someSel = children.some((c) => selected.includes(c));
                const isExpanded = expanded.includes(group.value);

                return (
                  <div key={group.value}>
                    <button
                      onClick={() => toggleExpand(group.value)}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left hover:bg-slate-50 transition-all"
                    >
                      <div
                        className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0"
                        onClick={(e) => { e.stopPropagation(); toggleGroup(group); }}
                        style={{
                          backgroundColor: allSel ? "#036c5f" : someSel ? "#e6f4f2" : "white",
                          border: `1.5px solid ${allSel || someSel ? "#036c5f" : "#cbd5e1"}`,
                        }}
                      >
                        {allSel && <CheckIcon size={10} />}
                        {someSel && !allSel && <span className="w-1.5 h-1.5 rounded-sm bg-[#036c5f]" />}
                      </div>
                      <span className="text-sm font-semibold text-slate-700 flex-1">{group.label}</span>
                      <span className="text-xs text-slate-400">{children.length}</span>
                      <svg
                        width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round"
                        style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)", transition: "0.15s" }}
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </button>
                    {isExpanded && group.children.map((child) => (
                      <button
                        key={child.value}
                        onClick={() => toggle(child.value)}
                        className="w-full flex items-center gap-2 pl-8 pr-3 py-2 rounded-xl text-left hover:bg-slate-50 transition-all"
                      >
                        <div
                          className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0"
                          style={{
                            backgroundColor: selected.includes(child.value) ? "#036c5f" : "white",
                            border: `1.5px solid ${selected.includes(child.value) ? "#036c5f" : "#cbd5e1"}`,
                          }}
                        >
                          {selected.includes(child.value) && <CheckIcon size={10} />}
                        </div>
                        <span className="text-sm text-slate-700">{child.label}</span>
                      </button>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </FieldWrapper>
  );
}

// Variant C: grouped with headings
function ComboboxGrouped({ cfg }: { cfg: FieldConfig }) {
  const [selected, setSelected] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useClickOutside(wrapRef, () => setOpen(false));

  const toggle = (v: string) =>
    setSelected((s) => s.includes(v) ? s.filter((x) => x !== v) : [...s, v]);

  const allOpts = COMBOBOX_GROUPED.flatMap((g) => g.options);

  return (
    <FieldWrapper
      label="Assign to"
      required={cfg.required}
      error={cfg.error}
      success={cfg.success && selected.length > 0}
      helperText="Assign this issue to one or more team members"
      errorText="Select at least one assignee"
      showLabel={cfg.label}
      showHelper={cfg.helperText}
    >
      <div ref={wrapRef} className="relative">
        <div
          className="flex flex-wrap items-center gap-1.5 min-h-[42px] cursor-pointer"
          style={{ ...baseInputStyle(cfg, open, selected.length > 0), padding: "6px 12px" }}
          onClick={() => !cfg.disabled && !cfg.readOnly && setOpen(!open)}
        >
          {selected.map((v) => {
            const opt = allOpts.find((o) => o.value === v)!;
            return (
              <span
                key={v}
                className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
                style={{ backgroundColor: "#e6f4f2", color: "#036c5f" }}
              >
                <span
                  className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0"
                  style={{ backgroundColor: "#036c5f" }}
                >
                  {opt.label[0]}
                </span>
                {opt.label}
                <button onClick={(e) => { e.stopPropagation(); toggle(v); }} className="hover:text-red-500 ml-0.5">
                  <XIcon size={10} />
                </button>
              </span>
            );
          })}
          {selected.length === 0 && (
            <span className="text-sm text-slate-400">{cfg.placeholder ? "Select assignees..." : ""}</span>
          )}
          <div className="ml-auto flex items-center gap-1">
            {cfg.clearable && selected.length > 0 && (
              <button onClick={(e) => { e.stopPropagation(); setSelected([]); }} className="text-slate-400 hover:text-slate-600">
                <XIcon size={14} />
              </button>
            )}
            <span className={`text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}><ChevronIcon size={14} /></span>
          </div>
        </div>

        {open && (
          <div
            className="absolute z-50 top-full mt-1.5 w-full rounded-2xl overflow-hidden"
            style={{ backgroundColor: "white", border: "1px solid #e2e8f0", boxShadow: "0 12px 40px rgba(0,0,0,0.14)" }}
          >
            <div className="p-1.5">
              {COMBOBOX_GROUPED.map((group) => (
                <div key={group.heading}>
                  <p className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    {group.heading}
                  </p>
                  {group.options.map((opt) => {
                    const isSel = selected.includes(opt.value);
                    return (
                      <button
                        key={opt.value}
                        onClick={() => toggle(opt.value)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all"
                        style={{ backgroundColor: isSel ? "#f0fbf9" : "transparent" }}
                        onMouseOver={(e) => { if (!isSel) (e.currentTarget as HTMLElement).style.backgroundColor = "#f8fafc"; }}
                        onMouseOut={(e) => { if (!isSel) (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"; }}
                      >
                        <div
                          className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: isSel ? "#036c5f" : "white", border: `1.5px solid ${isSel ? "#036c5f" : "#cbd5e1"}` }}
                        >
                          {isSel && <CheckIcon size={10} />}
                        </div>
                        <span
                          className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                          style={{ backgroundColor: "#036c5f" }}
                        >
                          {opt.label[0]}
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-800">{opt.label}</p>
                          <p className="text-xs text-slate-400 truncate">{opt.sub}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </FieldWrapper>
  );
}

/* ─────────────────────────────────────────────────────────
   Config bar
───────────────────────────────────────────────────────── */
function ConfigToggle({
  label,
  value,
  onChange,
  color = "#036c5f",
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  color?: string;
}) {
  return (
    <button
      onClick={() => onChange(!value)}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all select-none"
      style={{
        backgroundColor: value ? `${color}15` : "#f1f5f9",
        color: value ? color : "#64748b",
        border: `1px solid ${value ? `${color}30` : "#e2e8f0"}`,
      }}
    >
      <div
        className="w-3.5 h-3.5 rounded flex items-center justify-center"
        style={{ backgroundColor: value ? color : "white", border: `1.5px solid ${value ? color : "#cbd5e1"}` }}
      >
        {value && <CheckIcon size={9} />}
      </div>
      {label}
    </button>
  );
}

/* ─────────────────────────────────────────────────────────
   Section wrapper
───────────────────────────────────────────────────────── */
function FieldSection({
  title,
  description,
  children,
  wide = false,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div
      className="rounded-2xl p-6"
      style={{ backgroundColor: "white", border: "1px solid #e2e8f0" }}
    >
      <div className="mb-5">
        <h3 className="text-base font-bold text-slate-900 mb-0.5" style={{ fontFamily: "var(--font-display)" }}>
          {title}
        </h3>
        <p className="text-xs text-slate-500">{description}</p>
      </div>
      <div className={wide ? "w-full" : "max-w-sm"}>{children}</div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Main page
───────────────────────────────────────────────────────── */
export default function InputFieldsPage() {
  const [cfg, setCfg] = useState<FieldConfig>({
    size: "md",
    variant: "outlined",
    label: true,
    placeholder: true,
    required: false,
    disabled: false,
    readOnly: false,
    error: false,
    success: false,
    helperText: true,
    startIcon: true,
    endIcon: false,
    clearable: true,
  });

  const set = <K extends keyof FieldConfig>(k: K) => (v: FieldConfig[K]) =>
    setCfg((c) => ({ ...c, [k]: v }));

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-3"
          style={{ backgroundColor: "#e6f4f2", color: "#036c5f" }}
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <rect x="3" y="3" width="18" height="18" rx="2" /><line x1="9" y1="3" x2="9" y2="21" /><line x1="15" y1="3" x2="15" y2="21" />
          </svg>
          Component Library
        </div>
        <h1 className="text-3xl font-black text-slate-900 mb-2" style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}>
          Input Fields
        </h1>
        <p className="text-slate-500 text-sm">
          All input types with live configuration — toggle any option below to apply it across all fields simultaneously.
        </p>
      </div>

      {/* Sticky config bar */}
      <div
        className="sticky top-0 z-20 rounded-2xl p-4 mb-8"
        style={{ backgroundColor: "white", border: "1px solid #e2e8f0", boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}
      >
        {/* Row 1: boolean toggles */}
        <div className="flex flex-wrap gap-2 mb-4">
          {(
            [
              ["Label", "label"],
              ["Placeholder", "placeholder"],
              ["Required *", "required"],
              ["Disabled", "disabled"],
              ["Read-only", "readOnly"],
              ["Error state", "error"],
              ["Success state", "success"],
              ["Helper text", "helperText"],
              ["Start icon", "startIcon"],
              ["End icon", "endIcon"],
              ["Clearable ✕", "clearable"],
            ] as [string, keyof FieldConfig][]
          ).map(([label, key]) => (
            <ConfigToggle
              key={key}
              label={label}
              value={cfg[key] as boolean}
              onChange={set(key) as (v: boolean) => void}
              color={key === "error" ? "#dc2626" : key === "success" ? "#059669" : "#036c5f"}
            />
          ))}
        </div>

        {/* Row 2: size + variant */}
        <div className="flex items-center gap-6 pt-3 border-t" style={{ borderColor: "#f1f5f9" }}>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Size:</span>
            {(["sm", "md", "lg"] as FieldSize[]).map((s) => (
              <button
                key={s}
                onClick={() => set("size")(s)}
                className="px-3 py-1 rounded-lg text-xs font-semibold transition-all"
                style={{
                  backgroundColor: cfg.size === s ? "#036c5f" : "#f1f5f9",
                  color: cfg.size === s ? "white" : "#64748b",
                }}
              >
                {s.toUpperCase()}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Variant:</span>
            {(["outlined", "filled", "underline"] as FieldVariant[]).map((v) => (
              <button
                key={v}
                onClick={() => set("variant")(v)}
                className="px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-all"
                style={{
                  backgroundColor: cfg.variant === v ? "#036c5f" : "#f1f5f9",
                  color: cfg.variant === v ? "white" : "#64748b",
                }}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Fields grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <FieldSection title="Text Field" description="Single-line text input with start/end icons, clear button, and validation">
          <TextField cfg={cfg} />
        </FieldSection>

        <FieldSection title="Number Field" description="Numeric input with stepper controls, min/max validation, and formatting">
          <NumberField cfg={cfg} />
        </FieldSection>

        <FieldSection title="Phone Field" description="International phone input with searchable country code selector and flag">
          <PhoneField cfg={cfg} />
        </FieldSection>

        <FieldSection title="Country Field" description="Searchable country picker with emoji flags and custom card dropdown">
          <CountryField cfg={cfg} />
        </FieldSection>

        <FieldSection title="Email Field" description="Email input with inline format validation, success/error states, and clear icon">
          <EmailField cfg={cfg} />
        </FieldSection>

        <FieldSection title="Password Field" description="Password input with show/hide toggle and 4-bar strength indicator">
          <PasswordField cfg={cfg} />
        </FieldSection>

        <FieldSection title="Select Menu" description="Custom floating card dropdown — not a native select. Supports search and custom styling" wide>
          <SelectMenu cfg={cfg} />
        </FieldSection>
      </div>

      {/* Combobox section */}
      <div className="mt-5">
        <div
          className="rounded-2xl p-6"
          style={{ backgroundColor: "white", border: "1px solid #e2e8f0" }}
        >
          <div className="mb-6">
            <h3 className="text-base font-bold text-slate-900 mb-0.5" style={{ fontFamily: "var(--font-display)" }}>
              Combobox — 3 Variants
            </h3>
            <p className="text-xs text-slate-500">
              Multi-select with chip display. Supports flat checkboxes, hierarchical tree, and grouped headings.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p
                className="text-xs font-bold uppercase tracking-wider mb-3"
                style={{ color: "#036c5f" }}
              >
                A · Checkbox list
              </p>
              <ComboboxFlat cfg={cfg} />
            </div>
            <div>
              <p
                className="text-xs font-bold uppercase tracking-wider mb-3"
                style={{ color: "#036c5f" }}
              >
                B · Hierarchy / tree
              </p>
              <ComboboxHierarchy cfg={cfg} />
            </div>
            <div>
              <p
                className="text-xs font-bold uppercase tracking-wider mb-3"
                style={{ color: "#036c5f" }}
              >
                C · Grouped with headings
              </p>
              <ComboboxGrouped cfg={cfg} />
            </div>
          </div>
        </div>
      </div>

      <div className="h-16" />
    </div>
  );
}
