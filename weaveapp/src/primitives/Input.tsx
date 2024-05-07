import { InputHTMLAttributes, forwardRef } from "react";
import { twMerge } from "tailwind-merge";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  id: string;
  className?: string;
}

export type Ref = HTMLInputElement;

const Input = forwardRef<Ref, InputProps>((props, ref) => {
  const { className, ...rest } = props;
  return (
    <input
      className={twMerge(
        "text-bca-grey-9 focus:border-bca-success-6 focus-visible:shadow-bca-shadow-green h-4 w-10 min-w-10 bg-transparent px-1 py-1 text-lg font-semibold focus:outline-none focus-visible:rounded-md  disabled:opacity-50",
        className,
      )}
      ref={ref}
      {...rest}
      // role="presentation"
      autoComplete="off"
    />
  );
});

export { Input };
