import React from 'react';
import {X, AlertTriangle} from 'lucide-react';
import {motion as Motion, AnimatePresence} from 'framer-motion';
import {useCloseOnEscape} from '../hooks/useCloseOnEscape';
import {useTheme} from '../ThemeProvider';

const ValidationErrorsModal = ({
  isOpen = false,
  onClose,
  errors = {},
  isDarkMode: propDarkMode,
  title = 'Validation Errors',
}) => {
  const {isDarkMode: themeDarkMode} = useTheme();
  const isDarkMode = propDarkMode !== undefined ? propDarkMode : themeDarkMode;

  useCloseOnEscape(isOpen, onClose);

  if (!isOpen) return null;

  const isGrouped =
    errors && typeof errors === 'object' && !Array.isArray(errors);

  return (
    <AnimatePresence>
      {isOpen && (
        <Motion.div
          className="fixed inset-0 z-1000 flex items-center justify-center p-4 backdrop-blur-xs bg-black/50"
          initial={{opacity: 0}}
          animate={{opacity: 1}}
          exit={{opacity: 0}}
          transition={{duration: 0.15}}
          onClick={onClose}
        >
          <Motion.div
            className={`relative w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col border ${
              isDarkMode
                ? 'bg-[#1B172D] text-white border-white/10'
                : 'bg-white text-gray-900 border-gray-200'
            }`}
            initial={{scale: 0.95, opacity: 0, y: 15}}
            animate={{scale: 1, opacity: 1, y: 0}}
            exit={{scale: 0.95, opacity: 0, y: 15}}
            transition={{type: 'spring', stiffness: 350, damping: 25}}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-red-600 px-5 py-3.5 flex items-center justify-between text-white shadow-md">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                  <AlertTriangle
                    size={16}
                    strokeWidth={2.5}
                    className="text-white"
                  />
                </div>
                <h3 className="text-base font-bold tracking-tight">{title}</h3>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/20 transition-colors"
                title="Close"
              >
                <X size={18} strokeWidth={2.5} />
              </button>
            </div>

            <div className="p-5 max-h-[60vh] overflow-y-auto space-y-4 custom-scrollbar">
              {isGrouped ? (
                Object.entries(errors)?.map(([section, sectionErrors]) => {
                  if (
                    !Array.isArray(sectionErrors) ||
                    sectionErrors.length === 0
                  )
                    return null;

                  return (
                    <div key={section} className="space-y-2">
                      <h4
                        className={`text-sm font-bold flex items-center gap-2 border-b pb-1.5 ${
                          isDarkMode
                            ? 'text-white border-white/10'
                            : 'text-gray-900 border-gray-100'
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                        {section}
                      </h4>

                      <ul className="space-y-1.5 pl-1">
                        {sectionErrors.map((err, idx) => (
                          <li
                            key={idx}
                            className={`flex items-start gap-2.5 text-xs sm:text-sm leading-snug font-medium ${
                              isDarkMode ? 'text-gray-200' : 'text-gray-800'
                            }`}
                          >
                            <AlertTriangle
                              size={15}
                              className="text-red-500 shrink-0 mt-0.5"
                            />
                            <span>{err}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })
              ) : Array.isArray(errors) && errors.length > 0 ? (
                <ul className="space-y-2">
                  {errors.map((err, idx) => (
                    <li
                      key={idx}
                      className={`flex items-start gap-2.5 text-xs sm:text-sm font-medium ${
                        isDarkMode ? 'text-gray-200' : 'text-gray-800'
                      }`}
                    >
                      <AlertTriangle
                        size={15}
                        className="text-red-500 shrink-0 mt-0.5"
                      />
                      <span>{err}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p
                  className={`text-sm italic ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}
                >
                  Please review and fill all required fields.
                </p>
              )}
            </div>

            <div
              className={`px-5 py-3 border-t flex justify-end shrink-0 ${
                isDarkMode
                  ? 'border-white/10 bg-black/20'
                  : 'border-gray-100 bg-gray-50'
              }`}
            >
              <button
                type="button"
                onClick={onClose}
                className={`px-5 py-1.5 text-xs sm:text-sm font-semibold rounded-xl transition-all shadow-xs border ${
                  isDarkMode
                    ? 'bg-white/10 hover:bg-white/20 text-white border-white/10'
                    : 'bg-white hover:bg-gray-100 text-gray-800 border-gray-300'
                }`}
              >
                Close
              </button>
            </div>
          </Motion.div>
        </Motion.div>
      )}
    </AnimatePresence>
  );
};

export default ValidationErrorsModal;
