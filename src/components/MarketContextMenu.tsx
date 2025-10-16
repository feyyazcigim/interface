import { useEffect, useRef, type ReactNode } from "react";

export interface ContextMenuOption {
  label: string;
  onClick: () => void;
  icon?: ReactNode;
  className?: string;
}

export interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  options: ContextMenuOption[];
}

export const ContextMenu = ({ x, y, onClose, options }: ContextMenuProps) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  // Adjust position if menu would overflow viewport
  useEffect(() => {
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let adjustedX = x;
      let adjustedY = y;

      if (rect.right > viewportWidth) {
        adjustedX = viewportWidth - rect.width - 10;
      }

      if (rect.bottom > viewportHeight) {
        adjustedY = viewportHeight - rect.height - 10;
      }

      if (adjustedX !== x || adjustedY !== y) {
        menuRef.current.style.left = `${adjustedX}px`;
        menuRef.current.style.top = `${adjustedY}px`;
      }
    }
  }, [x, y]);

  return (
    <div
      ref={menuRef}
      className="fixed z-50 min-w-[200px] bg-white border border-gray-300 rounded-lg shadow-xl"
      style={{ left: x, top: y }}
    >
      {options.map((option, idx) => (
        <button
          key={idx}
          type="button"
          className={`w-full px-4 py-3 text-left text-sm hover:bg-gray-100 transition-colors first:rounded-t-lg last:rounded-b-lg ${
            option.className || ""
          }`}
          onClick={(e) => {
            e.stopPropagation();
            option.onClick();
            onClose();
          }}
        >
          <div className="flex items-center gap-3">
            {option.icon && <div className="flex-shrink-0">{option.icon}</div>}
            <span className="font-medium">{option.label}</span>
          </div>
        </button>
      ))}
    </div>
  );
};
