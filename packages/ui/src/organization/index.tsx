"use client";

import { Chip, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from "@mui/material";

export function OrganizationSwitcher({ organizations, active }: { organizations: string[]; active?: string }) {
  return (
    <Stack direction="row" spacing={1}>
      {organizations.map((organization) => (
        <Chip key={organization} color={organization === active ? "primary" : "default"} label={organization} size="small" />
      ))}
    </Stack>
  );
}

export function MemberRow({ name, role }: { name: string; role: string }) {
  return (
    <TableRow>
      <TableCell>{name}</TableCell>
      <TableCell>{role}</TableCell>
    </TableRow>
  );
}

export function RoleBadge({ role }: { role: string }) {
  return <Chip size="small" label={role} variant="outlined" />;
}

export type PermissionMatrixRow = {
  id: string;
  label: string;
  permissions: string[];
};

export function PermissionMatrix({ rows }: { rows: PermissionMatrixRow[] }) {
  return (
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell>Role</TableCell>
          <TableCell>Permissions</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.id}>
            <TableCell>{row.label}</TableCell>
            <TableCell>
              <Typography variant="body2">{row.permissions.join(", ")}</Typography>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function PlanBadge({ plan }: { plan: string }) {
  return <Chip size="small" color="primary" label={plan} />;
}
