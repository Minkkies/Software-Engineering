// components/button.jsx
// ปุ่มตามธีม CS Info Portal (น้ำเงิน #0033A0 / เหลือง #FFC72C)
//
// ตัวอย่าง:
//   <Button>บันทึก</Button>
//   <Button variant="accent" size="lg" icon="login">เข้าสู่ระบบ</Button>
//   <Button variant="outline" href="/news" iconRight="arrowRight">ดูข่าวทั้งหมด</Button>
//   <Button variant="danger" icon="trash" iconSize={18}>ลบ</Button>
//   <Button variant="ghost" icon="bell" aria-label="แจ้งเตือน" />   // ปุ่มไอคอนล้วน

import Link from "next/link";
import Icon from "./IconComponent";

const VARIANTS = {
  primary:
    "bg-[#0033A0] text-white hover:bg-[#002a85] focus-visible:ring-[#0033A0]",
  accent:
    "bg-[#FFC72C] text-[#1a1a1a] hover:bg-[#f0b715] focus-visible:ring-[#FFC72C]",
  outline:
    "bg-white text-[#0033A0] border border-[#0033A0]/30 hover:bg-[#0033A0]/5 focus-visible:ring-[#0033A0]",
  soft: "bg-[#0033A0]/10 text-[#0033A0] hover:bg-[#0033A0]/15 focus-visible:ring-[#0033A0]",
  ghost:
    "bg-transparent text-gray-600 hover:bg-gray-100 focus-visible:ring-gray-400",
  danger:
    "bg-[#dc2626] text-white hover:bg-[#b91c1c] focus-visible:ring-[#dc2626]",
};

// size: ความสูง/padding/ตัวอักษร + ขนาดไอคอนเริ่มต้น (override ได้ด้วย iconSize)
const SIZES = {
  sm: { box: "h-8 px-3 text-xs gap-1.5", icon: 14, square: "h-8 w-8" },
  md: { box: "h-10 px-4 text-sm gap-2", icon: 18, square: "h-10 w-10" },
  lg: { box: "h-12 px-6 text-base gap-2.5", icon: 22, square: "h-12 w-12" },
};

/**
 * @typedef {Object} ButtonProps
 * @property {import("react").ReactNode} [children]
 * @property {"primary"|"accent"|"outline"|"soft"|"ghost"|"danger"} [variant]
 * @property {"sm"|"md"|"lg"} [size]
 * @property {string} [icon]
 * @property {string} [iconRight]
 * @property {number|string} [iconSize]
 * @property {string} [href]
 * @property {"button"|"submit"|"reset"} [type]
 * @property {boolean} [fullWidth]
 * @property {boolean} [disabled]
 * @property {string} [className]
 */

/** @param {ButtonProps & Record<string, any>} props */
export default function Button({
  children,
  variant = "primary",
  size = "md", // "sm" | "md" | "lg"
  icon, // ชื่อไอคอนด้านซ้าย
  iconRight, // ชื่อไอคอนด้านขวา
  iconSize, // ระบุขนาดไอคอนเอง (px) ถ้าไม่ใส่จะใช้ตาม size
  href, // ถ้าใส่จะ render เป็น <Link>
  type = "button",
  fullWidth = false,
  disabled = false,
  className = "",
  ...props
}) {
  const s = SIZES[size] ?? SIZES.md;
  const iSize = iconSize ?? s.icon;
  const iconOnly = !children && (icon || iconRight);

  const classes = [
    "inline-flex items-center justify-center rounded-lg font-semibold whitespace-nowrap",
    "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
    iconOnly ? s.square : s.box,
    VARIANTS[variant] ?? VARIANTS.primary,
    fullWidth ? "w-full" : "",
    disabled ? "pointer-events-none opacity-50" : "cursor-pointer",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const content = (
    <>
      {icon && <Icon name={icon} size={iSize} />}
      {children}
      {iconRight && <Icon name={iconRight} size={iSize} />}
    </>
  );

  if (href && !disabled) {
    return (
      <Link href={href} className={classes} {...props}>
        {content}
      </Link>
    );
  }

  return (
    <button type={type} disabled={disabled} className={classes} {...props}>
      {content}
    </button>
  );
}