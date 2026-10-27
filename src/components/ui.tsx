import Image from "next/image";
import Link from "next/link";
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";

/** Emblem + lettering for headers. Matches the logo: navy LEADING EDGE, maroon spaced DETAILING. */
export function Wordmark({ light = false }: { light?: boolean }) {
  return (
    <span className="flex items-center gap-3">
      <Image src="/logo-mark.png" alt="" width={320} height={164} priority className="h-9 w-auto" />
      <span className="font-brand leading-none">
        <span className={`block text-[15px] font-extrabold tracking-wide ${light ? "text-white" : "text-navy"}`}>
          LEADING EDGE
        </span>
        <span className={`mt-1 block text-[10px] font-semibold tracking-[0.42em] ${light ? "text-cream/80" : "text-maroon"}`}>
          DETAILING
        </span>
      </span>
    </span>
  );
}

/** The full logo, for the login page and the sidebar badge. */
export function Logo({ className = "" }: { className?: string }) {
  return (
    <Image
      src="/logo.png"
      alt="Leading Edge Detailing"
      width={720}
      height={530}
      priority
      className={`h-auto ${className}`}
    />
  );
}

export function Footer() {
  return (
    <footer className="mt-auto border-t border-line px-4 py-5 text-center font-brand text-xs font-semibold uppercase tracking-[0.25em] text-navy/50">
      Leading Edge Detailing · Aviation-Level Care
    </footer>
  );
}

type Variant = "primary" | "secondary" | "ghost";

const variants: Record<Variant, string> = {
  primary: "bg-rust text-white hover:bg-rust-dark",
  secondary: "bg-maroon text-white hover:bg-maroon/90",
  ghost: "border border-navy/20 bg-white text-navy hover:bg-navy/5",
};

const base =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-5 text-[15px] font-semibold transition disabled:opacity-50";

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return <button className={`${base} ${variants[variant]} ${className}`} {...props} />;
}

export function ButtonLink({
  href,
  variant = "primary",
  className = "",
  children,
}: {
  href: string;
  variant?: Variant;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className={`${base} ${variants[variant]} ${className}`}>
      {children}
    </Link>
  );
}

export function Field({
  label,
  hint,
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-sm font-medium text-navy">{label}</span>
      <input
        className="block min-h-11 w-full rounded-lg border border-navy/15 bg-white px-3.5 text-base text-navy outline-none placeholder:text-navy/35 focus:border-rust focus:ring-2 focus:ring-rust/20"
        {...props}
      />
      {hint && <span className="mt-1 block text-xs text-navy/55">{hint}</span>}
    </label>
  );
}

/** White panel. `flush` drops the padding for edge-to-edge lists. */
export function Card({ children, className = "", flush = false }: { children: ReactNode; className?: string; flush?: boolean }) {
  return (
    <div className={`rounded-xl border border-line bg-white shadow-sm ${flush ? "overflow-hidden" : "p-5 sm:p-6"} ${className}`}>
      {children}
    </div>
  );
}

export function PageTitle({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-navy/60">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function ErrorText({ children }: { children: ReactNode }) {
  if (!children) return null;
  return <p className="rounded-lg bg-rust/10 px-3.5 py-2.5 text-sm text-rust-dark">{children}</p>;
}

export function TextArea({
  label,
  className = "",
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-sm font-medium text-navy">{label}</span>
      <textarea
        rows={3}
        className="block w-full rounded-lg border border-navy/15 bg-white px-3.5 py-2.5 text-base text-navy outline-none placeholder:text-navy/35 focus:border-rust focus:ring-2 focus:ring-rust/20"
        {...props}
      />
    </label>
  );
}
