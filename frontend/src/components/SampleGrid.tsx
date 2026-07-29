"use client";

import React, { useRef, useMemo, useState } from "react";
import { AgGridReact } from "ag-grid-react";
import { ColDef, GridReadyEvent, CellKeyDownEvent } from "ag-grid-community";
import { Plus, Trash2, CheckCircle, Info } from "lucide-react";
import { Sample } from "@/utils/api";

interface SampleGridProps {
  rowData: any[];
  setRowData: React.Dispatch<React.SetStateAction<any[]>>;
  validationErrors?: any[];
  defaultMacNo?: string;
  defaultContactPerson?: string;
}

export default function SampleGrid({ rowData, setRowData, validationErrors = [], defaultMacNo = "", defaultContactPerson = "Sheila" }: SampleGridProps) {
  const gridRef = useRef<AgGridReact | null>(null);

  // Material dropdown options
  const materials = [
    "BROILER",
    "PIG",
    "FISH",
    "RUMINANT",
    "PET",
    "SOYBEAN_MEAL",
    "CORN",
    "WHEAT",
    "PREMIX",
    "RAW_MATERIAL",
    "OTHER"
  ];

  // Custom keydown handler for Copy-Paste support in AG Grid Community
  const onCellKeyDown = (event: CellKeyDownEvent) => {
    const e = event.event as KeyboardEvent;
    
    // Check for Ctrl+V or Cmd+V
    if ((e.ctrlKey || e.metaKey) && e.key === "v") {
      navigator.clipboard.readText().then((text) => {
        if (!text) return;
        
        // Parse tab-separated values (Excel/Google Sheets copy format)
        const rows = text.split(/\r?\n/).filter(line => line.trim().length > 0);
        const newSamples = rows.map((rowText) => {
          const cells = rowText.split("\t");
          
          // Map helper to parse boolean cells
          const parseBool = (val: string) => {
            if (!val) return false;
            const normalized = val.trim().toLowerCase();
            return ["true", "1", "yes", "x", "y", "t", "checked"].includes(normalized);
          };

          return {
            mac_no: cells[0] || defaultMacNo || "",
            customer_name: cells[1] || "",
            material_code: (cells[2] || "OTHER").trim().toUpperCase(),
            sample_description: cells[3] || "",
            test_total_aa: parseBool(cells[4]),
            test_supp_aa: parseBool(cells[5]),
            test_nir: parseBool(cells[6]),
            test_trp: parseBool(cells[7]),
            test_gaa: parseBool(cells[8]),
            test_tdf: parseBool(cells[9]),
            contact_person: cells[10] || defaultContactPerson || "Sheila"
          };
        });

        // Insert new samples
        setRowData((prev) => [...prev, ...newSamples]);
      }).catch(err => {
        console.error("Failed to read clipboard: ", err);
      });
    }
  };

  const columnDefs = useMemo<ColDef[]>(() => [
    {
      headerCheckboxSelection: true,
      checkboxSelection: true,
      width: 50,
      pinned: "left",
      resizable: false
    },
    {
      headerName: "#",
      valueGetter: "node.rowIndex + 1",
      width: 60,
      pinned: "left",
      cellClass: "text-slate-500 font-semibold text-center"
    },
    {
      headerName: "Mac. no",
      field: "mac_no",
      editable: true,
      flex: 1.2,
      cellClass: "font-semibold text-slate-800"
    },
    {
      headerName: "Customer ID",
      field: "customer_name",
      editable: true,
      flex: 1.5,
      cellClass: "font-medium"
    },
    {
      headerName: "Material Code",
      field: "material_code",
      editable: true,
      cellEditor: "agSelectCellEditor",
      cellEditorParams: {
        values: materials
      },
      flex: 1.2
    },
    {
      headerName: "Sample Description",
      field: "sample_description",
      editable: true,
      flex: 2
    },
    {
      headerName: "Total AA",
      field: "test_total_aa",
      editable: true,
      cellRenderer: "agCheckboxCellRenderer",
      cellEditor: "agCheckboxCellEditor",
      width: 100,
      cellClass: "flex items-center justify-center"
    },
    {
      headerName: "Supp AA",
      field: "test_supp_aa",
      editable: true,
      cellRenderer: "agCheckboxCellRenderer",
      cellEditor: "agCheckboxCellEditor",
      width: 100,
      cellClass: "flex items-center justify-center"
    },
    {
      headerName: "NIR",
      field: "test_nir",
      editable: true,
      cellRenderer: "agCheckboxCellRenderer",
      cellEditor: "agCheckboxCellEditor",
      width: 80,
      cellClass: "flex items-center justify-center"
    },
    {
      headerName: "Trp",
      field: "test_trp",
      editable: true,
      cellRenderer: "agCheckboxCellRenderer",
      cellEditor: "agCheckboxCellEditor",
      width: 80,
      cellClass: "flex items-center justify-center"
    },
    {
      headerName: "GAA",
      field: "test_gaa",
      editable: true,
      cellRenderer: "agCheckboxCellRenderer",
      cellEditor: "agCheckboxCellEditor",
      width: 80,
      cellClass: "flex items-center justify-center"
    },
    {
      headerName: "TDF",
      field: "test_tdf",
      editable: true,
      cellRenderer: "agCheckboxCellRenderer",
      cellEditor: "agCheckboxCellEditor",
      width: 80,
      cellClass: "flex items-center justify-center"
    },
    {
      headerName: "Contact Person",
      field: "contact_person",
      editable: true,
      flex: 1.4,
      cellClass: "font-medium text-brand-600"
    }
  ], []);

  const defaultColDef = useMemo(() => ({
    sortable: true,
    filter: true,
    resizable: true,
    suppressKeyboardEvent: (params: any) => {
      // Allow Ctrl+V to pass through to grid cells
      const e = params.event as KeyboardEvent;
      return (e.ctrlKey || e.metaKey) && e.key === "v";
    }
  }), []);

  const addRow = () => {
    // Find last row values to prefill for efficiency
    const lastRow = rowData.length > 0 ? rowData[rowData.length - 1] : null;
    const newRow = {
      mac_no: lastRow?.mac_no || defaultMacNo || "",
      customer_name: lastRow?.customer_name || "",
      material_code: "BROILER",
      sample_description: "",
      test_total_aa: false,
      test_supp_aa: false,
      test_nir: false,
      test_trp: false,
      test_gaa: false,
      test_tdf: false,
      contact_person: lastRow?.contact_person || defaultContactPerson || "Sheila"
    };
    setRowData((prev) => [...prev, newRow]);
  };

  const deleteSelected = () => {
    const selectedNodes = gridRef.current?.api.getSelectedNodes();
    if (!selectedNodes || selectedNodes.length === 0) return;

    const selectedIndices = selectedNodes.map(node => node.rowIndex);
    setRowData((prev) => prev.filter((_, idx) => !selectedIndices.includes(idx)));
    gridRef.current?.api.deselectAll();
  };

  const onCellValueChanged = () => {
    // Collect raw row data from grid to update state
    const items: any[] = [];
    gridRef.current?.api.forEachNode(node => {
      items.push(node.data);
    });
    setRowData(items);
  };

  return (
    <div className="w-full flex flex-col gap-3">
      <div className="flex items-center justify-between border-b border-white/5 pb-3">
        <div className="flex items-center gap-2">
          <h2 className="text-md font-bold text-slate-200 tracking-tight font-outfit">Intake Batch Worksheet</h2>
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-white/5 border border-white/10 text-slate-400">
            {rowData.length} sample{rowData.length !== 1 && 's'}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="text-[10px] text-slate-500 font-semibold flex items-center gap-1.5 mr-2">
            <Info className="w-3.5 h-3.5" /> Ctrl+V to paste spreadsheet rows
          </div>
          <button
            onClick={addRow}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-brand-500/10 hover:bg-brand-500/20 text-brand-300 border border-brand-500/30 text-xs font-bold transition-all"
          >
            <Plus className="w-3.5 h-3.5" /> Add Row
          </button>
          <button
            onClick={deleteSelected}
            disabled={rowData.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 disabled:opacity-40 disabled:hover:bg-red-500/10 text-red-400 border border-red-500/20 text-xs font-bold transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" /> Delete Selected
          </button>
        </div>
      </div>

      {/* Grid container */}
      <div className="w-full height-container h-[420px]">
        <div className="ag-theme-quartz-dark w-full h-full">
          <AgGridReact
            ref={gridRef}
            rowData={rowData}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            rowSelection="multiple"
            suppressRowClickSelection={true}
            onCellKeyDown={onCellKeyDown}
            onCellValueChanged={onCellValueChanged}
          />
        </div>
      </div>

      {/* Local validation warning banner */}
      {validationErrors.length > 0 && (
        <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5 flex flex-col gap-2 mt-2">
          <h4 className="text-xs font-bold text-red-400 flex items-center gap-1.5">
            Validation Errors Detected: Please fix highlighting before submitting
          </h4>
          <ul className="text-[11px] text-slate-400 list-disc list-inside space-y-1">
            {validationErrors.map((err, i) => (
              <li key={i}>
                Row #{err.row_index + 1} ({err.description || 'No description'}): {err.errors.join(", ")}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
