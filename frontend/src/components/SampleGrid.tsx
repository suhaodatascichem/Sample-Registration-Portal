// Custom Header Component for Checkbox columns (Check All / Uncheck All)
const CheckboxHeader = (props: any) => {
  const { displayName, field, rowData, setRowData } = props;

  const allChecked = useMemo(() => {
    if (!rowData || rowData.length === 0) return false;
    return rowData.every((r: any) => !!r[field]);
  }, [rowData, field]);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextVal = !allChecked;
    setRowData((prev: any[]) => prev.map((row) => ({ ...row, [field]: nextVal })));
  };

  return (
    <div 
      onClick={handleToggle}
      className="flex items-center justify-center gap-1.5 cursor-pointer select-none font-bold text-slate-200 hover:text-white transition-colors w-full h-full"
      title={`Click to check or uncheck all rows for ${displayName}`}
    >
      <input
        type="checkbox"
        checked={allChecked}
        onChange={() => {}} // Handled by outer div click
        className="w-3.5 h-3.5 rounded accent-brand-500 cursor-pointer"
      />
      <span className="text-xs">{displayName}</span>
    </div>
  );
};

// Custom Header Component for String/Dropdown columns (Fill Down Copying Row 1)
const StringHeader = (props: any) => {
  const { displayName, field, rowData, setRowData } = props;

  const handleFillDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!rowData || rowData.length === 0) return;
    const topValue = rowData[0][field];
    if (topValue === undefined) return;
    setRowData((prev: any[]) => prev.map((row) => ({ ...row, [field]: topValue })));
  };

  return (
    <div className="flex items-center justify-between w-full font-bold select-none text-slate-200 group gap-1">
      <span className="text-xs truncate">{displayName}</span>
      {rowData && rowData.length > 0 && (
        <button
          onClick={handleFillDown}
          className="px-1.5 py-0.5 rounded bg-brand-500/20 hover:bg-brand-500/50 text-brand-300 hover:text-white text-[10px] font-bold border border-brand-500/30 flex items-center gap-0.5 transition-all opacity-80 group-hover:opacity-100 flex-shrink-0"
          title={`Fill Down: Copy row 1's "${rowData[0]?.[field] || ''}" to all rows below`}
        >
          <span>Fill Down ⬇</span>
        </button>
      )}
    </div>
  );
};

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
      headerComponent: StringHeader,
      headerComponentParams: { displayName: "Mac. no", field: "mac_no", rowData, setRowData },
      field: "mac_no",
      editable: true,
      flex: 1.2,
      cellClass: "font-semibold text-slate-800"
    },
    {
      headerComponent: StringHeader,
      headerComponentParams: { displayName: "Customer ID", field: "customer_name", rowData, setRowData },
      field: "customer_name",
      editable: true,
      flex: 1.5,
      cellClass: "font-medium"
    },
    {
      headerComponent: StringHeader,
      headerComponentParams: { displayName: "Material Code", field: "material_code", rowData, setRowData },
      field: "material_code",
      editable: true,
      cellEditor: "agSelectCellEditor",
      cellEditorParams: {
        values: materials
      },
      flex: 1.2
    },
    {
      headerComponent: StringHeader,
      headerComponentParams: { displayName: "Sample Description", field: "sample_description", rowData, setRowData },
      field: "sample_description",
      editable: true,
      flex: 2
    },
    {
      headerComponent: CheckboxHeader,
      headerComponentParams: { displayName: "Total AA", field: "test_total_aa", rowData, setRowData },
      field: "test_total_aa",
      editable: true,
      cellRenderer: "agCheckboxCellRenderer",
      cellEditor: "agCheckboxCellEditor",
      width: 115,
      cellClass: "flex items-center justify-center"
    },
    {
      headerComponent: CheckboxHeader,
      headerComponentParams: { displayName: "Supp AA", field: "test_supp_aa", rowData, setRowData },
      field: "test_supp_aa",
      editable: true,
      cellRenderer: "agCheckboxCellRenderer",
      cellEditor: "agCheckboxCellEditor",
      width: 115,
      cellClass: "flex items-center justify-center"
    },
    {
      headerComponent: CheckboxHeader,
      headerComponentParams: { displayName: "NIR", field: "test_nir", rowData, setRowData },
      field: "test_nir",
      editable: true,
      cellRenderer: "agCheckboxCellRenderer",
      cellEditor: "agCheckboxCellEditor",
      width: 95,
      cellClass: "flex items-center justify-center"
    },
    {
      headerComponent: CheckboxHeader,
      headerComponentParams: { displayName: "Trp", field: "test_trp", rowData, setRowData },
      field: "test_trp",
      editable: true,
      cellRenderer: "agCheckboxCellRenderer",
      cellEditor: "agCheckboxCellEditor",
      width: 95,
      cellClass: "flex items-center justify-center"
    },
    {
      headerComponent: CheckboxHeader,
      headerComponentParams: { displayName: "GAA", field: "test_gaa", rowData, setRowData },
      field: "test_gaa",
      editable: true,
      cellRenderer: "agCheckboxCellRenderer",
      cellEditor: "agCheckboxCellEditor",
      width: 95,
      cellClass: "flex items-center justify-center"
    },
    {
      headerComponent: CheckboxHeader,
      headerComponentParams: { displayName: "TDF", field: "test_tdf", rowData, setRowData },
      field: "test_tdf",
      editable: true,
      cellRenderer: "agCheckboxCellRenderer",
      cellEditor: "agCheckboxCellEditor",
      width: 95,
      cellClass: "flex items-center justify-center"
    },
    {
      headerComponent: StringHeader,
      headerComponentParams: { displayName: "Contact Person", field: "contact_person", rowData, setRowData },
      field: "contact_person",
      editable: true,
      flex: 1.4,
      cellClass: "font-medium text-brand-600"
    }
  ], [rowData, setRowData]);

  const defaultColDef = useMemo(() => ({
    sortable: true,
    filter: false,
    resizable: true,
    suppressMenu: true,
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
