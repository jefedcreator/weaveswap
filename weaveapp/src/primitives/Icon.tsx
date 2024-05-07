import type { SVGProps } from "react";
import { IconType, Icons } from "@/components";
import React from "react";

const Icon = ({
  name,
  color,
  ...props
}: SVGProps<SVGSVGElement> & { name: IconType }) => {
  if (!name) return null;
  const icon = Icons[name];
  const updatedIcon = React.cloneElement(icon(), {
    ...props,
  });
  return <>{updatedIcon}</>;
};

export { Icon };
