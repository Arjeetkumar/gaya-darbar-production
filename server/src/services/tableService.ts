import { Table, ITable, ISafeTable } from '../models/Table.js';
import { AppError } from '../middleware/errorHandler.js';

export async function getTableByQrIdentifier(
  qrCodeIdentifier: string
): Promise<ISafeTable> {
  if (!qrCodeIdentifier) {
    throw new AppError('QR code identifier is required.', 400);
  }

  const table = await Table.findOne({
    qrCodeIdentifier: qrCodeIdentifier.trim(),
    isActive: true,
    isDeleted: { $ne: true },
  });

  if (!table) {
    throw new AppError('Table not found or currently unavailable.', 404);
  }

  return table.toSafeObject();
}

/**
 * Validates a table for dine-in ordering (used by orderService)
 */
export async function validateTableForDineIn(
  tableIdentifier: string
): Promise<ITable> {
  if (!tableIdentifier) {
    throw new AppError('A valid table identifier is required for dine-in orders.', 400);
  }

  const cleanIdentifier = tableIdentifier.trim();

  // Check by qrCodeIdentifier or tableNumber (e.g. Table #12, Table 12, or gd_tbl_8f92a1b)
  const table = await Table.findOne({
    $or: [
      { qrCodeIdentifier: cleanIdentifier },
      { tableNumber: cleanIdentifier },
      { tableNumber: `Table ${cleanIdentifier}` },
      { tableNumber: `Table #${cleanIdentifier}` },
    ],
    isActive: true,
    isDeleted: { $ne: true },
  });

  if (!table) {
    throw new AppError(
      `Table '${tableIdentifier}' does not exist or is currently inactive.`,
      400
    );
  }

  return table;
}

/**
 * Development / Seed helper to ensure Gaya Darbar tables exist
 */
export async function seedTablesIfEmpty(): Promise<void> {
  const count = await Table.countDocuments();
  if (count > 0) return;

  const defaultTables = [
    {
      tableNumber: 'Table 1',
      qrCodeIdentifier: 'gd_tbl_table1',
      capacity: 2,
      location: 'Main Dining',
      status: 'available',
    },
    {
      tableNumber: 'Table 2',
      qrCodeIdentifier: 'gd_tbl_table2',
      capacity: 4,
      location: 'Main Dining',
      status: 'available',
    },
    {
      tableNumber: 'Table 3',
      qrCodeIdentifier: 'gd_tbl_table3',
      capacity: 4,
      location: 'Courtyard',
      status: 'available',
    },
    {
      tableNumber: 'Table 4',
      qrCodeIdentifier: 'gd_tbl_table4',
      capacity: 6,
      location: 'VIP Zone',
      status: 'available',
    },
    {
      tableNumber: 'Table 12',
      qrCodeIdentifier: 'gd_tbl_8f92a1b',
      capacity: 4,
      location: 'Main Dining',
      status: 'available',
    },
  ];

  await Table.insertMany(defaultTables);
}
