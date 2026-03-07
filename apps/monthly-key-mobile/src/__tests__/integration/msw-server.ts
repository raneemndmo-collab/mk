/**
 * MSW Server Setup — Integration Tests
 *
 * Intercepts tRPC calls. No real network.
 */

import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

const TRPC_BASE = 'https://monthlykey.com/api/trpc';

export const mswHandlers = [
  // Auth — login success
  http.post(`${TRPC_BASE}/auth.login`, () =>
    HttpResponse.json({
      result: {
        data: { id: 1, nameAr: 'أحمد محمد', role: 'tenant', token: 'mock-session-token' },
      },
    })
  ),

  // Auth — me (session restore)
  http.get(`${TRPC_BASE}/auth.me`, () =>
    HttpResponse.json({
      result: { data: { id: 1, nameAr: 'أحمد محمد', role: 'tenant' } },
    })
  ),

  // Properties — search
  http.get(`${TRPC_BASE}/property.search`, () =>
    HttpResponse.json({
      result: {
        data: {
          items: Array.from({ length: 20 }, (_, i) => ({
            id: i + 1,
            titleAr: `شقة رقم ${i + 1} في الرياض`,
            monthlyRate: 5000 + i * 100,
            dailyRate: 200 + i * 5,
            city: 'الرياض',
            district: 'العليا',
            bedrooms: 2,
            bathrooms: 2,
            area: 100 + i * 5,
            photos: [
              { url: `https://r2.monthlykey.com/prop${i + 1}.jpg`, isCover: true },
            ],
            status: 'active',
          })),
          total: 45,
          hasMore: true,
          currentPage: 1,
        },
      },
    })
  ),

  // Property — getById
  http.get(`${TRPC_BASE}/property.getById`, () =>
    HttpResponse.json({
      result: {
        data: {
          id: 1,
          titleAr: 'شقة فاخرة في الرياض',
          monthlyRate: 12300,
          dailyRate: 500,
          city: 'الرياض',
          district: 'العليا',
          bedrooms: 2,
          bathrooms: 2,
          area: 120,
          amenities: ['wifi', 'parking', 'ac'],
          photos: [
            { url: 'https://r2.monthlykey.com/prop1.jpg', isCover: true },
          ],
          status: 'active',
        },
      },
    })
  ),

  // Booking — create
  http.post(`${TRPC_BASE}/booking.create`, () =>
    HttpResponse.json({
      result: {
        data: { id: 42, status: 'pending', propertyId: 1 },
      },
    })
  ),

  // Push notification — subscribe
  http.post(`${TRPC_BASE}/notification.subscribe`, () =>
    HttpResponse.json({ result: { data: { success: true } } })
  ),

  // Push notification — unsubscribe
  http.post(`${TRPC_BASE}/notification.unsubscribe`, () =>
    HttpResponse.json({ result: { data: { success: true } } })
  ),

  // Geo — cities fallback (returns 404 to test static fallback)
  http.get(`${TRPC_BASE}/geo.all`, () =>
    HttpResponse.json(
      { error: { message: 'No procedure found' } },
      { status: 404 }
    )
  ),

  // CMS — getAll fallback
  http.get(`${TRPC_BASE}/cms.getAll`, () =>
    HttpResponse.json(
      { error: { message: 'No procedure found' } },
      { status: 404 }
    )
  ),
];

export const server = setupServer(...mswHandlers);
