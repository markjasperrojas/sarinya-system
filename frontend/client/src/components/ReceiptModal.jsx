import { useEffect, useState } from "react";
import { Receipt } from "lucide-react";
import Modal from "./Modal";
import { getSessionDetail } from "../services/salesService";

export default function ReceiptModal({ isOpen, onClose, sessionId }) {
  const [sales, setSales] = useState([]);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !sessionId) return;
    setLoading(true);
    getSessionDetail(sessionId)
      .then((data) => {
        // Aggregate by product for clean display
        const map = {};
        data.sales.forEach((s) => {
          const pid = s.product?._id;
          if (!pid) return;
          if (map[pid]) {
            map[pid].quantity += s.quantity;
          } else {
            map[pid] = {
              name: s.product.name,
              price: s.price,
              quantity: s.quantity,
            };
          }
        });
        setSales(Object.values(map));
        setNotes(data.sales[0]?.notes || "");
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [isOpen, sessionId]);

  const total = sales.reduce((sum, s) => sum + s.price * s.quantity, 0);
  const shortId = sessionId ? sessionId.slice(-6).toUpperCase() : "";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Receipt" size="default">
      {loading ? (
        <div className="py-10 text-center text-gray-400 text-sm">Loading...</div>
      ) : (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Receipt className="w-4 h-4 text-gray-400" />
            <span className="text-xs text-gray-400">Order #{shortId}</span>
          </div>

          <div className="space-y-2 mb-4">
            {sales.map((s, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="text-gray-800">
                  {s.name}
                  <span className="text-gray-400 ml-1">×{s.quantity}</span>
                </span>
                <span className="font-medium text-gray-900">
                  ₱{(s.price * s.quantity).toLocaleString()}
                </span>
              </div>
            ))}
          </div>

          {notes && (
            <div className="border-t border-gray-100 pt-3 pb-1">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Note</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{notes}</p>
            </div>
          )}

          <div className="border-t border-gray-200 pt-3 flex items-center justify-between">
            <span className="font-semibold text-gray-700">Total</span>
            <span className="text-xl font-bold text-gray-900">
              ₱{total.toLocaleString()}
            </span>
          </div>

          <button
            onClick={onClose}
            className="mt-6 w-full py-2.5 rounded-xl border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      )}
    </Modal>
  );
}
