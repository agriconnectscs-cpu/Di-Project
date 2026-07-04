import { useState } from "react";
import { Eye, EyeOff, Loader } from "lucide-react";

import { useTheme } from "../ThemeProvider";

const CustomInput = ({
  id,
  label,
  type = "text",
  value,
  onChange,
  placeholder = "",
  disabled = false,
  inputMode,
  required = false,
  minLength,
  maxLength,
  ref,
  className,
  inputClassName,
  passwordClassName,
  rows,
  isLoading = false,
  icon: Icon,
  error,
  spellCheck = true,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const { isDarkMode } = useTheme();

  const isPassword = type === "password";

  return (
    <div className={`relative w-full ${className}`}>
      {label && (
        <label
          htmlFor={id}
          className={`block text-sm font-medium mb-1 ${
            isDarkMode ? "text-gray-300" : "text-gray-700"
          }`}
        >
          {label}{" "}
          {required && <span className="text-red-500 font-semibold">*</span>}
        </label>
      )}

      <div className="relative flex items-center">
        {Icon && (
          <div
            className={`absolute left-3 transition-colors duration-300 ${
              isDarkMode ? "text-gray-500" : "text-gray-400"
            }`}
          >
            <Icon size={16} />
          </div>
        )}
        {type === "textarea" ? (
          <textarea
            id={id}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            disabled={disabled}
            ref={ref}
            name={id}
            rows={rows || 4}
            spellCheck={spellCheck}
            className={`${inputClassName} w-full rounded-md border ${
              Icon ? "pl-10" : "pl-3"
            } pr-2 py-2 transition-all duration-300 shadow-sm
          focus:outline-none focus:ring-2 placeholder:text-sm text-sm sm:text-[15px]
          ${
            error
              ? "border-red-500 focus:ring-red-200"
              : isDarkMode
                ? "bg-black/10 border-gray-700 focus:border-purple-500 focus:ring-purple-700"
                : "bg-gray-100/50 border-gray-300 focus:border-purple-400 focus:ring-purple-200"
          }
          ${isDarkMode ? "text-white placeholder-gray-400" : "text-gray-900 placeholder-gray-600"}
        `}
          />
        ) : (
          <input
            id={id}
            type={isPassword && showPassword ? "text" : type}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            disabled={disabled}
            inputMode={inputMode}
            ref={ref}
            min={0}
            minLength={minLength}
            maxLength={maxLength}
            name={id}
            spellCheck={spellCheck}
            // autoComplete="on"
            className={`${inputClassName} w-full rounded-md border ${
              Icon ? "pl-10" : "pl-3"
            } pr-2 py-2 transition-all duration-300 shadow-sm
          focus:outline-none focus:ring-2 placeholder:text-sm text-sm sm:text-[15px]
          ${
            error
              ? "border-red-500 focus:ring-red-200"
              : isDarkMode
                ? "bg-black/10 border-gray-700 focus:border-purple-500 focus:ring-purple-700"
                : "bg-gray-100/50 border-gray-300 focus:border-purple-400 focus:ring-purple-200"
          }
          ${isDarkMode ? "text-white placeholder-gray-400" : "text-gray-900 placeholder-gray-600"}
        `}
          />
        )}

        {isPassword && value && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className={`${passwordClassName} absolute right-3 top-1/2 transform -translate-y-1/2 transition cursor-pointer
            ${
              isDarkMode
                ? "text-gray-400 hover:text-gray-200"
                : "text-gray-500 hover:text-gray-700"
            }
          `}
          >
            {showPassword ? <Eye size={16} /> : <EyeOff size={16} />}
          </button>
        )}

        {isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <Loader
              size={16}
              className={`shrink-0 animate-spin ${
                isDarkMode ? "text-purple-400" : "text-purple-600"
              }`}
            />
          </div>
        )}
      </div>

      {error && (
        <p className="mt-1 text-xs text-red-500 font-medium animate-fadeIn">
          {error}
        </p>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        /* Remove number input arrows in all browsers */
        input[type="number"]::-webkit-outer-spin-button,
        input[type="number"]::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }

        input[type="number"] {
          -moz-appearance: textfield; 
        }
      `}</style>
    </div>
  );
};

export default CustomInput;
