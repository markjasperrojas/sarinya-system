import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { getActivityLogs, getUserActivityReport } from "../services/activityLogService";
import { getUsers } from "../services/userService";
import TableSkeleton from "../components/TableSkeleton";
import Button from "../components/Button";
import {
  ClipboardList,
  Search,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  X,
  BarChart2,
} from "lucide-react";

const actionColors = {
  add: "bg-green-100 text-green-800",
  edit: "bg-blue-100 text-blue-800",
  delete: "bg-red-100 text-red-800",
  sell: "bg-amber-100 text-amber-800",
  pull_out: "bg-orange-100 text-orange-800",
  login: "bg-indigo-100 text-indigo-800",
  logout: "bg-gray-100 text-gray-800",
  activate: "bg-emerald-100 text-emerald-800",
  deactivate: "bg-orange-100 text-orange-800",
};

const moduleColors = {
  inventory: "bg-purple-100 text-purple-800",
  sales: "bg-cyan-100 text-cyan-800",
  users: "bg-pink-100 text-pink-800",
  auth: "bg-slate-100 text-slate-800",
};

export default function ActivityLogsPage() {
  const [activeTab, setActiveTab] = useState("logs");

  // Logs tab state
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
  });
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("");
  const [selectedDate, setSelectedDate] = useState("");

  // Report tab state
  const [users, setUsers] = useState([]);
  const [reportUserId, setReportUserId] = useState("");
  const [reportStartDate, setReportStartDate] = useState("");
  const [reportEndDate, setReportEndDate] = useState("");
  const [reportData, setReportData] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState("");

  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  useEffect(() => {
    if (!isAdmin()) {
      navigate("/dashboard");
      return;
    }
  }, [isAdmin, navigate]);

  // Load users when switching to report tab
  useEffect(() => {
    if (activeTab === "report" && users.length === 0) {
      getUsers().then(setUsers).catch(console.error);
    }
  }, [activeTab, users.length]);

  const loadLogs = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const params = { page, limit: 20 };
        if (search) params.search = search;
        if (moduleFilter) params.module = moduleFilter;
        if (selectedDate) {
          params.startDate = selectedDate;
          params.endDate = selectedDate;
        }

        const data = await getActivityLogs(params);
        setLogs(data.logs);
        setPagination(data.pagination);
      } catch (error) {
        console.error("Failed to load activity logs:", error);
      } finally {
        setLoading(false);
      }
    },
    [search, moduleFilter, selectedDate]
  );

  useEffect(() => {
    loadLogs(1);
  }, [loadLogs]);

  const clearFilters = () => {
    setSearch("");
    setModuleFilter("");
    setSelectedDate("");
  };

  const hasFilters = search || moduleFilter || selectedDate;

  const handleGenerateReport = async () => {
    if (!reportUserId) {
      setReportError("Please select a user.");
      return;
    }
    setReportError("");
    setReportLoading(true);
    try {
      const params = { userId: reportUserId };
      if (reportStartDate) params.startDate = reportStartDate;
      if (reportEndDate) params.endDate = reportEndDate;
      const data = await getUserActivityReport(params);
      setReportData(data);
    } catch (error) {
      console.error("Failed to generate report:", error);
      setReportError("Failed to generate report. Please try again.");
    } finally {
      setReportLoading(false);
    }
  };

  return (
    <>
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl flex items-center justify-center">
                <ClipboardList className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Activity Logs
                </h1>
                {activeTab === "logs" && (
                  <p className="text-xs text-gray-500 hidden sm:block">
                    {pagination.total} total entries
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-8">
        {/* Tab Bar */}
        <div className="flex gap-2 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab("logs")}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "logs"
                ? "border-purple-600 text-purple-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            Logs
          </button>
          <button
            onClick={() => setActiveTab("report")}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "report"
                ? "border-purple-600 text-purple-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <BarChart2 className="w-4 h-4" />
            User Activity Report
          </button>
        </div>

        {activeTab === "logs" && (
          <>
            {/* Filters Card */}
            <div className="card p-4 sm:p-6 mb-6 animate-fade-in sticky top-16 z-10">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search descriptions..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:border-primary-500 focus:ring-4 focus:ring-primary-100 focus:outline-none transition-all"
                  />
                  {search && (
                    <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Module Filter */}
                <select
                  value={moduleFilter}
                  onChange={(e) => setModuleFilter(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:border-primary-500 focus:ring-4 focus:ring-primary-100 focus:outline-none transition-all"
                >
                  <option value="">All Modules</option>
                  <option value="inventory">Stocks</option>
                  <option value="sales">Sales</option>
                  <option value="users">Users</option>
                  <option value="auth">Auth</option>
                </select>

                {/* Date Filter */}
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:border-primary-500 focus:ring-4 focus:ring-primary-100 focus:outline-none transition-all"
                />
              </div>

              {hasFilters && (
                <div className="mt-4 flex justify-end">
                  <Button variant="outline" size="small" icon={X} onClick={clearFilters}>
                    Clear Filters
                  </Button>
                </div>
              )}
            </div>

            {/* Table Card */}
            <div className="card overflow-hidden animate-slide-up">
              {loading ? (
                <div className="p-6">
                  <TableSkeleton rows={8} columns={5} />
                </div>
              ) : (
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600 uppercase tracking-wider">
                          Date/Time
                        </th>
                        <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600 uppercase tracking-wider">
                          User
                        </th>
                        <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600 uppercase tracking-wider">
                          Action
                        </th>
                        <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600 uppercase tracking-wider">
                          Module
                        </th>
                        <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600 uppercase tracking-wider">
                          Description
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {logs.map((log) => (
                        <tr
                          key={log._id}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                            {new Date(log.createdAt).toLocaleString()}
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-medium text-gray-900">
                              {log.userId?.username}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                                actionColors[log.action] || "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {log.action.replace(/_/g, " ")}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                                moduleColors[log.module] || "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {log.module}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">
                            {log.description}
                          </td>
                        </tr>
                      ))}

                      {logs.length === 0 && !loading && (
                        <tr>
                          <td colSpan="5" className="px-6 py-12 text-center">
                            <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500 font-medium">
                              {hasFilters
                                ? "No logs match your filters"
                                : "No activity logs yet"}
                            </p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
                  <p className="text-sm text-gray-500">
                    Page {pagination.page} of {pagination.totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="small"
                      icon={ChevronLeft}
                      onClick={() => loadLogs(pagination.page - 1)}
                      disabled={pagination.page <= 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="small"
                      onClick={() => loadLogs(pagination.page + 1)}
                      disabled={pagination.page >= pagination.totalPages}
                    >
                      Next
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === "report" && (
          <>
            {/* Filter Bar */}
            <div className="card p-4 sm:p-6 mb-6 animate-fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <select
                  value={reportUserId}
                  onChange={(e) => {
                    setReportUserId(e.target.value);
                    setReportError("");
                  }}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:border-primary-500 focus:ring-4 focus:ring-primary-100 focus:outline-none transition-all"
                >
                  <option value="">Select a user...</option>
                  {users.map((u) => (
                    <option key={u._id} value={u._id}>
                      {u.username} ({u.role})
                    </option>
                  ))}
                </select>
                <input
                  type="date"
                  value={reportStartDate}
                  onChange={(e) => setReportStartDate(e.target.value)}
                  placeholder="Start date"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:border-primary-500 focus:ring-4 focus:ring-primary-100 focus:outline-none transition-all"
                />
                <input
                  type="date"
                  value={reportEndDate}
                  onChange={(e) => setReportEndDate(e.target.value)}
                  placeholder="End date"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:border-primary-500 focus:ring-4 focus:ring-primary-100 focus:outline-none transition-all"
                />
              </div>
              {reportError && (
                <p className="mt-2 text-sm text-red-600">{reportError}</p>
              )}
              <div className="mt-4 flex justify-end">
                <Button onClick={handleGenerateReport} disabled={reportLoading}>
                  {reportLoading ? "Generating..." : "Generate Report"}
                </Button>
              </div>
            </div>

            {reportLoading ? (
              <div className="card p-6">
                <TableSkeleton rows={5} columns={2} />
              </div>
            ) : reportData ? (
              <>
                {/* Summary Header */}
                <div className="card p-4 sm:p-6 mb-6 bg-purple-50 border border-purple-100">
                  <p className="text-sm text-gray-600">
                    Reporting on:{" "}
                    <span className="font-semibold text-gray-900">
                      {reportData.user?.username}
                    </span>{" "}
                    <span className="capitalize text-gray-500">
                      ({reportData.user?.role})
                    </span>
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    Total actions:{" "}
                    <span className="font-semibold text-gray-900">
                      {reportData.totalActions}
                    </span>
                    {(reportStartDate || reportEndDate) && (
                      <span className="text-gray-500">
                        {" "}
                        &bull; Period:{" "}
                        {reportStartDate || "—"} – {reportEndDate || "—"}
                      </span>
                    )}
                  </p>
                </div>

                {/* Breakdown Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* By Action */}
                  <div className="card overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                      <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wider">
                        By Action
                      </h3>
                    </div>
                    <div className="divide-y divide-gray-100">
                      {reportData.byAction.length === 0 ? (
                        <p className="px-6 py-8 text-center text-sm text-gray-400">No data</p>
                      ) : (
                        reportData.byAction.map((row) => (
                          <div key={row._id} className="flex items-center justify-between px-6 py-3">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                                actionColors[row._id] || "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {row._id.replace(/_/g, " ")}
                            </span>
                            <span className="text-sm font-semibold text-gray-900">
                              {row.count}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* By Module */}
                  <div className="card overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                      <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wider">
                        By Module
                      </h3>
                    </div>
                    <div className="divide-y divide-gray-100">
                      {reportData.byModule.length === 0 ? (
                        <p className="px-6 py-8 text-center text-sm text-gray-400">No data</p>
                      ) : (
                        reportData.byModule.map((row) => (
                          <div key={row._id} className="flex items-center justify-between px-6 py-3">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                                moduleColors[row._id] || "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {row._id}
                            </span>
                            <span className="text-sm font-semibold text-gray-900">
                              {row.count}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-24 text-gray-400">
                <BarChart2 className="w-12 h-12 mb-3" />
                <p className="text-sm font-medium">Select a user and click Generate Report</p>
              </div>
            )}
          </>
        )}

        {/* Back Link */}
        <Link
          to="/admin"
          className="inline-flex items-center gap-2 mt-6 text-primary-600 hover:text-primary-700 font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Admin Dashboard
        </Link>
      </main>
    </>
  );
}
