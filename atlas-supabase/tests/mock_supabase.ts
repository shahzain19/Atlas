interface Row {
  [key: string]: any;
  id?: string;
}

interface Filter {
  column: string;
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'in';
  value: any;
  values?: any[];
}

export class MockQueryBuilder {
  private table: string;
  private rows: Row[];
  private filters: Filter[] = [];
  private orderColumn: string | null = null;
  private orderAscending = false;
  private limitCount: number | null = null;
  private singleResult = false;
  private pendingInsert: any = null;
  private isSelect = false;
  private isDelete = false;
  private deleteFilters: Filter[] = [];

  constructor(table: string, rows: Row[]) {
    this.table = table;
    this.rows = rows;
  }

  select(columns?: string): this {
    this.isSelect = true;
    return this;
  }

  insert(values: any): this {
    this.pendingInsert = values;
    return this;
  }

  update(values: any): this {
    const matching = this.applyFilters();
    for (const row of matching) {
      const idx = this.rows.indexOf(row);
      if (idx !== -1) {
        this.rows[idx] = { ...this.rows[idx], ...values, updated_at: new Date().toISOString() };
      }
    }
    return this;
  }

  delete(): this {
    this.deleteFilters = [...this.filters];
    this.isDelete = true;
    return this;
  }

  eq(column: string, value: any): this {
    this.filters.push({ column, operator: 'eq', value });
    return this;
  }

  neq(column: string, value: any): this {
    this.filters.push({ column, operator: 'neq', value });
    return this;
  }

  gt(column: string, value: any): this {
    this.filters.push({ column, operator: 'gt', value });
    return this;
  }

  gte(column: string, value: any): this {
    this.filters.push({ column, operator: 'gte', value });
    return this;
  }

  lt(column: string, value: any): this {
    this.filters.push({ column, operator: 'lt', value });
    return this;
  }

  lte(column: string, value: any): this {
    this.filters.push({ column, operator: 'lte', value });
    return this;
  }

  like(column: string, value: any): this {
    this.filters.push({ column, operator: 'like', value });
    return this;
  }

  in(column: string, values: any[]): this {
    this.filters.push({ column, operator: 'in', value: values, values });
    return this;
  }

  order(column: string, opts?: { ascending?: boolean }): this {
    this.orderColumn = column;
    this.orderAscending = opts?.ascending ?? false;
    return this;
  }

  limit(count: number): this {
    this.limitCount = count;
    return this;
  }

  single(): this {
    this.singleResult = true;
    return this;
  }

  then(resolve: (value: { data: Row[] | Row | null; error: any; count?: any }) => any, reject?: any): Promise<any> {
    try {
      // Handle insert operations
      if (this.pendingInsert !== null) {
        const rows = Array.isArray(this.pendingInsert) ? this.pendingInsert : [this.pendingInsert];
        const inserted = rows.map((r: Row) => {
          const row: Row = { ...r };
          if (!row.id) row.id = crypto.randomUUID();
          if (!row.created_at) row.created_at = new Date().toISOString();
          if (!row.updated_at) row.updated_at = new Date().toISOString();
          return row;
        });
        this.rows.push(...inserted);

        if (!this.isSelect) {
          resolve({ data: null, error: null });
          return Promise.resolve();
        }

        resolve({ data: this.singleResult ? inserted[0] : inserted, error: null, count: inserted.length });
        return Promise.resolve();
      }

      // Handle delete operations
      if (this.isDelete) {
        const rowsToDelete = this.rows.filter((row) => {
          return this.deleteFilters.every((f) => {
            const val = row[f.column];
            if (f.operator === 'eq') {
              if (f.value === null) return val == null;
              return val === f.value || String(val) === String(f.value);
            }
            if (f.operator === 'neq') {
              return val !== f.value;
            }
            return true;
          });
        });
        for (const row of rowsToDelete) {
          const idx = this.rows.indexOf(row);
          if (idx !== -1) this.rows.splice(idx, 1);
        }
        resolve({ data: null, error: null });
        return Promise.resolve();
      }

      // Handle select operations
      let results = this.applyFilters();

      if (this.orderColumn) {
        results.sort((a, b) => {
          const av = a[this.orderColumn!];
          const bv = b[this.orderColumn!];
          if (av == null) return 1;
          if (bv == null) return -1;
          if (typeof av === 'string') {
            return this.orderAscending ? av.localeCompare(bv) : bv.localeCompare(av);
          }
          return this.orderAscending ? av - bv : bv - av;
        });
      }

      if (this.limitCount !== null) {
        results = results.slice(0, this.limitCount);
      }

      if (this.singleResult) {
        const data = results.length > 0 ? results[0] : null;
        const error = results.length === 0 ? { message: 'No rows found', code: 'PGRST116', details: 'The result contained 0 rows' } : null;
        resolve({ data, error, count: results.length });
        return Promise.resolve();
      }

      resolve({ data: results, error: null, count: results.length });
      return Promise.resolve();
    } catch (err) {
      if (reject) reject(err);
      return Promise.reject(err);
    }
  }

  private applyFilters(): Row[] {
    return this.rows.filter((row) => {
      return this.filters.every((f) => {
        const val = row[f.column];
        switch (f.operator) {
          case 'eq':
            if (f.value === null) return val == null;
            if (Array.isArray(val) && !Array.isArray(f.value)) return false;
            return val === f.value || String(val) === String(f.value);
          case 'neq':
            return val !== f.value;
          case 'gt':
            return val > f.value;
          case 'gte':
            return val >= f.value;
          case 'lt':
            return val < f.value;
          case 'lte':
            return val <= f.value;
          case 'like':
            if (typeof val !== 'string') return false;
            const pattern = String(f.value).replace(/%/g, '.*');
            return new RegExp(`^${pattern}$`).test(val);
          case 'in':
            return f.values?.includes(val);
          default:
            return true;
        }
      });
    });
  }
}

// Global in-memory table store
const tables = new Map<string, Row[]>();

export function getTable(name: string): Row[] {
  if (!tables.has(name)) {
    tables.set(name, []);
  }
  return tables.get(name)!;
}

export function resetTables(): void {
  tables.clear();
}

export class MockSupabaseClient {
  from(table: string): MockQueryBuilder {
    const rows = getTable(table);
    return new MockQueryBuilder(table, rows);
  }

  reset(): void {
    resetTables();
  }
}
