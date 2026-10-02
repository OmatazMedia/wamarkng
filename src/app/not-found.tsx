import Link from "next/link";

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: "70vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "60px 20px",
        color: "#fff",
      }}
    >
      <h1
        style={{
          fontSize: "72px",
          fontWeight: 800,
          color: "#48bb57",
          marginBottom: "12px",
          lineHeight: 1,
        }}
      >
        404
      </h1>
      <h2
        style={{
          fontSize: "26px",
          fontWeight: 700,
          marginBottom: "16px",
          color: "#fff",
        }}
      >
        Page Not Found
      </h2>
      <p
        style={{
          color: "rgba(255, 255, 255, 0.75)",
          maxWidth: "460px",
          marginBottom: "32px",
          lineHeight: 1.6,
        }}
      >
        The page you are looking for does not exist or might have been relocated.
      </p>
      <Link
        href="/"
        style={{
          display: "inline-block",
          background: "#48bb57",
          color: "#fff",
          padding: "12px 28px",
          borderRadius: "6px",
          fontWeight: 600,
          textDecoration: "none",
        }}
      >
        Return to Homepage
      </Link>
    </div>
  );
}
