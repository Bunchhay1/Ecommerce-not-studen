export enum ReviewEventType {
  ReviewCreated = 'ReviewCreated',
  ReviewPublished = 'ReviewPublished',
  ReviewUpdated = 'ReviewUpdated',
  ReviewDeleted = 'ReviewDeleted',
  ReviewHidden = 'ReviewHidden',
  ReviewReported = 'ReviewReported',
  ReviewHelpful = 'ReviewHelpful',
  ReviewUnhelpful = 'ReviewUnhelpful',
  RatingUpdated = 'RatingUpdated',
}

export interface BaseReviewEvent<T = any> {
  eventId: string;
  eventType: ReviewEventType | string;
  aggregateId: string;
  timestamp: string;
  data: T;
}
