import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    const resetAllScrolls = () => {
      window.scrollTo(0, 0);
      document.body.scrollTop = 0;
      document.documentElement.scrollTop = 0;

      const scrollableElements = document.querySelectorAll("*");
      scrollableElements.forEach((el) => {
        if (el.scrollTop > 0) {
          el.scrollTop = 0;
        }
      });
    };

    resetAllScrolls();

    const timer1 = setTimeout(resetAllScrolls, 0);
    const timer2 = setTimeout(resetAllScrolls, 100);
    const timer3 = setTimeout(resetAllScrolls, 500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [pathname]);

  return null;
};

export default ScrollToTop;
