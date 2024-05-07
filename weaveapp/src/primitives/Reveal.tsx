import React, { useEffect, useRef } from "react";
import {
  motion,
  useAnimate,
  useAnimation,
  useInView,
  useIsPresent,
} from "framer-motion";
import { twMerge } from "tailwind-merge";

interface IReveal {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
}

const Reveal = ({ children, className, delay, duration }: IReveal) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const mainControls = useAnimation();
  useEffect(() => {
    if (isInView) {
      mainControls.start("visible");
    }
  }, [isInView]);

  return (
    <motion.div
      className={twMerge(`${className} relative overflow-hidden`)}
      ref={ref}
      variants={{
        hidden: { opacity: 0, translateY: 90 },
        visible: { opacity: 1, translateY: 0 },
      }}
      initial="hidden"
      animate={mainControls}
      transition={{
        type: "spring",
        duration: duration || 0.2,
        damping: 8,
        delay: delay,
        stiffness: 100,
      }}
    >
      {children}
    </motion.div>
  );
};

export default Reveal;
