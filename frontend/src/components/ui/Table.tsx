import React from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

interface Column {
  key: string;
  label: string;
  render?: (value: any, row: any) => React.ReactNode;
}

interface DataTableProps {
  columns: Column[];
  data: any[];
  isLoading?: boolean;
  pagination?: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
  onPageChange?: (page: number) => void;
}

export default function DataTable({ columns, data, pagination, onPageChange, isLoading }: DataTableProps) {
  return (
    <div className="flex flex-col">
      <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
        <div className="inline-block min-w-full align-middle">
          <div className="overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-[#1B365D]">
                <tr>
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      scope="col"
                      className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider"
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={columns.length} className="px-6 py-10 text-center text-sm text-gray-500">
                      <div className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5 text-[#1B365D]" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Carregando dados...
                      </div>
                    </td>
                  </tr>
                ) : (
                  <>
                    {data.map((row, i) => (
                      <tr key={row.id || i} className="hover:bg-gray-50 transition-colors">
                        {columns.map((col) => (
                          <td key={col.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            {col.render ? col.render(row[col.key], row) : row[col.key]}
                          </td>
                        ))}
                      </tr>
                    ))}
                    {data.length === 0 && (
                      <tr>
                        <td colSpan={columns.length} className="px-6 py-10 text-center text-sm text-gray-500">
                          Nenhum registro encontrado.
                        </td>
                      </tr>
                    )}
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {pagination && pagination.total_pages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 bg-white border border-t-0 border-gray-200 sm:px-6 rounded-b-lg shadow-sm">
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Mostrando <span className="font-medium">{(pagination.page - 1) * pagination.per_page + 1}</span> até <span className="font-medium">{Math.min(pagination.page * pagination.per_page, pagination.total)}</span> de <span className="font-medium">{pagination.total}</span> resultados
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => onPageChange && onPageChange(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  <span className="sr-only">Anterior</span>
                  <FiChevronLeft className="h-5 w-5" aria-hidden="true" />
                </button>
                <button
                  onClick={() => onPageChange && onPageChange(pagination.page + 1)}
                  disabled={pagination.page >= pagination.total_pages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  <span className="sr-only">Próximo</span>
                  <FiChevronRight className="h-5 w-5" aria-hidden="true" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
