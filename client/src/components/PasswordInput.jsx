import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

function PasswordInput({
  style,
  wrapperStyle,
  className,
  wrapperClassName,
  buttonClassName,
  buttonStyle,
  iconSize = 18,
  ...inputProps
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div
      className={wrapperClassName}
      style={{ display: "flex", alignItems: "stretch", gap: 8, width: "100%", ...wrapperStyle }}
    >
      <input
        {...inputProps}
        type={visible ? "text" : "password"}
        className={className}
        style={style ? { ...style, flex: 1, minWidth: 0, width: "100%" } : { flex: 1, minWidth: 0 }}
      />
      <button
        type="button"
        className={buttonClassName}
        onClick={() => setVisible((current) => !current)}
        aria-label={visible ? "Hide password" : "Show password"}
        style={
          buttonClassName
            ? buttonStyle
            : {
                flex: "0 0 auto",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "46px",
                border: "1px solid #d1d5db",
                borderRadius: "12px",
                background: "#f9fafb",
                color: "#374151",
                cursor: "pointer",
                ...buttonStyle,
              }
        }
      >
        {visible ? <EyeOff size={iconSize} /> : <Eye size={iconSize} />}
      </button>
    </div>
  );
}

export default PasswordInput;
