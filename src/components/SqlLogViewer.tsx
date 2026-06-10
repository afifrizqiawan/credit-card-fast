import React, { useState, useEffect } from 'react';
import { Terminal, Database, RefreshCw, Layers, CheckCircle2, Copy, Check } from 'lucide-react';
import { SqlLog } from '../../server/db.ts';

interface SqlLogViewerProps {
  logs: SqlLog[];
  onRefresh: () => void;
}

export const SqlLogViewer: React.FC<SqlLogViewerProps> = ({ logs, onRefresh }) => {
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedId(index);
    setTimeout(() => setCopiedId(null), 200);
  };

  return (
    <div className="bg-slate-900 rounded-2xl p-5 text-white shadow-xl border border-slate-800 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-cyan-500/10 rounded-lg border border-cyan-500/30">
            <Terminal className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-wide flex items-center gap-2 text-cyan-200">
              MySQL Relational Log Client
              <span className="text-[10px] bg-cyan-900/40 text-cyan-300 font-mono py-0.5 px-2 rounded border border-cyan-500/10">
                PORT 3306 (simulated)
              </span>
            </h3>
            <p className="text-[10px] text-zinc-400">Log kueri SQL relasional yang dieksekusi oleh microservice backend</p>
          </div>
        </div>

        <button
          onClick={onRefresh}
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors flex items-center gap-1.5 text-xs border border-slate-700"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Database Schema Visualizer Helper */}
      <div className="bg-slate-950/80 rounded-xl p-3 border border-slate-800 text-[11px] space-y-2">
        <div className="flex items-center gap-1.5 text-yellow-400 font-bold mb-1">
          <Database className="w-3.5 h-3.5" />
          <span>Skema Tabel: `applications`</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-zinc-400 font-mono">
          <div><b className="text-zinc-200">id</b>: INT AUTO_INC</div>
          <div><b className="text-zinc-200">nama</b>: VARCHAR(100)</div>
          <div><b className="text-zinc-200">nik</b>: VARCHAR(16) UNI</div>
          <div><b className="text-zinc-200">email</b>: VARCHAR(100)</div>
          <div><b className="text-zinc-200">nomor_hp</b>: VARCHAR(20)</div>
          <div><b className="text-zinc-200">jenis_kartu</b>: VARCHAR(50)</div>
          <div><b className="text-zinc-200">pendapatan</b>: DECIMAL(15,2)</div>
          <div><b className="text-zinc-200">status</b>: ENUM('APP','PEND','REJ')</div>
        </div>
      </div>

      {/* SQL Logs List */}
      <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
        {logs.length === 0 ? (
          <div className="text-center py-8 text-zinc-500 text-xs font-mono">
            Memuat log transaksi MySQL...
          </div>
        ) : (
          logs.map((log, index) => (
            <div key={index} className="bg-slate-950 rounded-xl overflow-hidden border border-slate-800 flex flex-col">
              {/* Log meta */}
              <div className="bg-slate-900/60 px-3 py-1.5 flex justify-between items-center text-[10px] text-zinc-400 font-mono border-b border-slate-950">
                <span className="text-cyan-400/90 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  SUCCESS (affecting {log.rowsAffected} {log.rowsAffected === 1 ? 'row' : 'rows'})
                </span>
                <span className="text-zinc-500">{new Date(log.timestamp).toLocaleTimeString()}</span>
              </div>

              {/* Log Query Code block */}
              <div className="p-3 font-mono text-[11px] leading-relaxed relative group">
                <pre className="text-zinc-100 whitespace-pre-wrap overflow-x-auto select-all">
                  {log.query}
                </pre>
                
                {log.params && log.params !== '[]' && (
                  <div className="mt-2 pt-2 border-t border-slate-900 text-[10px] text-zinc-500">
                    <span className="text-yellow-500/80 font-bold">Params:</span> {log.params}
                  </div>
                )}

                {/* Copy button */}
                <button
                  type="button"
                  id={`btn-copy-sql-${index}`}
                  onClick={() => handleCopy(log.query, index)}
                  className="absolute top-2 right-2 p-1 rounded bg-slate-800 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-slate-700"
                  title="Copy SQL Query"
                >
                  {copiedId === index ? (
                    <Check className="w-3.5 h-3.5 text-green-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="text-[10px] text-zinc-400 flex items-center justify-between pt-1">
        <span className="flex items-center gap-1">
          <Layers className="w-3 h-3 text-emerald-500" />
          Simulasi ACID compliant MySQL
        </span>
        <span className="text-zinc-500 font-mono">Records: {logs.length} Queries run</span>
      </div>
    </div>
  );
};
