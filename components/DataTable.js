// components/DataTable.js
import { useEffect, useState, useMemo } from 'react';

export default function DataTable() {
  const [reports, setReports]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });

  useEffect(() => {
    fetch('/api/compatibility/list')
      .then((res) => {
        if (!res.ok) throw new Error(`Status ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setReports(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError(err);
        setLoading(false);
      });
  }, []);

  // Memoize sorted reports
  const sortedReports = useMemo(() => {
    if (!reports.length) return [];
    const sortable = [...reports];
    const { key, direction } = sortConfig;
    sortable.sort((a, b) => {
      let aVal = a[key], bVal = b[key];
      // for timestamps, compare date objects
      if (key === 'created_at') {
        aVal = new Date(aVal);
        bVal = new Date(bVal);
      }
      if (aVal < bVal) return direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return direction === 'asc' ? 1 : -1;
      return 0;
    });
    return sortable;
  }, [reports, sortConfig]);

  // Helper to toggle sort on click
  const requestSort = (key) => {
    setSortConfig((current) => {
      if (current.key === key) {
        // flip direction
        return { key, direction: current.direction === 'asc' ? 'desc' : 'asc' };
      } else {
        return { key, direction: 'asc' };
      }
    });
  };

  const getArrow = (key) => {
    if (sortConfig.key !== key) return '';
    return sortConfig.direction === 'asc' ? ' ▲' : ' ▼';
  };

  if (loading) return <div className="p-4">Loading reports…</div>;
  if (error)   return <div className="p-4 text-red-500">Error: {error.message}</div>;
  if (!reports.length) return <div className="p-4">No compatibility reports yet.</div>;

  return (
    <div className="overflow-x-auto p-4">
      <table className="min-w-full table-auto border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th
              className="px-3 py-2 border cursor-pointer"
              onClick={() => requestSort('id')}
            >
              ID{getArrow('id')}
            </th>
            <th
              className="px-3 py-2 border cursor-pointer"
              onClick={() => requestSort('user_id')}
            >
              User{getArrow('user_id')}
            </th>
            <th
              className="px-3 py-2 border cursor-pointer"
              onClick={() => requestSort('crankset_id')}
            >
              Crankset{getArrow('crankset_id')}
            </th>
            <th
              className="px-3 py-2 border cursor-pointer"
              onClick={() => requestSort('cassette_id')}
            >
              Cassette{getArrow('cassette_id')}
            </th>
            <th
              className="px-3 py-2 border cursor-pointer"
              onClick={() => requestSort('derailleur_id')}
            >
              Derailleur{getArrow('derailleur_id')}
            </th>
            <th
              className="px-3 py-2 border cursor-pointer text-center"
              onClick={() => requestSort('is_compatible')}
            >
              Compatible?{getArrow('is_compatible')}
            </th>
            <th
              className="px-3 py-2 border cursor-pointer"
              onClick={() => requestSort('created_at')}
            >
              Timestamp{getArrow('created_at')}
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedReports.map((r) => (
            <tr key={r.id} className="hover:bg-gray-50">
              <td className="px-3 py-2 border">{r.id}</td>
              <td className="px-3 py-2 border">{r.user_id}</td>
              <td className="px-3 py-2 border">{r.crankset_id}</td>
              <td className="px-3 py-2 border">{r.cassette_id}</td>
              <td className="px-3 py-2 border">{r.derailleur_id}</td>
              <td className="px-3 py-2 border text-center">
                {r.is_compatible ? '✅' : '❌'}
              </td>
              <td className="px-3 py-2 border">
                {new Date(r.created_at).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
