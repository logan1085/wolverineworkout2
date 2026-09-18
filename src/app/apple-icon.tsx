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
          background: "#111916",
        }}
      >
        <svg width="140" height="140" viewBox="0 0 512 512">
          <path
            d="m108 145 57 222h55l36-122 36 122h55l57-222h-59l-29 135-34-135h-52l-34 135-29-135z"
            fill="#d3f78b"
          />
        </svg>
      </div>
    ),
    size,
  );
}
