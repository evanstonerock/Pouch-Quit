
import { z } from 'zod';
import { insertSettingsSchema, insertLogSchema, appSettings, pouchLogs } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  settings: {
    get: {
      method: 'GET' as const,
      path: '/api/settings',
      responses: {
        200: z.custom<typeof appSettings.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/settings',
      input: insertSettingsSchema.partial(),
      responses: {
        200: z.custom<typeof appSettings.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    reset: {
      method: 'POST' as const,
      path: '/api/settings/reset',
      responses: {
        200: z.object({ success: z.boolean() }),
      },
    },
  },
  logs: {
    list: {
      method: 'GET' as const,
      path: '/api/logs',
      responses: {
        200: z.array(z.custom<typeof pouchLogs.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/logs',
      input: insertLogSchema.optional(),
      responses: {
        201: z.custom<typeof pouchLogs.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/logs/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
    deleteLast: {
      method: 'DELETE' as const,
      path: '/api/logs/last',
      responses: {
        200: z.custom<typeof pouchLogs.$inferSelect>().optional(),
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
