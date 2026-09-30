export function Icon({
  name = "arrow",
  size = 20,
}: {
  name?: "arrow" | "play" | "close" | "check" | "sound" | "pause" | "plus";
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {name === "arrow" && <path d="M5 12h14M13 6l6 6-6 6" />}
      {name === "play" && <path d="m9 5 11 7-11 7z" />}
      {name === "close" && <path d="m6 6 12 12M6 18 18 6" />}
      {name === "check" && <path d="m5 12 4 4L19 6" />}
      {name === "sound" && (
        <>
          <path d="M4 9h4l5-4v14l-5-4H4zM17 8c2 2 2 6 0 8M20 5c4 4 4 10 0 14" />
        </>
      )}
      {name === "pause" && <path d="M8 5v14M16 5v14" />}
      {name === "plus" && <path d="M12 5v14M5 12h14" />}
    </svg>
  );
}
