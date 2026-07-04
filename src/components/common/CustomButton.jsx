import { useTheme } from "../../ThemeProvider";

const CustomButton = ({
  onClick,
  title,
  icon: Icon,
  className,
  disabled = false,
}) => {
  const { isDarkMode } = useTheme();

  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium
        outline-none cursor-pointer transition-all duration-200 shadow-sm hover:shadow-lg
        active:scale-95 transform
        bg-[var(--btn-bg)] text-[var(--btn-text)] border border-[var(--btn-border)]
        hover:bg-[var(--btn-hover-bg)] hover:text-[var(--btn-hover-text)]
        focus-visible:ring-2 focus-visible:ring-purple-500/60 focus-visible:ring-offset-2
        ${isDarkMode ? "focus-visible:ring-offset-[#1a162b]" : "focus-visible:ring-offset-white"}
        disabled:opacity-50 disabled:cursor-not-allowed ${className} `}
    >
      {Icon && <Icon size={16} />}
      {title}
    </button>
  );
};

export default CustomButton;
