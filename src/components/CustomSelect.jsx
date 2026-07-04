import { useTheme } from "../ThemeProvider";
import { ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";

const CustomSelect = ({
  id,
  label,
  value,
  onChange,
  options = [],
  optionLabel = "label",
  optionValue = "value",
  error,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const selectRef = useRef(null);

  const { isDarkMode } = useTheme();

  const selectedOption = options.find((opt) => opt[optionValue] === value);
  const hasValue = Boolean(selectedOption);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false);
        setIsFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      <div className="relative w-full" ref={selectRef}>
        <div
          onClick={() => setIsOpen((prev) => !prev)}
          onFocus={() => setIsFocused(true)}
          tabIndex={0}
          className={`w-full rounded-lg border px-3 pt-5 pb-2 cursor-pointer focus:outline-none transition-all duration-300 shadow-md text-sm relative ${
            error
              ? "border-red-500 ring-2 ring-red-200"
              : isDarkMode
                ? "border-gray-700 bg-black/10 backdrop-blur"
                : "border-gray-300 bg-gray-100/50"
          } ${isDarkMode ? "text-white" : "text-gray-900"} ${
            (isFocused || isOpen) && !error
              ? isDarkMode
                ? "border-purple-500 ring-2 ring-purple-700"
                : "border-purple-400 ring-2 ring-purple-200"
              : ""
          }`}
          style={{ minHeight: "3rem" }}
        >
          <span
            className={`block ${
              hasValue
                ? isDarkMode
                  ? "text-white"
                  : "text-gray-900"
                : isDarkMode
                  ? "text-gray-400"
                  : "text-gray-500"
            }`}
          >
            {selectedOption ? selectedOption[optionLabel] : ""}
          </span>
          <ChevronDown
            size={18}
            className={`absolute right-3 top-1/2 transform -translate-y-1/2 transition-transform duration-200 ${
              isOpen
                ? isDarkMode
                  ? "rotate-180 text-purple-400"
                  : "rotate-180 text-purple-600"
                : isDarkMode
                  ? "text-gray-400"
                  : "text-gray-500"
            }`}
          />
        </div>

        <label
          htmlFor={id}
          className={`absolute left-3 transition-all duration-200 pointer-events-none ${
            isFocused || hasValue || isOpen
              ? error
                ? "top-1 text-sm text-red-500"
                : isDarkMode
                  ? "top-1 text-sm text-gray-300"
                  : "top-1 text-sm text-gray-600"
              : isDarkMode
                ? "top-3.5 text-base text-gray-400"
                : "top-3.5 text-base text-gray-500"
          }`}
        >
          {label}
        </label>

        {isOpen && (
          <ul
            className={`absolute z-10 mt-1 w-full backdrop-blur border rounded-lg shadow-lg max-h-48 overflow-auto animate-fadeIn custom-scrollbar ${
              isDarkMode
                ? "bg-gray-900/90 border-gray-700"
                : "bg-white border-gray-300"
            }`}
          >
            {options.map((opt) => (
              <li
                key={opt[optionValue]}
                onClick={() => {
                  onChange({ target: { value: opt[optionValue] } });
                  setIsOpen(false);
                }}
                className={`px-3 py-2 text-sm transition-colors duration-150 cursor-pointer ${
                  isDarkMode
                    ? `text-gray-200 hover:bg-purple-700 hover:text-white ${
                        value === opt[optionValue] ? "bg-purple-800/50" : ""
                      }`
                    : `text-gray-700 hover:bg-purple-100 hover:text-purple-900 ${
                        value === opt[optionValue]
                          ? "bg-purple-50 text-purple-700"
                          : ""
                      }`
                }`}
              >
                {opt[optionLabel]}
              </li>
            ))}
          </ul>
        )}
      </div>

      {error && (
        <p className="mt-1 text-xs text-red-500 font-medium animate-fadeIn">
          {error}
        </p>
      )}

      {/* Scrollbar Styles */}
      <style>
        {`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: ${
            isDarkMode ? "rgba(88, 42, 217, 0.2)" : "rgba(196, 181, 253, 0.2)"
          };
          border-radius: 12px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: ${
            isDarkMode ? "rgba(126, 34, 206, 0.6)" : "rgba(147, 51, 234, 0.5)"
          };
          border-radius: 12px;
          transition: all 0.3s ease;
          border: 1px solid ${
            isDarkMode ? "rgba(126, 34, 206, 0.4)" : "rgba(147, 51, 234, 0.3)"
          };
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: ${
            isDarkMode ? "rgba(126, 34, 206, 0.9)" : "rgba(147, 51, 234, 0.8)"
          };
          box-shadow: 0 0 6px ${
            isDarkMode ? "rgba(126, 34, 206, 0.7)" : "rgba(147, 51, 234, 0.5)"
          };
        }
      `}
      </style>
    </>
  );
};

export default CustomSelect;
