import { useEffect, useRef, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { formatPhone, friendlyAuthError, sendCode, toE164, verifyCode } from "../../services/auth/accounts";
import { accountHome, useAccount } from "./AccountProvider";

const RESEND_AFTER = 30;

/** Phone number → SMS code → signed in. New and returning people use the same steps. */
export function PhoneSignIn() {
  const { refresh } = useAccount();
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [wait, setWait] = useState(0);
  const codeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  const send = async (e?: FormEvent) => {
    e?.preventDefault();
    const e164 = toE164(phone);
    if (!e164) return setError("Enter a 10-digit mobile number.");
    setBusy(true);
    setError(null);
    try {
      await sendCode(e164);
      setSentTo(e164);
      setCode("");
      setWait(RESEND_AFTER);
      setTimeout(() => codeRef.current?.focus(), 0);
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setBusy(false);
    }
  };

  const verify = async (e: FormEvent) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(code.trim())) return setError("Enter the 6-digit code from the SMS.");
    setBusy(true);
    setError(null);
    try {
      await verifyCode(sentTo!, code.trim());
      navigate(accountHome(await refresh()), { replace: true });
    } catch (err) {
      setError(friendlyAuthError(err));
      setBusy(false);
    }
  };

  if (!sentTo)
    return (
      <form onSubmit={send} noValidate className="space-y-4">
        <div>
          <label htmlFor="phone" className="mb-1.5 block text-[13px] font-medium">
            Mobile number
          </label>
          <div className="flex rounded-lg border border-line-strong bg-surface focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-100">
            <span className="flex items-center border-r border-line px-3 text-sm text-ink-muted">+91</span>
            <input
              id="phone"
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              value={phone}
              onChange={(e) => (setPhone(e.target.value), setError(null))}
              aria-invalid={!!error}
              aria-describedby={error ? "signin-error" : "phone-hint"}
              placeholder="98450 12345"
              className="h-11 w-full rounded-r-lg bg-transparent px-3 text-base outline-none sm:text-sm"
            />
          </div>
          <p id="phone-hint" className="mt-1.5 text-[12px] text-ink-subtle">
            We'll send a 6-digit code by SMS. New here? The same steps create your account.
          </p>
        </div>
        {error && (
          <p id="signin-error" role="alert" className="text-[13px] text-danger">
            {error}
          </p>
        )}
        <Button type="submit" className="w-full" disabled={busy}>
          {busy ? "Sending code…" : "Send code"}
        </Button>
      </form>
    );

  return (
    <form onSubmit={verify} noValidate className="space-y-4">
      <p className="text-[13px] text-ink-muted">
        We sent a code to <span className="font-medium text-ink">{formatPhone(sentTo)}</span>.{" "}
        <button type="button" className="font-medium text-brand-700 hover:underline" onClick={() => (setSentTo(null), setError(null))}>
          Change number
        </button>
      </p>
      <div>
        <label htmlFor="otp" className="mb-1.5 block text-[13px] font-medium">
          6-digit code
        </label>
        <input
          id="otp"
          ref={codeRef}
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          value={code}
          onChange={(e) => (setCode(e.target.value.replace(/\D/g, "")), setError(null))}
          aria-invalid={!!error}
          aria-describedby={error ? "signin-error" : undefined}
          className="h-11 w-full rounded-lg border border-line-strong bg-surface px-3 text-center text-lg tracking-[0.4em] tabular-nums outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        />
      </div>
      {error && (
        <p id="signin-error" role="alert" className="text-[13px] text-danger">
          {error}
        </p>
      )}
      <Button type="submit" className="w-full" disabled={busy}>
        {busy ? "Checking…" : "Sign in"}
      </Button>
      <p className="text-center text-[13px] text-ink-muted">
        {wait > 0 ? (
          `No SMS? You can send a new code in ${wait} s.`
        ) : (
          <button type="button" className="font-medium text-brand-700 hover:underline" onClick={() => void send()} disabled={busy}>
            Send a new code
          </button>
        )}
      </p>
    </form>
  );
}
