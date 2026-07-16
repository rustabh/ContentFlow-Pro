"use client";

import { ReactNode, useEffect } from "react";

/* ------------------------------------------------------------------ */
/* Reusable UI primitives                                              */
/* ------------------------------------------------------------------ */

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-gray-100 bg-white p-5 shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-gray-900">
          {title}
        </h1>
        {subtitle && <p className="mt-0.5 text-sm text-gray-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Button({
  children,
  onClick,
  variant = "primary",
  type = "button",
  disabled = false,
  className = "",
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  type?: "button" | "submit";
  disabled?: boolean;
  className?: string;
}) {
  const styles = {
    primary:
      "bg-primary-500 text-white hover:bg-primary-600 shadow-sm disabled:bg-primary-300",
    secondary:
      "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 shadow-sm",
    ghost: "text-gray-600 hover:bg-gray-100",
    danger: "bg-white text-red-600 border border-red-200 hover:bg-red-50",
  }[variant];
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed ${styles} ${className}`}
    >
      {children}
    </button>
  );
}

export function Badge({
  children,
  color = "bg-gray-100 text-gray-700",
}: {
  children: ReactNode;
  color?: string;
}) {
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${color}`}
    >
      {children}
    </span>
  );
}

export function ProgressBar({
  done,
  total,
  label,
}: {
  done: number;
  total: number;
  label?: string;
}) {
  const pct = total > 0 ? Math.min(100, Math.round((done / total) * 100)) : 0;
  return (
    <div>
      {label && (
        <div className="mb-1 flex items-center justify-between text-xs">
          <span className="font-medium text-gray-600">{label}</span>
          <span className="tabular-nums text-gray-500">
            {done} / {total}
          </span>
        </div>
      )}
      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
        <div
          className="h-full rounded-full bg-primary-500 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon?: ReactNode;
}) {
  return (
    <Card className="flex items-start justify-between">
      <div>
        <div className="text-sm font-medium text-gray-500">{label}</div>
        <div className="mt-1 text-3xl font-bold tracking-tight text-gray-900">
          {value}
        </div>
        {hint && <div className="mt-1 text-xs text-gray-400">{hint}</div>}
      </div>
      {icon && (
        <div className="rounded-xl bg-primary-50 p-2.5 text-primary-500">
          {icon}
        </div>
      )}
    </Card>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
  wide = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-gray-900/40 p-4 backdrop-blur-sm sm:py-10"
      onClick={onClose}
    >
      <div
        className={`w-full ${wide ? "max-w-3xl" : "max-w-xl"} rounded-2xl bg-white shadow-xl`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-base font-semibold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            aria-label="Close"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Form fields                                                         */
/* ------------------------------------------------------------------ */

const fieldClass =
  "w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100";

export function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-xs font-medium text-gray-600">
        {label}
      </span>
      {children}
    </label>
  );
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${fieldClass} ${props.className ?? ""}`} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...props} className={`${fieldClass} ${props.className ?? ""}`}>
      {props.children}
    </select>
  );
}

export function TextArea(
  props: React.TextareaHTMLAttributes<HTMLTextAreaElement>
) {
  return (
    <textarea
      rows={props.rows ?? 3}
      {...props}
      className={`${fieldClass} ${props.className ?? ""}`}
    />
  );
}

export function EmptyState({
  title,
  hint,
  action,
}: {
  title: string;
  hint?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-14 text-center">
      <div className="mb-3 rounded-full bg-primary-50 p-3 text-primary-400">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="3" y="4" width="18" height="17" rx="3" />
          <path d="M3 9h18M8 2v4M16 2v4" strokeLinecap="round" />
        </svg>
      </div>
      <div className="text-sm font-semibold text-gray-700">{title}</div>
      {hint && <div className="mt-1 max-w-sm text-xs text-gray-400">{hint}</div>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Spinner() {
  return (
    <div className="flex justify-center py-16">
      <div className="h-7 w-7 animate-spin rounded-full border-2 border-gray-200 border-t-primary-500" />
    </div>
  );
}
