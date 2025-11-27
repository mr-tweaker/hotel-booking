// Analytics service - handles analytics event tracking
import AnalyticsEvent from '@/models/AnalyticsEvent';
import connectDB from '@/lib/db';
import { AnalyticsEvent as IAnalyticsEvent, ApiResponse } from '@/types';

export class AnalyticsService {
  async trackEvent(
    type: string,
    payload?: Record<string, unknown>
  ): Promise<ApiResponse> {
    try {
      await connectDB();

      // Determine category based on event type
      let category: IAnalyticsEvent['category'] = 'event';
      if (
        type === 'visit_home' ||
        type === 'visit_search' ||
        type === 'hotel_open'
      ) {
        category = 'visit';
      } else if (
        type === 'signup' ||
        type === 'signup_fail' ||
        type === 'login_success' ||
        type === 'login_fail'
      ) {
        category = 'session';
      } else if (
        type === 'payment_page_opened' ||
        type === 'booking_attempt' ||
        type === 'booking_failed'
      ) {
        category = 'payment';
      } else if (
        type === 'booking_completed' ||
        type === 'booking_created'
      ) {
        category = 'booking';
      }

      const event = new AnalyticsEvent({
        type,
        payload: payload || {},
        ts: new Date(),
        category,
      });

      await event.save();

      return {
        success: true,
      };
    } catch (error) {
      console.error('Analytics tracking error:', error);
      // Analytics failures should not block user actions
      return {
        success: false,
        error: 'Failed to track event',
      };
    }
  }

  async getEvents(filters?: {
    type?: string;
    category?: IAnalyticsEvent['category'];
    startDate?: Date;
    endDate?: Date;
  }): Promise<ApiResponse<IAnalyticsEvent[]>> {
    try {
      await connectDB();

      const query: Record<string, unknown> = {};
      if (filters?.type) {
        query.type = filters.type;
      }
      if (filters?.category) {
        query.category = filters.category;
      }
      if (filters?.startDate || filters?.endDate) {
        query.ts = {};
        if (filters.startDate) {
          (query.ts as Record<string, unknown>).$gte = filters.startDate;
        }
        if (filters.endDate) {
          (query.ts as Record<string, unknown>).$lte = filters.endDate;
        }
      }

      const events = await AnalyticsEvent.find(query)
        .sort({ ts: -1 })
        .limit(1000);

      return {
        success: true,
        data: events.map((e) => e.toObject() as IAnalyticsEvent),
      };
    } catch (error) {
      console.error('Get events error:', error);
      return {
        success: false,
        error: 'Failed to fetch events',
      };
    }
  }
}

export const analyticsService = new AnalyticsService();

