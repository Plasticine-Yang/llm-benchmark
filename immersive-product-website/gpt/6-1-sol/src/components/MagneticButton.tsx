import { useRef } from "react";
import type { ButtonHTMLAttributes } from "react";
import { Icon } from "./Icon";

export function MagneticButton({
  children,
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  const ref = useRef<HTMLButtonElement>(null);
  return (
    <button
      {...props}
      ref={ref}
      className={`primary-button ${className}`}
      onPointerMove={(e) => {
        if (
          e.pointerType !== "mouse" ||
          matchMedia("(prefers-reduced-motion: reduce)").matches
        )
          return;
        const box = e.currentTarget.getBoundingClientRect();
        ref.current?.style.setProperty(
          "--mx",
          `${(e.clientX - box.left - box.width / 2) * 0.065}px`,
        );
        ref.current?.style.setProperty(
          "--my",
          `${(e.clientY - box.top - box.height / 2) * 0.1}px`,
        );
      }}
      onPointerLeave={() => {
        ref.current?.style.setProperty("--mx", "0px");
        ref.current?.style.setProperty("--my", "0px");
      }}
    >
      <span>{children}</span>
      <Icon />
    </button>
  );
}
