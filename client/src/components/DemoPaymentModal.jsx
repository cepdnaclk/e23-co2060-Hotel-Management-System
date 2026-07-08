import { useEffect, useMemo, useState } from "react";
import {
  Building2,
  CheckCircle2,
  ChevronDown,
  CreditCard,
  Lock,
  ShieldCheck,
  Smartphone,
  X,
} from "lucide-react";

const paymentGroups = [
  {
    title: "Credit/Debit Card",
    type: "card",
    options: [
      { value: "visa", label: "VISA", accent: "#1a4fb8" },
      { value: "mastercard", label: "mastercard", accent: "#ef4444" },
      { value: "amex", label: "AMERICAN EXPRESS", accent: "#0f75bc" },
      { value: "discover", label: "DISCOVER", accent: "#f59e0b" },
      { value: "diners", label: "Diners Club", accent: "#2563eb" },
    ],
  },
  {
    title: "Mobile Wallet",
    type: "wallet",
    options: [
      { value: "genie", label: "genie", accent: "#e11d48" },
      { value: "frimi", label: "FriMi", accent: "#ef4444" },
      { value: "ezcash", label: "eZ Cash", accent: "#84cc16" },
      { value: "mcash", label: "mCash", accent: "#0284c7" },
      { value: "sampathpay", label: "Sampath Pay", accent: "#f97316" },
    ],
  },
  {
    title: "Internet Banking",
    type: "bank",
    options: [
      { value: "boc", label: "BOC", accent: "#f97316" },
      { value: "hnb", label: "HNB", accent: "#1d4ed8" },
    ],
  },
];

const methodByValue = paymentGroups
  .flatMap((group) =>
    group.options.map((option) => ({
      ...option,
      groupTitle: group.title,
      type: group.type,
    }))
  )
  .reduce((map, option) => ({ ...map, [option.value]: option }), {});

const cleanDigits = (value) => String(value || "").replace(/\D/g, "");

const formatCardNumber = (value) =>
  cleanDigits(value)
    .slice(0, 19)
    .replace(/(.{4})/g, "$1 ")
    .trim();

const formatExpiry = (value) => {
  const digits = cleanDigits(value).slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
};

const renderPaymentLogo = (option) => {
  switch (option.value) {
    case "visa":
      return (
        <span className="brand-logo visa-logo">
          <span>VISA</span>
        </span>
      );
    case "mastercard":
      return (
        <span className="brand-logo mastercard-logo">
          <i />
          <i />
          <span>mastercard</span>
        </span>
      );
    case "amex":
      return (
        <span className="brand-logo amex-logo">
          <span>AMERICAN</span>
          <strong>EXPRESS</strong>
        </span>
      );
    case "discover":
      return (
        <span className="brand-logo discover-logo">
          <span>DISCOVER</span>
          <i />
        </span>
      );
    case "diners":
      return (
        <span className="brand-logo diners-logo">
          <i />
          <span>Diners Club</span>
        </span>
      );
    case "genie":
      return (
        <span className="brand-logo genie-logo">
          <i />
          <span>genie</span>
        </span>
      );
    case "frimi":
      return (
        <span className="brand-logo frimi-logo">
          <span>FriMi</span>
        </span>
      );
    case "ezcash":
      return (
        <span className="brand-logo ezcash-logo">
          <span>eZ</span>
          <strong>Cash</strong>
        </span>
      );
    case "mcash":
      return (
        <span className="brand-logo mcash-logo">
          <i>m</i>
          <span>Cash</span>
        </span>
      );
    case "sampathpay":
      return (
        <span className="brand-logo sampath-logo">
          <span>Sampath</span>
          <strong>Pay</strong>
        </span>
      );
    case "boc":
      return (
        <span className="brand-logo boc-logo">
          <i />
          <span>BOC</span>
        </span>
      );
    case "hnb":
      return (
        <span className="brand-logo hnb-logo">
          <i />
          <span>HNB</span>
        </span>
      );
    default:
      return <span className="brand-logo text-logo">{option.label}</span>;
  }
};

function DemoPaymentModal({
  open,
  title = "Online payment",
  description = "Complete this demo card payment.",
  amount = 0,
  reference = "",
  submitLabel = "Pay now",
  onClose,
  onConfirm,
}) {
  const [selectedMethod, setSelectedMethod] = useState("visa");
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [walletMobile, setWalletMobile] = useState("");
  const [bankReference, setBankReference] = useState("");
  const [error, setError] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSelectedMethod("visa");
    setCardName("");
    setCardNumber("");
    setExpiry("");
    setCvv("");
    setWalletMobile("");
    setBankReference("");
    setError("");
    setProcessing(false);
  }, [open]);

  const formattedAmount = useMemo(
    () => `Rs. ${Number(amount || 0).toLocaleString("en-LK")}`,
    [amount]
  );

  if (!open) return null;

  const activeMethod = methodByValue[selectedMethod] || methodByValue.visa;
  const isCardPayment = activeMethod.type === "card";
  const isWalletPayment = activeMethod.type === "wallet";
  const isBankPayment = activeMethod.type === "bank";

  const validate = () => {
    if (isCardPayment) {
      const numberDigits = cleanDigits(cardNumber);
      const cvvDigits = cleanDigits(cvv);

      if (!cardName.trim()) return "Card holder name is required.";
      if (numberDigits.length < 12 || numberDigits.length > 19) {
        return "Enter a valid card number.";
      }
      if (!/^\d{2}\/\d{2}$/.test(expiry)) return "Expiry must use MM/YY format.";
      if (cvvDigits.length < 3 || cvvDigits.length > 4) return "Enter a valid CVV.";
    }

    if (isWalletPayment && cleanDigits(walletMobile).length < 9) {
      return "Enter a valid mobile wallet number.";
    }

    if (isBankPayment && bankReference.trim().length < 5) {
      return "Enter your internet banking reference.";
    }

    return "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationError = validate();

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setProcessing(true);
      setError("");
      await onConfirm?.({
        gateway: selectedMethod,
        card_last4: isCardPayment
          ? cleanDigits(cardNumber).slice(-4)
          : cleanDigits(walletMobile || bankReference).slice(-4),
        card_holder: cardName.trim(),
        payment_method_type: activeMethod.type,
      });
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Payment failed. Please try again.");
      setProcessing(false);
    }
  };

  return (
    <div className="demo-payment-overlay" role="dialog" aria-modal="true">
      <style>{paymentCss}</style>
      <form className="demo-payment-modal" onSubmit={handleSubmit}>
        <div className="payment-modal-head">
          <div>
            <span><Lock size={14} /> Secure demo checkout</span>
            <h2>{title}</h2>
            <p>{description}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close payment modal">
            <X size={20} />
          </button>
        </div>

        <div className="payment-summary-box">
          <div>
            <span>Amount</span>
            <strong>{formattedAmount}</strong>
          </div>
          {reference && (
            <div>
              <span>Reference</span>
              <strong>{reference}</strong>
            </div>
          )}
        </div>

        <div className="payment-method-picker">
          <span className="payment-section-label">Select a payment method</span>
          {paymentGroups.map((group) => (
            <section className="payment-method-group" key={group.title}>
              <h3>{group.title}</h3>
              <div className="payment-brand-grid">
                {group.options.map((option) => {
                  const selected = selectedMethod === option.value;
                  return (
                    <button
                      type="button"
                      key={option.value}
                      className={`payment-brand-tile${selected ? " selected" : ""}`}
                      style={{ "--brand-color": option.accent }}
                      onClick={() => {
                        setSelectedMethod(option.value);
                        setError("");
                      }}
                      aria-label={option.label}
                    >
                      {renderPaymentLogo(option)}
                      {selected && <CheckCircle2 size={15} />}
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        <div className="payment-accordion">
          <div className="payment-accordion-head">
            <div>
              {isCardPayment && <CreditCard size={18} />}
              {isWalletPayment && <Smartphone size={18} />}
              {isBankPayment && <Building2 size={18} />}
              <span>Pay with {activeMethod.label}</span>
            </div>
            <div className="selected-method-chip">{activeMethod.groupTitle}</div>
            <ChevronDown size={18} />
          </div>

          {isCardPayment && (
            <div className="payment-accordion-body">
              <label className="payment-field">
                <span>Card number</span>
                <div className="card-input-wrap">
                  <CreditCard size={18} />
                  <input
                    value={cardNumber}
                    onChange={(event) => setCardNumber(formatCardNumber(event.target.value))}
                    placeholder="4242 4242 4242 4242"
                    inputMode="numeric"
                    autoComplete="cc-number"
                  />
                  <b>{activeMethod.label}</b>
                </div>
              </label>

              <label className="payment-field">
                <span>Cardholder</span>
                <input
                  value={cardName}
                  onChange={(event) => setCardName(event.target.value)}
                  placeholder="John Smith"
                  autoComplete="cc-name"
                />
              </label>

              <div className="payment-two-cols">
                <label className="payment-field">
                  <span>Expiration</span>
                  <input
                    value={expiry}
                    onChange={(event) => setExpiry(formatExpiry(event.target.value))}
                    placeholder="12/25"
                    inputMode="numeric"
                    autoComplete="cc-exp"
                  />
                </label>
                <label className="payment-field">
                  <span>CVC</span>
                  <input
                    value={cvv}
                    onChange={(event) => setCvv(cleanDigits(event.target.value).slice(0, 4))}
                    placeholder="123"
                    inputMode="numeric"
                    autoComplete="cc-csc"
                  />
                </label>
              </div>
            </div>
          )}

          {isWalletPayment && (
            <div className="payment-accordion-body">
              <label className="payment-field">
                <span>Wallet mobile number</span>
                <div className="card-input-wrap">
                  <Smartphone size={18} />
                  <input
                    value={walletMobile}
                    onChange={(event) => setWalletMobile(cleanDigits(event.target.value).slice(0, 12))}
                    placeholder="0771234567"
                    inputMode="tel"
                    autoComplete="tel"
                  />
                  <b>{activeMethod.label}</b>
                </div>
              </label>
              <div className="payment-help-box">
                <ShieldCheck size={18} />
                Confirm the one-time wallet prompt in your mobile app to complete this demo payment.
              </div>
            </div>
          )}

          {isBankPayment && (
            <div className="payment-accordion-body">
              <label className="payment-field">
                <span>Internet banking reference</span>
                <div className="card-input-wrap">
                  <Building2 size={18} />
                  <input
                    value={bankReference}
                    onChange={(event) => setBankReference(event.target.value)}
                    placeholder="Customer ID or payment reference"
                    autoComplete="off"
                  />
                  <b>{activeMethod.label}</b>
                </div>
              </label>
              <div className="payment-help-box">
                <ShieldCheck size={18} />
                Use your bank's secure portal reference. This app only records the successful demo status.
              </div>
            </div>
          )}
        </div>

        {error && <div className="payment-error">{error}</div>}

        <button className="payment-submit-btn" type="submit" disabled={processing}>
          {processing ? "Processing..." : submitLabel}
        </button>

        <p className="payment-footnote">
          Demo only: card details are validated in the browser and are not sent to a real bank gateway.
        </p>
      </form>
    </div>
  );
}

const paymentCss = `
.demo-payment-overlay{position:fixed;inset:0;z-index:4000;display:grid;place-items:center;background:rgba(15,23,42,.56);padding:18px;backdrop-filter:blur(7px);overflow:auto}
.demo-payment-modal{width:min(720px,100%);max-height:calc(100vh - 36px);overflow:auto;background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:24px;box-shadow:0 34px 90px rgba(0,0,0,.28);color:#102033;font-family:Inter,system-ui,Arial,sans-serif}
.payment-modal-head{display:flex;justify-content:space-between;gap:18px;align-items:flex-start;margin-bottom:18px}.payment-modal-head span{display:inline-flex;align-items:center;gap:6px;color:#0f766e;font-size:12px;font-weight:1000;text-transform:uppercase;letter-spacing:.08em}.payment-modal-head h2{margin:8px 0 7px;color:#0f172a;font-size:28px;letter-spacing:0}.payment-modal-head p{margin:0;color:#64748b;font-weight:750;line-height:1.55}.payment-modal-head button{width:38px;height:38px;border:none;border-radius:8px;background:#f1f5f9;color:#0f172a;display:grid;place-items:center;cursor:pointer;flex:0 0 auto}
.payment-summary-box{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:18px}.payment-summary-box div{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:13px}.payment-summary-box span{display:block;color:#64748b;font-size:11px;font-weight:1000;text-transform:uppercase}.payment-summary-box strong{display:block;margin-top:6px;color:#0f172a;font-size:17px;word-break:break-word}
.payment-section-label{display:block;margin-bottom:14px;color:#94a3b8;font-size:14px;font-weight:1000;text-transform:uppercase;letter-spacing:0}.payment-method-picker{border-top:1px solid #eef2f7;border-bottom:1px solid #eef2f7;padding:18px 0;margin-bottom:16px}.payment-method-group{margin-top:0}.payment-method-group+.payment-method-group{margin-top:18px}.payment-method-group h3{margin:0 0 10px;color:#1f2937;font-size:15px;font-weight:850;letter-spacing:0}.payment-brand-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(104px,1fr));gap:11px}.payment-brand-tile{height:76px;border:none;border-radius:8px;background:#f1f5f9;color:#0f172a;display:grid;place-items:center;position:relative;cursor:pointer;box-shadow:inset 0 0 0 1px #e5e7eb;transition:transform .16s ease,box-shadow .16s ease,background .16s ease}.payment-brand-tile:hover{transform:translateY(-1px);background:#fff}.payment-brand-tile.selected{background:#fff;box-shadow:inset 0 0 0 2px var(--brand-color),0 10px 22px rgba(15,23,42,.12)}.payment-brand-tile svg{position:absolute;right:7px;top:7px;color:#16a34a;background:#fff;border-radius:999px}
.brand-logo{width:84px;min-height:38px;display:grid;place-items:center;color:var(--brand-color);font-weight:1000;line-height:1;text-align:center;letter-spacing:0}.visa-logo span{font-size:21px;font-style:italic;color:#174ea6;letter-spacing:.03em}.mastercard-logo{position:relative;grid-template-rows:22px auto}.mastercard-logo i{position:absolute;top:3px;width:26px;height:26px;border-radius:999px;opacity:.94}.mastercard-logo i:first-child{left:18px;background:#eb001b}.mastercard-logo i:nth-child(2){right:18px;background:#f79e1b;mix-blend-mode:multiply}.mastercard-logo span{align-self:end;color:#eb001b;font-size:12px;letter-spacing:0}.amex-logo{width:78px;height:42px;background:#1976bd;color:#fff;border-radius:4px;box-shadow:inset 0 0 0 1px rgba(255,255,255,.25)}.amex-logo span{font-size:10px}.amex-logo strong{font-size:13px;letter-spacing:.02em}.discover-logo{position:relative;overflow:hidden}.discover-logo span{z-index:1;color:#111827;font-size:15px}.discover-logo i{position:absolute;left:17px;right:17px;bottom:5px;height:9px;border-radius:999px;background:linear-gradient(90deg,#f59e0b,#f97316)}.diners-logo{grid-template-columns:28px 1fr;gap:7px;width:92px;color:#1556bd}.diners-logo i{width:28px;height:28px;border-radius:999px;border:2px solid #1556bd;position:relative;background:#fff}.diners-logo i:after{content:"";position:absolute;inset:5px 10px;border-radius:999px;background:#1556bd}.diners-logo span{font-size:12px;text-align:left;line-height:1.05}
.genie-logo{grid-template-columns:23px 1fr;gap:8px;width:82px}.genie-logo i{width:0;height:0;border-top:14px solid transparent;border-bottom:14px solid transparent;border-left:23px solid #f59e0b;filter:drop-shadow(-7px 0 0 #e11d48)}.genie-logo span{color:#dc2626;font-size:18px;text-align:left}.frimi-logo{width:72px;height:42px;border-radius:8px;background:#ef3124;color:#fff;box-shadow:inset 0 -8px 14px rgba(0,0,0,.12)}.frimi-logo span{font-size:18px;font-style:italic;color:#fff}.ezcash-logo{width:72px;height:42px;border-radius:8px;background:#d9ff2f;border:2px solid #84cc16;color:#2f9e00}.ezcash-logo span{font-size:17px;color:#e11d48}.ezcash-logo strong{font-size:15px;color:#40a000}.mcash-logo{grid-template-columns:26px 1fr;gap:4px;width:82px}.mcash-logo i{display:grid;place-items:center;width:26px;height:24px;border-radius:5px;background:#0284c7;color:#fff;font-style:normal;font-size:19px}.mcash-logo span{color:#0284c7;font-size:18px;text-align:left}.sampath-logo{width:72px;height:42px;border-radius:7px;background:#fff;border:2px solid #f97316;color:#f97316}.sampath-logo span{font-size:12px}.sampath-logo strong{font-size:17px}
.boc-logo{grid-template-columns:34px 1fr;gap:7px;width:88px}.boc-logo i{width:34px;height:34px;background:#fff3e6;border:3px solid #f97316;clip-path:polygon(30% 0,70% 0,100% 30%,100% 70%,70% 100%,30% 100%,0 70%,0 30%)}.boc-logo span{color:#f97316;font-size:19px}.hnb-logo{grid-template-columns:32px 1fr;gap:8px;width:88px}.hnb-logo i{width:32px;height:28px;border-radius:3px;background:repeating-linear-gradient(90deg,#facc15 0 5px,#1d4ed8 5px 10px)}.hnb-logo span{color:#1d4ed8;font-size:21px;letter-spacing:.03em}.text-logo{font-size:14px}
.payment-accordion{border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;margin-bottom:14px}.payment-accordion-head{display:grid;grid-template-columns:1fr auto auto;gap:10px;align-items:center;background:#f8fafc;border-bottom:1px solid #e2e8f0;padding:12px 14px}.payment-accordion-head>div:first-child{display:flex;align-items:center;gap:10px;min-width:0}.payment-accordion-head span{font-size:15px;color:#334155;font-weight:900}.payment-accordion-head svg{color:#64748b}.selected-method-chip{border:1px solid #dbeafe;background:#fff;color:#1d4ed8;border-radius:8px;padding:6px 8px;font-size:11px;font-weight:950;white-space:nowrap}.payment-accordion-body{padding:15px;background:#fff}
.payment-field{display:grid;gap:7px;margin-bottom:13px}.payment-field span{color:#334155;font-size:12px;font-weight:1000;text-transform:uppercase;letter-spacing:.06em}.payment-field input{width:100%;border:1px solid #cbd5e1;border-radius:8px;padding:13px 14px;font-weight:850;color:#102033;background:#fff;outline:none}.payment-field input:focus{border-color:#0f766e;box-shadow:0 0 0 4px rgba(15,118,110,.11)}
.card-input-wrap{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:9px;border:1px solid #cbd5e1;border-radius:8px;padding:0 12px}.card-input-wrap:focus-within{border-color:#0f766e;box-shadow:0 0 0 4px rgba(15,118,110,.11)}.card-input-wrap input{border:none;box-shadow:none;padding-left:0;min-width:0}.card-input-wrap input:focus{box-shadow:none}.card-input-wrap svg{color:#0f766e}.card-input-wrap b{color:#2563eb;font-size:11px;text-transform:uppercase;white-space:nowrap}
.payment-two-cols{display:grid;grid-template-columns:1fr 1fr;gap:12px}.payment-help-box{display:flex;align-items:flex-start;gap:10px;background:#ecfdf5;border:1px solid #bbf7d0;color:#166534;border-radius:8px;padding:12px 13px;font-size:13px;font-weight:850;line-height:1.45}.payment-error{background:#fee2e2;border:1px solid #fecaca;color:#991b1b;border-radius:8px;padding:12px 13px;font-weight:900;margin-bottom:13px}.payment-submit-btn{width:100%;border:none;border-radius:8px;background:#0f766e;color:#fff;padding:15px 18px;font-weight:1000;font-size:15px;cursor:pointer}.payment-submit-btn:disabled{opacity:.68;cursor:not-allowed}.payment-footnote{margin:12px 0 0;color:#64748b;font-size:12px;font-weight:750;line-height:1.5;text-align:center}
@media(max-width:560px){.demo-payment-overlay{padding:10px}.demo-payment-modal{padding:18px;max-height:calc(100vh - 20px)}.payment-summary-box,.payment-two-cols,.payment-accordion-head{grid-template-columns:1fr}.payment-modal-head h2{font-size:24px}.selected-method-chip{width:max-content}.payment-brand-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.card-input-wrap{grid-template-columns:auto 1fr}.card-input-wrap b{grid-column:2}}
`;

export default DemoPaymentModal;
