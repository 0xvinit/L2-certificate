// Dynamic imports to avoid SSR errors like "self is not defined"
async function getHtml2Pdf() {
  const mod = await import("html2pdf.js");
  // Some bundlers export default, some named
  // @ts-ignore
  return mod.default || mod;
}

async function getQRCode() {
  const mod = await import("qrcode");
  // @ts-ignore
  return mod.default || mod;
}

export async function generatePDFFromHTML(
  element: HTMLElement,
  options?: {
    filename?: string;
    returnBlob?: boolean;
  }
): Promise<Blob | void> {
  const html2pdf = await getHtml2Pdf();
  const opt = {
    margin: 0,
    filename: options?.filename || "certificate.pdf",
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      logging: false,
      letterRendering: true,
      allowTaint: false,
    },
    jsPDF: {
      unit: "in",
      format: [11.69, 8.27], // A4 landscape
      orientation: "landscape",
    },
  };

  if (options?.returnBlob) {
    return html2pdf().set(opt).from(element).outputPdf("blob");
  } else {
    return html2pdf().set(opt).from(element).save();
  }
}

export async function addQRCodeToElement(
  element: HTMLElement,
  verifyUrl: string
): Promise<void> {
  const qrPlaceholder = element.querySelector("#qr-code-placeholder");
  if (!qrPlaceholder) {
    console.warn("QR code placeholder not found");
    return;
  }

  try {
    const QRCode = await getQRCode();
    const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
      margin: 1,
      width: 200, // Increased for better quality
    });

    const img = document.createElement("img");
    img.src = qrDataUrl;
    img.alt = "QR Code";
    img.style.width = "0.8in"; // Match placeholder size
    img.style.height = "0.8in"; // Match placeholder size
    img.style.display = "block";

    // Clear placeholder and add QR code
    qrPlaceholder.innerHTML = "";
    qrPlaceholder.appendChild(img);
    
    // Also embed the verify URL as tiny white text so it is searchable in the PDF bytes later
    const hiddenUrl = document.createElement("div");
    hiddenUrl.textContent = verifyUrl;
    hiddenUrl.style.fontSize = "0.01in";
    hiddenUrl.style.color = "#ffffff"; // white on white; present in PDF text layer
    hiddenUrl.style.lineHeight = "1";
    hiddenUrl.style.marginTop = "0.02in";
    qrPlaceholder.appendChild(hiddenUrl);

    console.log("QR code added successfully");
  } catch (err) {
    console.error("Failed to generate QR code:", err);
  }
}
