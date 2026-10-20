import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  Download,
  Upload,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { DashboardContextType } from '../components/layout/DashboardLayout';
import { csvApi } from '../services/api';
import { CSVImportPreviewResponse } from '../types';
import { Button } from '../components/common/Button';
import { useToast } from '../context/ToastContext';

export const ImportExportPage: React.FC = () => {
  const { triggerRefresh } = useOutletContext<DashboardContextType>();
  const { showToast } = useToast();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [previewData, setPreviewData] = useState<CSVImportPreviewResponse | null>(null);
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [isImporting, setIsImporting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.name.endsWith('.csv')) {
        showToast('Please select a valid .csv file.', 'error');
        return;
      }
      setSelectedFile(file);
      setPreviewData(null);
    }
  };

  const handleUploadAndPreview = async () => {
    if (!selectedFile) return;

    try {
      setIsPreviewing(true);
      const preview = await csvApi.preview(selectedFile);
      setPreviewData(preview);
      showToast(
        `Validated ${preview.total_rows} rows: ${preview.valid_rows} valid, ${preview.duplicate_rows} duplicates, ${preview.error_rows} errors.`,
        preview.error_rows > 0 ? 'warning' : 'info'
      );
    } catch (err: any) {
      showToast(err?.response?.data?.detail || 'Failed to preview CSV.', 'error');
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleExecuteImport = async () => {
    if (!previewData || previewData.rows.length === 0) return;

    try {
      setIsImporting(true);
      const res = await csvApi.import(previewData.rows, skipDuplicates);
      showToast(
        `Import complete: ${res.imported_count} imported, ${res.skipped_duplicates_count} duplicates skipped, ${res.failed_count} failed.`,
        res.failed_count > 0 ? 'warning' : 'success'
      );
      setPreviewData(null);
      setSelectedFile(null);
      triggerRefresh();
    } catch (err: any) {
      showToast(err?.response?.data?.detail || 'Failed to import CSV records.', 'error');
    } finally {
      setIsImporting(false);
    }
  };

  const downloadSampleTemplate = () => {
    const sampleCsv =
      "Date,Amount,Type,Category,Description,Payment Method,Notes\n" +
      "2026-10-15,120.50,expense,Groceries,Weekly grocery run,debit_card,Fresh vegetables\n" +
      "2026-10-01,4800.00,income,Salary & Wages,Monthly Software Engineering Salary,bank_transfer,Main paycheck\n" +
      "2026-10-05,45.00,expense,Dining & Cafes,Dinner at Italian Trattoria,credit_card,Dining with team\n" +
      "2026-10-08,85.00,expense,Utilities & Bills,Fiber Internet Monthly Bill,credit_card,Home office\n";

    const blob = new Blob([sampleCsv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'spendwise_sample_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          CSV Import & Export
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
          Bulk import financial records with automated duplicate detection, or backup your history to CSV
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Export Card */}
        <div className="glass-card p-6 flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mb-4">
              <Download className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white tracking-tight">Export Ledger Data</h3>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              Export all recorded transactions into an RFC-4180 compliant CSV spreadsheet compatible with Excel, Google Sheets, or tax preparation software.
            </p>

            <div className="mt-4 p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 text-xs text-slate-400 space-y-1">
              <div className="flex items-center gap-2 text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Exports all dates, amounts, categories, and payment notes</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Respects your active currency settings</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-500">Format: Standard CSV</span>
            <a
              href="/api/csv/export"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center font-semibold rounded-xl text-xs px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/25 transition-all"
            >
              <Download className="w-4 h-4 mr-1.5" />
              Download All Transactions (.CSV)
            </a>
          </div>
        </div>

        {/* Import Card */}
        <div className="glass-card p-6 flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center mb-4">
              <Upload className="w-5 h-5" />
            </div>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white tracking-tight">Import Transactions</h3>
              <button
                type="button"
                onClick={downloadSampleTemplate}
                className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Sample CSV Template</span>
              </button>
            </div>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              Upload bank or credit card exports. SpendWise will validate headers and automatically flag duplicate transactions.
            </p>

            {/* File Dropzone / Picker */}
            <div className="mt-4 border-2 border-dashed border-slate-800 hover:border-slate-700 rounded-2xl p-6 text-center bg-slate-950/40 transition-colors">
              <input
                type="file"
                accept=".csv"
                id="csv_file_input"
                onChange={handleFileChange}
                className="hidden"
              />
              <label
                htmlFor="csv_file_input"
                className="cursor-pointer flex flex-col items-center justify-center"
              >
                <FileSpreadsheet className="w-8 h-8 text-slate-500 mb-2" />
                <span className="text-xs font-semibold text-white">
                  {selectedFile ? selectedFile.name : 'Click to select CSV file'}
                </span>
                <span className="text-[11px] text-slate-500 mt-1">
                  Supports UTF-8 or Latin-1 CSV files up to 5MB
                </span>
              </label>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-end">
            <Button
              variant="primary"
              size="sm"
              disabled={!selectedFile}
              isLoading={isPreviewing}
              onClick={handleUploadAndPreview}
              leftIcon={<Upload className="w-4 h-4" />}
            >
              Analyze & Preview CSV
            </Button>
          </div>
        </div>
      </div>

      {/* Preview Section */}
      {previewData && (
        <div className="glass-card p-6 space-y-4 animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Import Preview & Duplicate Diagnosis
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Review scanned rows before committing them to your database
              </p>
            </div>

            {/* Stats chips */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-300">
                Total: {previewData.total_rows}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                Valid: {previewData.valid_rows}
              </span>
              {previewData.duplicate_rows > 0 && (
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  Duplicates: {previewData.duplicate_rows}
                </span>
              )}
              {previewData.error_rows > 0 && (
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30">
                  Errors: {previewData.error_rows}
                </span>
              )}
            </div>
          </div>

          {/* Options & Action */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-950/80 border border-slate-800">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="skip_dups"
                checked={skipDuplicates}
                onChange={(e) => setSkipDuplicates(e.target.checked)}
                className="rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-emerald-500"
              />
              <label htmlFor="skip_dups" className="text-xs text-slate-300 cursor-pointer select-none">
                Automatically skip duplicate transactions (same date, amount, description)
              </label>
            </div>

            <Button
              variant="primary"
              size="md"
              isLoading={isImporting}
              onClick={handleExecuteImport}
              leftIcon={<CheckCircle2 className="w-4 h-4" />}
            >
              Confirm Import ({skipDuplicates ? previewData.valid_rows : previewData.valid_rows + previewData.duplicate_rows} Rows)
            </Button>
          </div>

          {/* Preview Table */}
          <div className="overflow-x-auto max-h-[400px] overflow-y-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 bg-slate-900 border-b border-slate-800 z-10 text-[11px] font-semibold uppercase text-slate-400">
                <tr>
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Description</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-950/40">
                {previewData.rows.map((row) => (
                  <tr
                    key={row.row_number}
                    className={`hover:bg-slate-900/60 ${
                      row.validation_error
                        ? 'bg-rose-950/20'
                        : row.is_duplicate
                        ? 'bg-amber-950/20'
                        : ''
                    }`}
                  >
                    <td className="py-2.5 px-3 text-slate-500 font-mono text-[10px]">
                      {row.row_number}
                    </td>
                    <td className="py-2.5 px-3">
                      {row.validation_error ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-rose-400 font-medium">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>Error: {row.validation_error}</span>
                        </span>
                      ) : row.is_duplicate ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-amber-400 font-medium">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          <span>Duplicate</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                          <span>Ready</span>
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-slate-300 font-mono">{row.date}</td>
                    <td className="py-2.5 px-3 text-white font-medium">{row.description}</td>
                    <td className="py-2.5 px-3 text-slate-400">{row.category}</td>
                    <td className="py-2.5 px-3 capitalize text-slate-400">{row.type}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-semibold text-white">
                      ${row.amount.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
