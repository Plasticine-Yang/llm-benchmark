import { useState } from 'react';
import {
  ArrowRight,
  Check,
  CreditCard,
  ShieldCheck,
  Truck,
} from '@phosphor-icons/react';
import { useInView, useMagnetic } from '../lib/hooks';
import { useReservation } from '../lib/reservation';

const KIT = [
  'NOCTURNE ONE 耳机',
  '硬质旅行收纳盒',
  'USB-C 编织线（1.2 m）',
  '3.5 mm 模拟音频线',
  '快速入门与两年保修卡',
];

const SERVICES = [
  { icon: ShieldCheck, t: '两年整机保修', d: '含驱动单元与电池' },
  { icon: Truck, t: '顺丰包邮', d: '首批订单次日达' },
  { icon: CreditCard, t: '24 期免息', d: '支持以旧换新折抵' },
];

export function Purchase() {
  const [ref, shown] = useInView<HTMLElement>({ threshold: 0.12 });
  const [notified, setNotified] = useState(false);
  const magnetic = useMagnetic<HTMLSpanElement>(0.2, 12);
  const { open } = useReservation();

  return (
    <section className="purchase section" id="purchase" ref={ref}>
      <div className="shell">
        <header className="purchase__head">
          <p className="t-eyebrow section__eyebrow reveal" data-shown={shown}>
            <span className="section__idx mono">06</span> 购买 / PURCHASE
          </p>
          <h2 className="t-h2 section__title reveal" data-shown={shown} data-delay="1">
            把房间，随身带走。
          </h2>
        </header>

        <div className="purchase__plinth glass reveal" data-shown={shown} data-delay="2">
          <div className="purchase__price">
            <span className="purchase__price-label mono">首发价</span>
            <div className="purchase__price-row">
              <span className="purchase__price-value num">¥3,499</span>
              <span className="purchase__price-was num">¥3,899</span>
            </div>
            <p className="purchase__price-note">
              含 24 期免息 · 全国包邮 · 首批限量 500 台
            </p>
          </div>

          <span className="purchase__divider" aria-hidden="true" />

          <div className="purchase__kit">
            <h3 className="purchase__kit-title mono">标准配置 / IN THE BOX</h3>
            <ul>
              {KIT.map((k) => (
                <li key={k}>
                  <Check size={12} weight="bold" aria-hidden="true" />
                  {k}
                </li>
              ))}
            </ul>
          </div>

          <span className="purchase__divider" aria-hidden="true" />

          <div className="purchase__action">
            <span className="magnetic purchase__magnetic" ref={magnetic}>
              <button
                type="button"
                className="btn btn--primary purchase__cta"
                onClick={(e) => open(e.currentTarget)}
              >
                <span className="btn__label">预约试听</span>
                <span className="btn__icon" aria-hidden="true">
                  <ArrowRight size={15} weight="bold" />
                </span>
              </button>
            </span>

            <button
              type="button"
              className="btn btn--ghost purchase__notify"
              onClick={() => setNotified(true)}
              disabled={notified}
              aria-live="polite"
            >
              <span className="btn__icon" aria-hidden="true">
                {notified ? (
                  <Check size={13} weight="bold" />
                ) : (
                  <ArrowRight size={13} weight="bold" />
                )}
              </span>
              <span className="btn__label">
                {notified ? '已加入补货提醒' : '加入补货提醒'}
              </span>
            </button>

            <p className="purchase__micro mono">
              预计 4 周内发货 · 支持 30 天无理由退货
            </p>
          </div>
        </div>

        <ul className="purchase__services reveal" data-shown={shown} data-delay="3">
          {SERVICES.map((s) => (
            <li key={s.t}>
              <s.icon size={16} weight="light" aria-hidden="true" />
              <div>
                <strong>{s.t}</strong>
                <span>{s.d}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
