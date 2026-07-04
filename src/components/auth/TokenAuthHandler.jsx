import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout, selectUser } from "../../store/authSlice";

const TokenAuthHandler = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector(selectUser);

  useEffect(() => {
    // 2 Hours = 2 * 60 Minutes * 60 Seconds * 1000 Milliseconds
    const TIMEOUT_MS = 2 * 60 * 60 * 1000;
    const STORAGE_KEY = "last_activity_timestamp";

    const checkInactivity = () => {
      if (!user) return true;

      const lastActivity = parseInt(localStorage.getItem(STORAGE_KEY) || "0");
      const now = Date.now();

      if (lastActivity > 0 && now - lastActivity >= TIMEOUT_MS) {
        dispatch(logout());
        navigate("/UserValidate/login", { replace: true });
        localStorage.removeItem(STORAGE_KEY);
        return true;
      }
      return false;
    };

    const updateActivity = () => {
      if (!user) return;

      const lastActivity = parseInt(localStorage.getItem(STORAGE_KEY) || "0");
      const now = Date.now();

      if (lastActivity > 0 && now - lastActivity >= TIMEOUT_MS) {
        checkInactivity();
        return;
      }

      localStorage.setItem(STORAGE_KEY, now.toString());
    };

    const isLoggedOut = checkInactivity();

    if (!isLoggedOut) {
      if (!localStorage.getItem(STORAGE_KEY)) {
        localStorage.setItem(STORAGE_KEY, Date.now().toString());
      }

      const intervalId = setInterval(checkInactivity, 30000);

      const events = [
        "mousedown",
        "mousemove",
        "keydown",
        "scroll",
        "touchstart",
        "click",
      ];

      events.forEach((event) => {
        document.addEventListener(event, updateActivity);
      });

      return () => {
        clearInterval(intervalId);
        events.forEach((event) => {
          document.removeEventListener(event, updateActivity);
        });
      };
    }

    const handleStorageChange = (e) => {
      if (e.key === "LoggedInUser" && !e.newValue) {
        dispatch(logout());
        navigate("/UserValidate/login", { replace: true });
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [navigate, dispatch, user]);

  return null;
};

export default TokenAuthHandler;
