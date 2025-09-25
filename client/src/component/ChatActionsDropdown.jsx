// ChatActionsDropdown.js

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { jsPDF } from "jspdf";
export default function ChatActionsDropdown({
  chat,
  darkMode,
  onRequestRename,
  onArchive,
  onDelete,
  openDropdownChatId,
  setOpenDropdownChatId
}) {
  const [hoveredBtn, setHoveredBtn] = useState(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, direction: "down" });
  const btnRef = useRef(null);
  // inline rename handled by parent sidebar now
  const showDropdown = openDropdownChatId === chat.id;
  const handleToggleDropdown = (e) => {
    e.stopPropagation();
    if (showDropdown) {
      setOpenDropdownChatId(null);
    } else {
      setOpenDropdownChatId(chat.id);
    }
  };
  const handleCloseDropdown = () => setOpenDropdownChatId(null);
  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    const pageHeight = doc.internal.pageSize.height;
    const lineHeight = 8;
    let y = 20;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(44, 62, 80);
    doc.text(`Chat: ${chat.title || "Untitled"}`, 10, y);
    y += 12;
    doc.setFontSize(12);

    chat.messages.forEach((msg) => {
      let sender = msg.role === "user" ? "User" : "AI";
  let text = (msg.text || "").replace(/\*+/g, "").replace(/"/g, "");

      if (y + lineHeight > pageHeight - 10) {
        doc.addPage();
        y = 20;
      }

      if (msg.role === "user") {
        doc.setTextColor(200, 0, 0);
      } else {
        doc.setTextColor(0, 0, 180);
      }

      doc.setFont("helvetica", "bold");
      doc.text(`${sender}:`, 10, y);
      y += lineHeight;

      doc.setFont("helvetica", "normal");
      const lines = doc.splitTextToSize(text, 180);
      lines.forEach((line) => {
        if (y + lineHeight > pageHeight - 10) {
          doc.addPage();
          y = 20;
        }
        doc.text(line, 15, y);
        y += lineHeight;
      });

      y += 4;
    });

    doc.save(`${chat.title || "chat"}.pdf`);
    handleCloseDropdown();
  };

  // --- updated: fixed copy link with chatId in URL ---
  const handleCopyLink = () => {
    try {
      const link = `${window.location.origin}/?chatId=${encodeURIComponent(chat.id)}`;
      navigator.clipboard.writeText(link);
      alert("Link copied to clipboard!");
    } catch (err) {
      console.error(err);
      alert("Failed to copy link.");
    }
    handleCloseDropdown();
  };



  const buttonStyle = (btnName) => ({
    display: "block",
    width: "100%",
    textAlign: "left",
    background: hoveredBtn === btnName ? (darkMode ? "#333" : "#f0f0f0") : "none",
    border: "none",
    padding: "6px 10px",
    cursor: "pointer",
    color: darkMode ? "#fff" : "#000",
    borderRadius: "4px"
  });
  useEffect(() => {
    if (showDropdown && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const dropdownHeight = 180;
      const direction = rect.bottom + dropdownHeight > viewportHeight ? "up" : "down";
      const top = direction === "down" ? rect.bottom + 2 : rect.top - dropdownHeight - 2;
      setDropdownPosition({ top, left: rect.left, direction });
    }
  }, [showDropdown, chat.id]);

  useEffect(() => {
  function handleClickOutside(e) {
    if (
      showDropdown &&
      btnRef.current &&
      !btnRef.current.contains(e.target) && // not clicking the ⋮ button
      !document.getElementById(`dropdown-${chat.id}`)?.contains(e.target) // not clicking inside dropdown
    ) {
      setOpenDropdownChatId(null);
    }
  }

  document.addEventListener("mousedown", handleClickOutside);
  return () => {
    document.removeEventListener("mousedown", handleClickOutside);
  };
}, [showDropdown, chat.id, setOpenDropdownChatId]);

  // --- render dropdown
  const dropdownMenu = showDropdown ? (
    <div
    id={`dropdown-${chat.id}`} 
      style={{
        position: "fixed",
        top: dropdownPosition.top,
        left: dropdownPosition.left,
        zIndex: 3000,
        backgroundColor: darkMode ? "#222" : "#fff",
        color: darkMode ? "#fff" : "#000",
        border: darkMode ? "1px solid #444" : "1px solid #ccc",
        borderRadius: "6px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
        padding: "5px",
        minWidth: "150px"
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        style={buttonStyle("download")}
        onMouseEnter={() => setHoveredBtn("download")}
        onMouseLeave={() => setHoveredBtn(null)}
        onClick={handleDownloadPDF}
      >
        Download PDF
      </button>
      <button
        style={buttonStyle("copy")}
        onMouseEnter={() => setHoveredBtn("copy")}
        onMouseLeave={() => setHoveredBtn(null)}
        onClick={handleCopyLink}
      >
        Copy Link
      </button>
      <button
        style={buttonStyle("rename")}
        onMouseEnter={() => setHoveredBtn("rename")}
        onMouseLeave={() => setHoveredBtn(null)}
        onClick={() => {
          onRequestRename && onRequestRename();
          handleCloseDropdown();
        }}
      >
        Rename
      </button>
      <button
        style={buttonStyle("archive")}
        onMouseEnter={() => setHoveredBtn("archive")}
        onMouseLeave={() => setHoveredBtn(null)}
        onClick={() => {
          onArchive(chat.id);
          handleCloseDropdown();
          alert("Chat archived. To see the archived chats, go to Settings.");

        }}
      >
        Archive
      </button>
      <button
        style={{ ...buttonStyle("delete"), color: "red" }}
        onMouseEnter={() => setHoveredBtn("delete")}
        onMouseLeave={() => setHoveredBtn(null)}
        onClick={() => {
          if (window.confirm("Are you sure you want to delete this chat?")) {
            onDelete(chat.id);
          }
          handleCloseDropdown();
        }}
      >
        Delete
      </button>
    </div>
  ) : null;
  return (
    <div style={{ position: "relative" }}>
      <button
        ref={btnRef}
        className="btn btn-sm"
        style={{ background: "none", border: "none", color: darkMode ? "white" : "black" }}
        onClick={handleToggleDropdown}
      >
        ⋮
      </button>
      {createPortal(dropdownMenu, document.body)}
    </div>
  );
}
