// components/CitationBadge.js
export default function CitationBadge({ citation, index }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <span
      onClick={() => setExpanded(!expanded)}
      className="inline-flex items-center gap-1 cursor-pointer ml-1"
    >
      <span className="bg-amu-green/10 text-amu-green text-xs px-1.5 py-0.5 rounded border border-amu-green/30 hover:bg-amu-green/20 transition font-mono">
        [{index + 1}]
      </span>
      {expanded && (
        <span className="ml-1 bg-white border border-gray-200 rounded px-2 py-1 text-xs text-gray-600 shadow-md max-w-xs">
          📄 {citation.source}: "{citation.text}"
        </span>
      )}
    </span>
  );
}

// Need useState import
import { useState } from 'react';
