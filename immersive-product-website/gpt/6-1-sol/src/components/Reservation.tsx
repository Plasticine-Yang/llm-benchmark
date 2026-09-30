import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Icon } from "./Icon";

export type ReservationRequest = {
  x: number;
  y: number;
  mode: "reserve" | "purchase";
};
export function Reservation({
  request,
  onClose,
  color,
}: {
  request: ReservationRequest | null;
  onClose: () => void;
  color: string;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [status, setStatus] = useState<
    "default" | "submitting" | "success" | "error"
  >("default");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [name, setName] = useState("");
  useEffect(() => {
    if (request) {
      setStatus("default");
      setErrors({});
      dialog.current?.showModal();
    } else {
      dialog.current?.close();
      if (timer.current) clearTimeout(timer.current);
    }
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [request]);
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const fields = Object.fromEntries(data.entries()) as Record<string, string>;
    const next: Record<string, string> = {};
    if (!fields.name.trim()) next.name = "请填写你的称呼";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email))
      next.email = "请输入有效的邮箱地址";
    if (!fields.city) next.city = "请选择试听城市";
    if (Object.keys(next).length) {
      setErrors(next);
      setStatus("error");
      requestAnimationFrame(() =>
        dialog.current
          ?.querySelector<HTMLInputElement>('[aria-invalid="true"]')
          ?.focus(),
      );
      return;
    }
    setErrors({});
    setName(fields.name);
    setStatus("submitting");
    timer.current = setTimeout(() => {
      try {
        localStorage.setItem(
          "nocturne-reservation",
          JSON.stringify({
            ...fields,
            color,
            mode: request?.mode,
            date: new Date().toISOString(),
          }),
        );
        setStatus("success");
      } catch {
        setStatus("error");
        setErrors({
          submit: "此设备暂时无法保存预约，请检查浏览器存储权限后重试。",
        });
      }
    }, 1200);
  }
  return (
    <dialog
      className="reservation-dialog glass"
      ref={dialog}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          const b = e.currentTarget.getBoundingClientRect();
          if (
            e.clientX < b.left ||
            e.clientX > b.right ||
            e.clientY < b.top ||
            e.clientY > b.bottom
          )
            onClose();
        }
      }}
      style={{
        transformOrigin: request
          ? `${request.x - innerWidth / 2 + 250}px ${request.y - innerHeight / 2 + 320}px`
          : undefined,
      }}
      aria-labelledby="reservation-title"
    >
      <button
        className="icon-button dialog-close"
        onClick={onClose}
        aria-label="关闭预约面板"
      >
        <Icon name="close" />
      </button>
      <div className="eyebrow">NOCTURNE PRIVATE LISTENING</div>
      {status === "success" ? (
        <div className="reservation-success">
          <div className="success-icon">
            <Icon name="check" size={30} />
          </div>
          <h2 id="reservation-title">为你，留一个位置。</h2>
          <p>
            {name}，你的{request?.mode === "purchase" ? "购买" : "试听"}
            意向已登记。
          </p>
          <p className="body-copy">
            预约信息已保存在此设备。本页面为产品体验演示，不会发送邮件或产生付款。
          </p>
          <button className="primary-button" onClick={onClose}>
            继续探索
            <Icon />
          </button>
        </div>
      ) : (
        <>
          <h2 id="reservation-title">
            {request?.mode === "purchase"
              ? "让好声音，属于你。"
              : "亲耳听见，不同。"}
          </h2>
          <p className="dialog-description">
            预约 NOCTURNE ONE 私人试听，寻找你的声音坐标。
          </p>
          <form onSubmit={submit} noValidate>
            <label htmlFor="reservation-name">
              你的称呼
              <input
                id="reservation-name"
                name="name"
                autoComplete="name"
                placeholder="如何称呼你"
                maxLength={60}
                disabled={status === "submitting"}
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? "name-error" : undefined}
              />
            </label>
            {errors.name && (
              <span className="form-error" id="name-error">
                {errors.name}
              </span>
            )}
            <label htmlFor="reservation-email">
              电子邮箱
              <input
                id="reservation-email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                maxLength={180}
                disabled={status === "submitting"}
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? "email-error" : undefined}
              />
            </label>
            {errors.email && (
              <span className="form-error" id="email-error">
                {errors.email}
              </span>
            )}
            <label htmlFor="reservation-city">
              试听城市
              <select
                id="reservation-city"
                name="city"
                defaultValue=""
                disabled={status === "submitting"}
                aria-invalid={!!errors.city}
                aria-describedby={errors.city ? "city-error" : undefined}
              >
                <option value="" disabled>
                  选择你所在的城市
                </option>
                <option>上海</option>
                <option>北京</option>
                <option>深圳</option>
                <option>杭州</option>
                <option>其他城市 · 线上体验</option>
              </select>
            </label>
            {errors.city && (
              <span className="form-error" id="city-error">
                {errors.city}
              </span>
            )}
            <div className="reservation-selection">
              <span>你的选择</span>
              <strong>{color} / ¥3,499</strong>
            </div>
            {errors.submit && (
              <p role="alert" className="form-error">
                {errors.submit}
              </p>
            )}
            <button
              className="primary-button"
              disabled={status === "submitting"}
              type="submit"
            >
              {status === "submitting" ? (
                <>
                  <span className="spinner" />
                  正在登记…
                </>
              ) : (
                <>
                  确认预约
                  <Icon />
                </>
              )}
            </button>
            <p className="form-note" aria-live="polite">
              {status === "submitting"
                ? "正在保存你的预约信息，请稍候。"
                : "体验演示 · 信息仅保存在当前设备，无需付款。"}
            </p>
          </form>
        </>
      )}
    </dialog>
  );
}
