import { ComponentProps } from "react";
import { twMerge } from "tailwind-merge";

const VARIANT = {
  primary:
    "bg-gradient-to-r from-primary-1 via-primary-2 to-primary-3 text-black font-khand focus:outline-none focus-visible:rounded-md focus-visible:shadow-bca-shadow-green disabled:bg-bca-grey-15",
  secondary:
    "bg-white shadow disabled:border-bca-grey-2 disabled:bg-bca-grey-2 disabled:text-bca-grey-5 disabled:shadow-none",
  tertiary:
    "border bg-white leading-6 text-bca-primary11 transition-shadow hover:shadow focus-visible:rounded-md focus-visible:outline-none focus-visible:ring focus-visible:ring-bca-black-1",
  destructive:
    "bg-bca-red-failure7 text-white disabled:border-bca-grey-2 disabled:bg-bca-grey-2 disabled:text-bca-grey-5 disabled:shadow-none",
};

interface ButtonProps extends ComponentProps<"button"> {
  variant: keyof typeof VARIANT;
  isFullWidth?: boolean;
  className?: string;
  children: React.ReactNode;
  isHome?: boolean;
}

const Button = ({
  variant,
  isFullWidth,
  className,
  children,
  isHome,
  ...rest
}: ButtonProps) => {
  return (
    <button
      className={twMerge(
        "flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition-transform duration-100 active:scale-95",
        VARIANT[variant],
        isFullWidth && "w-full",
        className,
        isHome && "bg-white bg-none",
      )}
      {...rest}
    >
      {children}
    </button>
  );
};

export { Button };
