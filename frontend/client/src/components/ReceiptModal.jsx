import { useEffect, useState } from "react";
import Modal from "./Modal";
import { getSessionDetail } from "../services/salesService";

export default function ReceiptModal({ isOpen, onClose, sessionId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !sessionId) return;
    setData(null);
    setLoading(true);
    getSessionDetail(sessionId)
      .then((res) => setData(res))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [isOpen, sessionId]);

  const orderNumber = sessionId ? sessionId.slice(-6).toUpperCase() : "";

  // Aggregate sales by product
  const itemsMap = {};
  (data?.sales || []).forEach((s) => {
    const pid = s.product?._id || s.productId;
    if (!pid) return;
    if (itemsMap[pid]) {
      itemsMap[pid].quantity += s.quantity;
    } else {
      itemsMap[pid] = {
        name: s.product?.name || "Unknown",
        price: s.price,
        quantity: s.quantity,
      };
    }
  });
  const items = Object.values(itemsMap);
  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const rawDate = data?.sales?.[0]?.date || data?.sales?.[0]?.createdAt;
  const dateStr = rawDate
    ? new Date(rawDate).toLocaleString([], {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  const notes = data?.sales?.[0]?.notes;

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title={`Receipt #${orderNumber}`} size="small">
        {loading && (
          <div className="py-10 text-center text-sm text-gray-400">Loading…</div>
        )}

        {!loading && !data && (
          <div className="py-10 text-center text-sm text-gray-400">Failed to load receipt.</div>
        )}

        {!loading && data && (
          <div className="receipt-print-content font-mono text-sm">
            {/* Header */}
            <div className="text-center mb-4">
              <p className="text-lg font-bold text-gray-900">Order #{orderNumber}</p>
              {dateStr && <p className="text-xs text-gray-500 mt-0.5">{dateStr}</p>}
            </div>

            {/* Items */}
            <div className="border-t border-dashed border-gray-300 pt-3 mb-3 space-y-1.5">
              {items.map((item, i) => (
                <div key={i} className="flex items-baseline justify-between gap-2">
                  <span className="text-gray-800 truncate flex-1">
                    {item.name}
                  </span>
                  <span className="text-gray-500 text-xs whitespace-nowrap">
                    ×{item.quantity}
                  </span>
                  <span className="text-gray-900 font-semibold whitespace-nowrap">
                    ₱{(item.price * item.quantity).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>

            {/* Notes */}
            {notes && (
              <div className="border-t border-dashed border-gray-300 pt-2 mb-3">
                <p className="text-xs text-amber-700 italic">Note: {notes}</p>
              </div>
            )}

            {/* Total */}
            <div className="border-t border-gray-300 pt-3 flex items-center justify-between">
              <span className="font-bold text-gray-900">Total</span>
              <span className="text-lg font-bold text-primary-600">
                ₱{total.toLocaleString()}
              </span>
            </div>

            {/* Actions */}
            <div className="mt-5">
              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
