import { useEffect, useState } from "react";
import { Maximize2, Minimize2 } from "lucide-react";

const FullscreenToggle = ({ isDarkMode, onToggleStart }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const updateFullscreenState = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    updateFullscreenState();
    document.addEventListener("fullscreenchange", updateFullscreenState);
    return () =>
      document.removeEventListener("fullscreenchange", updateFullscreenState);
  }, []);

  const handleFullscreenToggle = async () => {
    if (onToggleStart) onToggleStart();
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await document.documentElement.requestFullscreen();
      }
    } catch (error) {
      console.error("Fullscreen toggle failed:", error);
    }
  };

  return (
    <button
      onClick={handleFullscreenToggle}
      aria-label={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
      title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
      className={`hidden sm:flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-300 ${
        isFullscreen
          ? "bg-purple-500/20 text-purple-400"
          : isDarkMode
            ? "text-gray-400 hover:bg-white/10 hover:text-purple-400"
            : "text-gray-600 hover:bg-purple-50 hover:text-purple-600"
      }`}
    >
      {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
    </button>
  );
};

export default FullscreenToggle;
