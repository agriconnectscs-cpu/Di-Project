import { motion as Motion } from "framer-motion";
import {
  Keyboard,
  Search,
  Plus,
  X,
  CornerDownLeft,
  ArrowDown,
  Command,
  Edit,
  Trash2,
} from "lucide-react";
import { useTheme } from "../ThemeProvider";

// eslint-disable-next-line no-unused-vars
const ShortcutCard = ({ icon: Icon, label, keys, description, isDarkMode }) => {
  return (
    <Motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={`p-6 rounded-2xl border transition-all duration-300 group hover:shadow-xl ${
        isDarkMode
          ? "bg-[#1a1428] border-white/5 hover:border-purple-500/30 hover:bg-white/[0.04]"
          : "bg-white border-gray-100 hover:border-purple-200 hover:shadow-purple-500/5 shadow-sm"
      }`}
    >
      <div className="flex items-start justify-between gap-4 mb-4">
        <div
          className={`p-3 rounded-xl transition-colors duration-300 ${
            isDarkMode
              ? "bg-purple-500/10 text-purple-400 group-hover:bg-purple-500/20"
              : "bg-purple-50 text-purple-600 group-hover:bg-purple-100"
          }`}
        >
          <Icon size={24} />
        </div>
        <div className="flex gap-1.5 pt-1">
          {keys.map((key, i) => (
            <span
              key={i}
              className={`px-2.5 py-1 text-[10px] font-bold rounded-md border min-w-[28px] text-center uppercase tracking-wider ${
                isDarkMode
                  ? "bg-white/5 border-white/10 text-gray-400 group-hover:border-purple-500/30 group-hover:text-purple-300"
                  : "bg-gray-50 border-gray-200 text-gray-500 group-hover:border-purple-300 group-hover:text-purple-600"
              }`}
            >
              {key}
            </span>
          ))}
        </div>
      </div>
      <h3
        className={`text-base font-bold mb-1.5 ${isDarkMode ? "text-white" : "text-gray-900"}`}
      >
        {label}
      </h3>
      <p
        className={`text-sm leading-relaxed ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
      >
        {description}
      </p>
    </Motion.div>
  );
};

const ShortcutsPage = () => {
  const { isDarkMode } = useTheme();

  const shortcutGroups = [
    {
      title: "Navigation & Search",
      shortcuts: [
        {
          icon: Search,
          label: "Global Search",
          keys: ["Ctrl", "K"],
          description:
            "Open the command palette and search for menus across modules.",
        },
        {
          icon: ArrowDown,
          label: "Navigate Results",
          keys: ["↓", "↑"],
          description: "Move selection up or down in search results or lists.",
        },
        {
          icon: CornerDownLeft,
          label: "Select Item",
          keys: ["Enter"],
          description:
            "Navigate to the selected menu item from search results.",
        },
      ],
    },
    {
      title: "Modals & Forms",
      shortcuts: [
        {
          icon: Plus,
          label: "Add New Record",
          keys: ["Alt", "N"],
          description:
            "Trigger the primary 'Create' or 'Add' modal on any management page.",
        },
        {
          icon: X,
          label: "Close / Cancel",
          keys: ["Esc"],
          description:
            "Instantly close active modals, search panels, or discard temporary states.",
        },
        {
          icon: CornerDownLeft,
          label: "Submit / Save Form",
          keys: ["Alt", "Enter"],
          description:
            "Submit and save data in active modals without clicking, even from multi-line fields.",
        },
        {
          icon: Edit,
          label: "Edit Last Added",
          keys: ["Alt", "E"],
          description:
            "Instantly open the edit modal for the most recently added record in the current list.",
        },
        {
          icon: Trash2,
          label: "Delete Last Added",
          keys: ["Alt", "Delete"],
          description:
            "Trigger the delete confirmation for the most recently added record in the current list.",
        },
      ],
    },
  ];

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto min-h-screen">
      <Motion.div
        initial={{ opacity: 0, x: -20 }}
        whileInView={{ opacity: 1, x: 0 }}
        className="mb-12"
      >
        <div className="flex items-center gap-4 mb-3">
          <div className="p-3 bg-purple-600 rounded-2xl shadow-lg shadow-purple-600/20 text-white">
            <Command size={28} />
          </div>
          <div>
            <h1
              className={`text-3xl font-black tracking-tight ${isDarkMode ? "text-white" : "text-gray-900"}`}
            >
              Keyboard Shortcuts
            </h1>
            <p
              className={`text-base font-medium mt-1 ${isDarkMode ? "text-purple-400/60" : "text-purple-600/60"}`}
            >
              Power up your workflow with global and contextual hotkeys.
            </p>
          </div>
        </div>
      </Motion.div>

      <div className="space-y-16">
        {shortcutGroups.map((group, groupIdx) => (
          <div key={groupIdx}>
            <Motion.h2
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className={`text-xs font-black uppercase tracking-[0.2em] mb-8 flex items-center gap-4 ${
                isDarkMode ? "text-purple-400/50" : "text-purple-600/40"
              }`}
            >
              <span className="shrink-0">{group.title}</span>
              <div
                className={`h-px w-full ${isDarkMode ? "bg-white/5" : "bg-gray-100"}`}
              />
            </Motion.h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {group.shortcuts.map((shortcut, idx) => (
                <ShortcutCard key={idx} {...shortcut} isDarkMode={isDarkMode} />
              ))}
            </div>
          </div>
        ))}
      </div>

      <Motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className={`mt-20 p-8 rounded-3xl border text-center relative overflow-hidden ${
          isDarkMode
            ? "bg-gradient-to-br from-purple-500/10 to-indigo-500/5 border-white/5"
            : "bg-gray-50 border-gray-100"
        }`}
      >
        <div
          className={`absolute top-0 right-0 p-12 opacity-5 ${isDarkMode ? "text-white" : "text-purple-600"}`}
        >
          <Keyboard size={120} />
        </div>
        <h3
          className={`text-xl font-bold mb-2 ${isDarkMode ? "text-white" : "text-gray-900"}`}
        >
          Pro Tip: Contextual Shortcuts
        </h3>
        <p
          className={`max-w-2xl mx-auto text-sm leading-relaxed ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
        >
          Some sections may have specific shortcuts that appear while they are
          active. Keep an eye out for helper tooltips or check this page as we
          add more global shortcuts to improve your productivity.
        </p>
      </Motion.div>
    </div>
  );
};

export default ShortcutsPage;
