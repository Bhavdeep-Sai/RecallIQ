import { sql } from "drizzle-orm";
import type { Database } from "@/lib/db/client";
import { getDb } from "@/lib/db/client";

export interface RequestScope {
  organizationId: string;
  userId?: string;
}

export async function withRequestScope<T>(scope: RequestScope, executor: (db: Database) => Promise<T>) {
  const db = getDb();

  return db.transaction(async (tx) => {
    await tx.execute(sql`select set_config('app.current_organization_id', ${scope.organizationId}, true)`);

    if (scope.userId) {
      await tx.execute(sql`select set_config('app.current_user_id', ${scope.userId}, true)`);
    }

    return executor(tx as unknown as Database);
  });
}
