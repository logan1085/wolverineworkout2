import { ImageResponse } from "next/og";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          alignItems: "center",
          justifyContent: "center",
          background: "#344da9",
        }}
      >
        <svg width="140" height="140" viewBox="0 0 24 24">
          <path
            d="m12 3 2.4 6.6L21 12l-6.6 2.4L12 21l-2.4-6.6L3 12l6.6-2.4L12 3Z"
            fill="none" stroke="#ffffff" strokeWidth="1.3" strokeLinejoin="round"
          />
        </svg>
      </div>
    ),
    size,
  );
}
