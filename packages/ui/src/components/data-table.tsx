"use client";

import * as React from "react";
import {
  Checkbox,
  Chip,
  Grid,
  Pagination,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  alpha,
  styled,
} from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";

import { TextField, ToggleButton, ToggleButtonGroup } from "./forms";
import { Card, Paper, Skeleton } from "./data-display";

type DataTableRow = {
  id: number | string;
  [key: string]: React.ReactNode;
};

export type DataTableProps<T extends DataTableRow> = {
  title?: string;
  rows: T[];
  columns: Array<{ key: string; label: string; render?: (row: T) => React.ReactNode }>;
  loading?: boolean;
  pageSize?: number;
  onRowSelect?: (selectedRows: Array<T["id"]>) => void;
};

const StyledTable = styled(Table)(({ theme }) => ({
  borderCollapse: "separate",
  borderSpacing: 0,
  "& .MuiTableCell-root": {
    borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.08)}`,
    padding: "0.85rem 1rem",
  },
  "& .MuiTableHead-root .MuiTableCell-root": {
    backgroundColor: alpha(theme.palette.primary.main, 0.04),
    color: theme.palette.text.primary,
    fontWeight: 700,
  },
}));

export function DataTable<T extends DataTableRow>({
  title,
  rows,
  columns,
  loading = false,
  pageSize = 5,
  onRowSelect,
}: DataTableProps<T>) {
  const [search, setSearch] = React.useState("");
  const [selected, setSelected] = React.useState<Array<T["id"]>>([]);
  const [page, setPage] = React.useState(0);
  const [view, setView] = React.useState<"table" | "grid">("table");

  const filteredRows = React.useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return rows;
    return rows.filter((row) =>
      Object.values(row).some((value) => String(value).toLowerCase().includes(query)),
    );
  }, [rows, search]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const currentRows = filteredRows.slice(page * pageSize, page * pageSize + pageSize);

  React.useEffect(() => {
    setPage(0);
  }, [search]);

  React.useEffect(() => {
    onRowSelect?.(selected);
  }, [selected, onRowSelect]);

  const toggleSelect = (id: T["id"]) => {
    setSelected((current) => {
      const exists = current.includes(id);
      return exists ? current.filter((value) => value !== id) : [...current, id];
    });
  };

  const isSelected = (id: T["id"]) => selected.includes(id);

  const tableSx: SxProps<Theme> = {
    width: "100%",
    overflow: "hidden",
  };

  return (
    <Paper sx={{ p: 2.5, borderRadius: (theme) => theme.tokens.radius.xl }}>
      <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mb: 2, justifyContent: "space-between", alignItems: { xs: "stretch", md: "center" } }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>{title ?? "Records"}</Typography>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
          <TextField
            size="small"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search..."
            aria-label="Search table"
          />
          <ToggleButtonGroup
            value={view}
            exclusive
            size="small"
            onChange={(_, nextView) => nextView && setView(nextView)}
          >
            <ToggleButton value="table">Table</ToggleButton>
            <ToggleButton value="grid">Grid</ToggleButton>
          </ToggleButtonGroup>
        </Stack>
      </Stack>

      {loading ? (
        <Stack spacing={1.5}>
          <Skeleton variant="rectangular" height={48} sx={{ borderRadius: (theme) => theme.tokens.radius.md }} />
          <Skeleton variant="rectangular" height={48} sx={{ borderRadius: (theme) => theme.tokens.radius.md }} />
          <Skeleton variant="rectangular" height={48} sx={{ borderRadius: (theme) => theme.tokens.radius.md }} />
        </Stack>
      ) : view === "table" ? (
        <TableContainer sx={{ borderRadius: (theme) => theme.tokens.radius.md, border: "1px solid rgba(0,0,0,0.04)" }}>
          <StyledTable sx={tableSx}>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={selected.length > 0 && selected.length === currentRows.length}
                    indeterminate={selected.length > 0 && selected.length < currentRows.length}
                    onChange={() => {
                      if (selected.length === currentRows.length) {
                        setSelected((current) => current.filter((id) => !currentRows.some((row) => row.id === id)));
                        return;
                      }

                      setSelected((current) => [
                        ...new Set([...current, ...currentRows.map((row) => row.id)]),
                      ]);
                    }}
                  />
                </TableCell>
                {columns.map((column) => (
                  <TableCell key={column.key}>{column.label}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {currentRows.map((row) => (
                <TableRow key={String(row.id)} hover>
                  <TableCell padding="checkbox">
                    <Checkbox checked={isSelected(row.id)} onChange={() => toggleSelect(row.id)} />
                  </TableCell>
                  {columns.map((column) => (
                    <TableCell key={`${String(row.id)}-${column.key}`}>
                      {column.render ? column.render(row) : row[column.key]}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </StyledTable>
        </TableContainer>
      ) : (
        <Grid container spacing={2}>
          {currentRows.map((row) => (
            <Grid key={String(row.id)} size={{ xs: 12, sm: 6, md: 4 }}>
              <Card sx={{ p: 2, height: "100%" }}>
                <Stack direction="row" sx={{ mb: 1.5, justifyContent: "space-between", alignItems: "center" }}>
                  <Chip label={String(row.id)} size="small" />
                  <Checkbox checked={isSelected(row.id)} onChange={() => toggleSelect(row.id)} />
                </Stack>
                {columns.map((column) => (
                  <div key={`${String(row.id)}-grid-${column.key}`} style={{ marginBottom: 8 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
                      {column.label}
                    </Typography>
                    {column.render ? column.render(row) : row[column.key]}
                  </div>
                ))}
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mt: 2, justifyContent: "space-between", alignItems: "center" }}>
        <Chip label={`${selected.length} selected`} />
        <Pagination page={page} count={totalPages} onChange={(_, nextPage) => setPage(nextPage - 1)} color="primary" />
      </Stack>
    </Paper>
  );
}
