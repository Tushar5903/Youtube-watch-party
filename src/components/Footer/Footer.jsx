import React from "react";
import { Link } from "react-router-dom";

export const Footer = () => (
  <footer
    style={{
      borderTop: "1px solid #1f2937",
      background: "#0d1117",
      padding: "60px 40px 32px",
      fontFamily: "'DM Sans', sans-serif",
    }}
  >
    <div
      style={{
        maxWidth: "1200px",
        margin: "0 auto",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: "40px",
        flexWrap: "wrap",
        paddingBottom: "40px",
        borderBottom: "1px solid #1f2937",
      }}
    >
      {/* Brand */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <img src="/logo192.png" alt="Logo" style={{ width: 100, height: 60 }} />
        <div>
          <div
            style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: "22px",
              fontWeight: 800,
              letterSpacing: "-0.5px",
            }}
          >
            <span style={{ color: "#38bdf8" }}>Watch</span>
            <span style={{ color: "#34d399" }}>Party</span>
          </div>
          <div style={{ fontSize: "13px", color: "#475569", marginTop: "2px" }}>
            Watch together, from anywhere.
          </div>
        </div>
      </div>

      {/* Links */}
      <div style={{ display: "flex", gap: "60px", flexWrap: "wrap" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <div
            style={{
              fontSize: "12px",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "1.5px",
              color: "#475569",
              marginBottom: "4px",
            }}
          >
            Product
          </div>
          <FooterLink to="/">Home</FooterLink>
          <FooterLink to="/faq">FAQ</FooterLink>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <div
            style={{
              fontSize: "12px",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "1.5px",
              color: "#475569",
              marginBottom: "4px",
            }}
          >
            Legal
          </div>
          <FooterLink to="/terms">Terms of Service</FooterLink>
          <FooterLink to="/privacy">Privacy Policy</FooterLink>
        </div>
      </div>
    </div>

    {/* Bottom bar */}
    <div
      style={{
        maxWidth: "1200px",
        margin: "24px auto 0",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "12px",
        fontSize: "13px",
        color: "#475569",
      }}
    >
      <span>© {new Date().getFullYear()} WatchParty. All rights reserved.</span>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <FooterBottomLink to="/terms">Terms</FooterBottomLink>
        <span style={{ color: "#374151" }}>·</span>
        <FooterBottomLink to="/privacy">Privacy</FooterBottomLink>
        <span style={{ color: "#374151" }}>·</span>
        <FooterBottomLink to="/faq">FAQ</FooterBottomLink>
      </div>
    </div>
  </footer>
);

const FooterLink = ({ to, children }) => (
  <Link
    to={to}
    style={{
      fontSize: "14px",
      color: "#94a3b8",
      textDecoration: "none",
      transition: "color 0.15s",
      textAlign: "center",
    }}
    onMouseEnter={(e) => (e.target.style.color = "#38bdf8")}
    onMouseLeave={(e) => (e.target.style.color = "#94a3b8")}
  >
    {children}
  </Link>
);

const FooterBottomLink = ({ to, children }) => (
  <Link
    to={to}
    style={{
      color: "#475569",
      textDecoration: "none",
      transition: "color 0.15s",
    }}
    onMouseEnter={(e) => (e.target.style.color = "#94a3b8")}
    onMouseLeave={(e) => (e.target.style.color = "#475569")}
  >
    {children}
  </Link>
);
