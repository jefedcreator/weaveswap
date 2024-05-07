import localFont from "next/font/local";

export const hubotsans = localFont({
  src: [
    {
      path: "./hubotsans/bold.otf",
      weight: "600",
      style: "bold",
    },
    {
      path: "./hubotsans/italic.otf",
      weight: "700",
      style: "italic",
    },
    {
      path: "./hubotsans/medium.otf",
      weight: "300",
      style: "medium",
    },
    {
      path: "./hubotsans/regular.otf",
      weight: "400",
      style: "regular",
    },
    {
      path: "./hubotsans/semibold.otf",
      weight: "400",
      style: "semibold",
    },
  ],
});
