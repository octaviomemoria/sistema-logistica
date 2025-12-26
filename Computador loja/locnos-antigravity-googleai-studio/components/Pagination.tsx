import React from 'react';
import { ChevronLeft, ChevronRight } from './Icons';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    totalCount: number;
    itemsPerPage: number;
}

const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange, totalCount, itemsPerPage }) => {
    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalCount);

    if (totalCount === 0) return null;

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6">
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                    <p className="text-sm text-gray-700">
                        Mostrando <span className="font-medium">{startItem}</span> a <span className="font-medium">{endItem}</span> de{' '}
                        <span className="font-medium">{totalCount}</span> resultados
                    </p>
                </div>
                <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                        <button
                            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                            disabled={currentPage === 1}
                            className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
                        >
                            <span className="sr-only">Anterior</span>
                            <ChevronLeft className="h-5 w-5" />
                        </button>

                        {/* Simple page numbers logic - can be improved for many pages */}
                        {[...Array(totalPages)].map((_, i) => {
                            const p = i + 1;
                            // Show first, last, current, and adjacent pages
                            if (p === 1 || p === totalPages || (p >= currentPage - 1 && p <= currentPage + 1)) {
                                return (
                                    <button
                                        key={p}
                                        onClick={() => onPageChange(p)}
                                        aria-current={currentPage === p ? 'page' : undefined}
                                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${currentPage === p
                                                ? 'z-10 bg-primary border-primary text-white'
                                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                            }`}
                                    >
                                        {p}
                                    </button>
                                );
                            } else if (p === currentPage - 2 || p === currentPage + 2) {
                                return <span key={p} className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">...</span>;
                            }
                            return null;
                        })}

                        <button
                            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                            disabled={currentPage === totalPages}
                            className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
                        >
                            <span className="sr-only">Próxima</span>
                            <ChevronRight className="h-5 w-5" />
                        </button>
                    </nav>
                </div>
            </div>
            {/* Mobile View */}
            <div className="flex items-center justify-between sm:hidden w-full">
                <button
                    onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:opacity-50"
                >
                    Anterior
                </button>
                <div className="text-sm text-gray-700">
                    Pág. {currentPage} de {totalPages}
                </div>
                <button
                    onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:opacity-50"
                >
                    Próxima
                </button>
            </div>
        </div>
    );
};

export default Pagination;
