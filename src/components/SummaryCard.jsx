import Lottie from "lottie-react";
import { useState } from "react";
import { useTheme } from "../ThemeProvider";

const SummaryCard = ({ title, count, color, onClick, animationData }) => {
  const { isDarkMode } = useTheme();

  const [animKey, setAnimKey] = useState(0);

  const handleClick = () => {
    setAnimKey((prev) => prev + 1);
    onClick && onClick();
  };

  const textTitleClass = isDarkMode ? "text-gray-300" : "text-gray-600";

  return (
    <div
      onClick={handleClick}
      style={{ borderColor: color }}
      className={`select-none rounded-xl p-3 sm:p-5 flex items-center gap-2 sm:gap-4 border-l-4 cursor-pointer
        transition-all duration-200 bg-gradient-to-r from-white/5 to-white/10 
        hover:from-white/10 hover:to-white/20 shadow-md hover:shadow-lg`}
    >
      <div
        className="p-0 rounded-full"
        style={{ backgroundColor: `${color}1A`, color }}
      >
        {animationData ? (
          <Lottie
            key={animKey}
            animationData={animationData}
            loop={false}
            autoplay={true}
            style={{ width: 52, height: 52 }}
          />
        ) : (
          <div style={{ width: 52, height: 52 }}></div>
        )}
      </div>

      <div>
        <h4 className={`${textTitleClass} text-sm`}>{title}</h4>
        <p className="text-2xl font-bold" style={{ color }}>
          {count}
        </p>
      </div>
    </div>
  );
};

export default SummaryCard;
