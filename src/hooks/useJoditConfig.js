import { useMemo } from "react";

const useJoditConfig = (
  content,
  isDarkMode,
  height = 300,
  excludeButtons = [],
) => {
  const config = useMemo(() => {
    const allButtons = [
      "heading",
      "fontsize",
      "bold",
      "italic",
      "underline",
      "|",
      "ul",
      "ol",
      "|",
      "align",
      "|",
      "link",
      "image",
      "table",
      "hr",
      "|",
      "undo",
      "redo",
      "fullsize",
    ];

    const safeExcludeList = Array.isArray(excludeButtons) ? excludeButtons : [];

    const filteredButtons = allButtons.filter(
      (btn) => !safeExcludeList.includes(btn),
    );

    return {
      readonly: false,
      theme: isDarkMode ? "dark" : "default",
      placeholder: content ? "" : "Write your content here...",
      height,
      toolbarAdaptive: false,
      toolbarSticky: false,

      buttons: filteredButtons,

      style: isDarkMode
        ? { backgroundColor: "#1A162B", color: "#FFFFFF" }
        : { backgroundColor: "#FFFFFF", color: "#000000" },

      controls: {
        fontsize: {
          list: ["10", "12", "14", "16", "18", "20", "24", "32", "48"],
        },
      },

      events: {
        afterInit: (editor) => {
          if (isDarkMode) {
            const toolbarGroups =
              editor.container.querySelectorAll(".jodit-ui-group");
            toolbarGroups.forEach((group) => {
              group.style.backgroundColor = "#2C2540";
              group.style.borderColor = "#8200DB";
            });

            const buttons =
              editor.container.querySelectorAll(".jodit-ui-button");
            buttons.forEach((btn) => {
              btn.style.backgroundColor = "#2C2540";
              btn.style.color = "#FFFFFF";
            });
          }
        },
      },

      uploader: {
        insertImageAsBase64URI: true,
      },
    };
  }, [isDarkMode, content, height, excludeButtons]);

  return config;
};

export default useJoditConfig;
