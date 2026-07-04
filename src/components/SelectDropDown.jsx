import { Select } from "antd";
import { forwardRef, useState } from "react";
import { ChevronDown, Search } from "lucide-react";

import { useTheme } from "../ThemeProvider";

const SelectDropDown = forwardRef(
  (
    {
      id,
      label,
      value,
      placeholder = "Select an option",
      required = false,
      options = [],
      onChange,
      disabled = false,
      loading = false,
      allowClear = true,
      mode = undefined,
      className = "",
    },
    ref,
  ) => {
    const { isDarkMode } = useTheme();
    const [isOpen, setIsOpen] = useState(false);

    return (
      <div
        className={`flex flex-col gap-1 w-full ${className}`}
        autoComplete="no-autofill"
      >
        {label && (
          <label
            htmlFor={id}
            className={`text-sm font-medium ${
              isDarkMode ? "text-gray-300" : "text-gray-700"
            }`}
          >
            {label}{" "}
            {required && <span className="text-red-500 font-semibold">*</span>}
          </label>
        )}

        <Select
          id={id}
          ref={ref}
          mode={mode}
          showSearch
          allowClear={allowClear}
          value={value === "" || value === null || value === undefined ? undefined : value}
          placeholder={placeholder}
          loading={loading}
          optionFilterProp="label"
          onChange={(selectedValues, selectedOptions) => {
            if (mode === "multiple" && selectedValues.includes("SELECT_ALL")) {
              if (value?.length === options.length) {
                onChange([], []);
              } else {
                const allValues = options.map((opt) => opt.value);
                onChange(allValues, options);
              }
            } else {
              onChange(selectedValues, selectedOptions);
            }
          }}
          disabled={disabled}
          maxTagCount="responsive"
          className={`w-full my-custom-select`}
          filterOption={(input, option) =>
            (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
          }
          options={
            mode === "multiple" && options.length > 0
              ? [
                  {
                    label:
                      value?.length === options.length
                        ? "Deselect All"
                        : "Select All",
                    value: "SELECT_ALL",
                    className: "select-all-option font-bold text-purple-600",
                  },
                  ...options,
                ]
              : options
          }
          autoComplete="no-autofill"
          styles={{ popup: { root: { borderRadius: "12px" } } }}
          onOpenChange={(visible) => setIsOpen(visible)}
          suffixIcon={
            isOpen ? (
              <Search
                size={14}
                className={isDarkMode ? "text-purple-400" : "text-purple-600"}
              />
            ) : (
              <ChevronDown
                size={16}
                className={isDarkMode ? "text-gray-400" : "text-gray-500"}
              />
            )
          }
        />
      </div>
    );
  },
);

export default SelectDropDown;
