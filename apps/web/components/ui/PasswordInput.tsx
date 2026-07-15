"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState, type InputHTMLAttributes, type Ref } from "react";
import { Input } from "./Input";

export default function PasswordInput({
  className = "",
  ref,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { ref?: Ref<HTMLInputElement> }) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="relative">
      <Input ref={ref} type={showPassword ? "text" : "password"} className={`pr-10 ${className}`} {...props} />
      <button
        type="button"
        onClick={() => setShowPassword((v) => !v)}
        className="text-muted-foreground hover:text-foreground focus-visible:ring-ring absolute inset-y-0 right-0 flex items-center rounded-r-md px-3 focus-visible:ring-[3px] focus-visible:outline-none"
        aria-label={showPassword ? "Hide password" : "Show password"}
        tabIndex={-1}
      >
        {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}
