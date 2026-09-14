export default () => ({
  port: parseInt(process.env.PORT, 10) || 8091,
  database: {
    url: process.env.DATABASE_URL || 'postgresql://review_user:review_password@localhost:5442/review_db?schema=public',
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT, 10) || 6389,
    ttl: {
      ratingSummary: 600, // 10 minutes
      productReviews: 300, // 5 minutes
    },
  },
  kafka: {
    brokers: (process.env.KAFKA_BROKERS || 'localhost:9102').split(','),
    clientId: process.env.KAFKA_CLIENT_ID || 'review-service',
    groupId: process.env.KAFKA_GROUP_ID || 'review-group',
    topics: {
      reviewEvents: 'review.events',
      orderEvents: 'order.events',
      catalogEvents: 'catalog.events',
    },
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'supersecretjwtkeyforreviewandratingservice2026',
  },
  review: {
    autoPublishVerified: process.env.AUTO_PUBLISH_VERIFIED === 'true',
    flagThresholdReports: 3,
  },
  storage: {
    type: process.env.STORAGE_TYPE || 'LOCAL',
    uploadDir: process.env.UPLOAD_DIR || './uploads',
  },
});
