import React from 'react';
import { SortAscIcon, SortDescIcon } from './Icons';

interface SortableHeaderProps<T extends string> {
    label: string;
    sortKey: T;
    requestSort: (key: T) => void;
    sortConfig: { key: string; direction: 'ascending' | 'descending' } | null;
}

const SortableHeader = <T extends string>({ label, sortKey, requestSort, sortConfig }: SortableHeaderProps<T>): React.ReactElement => {
    const isSorted = sortConfig && sortConfig.key === sortKey;
    return (
        <button className="flex items-center gap-1 group" onClick={() => requestSort(sortKey)}>
        {label}
        <span className="opacity-0 group-hover:opacity-100 transition-opacity">
            {isSorted && sortConfig.direction === 'ascending' ? <SortAscIcon className="w-4 h-4 text-primary" /> : <SortDescIcon className="w-4 h-4 text-primary" />}
            {!isSorted && <SortDescIcon className="w-4 h-4 text-gray-400" />}
        </span>
        </button>
    );
};

export default SortableHeader;
