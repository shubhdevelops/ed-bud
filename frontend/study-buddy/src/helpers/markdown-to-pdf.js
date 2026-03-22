import { jsPDF } from "jspdf";
import "jspdf-autotable";

// Helper function to convert oklch to rgb
function convertOklchToRgb(oklchColor) {
  // Default to white if conversion fails
  return "#ffffff";
}

// Function to replace oklch colors in content
function replaceOklchColors(content) {
  return content.replace(/oklch\([^)]+\)/g, (match) => {
    return convertOklchToRgb(match);
  });
}

// Function to strip HTML tags
function stripHtmlTags(content) {
  return content.replace(/<[^>]*>/g, "");
}

export const downloadPdfFromHtml = async (
  markdownContent,
  filename = "document.pdf"
) => {
  try {
    // Strip HTML tags from the content
    const cleanContent = stripHtmlTags(markdownContent);

    // Initialize PDF
    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 20;

    // Split markdown content into lines
    const lines = cleanContent.split("\n");
    let y = margin;
    const lineHeight = 7;
    const maxWidth = pageWidth - margin * 2;

    // Add content line by line
    lines.forEach((line) => {
      // Skip empty lines
      if (!line.trim()) {
        y += lineHeight;
        return;
      }

      // Check if we need a new page
      if (y > pdf.internal.pageSize.getHeight() - margin) {
        pdf.addPage();
        y = margin;
      }

      // Handle different markdown elements
      if (line.startsWith("# ")) {
        // Heading 1
        pdf.setFontSize(24);
        pdf.text(line.substring(2), margin, y);
        y += lineHeight * 2;
      } else if (line.startsWith("## ")) {
        // Heading 2
        pdf.setFontSize(20);
        pdf.text(line.substring(3), margin, y);
        y += lineHeight * 1.5;
      } else if (line.startsWith("### ")) {
        // Heading 3
        pdf.setFontSize(18);
        pdf.text(line.substring(4), margin, y);
        y += lineHeight * 1.5;
      } else if (line.startsWith("- ")) {
        // List item
        pdf.setFontSize(12);
        pdf.text("• " + line.substring(2), margin + 5, y);
        y += lineHeight;
      } else if (line.startsWith("```")) {
        // Code block
        pdf.setFont("courier");
        pdf.setFontSize(10);
        y += lineHeight;
      } else if (line === "```") {
        // End code block
        pdf.setFont("helvetica");
        pdf.setFontSize(12);
        y += lineHeight;
      } else {
        // Regular text
        pdf.setFontSize(12);
        const text = pdf.splitTextToSize(line, maxWidth);
        pdf.text(text, margin, y);
        y += lineHeight * text.length;
      }
    });

    // Save the PDF
    pdf.save(filename);
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw error;
  }
};
