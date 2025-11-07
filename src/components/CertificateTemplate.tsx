"use client";
import { useEffect, useRef } from "react";

type CertificateTemplateProps = {
  studentName: string;
  studentId: string;
  programName: string;
  programCode?: string;
  date: string;
  universityName?: string;
  logoUrl?: string;
  signatureUrl?: string;
  signatoryName?: string;
  signatoryTitle?: string;
  verifyUrl?: string;
  hash?: string;
};

export default function CertificateTemplate({
  studentName,
  studentId,
  programName,
  programCode,
  date,
  universityName,
  logoUrl,
  signatureUrl,
  signatoryName,
  signatoryTitle,
  verifyUrl,
  hash,
}: CertificateTemplateProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={containerRef}
      style={{
        width: "11.69in",
        height: "8.27in",
        background: "#FBF8F0",
        position: "relative",
        fontFamily: "serif",
        overflow: "hidden",
      }}
      id="certificate-container"
    >
      {/* Gold borders */}
      <div
        style={{
          position: "absolute",
          top: "0.4in",
          left: "0.4in",
          right: "0.4in",
          bottom: "0.4in",
          border: "4px solid #D4AF37",
          borderRadius: "0",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: "0.55in",
          left: "0.55in",
          right: "0.55in",
          bottom: "0.55in",
          border: "2px solid #D4AF37",
          borderRadius: "0",
        }}
      />

      {/* Decorative corner accents */}
      <div
        style={{
          position: "absolute",
          top: "0.53in",
          left: "0.53in",
          width: "0.83in",
          height: "0.83in",
          borderTop: "3px solid #D4AF37",
          borderLeft: "3px solid #D4AF37",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: "0.53in",
          right: "0.53in",
          width: "0.83in",
          height: "0.83in",
          borderTop: "3px solid #D4AF37",
          borderRight: "3px solid #D4AF37",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "0.53in",
          left: "0.53in",
          width: "0.83in",
          height: "0.83in",
          borderBottom: "3px solid #D4AF37",
          borderLeft: "3px solid #D4AF37",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "0.53in",
          right: "0.53in",
          width: "0.83in",
          height: "0.83in",
          borderBottom: "3px solid #D4AF37",
          borderRight: "3px solid #D4AF37",
        }}
      />

      {/* Logo and Title aligned at top */}
      <div
        style={{
          position: "absolute",
          top: "0.9in",
          left: "1.2in",
          right: "1.2in",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
        }}
      >
        {/* Logo on left */}
        {logoUrl && (
          <div
            style={{
              width: "1.2in",
              height: "1.2in",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <img
              src={logoUrl}
              alt="Logo"
              style={{
                maxWidth: "100%",
                maxHeight: "100%",
                objectFit: "contain",
              }}
              crossOrigin="anonymous"
            />
          </div>
        )}

        {/* Badge/Seal on left if no logo */}
        {!logoUrl && (
          <div
            style={{
              width: "1in",
              height: "1in",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: "0.7in",
                height: "0.7in",
                borderRadius: "50%",
                border: "4px solid #D4AF37",
                background: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.4in",
                color: "#D4AF37",
              }}
            >
              ★
            </div>
          </div>
        )}

        {/* Title - centered */}
        <div
          style={{
            flex: 1,
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <h1
            style={{
              fontSize: "0.67in",
              fontWeight: "bold",
              color: "#1a1a1a",
              margin: 0,
              letterSpacing: "0.05in",
              fontFamily: "serif",
            }}
          >
            CERTIFICATE
          </h1>
          <p
            style={{
              fontSize: "0.22in",
              color: "#666",
              margin: "0.1in 0 0 0",
              fontWeight: "normal",
              letterSpacing: "0.02in",
            }}
          >
            OF COMPLETION
          </p>
        </div>

        {/* Empty space on right to balance */}
        <div style={{ width: logoUrl ? "1.2in" : "1in", flexShrink: 0 }} />
      </div>

      {/* Main content */}
      <div
        style={{
          position: "absolute",
          top: "2.8in",
          left: "1.2in",
          right: "1.2in",
          textAlign: "center",
        }}
      >
        <p
          style={{
            fontSize: "0.19in",
            color: "#1a1a1a",
            margin: "0 0 0.3in 0",
            fontStyle: "italic",
          }}
        >
          This certificate is proudly presented to
        </p>

        {/* Student name - ABOVE the line */}
        <h2
          style={{
            fontSize: "0.45in",
            fontWeight: "normal",
            color: "#D4AF37",
            margin: "0.10in 0 0.2in 0",
            fontFamily: "serif",
            fontStyle: "italic",
            letterSpacing: "0.02in",
            minHeight: "0.6in",
          }}
        >
          {studentName || "Student Name"}
        </h2>

        {/* Name decoration line */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0.2in 0",
          }}
        >
          <div
            style={{
              width: "0.08in",
              height: "0.08in",
              borderRadius: "50%",
              background: "#D4AF37",
              marginRight: "0.15in",
            }}
          />
          <div
            style={{
              width: "4in",
              height: "1px",
              background: "#1a1a1a",
            }}
          />
          <div
            style={{
              width: "0.08in",
              height: "0.08in",
              borderRadius: "50%",
              background: "#D4AF37",
              marginLeft: "0.15in",
            }}
          />
        </div>

        {/* Description - centered and balanced with right margin for signature */}
        <p
          style={{
            fontSize: "0.18in",
            color: "#1a1a1a",
            margin: "0.3in auto 0",
            lineHeight: "1.8",
            textAlign: "center",
            maxWidth: "10in",
            paddingLeft: "1.0in",
            paddingRight: "1.0in", // Extra right padding to avoid signature overlap
          }}
        >
          has successfully completed the <strong>{programName}</strong>
          {programCode && ` (${programCode})`} on {date}, demonstrating
          dedication, skill, and commitment throughout the program. This
          certificate is securely recorded and verifiable on-chain through
          Patram, ensuring authenticity and transparency in recognition.
        </p>
      </div>

      {/* Signature section - Bottom right corner, smaller size */}
      <div
        style={{
          position: "absolute",
          bottom: "0.7in",
          right: "0.5in",
          textAlign: "left",
          width: "1.8in", // Reduced from 2.5in
        }}
      >
        {signatureUrl && (
          <div
            style={{
              marginBottom: "0.05in", // Reduced margin
              height: "0.6in", // Reduced from 0.8in
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-start",
            }}
          >
            <img
              src={signatureUrl}
              alt="Signature"
              style={{
                maxHeight: "100%",
                maxWidth: "100%",
                objectFit: "contain",
              }}
              crossOrigin="anonymous"
            />
          </div>
        )}
        <div
          style={{
            width: "1in", // Reduced from 2in
            height: "1px",
            background: "#1a1a1a",
            margin: "0 0 0.1in 0", // Reduced margin
          }}
        />
        <p
          style={{
            fontSize: "0.14in", // Slightly smaller
            fontWeight: "bold",
            color: "#1a1a1a",
            margin: "0 0 0.08in 0", // Reduced margin
            textTransform: "uppercase",
            letterSpacing: "0.015in", // Reduced
            textAlign: "left",
          }}
        >
          {signatoryName || "AUTHORIZED SIGNATORY"}
        </p>
        <p
          style={{
            fontSize: "0.13in", // Slightly smaller
            color: "#666",
            margin: 0,
            textAlign: "left",
          }}
        >
          {signatoryTitle || "Program Director"}
        </p>
      </div>

      {/* Student ID and QR Code at bottom left */}
      <div
        style={{
          position: "absolute",
          bottom: "0.7in",
          left: "0.8in",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          gap: "0.15in",
        }}
      >
        {/* QR Code placeholder - always render; QR inserted later via JS */}
        <div
          id="qr-code-placeholder"
          style={{
            width: "0.9in",
            height: "0.9in",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "white",
            border: "1px solid #D4AF37",
            padding: "0.05in",
          }}
        />

        <div
          style={{
            fontSize: "0.13in",
            color: "#666",
            marginTop: verifyUrl ? "0" : "0",
          }}
        >
          Student ID: {studentId}
        </div>

        {verifyUrl && (
          <div
            style={{
              fontSize: "0.1in",
              color: "#666",
              textAlign: "center",
              width: "0.9in",
            }}
          >
            Scan to Verify
          </div>
        )}
      </div>
    </div>
  );
}
