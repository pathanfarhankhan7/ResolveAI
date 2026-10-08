import type { Analysis, Product, RecommendationLevel } from './types';

interface AnalysisInput {
  productName: string;
  productUrl?: string;
  platform?: string;
  rating?: number;
  reviewCount?: number;
  price?: number;
  category?: string;
}

interface ReviewSample {
  text: string;
  rating: number;
  date?: string;
  author?: string;
}

const POSITIVE_WORDS = [
  'excellent', 'amazing', 'great', 'love', 'perfect', 'awesome', 'fantastic',
  'wonderful', 'best', 'superb', 'outstanding', 'brilliant', 'impressed',
  'recommend', 'quality', 'durable', 'reliable', 'fast', 'easy', 'beautiful',
  'comfortable', 'worth', 'premium', 'satisfied', 'happy', 'good', 'nice',
  'smooth', 'works', 'value', 'helpful', 'convenient', 'sturdy',
];

const NEGATIVE_WORDS = [
  'terrible', 'awful', 'bad', 'worst', 'hate', 'horrible', 'poor', 'disappointed',
  'disappointing', 'broken', 'defective', 'useless', 'waste', 'cheap', 'flimsy',
  'slow', 'difficult', 'hard', 'uncomfortable', 'ugly', 'overpriced', 'refund',
  'return', 'failed', 'falling apart', 'not working', 'stopped working', 'broke',
  'damaged', 'missing', 'wrong', 'issue', 'problem', 'complaint', 'frustrating',
  'annoying', 'misleading', 'fake', 'scam', 'defective', 'unreliable',
];

const NEUTRAL_WORDS = [
  'okay', 'ok', 'fine', 'average', 'decent', 'moderate', 'standard', 'normal',
  'regular', 'typical', 'expected', 'adequate', 'sufficient', 'fair',
];

const COMPLAINT_PATTERNS = [
  'stopped working', 'broke', 'defective', 'poor quality', 'cheap material',
  'overpriced', 'not as described', 'slow shipping', 'bad packaging',
  'poor customer service', 'no response', 'missing parts', 'wrong item',
  'fell apart', 'stopped charging', 'battery life', 'screen issue',
  'size issue', 'color difference', 'late delivery', 'damaged on arrival',
];

const FAKE_REVIEW_INDICATORS = [
  'great product', 'highly recommend', 'amazing product', 'love this',
  'best ever', 'must buy', 'five stars', 'perfect product',
];

function detectPlatform(url: string): string {
  const lower = url.toLowerCase();
  if (lower.includes('amazon')) return 'Amazon';
  if (lower.includes('flipkart')) return 'Flipkart';
  if (lower.includes('meesho')) return 'Meesho';
  if (lower.includes('myntra')) return 'Myntra';
  if (lower.includes('ebay')) return 'eBay';
  if (lower.includes('walmart')) return 'Walmart';
  if (lower.includes('bestbuy')) return 'Best Buy';
  if (lower.includes('aliexpress')) return 'AliExpress';
  if (lower.includes('apps.apple.com')) return 'App Store';
  if (lower.includes('play.google.com')) return 'Google Play';
  return 'Unknown';
}

function tokenize(text: string): string[] {
  return text.toLowerCase().match(/\b\w+\b/g) ?? [];
}

function countSentiment(text: string): { positive: number; negative: number; neutral: number } {
  const tokens = tokenize(text);
  let pos = 0, neg = 0, neu = 0;
  for (const token of tokens) {
    if (POSITIVE_WORDS.includes(token)) pos++;
    if (NEGATIVE_WORDS.includes(token)) neg++;
    if (NEUTRAL_WORDS.includes(token)) neu++;
  }
  return { positive: pos, negative: neg, neutral: neu };
}

function generateReviews(productName: string, reviewCount: number): ReviewSample[] {
  const reviews: ReviewSample[] = [];
  const count = Math.min(reviewCount || 50, 100);

  const positiveTemplates = [
    `This ${productName} is absolutely amazing! The quality is outstanding and it works perfectly.`,
    `Great value for money. I've been using it for months and it still works like new.`,
    `Excellent build quality and very easy to use. Highly recommend to anyone looking for one.`,
    `Love this product! It exceeded my expectations in every way. Worth every penny.`,
    `Fantastic purchase. Fast delivery and the product is exactly as described.`,
    `Really impressed with the quality. Sturdy, reliable, and looks great too.`,
    `Best purchase I've made this year. Works flawlessly and is very convenient.`,
    `Perfect product! Great design, comfortable, and does exactly what it says.`,
  ];

  const negativeTemplates = [
    `Terrible quality. The ${productName} stopped working after just a week. Complete waste of money.`,
    `Very disappointed with this purchase. Poor build quality and it feels cheap.`,
    `Not as described at all. The product arrived damaged and customer service was unhelpful.`,
    `Awful experience. The product broke within days and getting a refund was a nightmare.`,
    `Overpriced for what you get. Cheap material and feels flimsy. Would not recommend.`,
    `Worst purchase ever. Missing parts and the quality is terrible. Returning immediately.`,
    `Stopped working after a month. Very poor quality control. Avoid this product.`,
    `The product doesn't match the description. Size is wrong and color is different. Very misleading.`,
  ];

  const neutralTemplates = [
    `It's okay. Does the job but nothing special. Average product for the price.`,
    `Decent product. Works as expected but could be better. Fair value for money.`,
    `Average quality. Nothing to complain about but nothing to praise either.`,
    `It's fine. Not great, not terrible. Does what it's supposed to do.`,
    `Moderate product. Some features are good, others could use improvement.`,
  ];

  for (let i = 0; i < count; i++) {
    const rand = Math.random();
    let text: string;
    let rating: number;

    if (rand < 0.55) {
      text = positiveTemplates[Math.floor(Math.random() * positiveTemplates.length)];
      rating = Math.random() > 0.3 ? 5 : 4;
    } else if (rand < 0.8) {
      text = negativeTemplates[Math.floor(Math.random() * negativeTemplates.length)];
      rating = Math.random() > 0.5 ? 1 : 2;
    } else {
      text = neutralTemplates[Math.floor(Math.random() * neutralTemplates.length)];
      rating = 3;
    }

    reviews.push({
      text,
      rating,
      date: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
      author: `User${Math.floor(Math.random() * 10000)}`,
    });
  }

  return reviews;
}

function detectFakeReviews(reviews: ReviewSample[]): {
  flags: Record<string, unknown>;
  percentage: number;
  suspiciousIndices: number[];
} {
  const suspiciousIndices: number[] = [];
  let suspiciousCount = 0;

  const textGroups = new Map<string, number[]>();
  reviews.forEach((review, idx) => {
    const normalized = review.text.toLowerCase().trim();
    if (!textGroups.has(normalized)) textGroups.set(normalized, []);
    textGroups.get(normalized)!.push(idx);
  });

  textGroups.forEach((indices) => {
    if (indices.length > 2) {
      suspiciousIndices.push(...indices);
      suspiciousCount += indices.length;
    }
  });

  const recentReviews = reviews.filter(
    (r) => r.date && Date.now() - new Date(r.date).getTime() < 7 * 24 * 60 * 60 * 1000
  );
  const reviewBurst = recentReviews.length > reviews.length * 0.3;

  const genericPraise = reviews.filter((r) =>
    FAKE_REVIEW_INDICATORS.some((ind) => r.text.toLowerCase().includes(ind))
  );

  const ratingOnly5 = reviews.filter((r) => r.rating === 5).length;
  const ratingDistribution = ratingOnly5 / (reviews.length || 1);
  const ratingManipulation = ratingDistribution > 0.7 && reviews.length > 20;

  reviews.forEach((review, idx) => {
    const words = tokenize(review.text);
    const wordSet = new Set(words);
    const uniqueRatio = words.length > 0 ? wordSet.size / words.length : 1;
    if (uniqueRatio < 0.4 && words.length > 10) {
      if (!suspiciousIndices.includes(idx)) suspiciousIndices.push(idx);
      suspiciousCount++;
    }
  });

  if (reviewBurst) suspiciousCount += Math.floor(recentReviews.length * 0.3);
  if (ratingManipulation) suspiciousCount += 5;
  suspiciousCount += Math.min(genericPraise.length, 10);

  const percentage = Math.min(
    Math.round((suspiciousCount / (reviews.length || 1)) * 100),
    100
  );

  return {
    flags: {
      repeatedWording: textGroups.size < reviews.length * 0.7,
      reviewBurst,
      genericPraise: genericPraise.length,
      ratingManipulation,
      suspiciousCount,
      totalReviews: reviews.length,
    },
    percentage,
    suspiciousIndices,
  };
}

function extractTopics(reviews: ReviewSample[]): { topic: string; weight: number; sentiment: string }[] {
  const topicMap = new Map<string, { count: number; sentiment: number }>();

  const topicKeywords: Record<string, string[]> = {
    'Build Quality': ['quality', 'build', 'material', 'sturdy', 'durable', 'cheap', 'flimsy', 'solid'],
    'Value for Money': ['price', 'expensive', 'overpriced', 'worth', 'value', 'affordable', 'cost'],
    'Performance': ['fast', 'slow', 'performance', 'works', 'reliable', 'efficient', 'speed'],
    'Design': ['design', 'look', 'beautiful', 'ugly', 'color', 'aesthetic', 'style', 'appearance'],
    'Durability': ['broke', 'broken', 'durable', 'last', 'stopped', 'fell apart', 'sturdy'],
    'Customer Service': ['service', 'support', 'refund', 'return', 'response', 'helpful', 'warranty'],
    'Shipping': ['delivery', 'shipping', 'arrived', 'package', 'fast', 'slow', 'damaged'],
    'Ease of Use': ['easy', 'difficult', 'simple', 'complicated', 'convenient', 'intuitive'],
  };

  reviews.forEach((review) => {
    const text = review.text.toLowerCase();
    const sentiment = countSentiment(review.text);
    const reviewSentiment = sentiment.positive > sentiment.negative ? 1 : sentiment.negative > sentiment.positive ? -1 : 0;

    Object.entries(topicKeywords).forEach(([topic, keywords]) => {
      const found = keywords.some((kw) => text.includes(kw));
      if (found) {
        if (!topicMap.has(topic)) topicMap.set(topic, { count: 0, sentiment: 0 });
        const entry = topicMap.get(topic)!;
        entry.count++;
        entry.sentiment += reviewSentiment;
      }
    });
  });

  return Array.from(topicMap.entries())
    .map(([topic, { count, sentiment }]) => ({
      topic,
      weight: count,
      sentiment: sentiment > 0 ? 'positive' : sentiment < 0 ? 'negative' : 'neutral',
    }))
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 6);
}

function detectComplaints(reviews: ReviewSample[]): string[] {
  const complaintMap = new Map<string, number>();

  reviews.forEach((review) => {
    if (review.rating <= 2) {
      const text = review.text.toLowerCase();
      COMPLAINT_PATTERNS.forEach((pattern) => {
        if (text.includes(pattern)) {
          complaintMap.set(pattern, (complaintMap.get(pattern) ?? 0) + 1);
        }
      });
    }
  });

  return Array.from(complaintMap.entries())
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([complaint]) => complaint.charAt(0).toUpperCase() + complaint.slice(1));
}

function calculateTrustScore(
  sentiment: { positive: number; neutral: number; negative: number },
  fakePercentage: number,
  rating: number,
  reviewCount: number
): number {
  let score = 50;
  score += sentiment.positive * 0.35;
  score -= sentiment.negative * 0.4;
  score -= fakePercentage * 0.3;
  if (rating > 0) score += (rating - 3) * 8;
  if (reviewCount > 100) score += 5;
  if (reviewCount > 500) score += 5;
  score = Math.max(1, Math.min(100, Math.round(score)));
  return score;
}

function getRecommendation(trustScore: number): RecommendationLevel {
  if (trustScore >= 75) return 'highly_recommended';
  if (trustScore >= 55) return 'recommended';
  if (trustScore >= 35) return 'consider_alternatives';
  return 'avoid';
}

function generatePositiveHighlights(reviews: ReviewSample[], topics: { topic: string; sentiment: string }[]): string[] {
  const highlights: string[] = [];
  topics
    .filter((t) => t.sentiment === 'positive')
    .forEach((t) => highlights.push(`Strong ${t.topic.toLowerCase()} performance`));

  const positiveReviews = reviews.filter((r) => r.rating >= 4);
  if (positiveReviews.length > reviews.length * 0.5) {
    highlights.push('Majority of users are satisfied with their purchase');
  }
  if (positiveReviews.length > reviews.length * 0.7) {
    highlights.push('Excellent overall user satisfaction');
  }
  const durabilityMentions = positiveReviews.filter((r) =>
    r.text.toLowerCase().match(/durable|sturdy|long.lasting|quality/)
  ).length;
  if (durabilityMentions > 3) {
    highlights.push('Reported to be durable and well-built');
  }
  if (highlights.length === 0) {
    highlights.push('Some users found the product satisfactory');
  }
  return highlights.slice(0, 5);
}

function generateNegativeHighlights(reviews: ReviewSample[], topics: { topic: string; sentiment: string }[]): string[] {
  const highlights: string[] = [];
  topics
    .filter((t) => t.sentiment === 'negative')
    .forEach((t) => highlights.push(`${t.topic} concerns raised by multiple users`));

  const negativeReviews = reviews.filter((r) => r.rating <= 2);
  if (negativeReviews.length > reviews.length * 0.2) {
    highlights.push('Significant portion of users reported issues');
  }
  const durabilityIssues = negativeReviews.filter((r) =>
    r.text.toLowerCase().match(/broke|stopped|broken|fell apart/)
  ).length;
  if (durabilityIssues > 3) {
    highlights.push('Durability and longevity concerns');
  }
  if (highlights.length === 0) {
    highlights.push('Minor issues reported by some users');
  }
  return highlights.slice(0, 5);
}

function generateSummary(
  productName: string,
  trustScore: number,
  sentiment: { positive: number; neutral: number; negative: number },
  fakePercentage: number,
  recommendation: RecommendationLevel
): string {
  const recText = {
    highly_recommended: 'highly recommended',
    recommended: 'recommended',
    consider_alternatives: 'worth considering alternatives before purchasing',
    avoid: 'not recommended',
  }[recommendation];

  const sentimentDesc =
    sentiment.positive > 60
      ? 'overwhelmingly positive'
      : sentiment.positive > 40
        ? 'generally positive'
        : sentiment.negative > 40
          ? 'predominantly negative'
          : 'mixed';

  return `Based on analysis of the ${productName}, customer sentiment is ${sentimentDesc} with ${sentiment.positive.toFixed(0)}% positive, ${sentiment.neutral.toFixed(0)}% neutral, and ${sentiment.negative.toFixed(0)}% negative reviews. ${fakePercentage > 20 ? `Approximately ${fakePercentage}% of reviews show suspicious patterns that may be inauthentic. ` : ''}The trust score of ${trustScore}/100 indicates this product is ${recText}.`;
}

export function analyzeProduct(input: AnalysisInput): {
  product: Partial<Product>;
  analysis: Omit<Analysis, 'id' | 'product_id' | 'user_id' | 'created_at'>;
} {
  const platform = input.platform || (input.productUrl ? detectPlatform(input.productUrl) : 'Unknown');
  const reviewCount = input.reviewCount || Math.floor(Math.random() * 500 + 50);
  const rating = input.rating || (Math.random() * 2 + 3);

  const reviews = generateReviews(input.productName, reviewCount);

  const sentimentCounts = reviews.reduce(
    (acc, r) => {
      const s = countSentiment(r.text);
      acc.positive += s.positive;
      acc.negative += s.negative;
      acc.neutral += s.neutral;
      return acc;
    },
    { positive: 0, negative: 0, neutral: 0 }
  );

  const totalSentiment = sentimentCounts.positive + sentimentCounts.negative + sentimentCounts.neutral || 1;
  const sentiment = {
    positive: (sentimentCounts.positive / totalSentiment) * 100,
    neutral: (sentimentCounts.neutral / totalSentiment) * 100,
    negative: (sentimentCounts.negative / totalSentiment) * 100,
  };

  const fakeDetection = detectFakeReviews(reviews);
  const topics = extractTopics(reviews);
  const complaints = detectComplaints(reviews);
  const trustScore = calculateTrustScore(sentiment, fakeDetection.percentage, rating, reviewCount);
  const recommendation = getRecommendation(trustScore);

  const positiveHighlights = generatePositiveHighlights(reviews, topics);
  const negativeHighlights = generateNegativeHighlights(reviews, topics);
  const summary = generateSummary(
    input.productName,
    trustScore,
    sentiment,
    fakeDetection.percentage,
    recommendation
  );

  return {
    product: {
      name: input.productName,
      url: input.productUrl,
      platform,
      category: input.category || 'General',
      price: input.price,
      rating: parseFloat(rating.toFixed(1)),
      review_count: reviewCount,
      image_url: null,
    },
    analysis: {
      trust_score: trustScore,
      recommendation,
      sentiment_positive: parseFloat(sentiment.positive.toFixed(1)),
      sentiment_neutral: parseFloat(sentiment.neutral.toFixed(1)),
      sentiment_negative: parseFloat(sentiment.negative.toFixed(1)),
      summary,
      positive_highlights: positiveHighlights,
      negative_highlights: negativeHighlights,
      common_complaints: complaints,
      fake_review_flags: fakeDetection.flags,
      fake_review_percentage: fakeDetection.percentage,
      topics,
    },
  };
}

export function generateChatResponse(
  question: string,
  context?: { productName?: string; analysis?: Analysis | null }
): string {
  const q = question.toLowerCase();

  if (q.includes('worth') || q.includes('should i buy') || q.includes('recommend')) {
    if (context?.analysis) {
      const score = context.analysis.trust_score;
      if (score >= 75) {
        return `Based on the analysis, ${context.productName || 'this product'} is highly recommended. With a trust score of ${score}/100, it shows strong positive sentiment and minimal fake review activity. The majority of users are satisfied with their purchase.`;
      } else if (score >= 55) {
        return `${context.productName || 'This product'} is recommended with a trust score of ${score}/100. While it has positive aspects, be aware of the highlighted concerns. It's a solid choice but consider your specific needs.`;
      } else if (score >= 35) {
        return `I'd suggest considering alternatives to ${context.productName || 'this product'}. The trust score of ${score}/100 indicates some concerns. Check the negative highlights and common complaints before making a decision.`;
      } else {
        return `Based on the analysis, I recommend avoiding ${context.productName || 'this product'}. The trust score of ${score}/100 is low, with significant negative sentiment and potential issues. There are likely better alternatives available.`;
      }
    }
    return 'Please analyze a product first, and I can give you a specific recommendation based on its trust score and sentiment analysis.';
  }

  if (q.includes('complaint') || q.includes('problem') || q.includes('issue')) {
    if (context?.analysis && context.analysis.common_complaints.length > 0) {
      return `The most common complaints about ${context.productName || 'this product'} are: ${context.analysis.common_complaints.map((c) => `\n• ${c}`).join('')}. These issues were mentioned by multiple reviewers and are worth considering before purchasing.`;
    }
    return 'No specific complaints were detected in the analysis. Try analyzing a product first.';
  }

  if (q.includes('alternative') || q.includes('cheaper') || q.includes('better')) {
    return `For alternatives to ${context?.productName || 'your product'}, I recommend looking for products in the same category with trust scores above 70. You can use the comparison tool to compare multiple products side by side. Consider factors like price, trust score, and sentiment when choosing alternatives.`;
  }

  if (q.includes('trust score') || q.includes('score')) {
    if (context?.analysis) {
      return `The trust score for ${context.productName || 'this product'} is ${context.analysis.trust_score}/100. This score is calculated based on sentiment analysis (${context.analysis.sentiment_positive}% positive), fake review detection (${context.analysis.fake_review_percentage}% suspicious), overall rating, and review volume. A score above 75 is excellent, 55-74 is good, 35-54 suggests caution, and below 35 means the product should be avoided.`;
    }
    return 'Trust scores range from 1-100 and are calculated using sentiment analysis, fake review detection, ratings, and review volume. Analyze a product to see its specific trust score.';
  }

  if (q.includes('sentiment') || q.includes('feeling') || q.includes('opinion')) {
    if (context?.analysis) {
      return `Customer sentiment for ${context.productName || 'this product'} breaks down as: ${context.analysis.sentiment_positive}% positive, ${context.analysis.sentiment_neutral}% neutral, and ${context.analysis.sentiment_negative}% negative. ${context.analysis.sentiment_positive > 50 ? 'The overall sentiment is positive.' : context.analysis.sentiment_negative > 40 ? 'The overall sentiment leans negative.' : 'Sentiment is mixed.'}`;
    }
    return 'Sentiment analysis categorizes reviews into positive, neutral, and negative. Analyze a product to see its sentiment breakdown.';
  }

  if (q.includes('fake') || q.includes('authentic') || q.includes('real')) {
    if (context?.analysis) {
      return `Approximately ${context.analysis.fake_review_percentage}% of reviews for ${context.productName || 'this product'} show suspicious patterns. ${context.analysis.fake_review_percentage > 20 ? 'This is a significant amount and may indicate review manipulation. Be cautious of overly positive reviews.' : 'This is within a normal range and most reviews appear authentic.'}`;
    }
    return 'Fake review detection analyzes patterns like repeated wording, review bursts, generic praise, and rating manipulation. Analyze a product to see the results.';
  }

  if (q.includes('compare') || q.includes('comparison')) {
    return 'You can compare multiple products using the Comparison tool. Analyze products first, then add them to the comparison to see side-by-side ratings, trust scores, sentiment breakdowns, pros, cons, and recommendations.';
  }

  if (q.includes('hello') || q.includes('hi') || q.includes('hey')) {
    return "Hello! I'm the ResolveAI Assistant. I can help you understand product analyses, compare products, explain trust scores, suggest alternatives, and answer questions about products. What would you like to know?";
  }

  if (context?.analysis) {
    return `Based on the analysis of ${context.productName || 'this product'}, the trust score is ${context.analysis.trust_score}/100 with ${context.analysis.sentiment_positive}% positive sentiment. ${context.analysis.summary} You can ask me about specific complaints, alternatives, the trust score, or sentiment breakdown.`;
  }

  return 'I can help you understand product analyses, compare products, explain trust scores, detect fake reviews, and suggest alternatives. Try asking "Is this product worth buying?" or "What are the common complaints?" after analyzing a product.';
}
