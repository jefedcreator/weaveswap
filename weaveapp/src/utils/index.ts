import { ReadonlyURLSearchParams } from "next/navigation";

export const createUrl = (
  pathname: string,
  params: URLSearchParams | ReadonlyURLSearchParams,
) => {
  const paramsString = params.toString();
  const queryString = `${paramsString.length ? "?" : ""}${paramsString}`;

  return `${pathname}${queryString}`;
};

export const formatNumber = (num: string) => {
  const figure = parseInt(num);
  if (figure >= 1e12) {
    return (figure / 1e12).toFixed(1) + "T";
  }
  if (figure >= 1e9) {
    return (figure / 1e9).toFixed(1) + "B";
  }
  if (figure >= 1e6) {
    return (figure / 1e6).toFixed(1) + "M";
  }
  if (figure >= 1e3) {
    return (figure / 1e3).toFixed(1) + "K";
  }
  return figure.toString();
};
