export default function RootLoading() {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#0f0f0f",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "24px",
        zIndex: 9999,
      }}
    >
      {/* Store name */}
      <div style={{ display: "flex", alignItems: "baseline", gap: "2px" }}>
        <span
          style={{
            fontSize: "22px",
            fontWeight: 400,
            letterSpacing: "0.18em",
            color: "#e0e0e0",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          trendy
        </span>
        <span
          style={{
            fontSize: "22px",
            fontWeight: 700,
            letterSpacing: "0.18em",
            color: "#c9a84c",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          &nbsp;store
        </span>
      </div>

      {/* Gold spinner */}
      <div
        style={{
          width: "28px",
          height: "28px",
          borderRadius: "50%",
          border: "2.5px solid rgba(201,168,76,0.2)",
          borderTopColor: "#c9a84c",
          animation: "ts-spin 0.75s linear infinite",
        }}
      />

      <style>{`
        @keyframes ts-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
