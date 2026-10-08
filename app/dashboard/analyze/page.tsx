'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Search, Loader2, Shield, ThumbsUp, ThumbsDown, AlertTriangle,
  MessageSquare, Star, TrendingUp, Save, FileText, Sparkles,
  Package, DollarSign, Tag, BarChart3, Bookmark,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, RadarChart, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Radar,
} from 'recharts';
import { supabase } from '@/lib/supabase-client';
import { useAuth } from '@/lib/auth-context';
import { analyzeProduct } from '@/lib/ai-service';
import { toast } from 'sonner';
import type { Analysis, Product, RecommendationLevel } from '@/lib/types';

const recommendationConfig: Record<RecommendationLevel, { label: string; color: string; bg: string }> = {
  highly_recommended: { label: 'Highly Recommended', color: 'text-success', bg: 'bg-success/20 border-success/30' },
  recommended: { label: 'Recommended', color: 'text-primary', bg: 'bg-primary/20 border-primary/30' },
  consider_alternatives: { label: 'Consider Alternatives', color: 'text-warning', bg: 'bg-warning/20 border-warning/30' },
  avoid: { label: 'Avoid', color: 'text-destructive', bg: 'bg-destructive/20 border-destructive/30' },
};

const platformLogos: Record<string, string> = {
  Amazon: '🛒', Flipkart: '🛍️', Meesho: '👗', Myntra: '👕',
  eBay: '🏬', Walmart: '🛒', 'Best Buy': '🔌', AliExpress: '🌐',
  'App Store': '📱', 'Google Play': '📲',
};

export default function AnalyzePageWrapper() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}>
      <AnalyzePage />
    </Suspense>
  );
}

function AnalyzePage() {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [url, setUrl] = useState('');
  const [productName, setProductName] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    product: Partial<Product>;
    analysis: Omit<Analysis, 'id' | 'product_id' | 'user_id' | 'created_at'>;
  } | null>(null);
  const [saved, setSaved] = useState(false);
  const [savedAnalysisId, setSavedAnalysisId] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);

  const loadExistingAnalysis = useCallback(async (analysisId: string) => {
    if (!user) return;
    const { data } = await supabase
      .from('analyses')
      .select(`*, product:products(*)`)
      .eq('id', analysisId)
      .maybeSingle();

    if (data) {
      const analysis = data as unknown as Analysis & { product: Product };
      setResult({
        product: analysis.product,
        analysis: {
          trust_score: analysis.trust_score,
          recommendation: analysis.recommendation,
          sentiment_positive: analysis.sentiment_positive,
          sentiment_neutral: analysis.sentiment_neutral,
          sentiment_negative: analysis.sentiment_negative,
          summary: analysis.summary,
          positive_highlights: analysis.positive_highlights,
          negative_highlights: analysis.negative_highlights,
          common_complaints: analysis.common_complaints,
          fake_review_flags: analysis.fake_review_flags,
          fake_review_percentage: analysis.fake_review_percentage,
          topics: analysis.topics,
        },
      });
      setSavedAnalysisId(analysisId);
      setSaved(true);
    }
  }, [user]);

  useEffect(() => {
    const id = searchParams.get('id');
    if (id) {
      loadExistingAnalysis(id);
    }
  }, [searchParams, loadExistingAnalysis]);

  const handleAnalyze = async () => {
    if (!url && !productName) {
      toast.error('Please enter a product URL or name');
      return;
    }

    setLoading(true);
    setSaved(false);
    setSavedAnalysisId(null);

    await new Promise((r) => setTimeout(r, 1500));

    const name = productName || url.split('/').filter(Boolean).pop()?.replace(/-/g, ' ') || 'Unknown Product';
    const analysisResult = analyzeProduct({
      productName: name,
      productUrl: url || undefined,
    });

    setResult(analysisResult);
    setLoading(false);
    toast.success('Analysis complete!');
  };

  const handleSave = async () => {
    if (!user || !result) return;

    const { data: productData } = await supabase
      .from('products')
      .insert({
        user_id: user.id,
        name: result.product.name,
        url: result.product.url,
        image_url: result.product.image_url,
        category: result.product.category,
        price: result.product.price,
        rating: result.product.rating,
        review_count: result.product.review_count,
        platform: result.product.platform,
      })
      .select()
      .single();

    if (!productData) {
      toast.error('Failed to save product');
      return;
    }

    const { data: analysisData } = await supabase
      .from('analyses')
      .insert({
        product_id: productData.id,
        user_id: user.id,
        trust_score: result.analysis.trust_score,
        recommendation: result.analysis.recommendation,
        sentiment_positive: result.analysis.sentiment_positive,
        sentiment_neutral: result.analysis.sentiment_neutral,
        sentiment_negative: result.analysis.sentiment_negative,
        summary: result.analysis.summary,
        positive_highlights: result.analysis.positive_highlights,
        negative_highlights: result.analysis.negative_highlights,
        common_complaints: result.analysis.common_complaints,
        fake_review_flags: result.analysis.fake_review_flags,
        fake_review_percentage: result.analysis.fake_review_percentage,
        topics: result.analysis.topics,
      })
      .select()
      .single();

    if (analysisData) {
      setSavedAnalysisId(analysisData.id);
      setSaved(true);
      toast.success('Analysis saved to your dashboard');
    }
  };

  const handleSaveReport = async () => {
    if (!user || !savedAnalysisId || !result) return;

    const { error } = await supabase
      .from('reports')
      .insert({
        analysis_id: savedAnalysisId,
        user_id: user.id,
        title: `${result.product.name} - Analysis Report`,
      });

    if (error) {
      toast.error('Failed to save report');
    } else {
      toast.success('Report saved! View it in the Reports section.');
    }
  };

  const handleFavorite = async () => {
    if (!user || !savedAnalysisId) return;
    const { error } = await supabase
      .from('saved_products')
      .insert({
        user_id: user.id,
        product_id: (result?.product as Product)?.id || '',
      });
    if (error) {
      toast.error('Save product as favorite first by saving the analysis');
    } else {
      setIsFavorite(true);
      toast.success('Added to saved products');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="relative">
          <div className="w-20 h-20 rounded-full border-4 border-primary/20" />
          <div className="w-20 h-20 rounded-full border-4 border-transparent border-t-primary animate-spin absolute inset-0" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Brain className="w-8 h-8 text-primary" />
          </div>
        </div>
        <h3 className="mt-6 text-lg font-semibold">Analyzing product...</h3>
        <p className="text-sm text-muted-foreground mt-2">Running AI analysis on reviews</p>
        <div className="mt-6 space-y-2 w-full max-w-md">
          {['Fetching product details', 'Processing reviews with NLP', 'Detecting fake reviews', 'Analyzing sentiment', 'Calculating trust score'].map((step, i) => (
            <div key={step} className="flex items-center gap-2 text-sm text-muted-foreground" style={{ animationDelay: `${i * 0.3}s` }}>
              <Loader2 className="w-3 h-3 animate-spin" />
              {step}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Analyze a Product</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Enter a product URL or name to get instant AI-powered analysis.
        </p>
      </div>

      {/* Input Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Product URL</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Paste Amazon, Flipkart, eBay, or any product URL..."
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="flex-1 h-px bg-border" />
              OR
              <div className="flex-1 h-px bg-border" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Product Name</label>
              <Input
                placeholder="e.g., iPhone 15 Pro, Sony WH-1000XM5..."
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
              />
            </div>

            <Button onClick={handleAnalyze} className="w-full" disabled={loading || (!url && !productName)}>
              <Sparkles className="w-4 h-4 mr-2" /> Start AI Analysis
            </Button>

            <div className="flex flex-wrap gap-2 pt-2">
              {['Amazon', 'Flipkart', 'eBay', 'Walmart', 'App Store', 'Google Play'].map((p) => (
                <Badge key={p} variant="outline" className="text-xs">
                  {platformLogos[p] || '🔗'} {p}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <div className="space-y-6 animate-fade-in-up">
          {/* Product Info */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-6">
                <div className="w-full sm:w-32 h-32 rounded-xl bg-muted flex items-center justify-center shrink-0">
                  <Package className="w-12 h-12 text-muted-foreground" />
                </div>
                <div className="flex-1 space-y-3">
                  <div>
                    <h2 className="text-xl font-bold">{result.product.name}</h2>
                    <div className="flex items-center gap-2 mt-1">
                      {result.product.platform && (
                        <Badge variant="outline" className="text-xs">
                          {platformLogos[result.product.platform] || '🔗'} {result.product.platform}
                        </Badge>
                      )}
                      {result.product.category && (
                        <Badge variant="outline" className="text-xs">
                          <Tag className="w-3 h-3 mr-1" /> {result.product.category}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Rating</p>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-warning text-warning" />
                        <span className="text-sm font-semibold">{result.product.rating?.toFixed(1)}</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Reviews</p>
                      <p className="text-sm font-semibold">{result.product.review_count?.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Price</p>
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3 text-muted-foreground" />
                        <span className="text-sm font-semibold">{result.product.price?.toFixed(2) || 'N/A'}</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Trust Score</p>
                      <p className="text-sm font-bold text-gradient-blue">{result.analysis.trust_score}/100</p>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button onClick={handleSave} variant={saved ? 'outline' : 'default'} size="sm">
                      <Save className="w-4 h-4 mr-2" /> {saved ? 'Saved' : 'Save Analysis'}
                    </Button>
                    {saved && (
                      <>
                        <Button onClick={handleSaveReport} variant="outline" size="sm">
                          <FileText className="w-4 h-4 mr-2" /> Save Report
                        </Button>
                        <Button onClick={handleFavorite} variant="outline" size="sm" disabled={isFavorite}>
                          <Bookmark className="w-4 h-4 mr-2" /> {isFavorite ? 'Favorited' : 'Favorite'}
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Trust Score & Recommendation */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" /> Trust Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-4">
                  <div className="relative inline-flex items-center justify-center">
                    <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
                      <circle cx="60" cy="60" r="52" fill="none" stroke="hsl(var(--muted))" strokeWidth="10" />
                      <circle
                        cx="60" cy="60" r="52" fill="none"
                        stroke={
                          result.analysis.trust_score >= 75 ? 'hsl(var(--success))' :
                          result.analysis.trust_score >= 55 ? 'hsl(var(--primary))' :
                          result.analysis.trust_score >= 35 ? 'hsl(var(--warning))' :
                          'hsl(var(--destructive))'
                        }
                        strokeWidth="10"
                        strokeDasharray={`${(result.analysis.trust_score / 100) * 327} 327`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-4xl font-bold">{result.analysis.trust_score}</span>
                      <span className="text-xs text-muted-foreground">out of 100</span>
                    </div>
                  </div>
                  <div className={`mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full border ${recommendationConfig[result.analysis.recommendation].bg}`}>
                    <Badge className={`${recommendationConfig[result.analysis.recommendation].color} border-0`}>
                      {recommendationConfig[result.analysis.recommendation].label}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Summary */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" /> AI Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-muted-foreground">{result.analysis.summary}</p>

                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-semibold text-success mb-2 flex items-center gap-1">
                      <ThumbsUp className="w-4 h-4" /> Positive Highlights
                    </h4>
                    <ul className="space-y-1.5">
                      {result.analysis.positive_highlights.map((h, i) => (
                        <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                          <span className="text-success mt-0.5">+</span> {h}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-destructive mb-2 flex items-center gap-1">
                      <ThumbsDown className="w-4 h-4" /> Negative Highlights
                    </h4>
                    <ul className="space-y-1.5">
                      {result.analysis.negative_highlights.map((h, i) => (
                        <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                          <span className="text-destructive mt-0.5">-</span> {h}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Analysis Tabs */}
          <Tabs defaultValue="sentiment" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
              <TabsTrigger value="sentiment">Sentiment</TabsTrigger>
              <TabsTrigger value="complaints">Complaints</TabsTrigger>
              <TabsTrigger value="fake">Fake Reviews</TabsTrigger>
              <TabsTrigger value="topics">Topics</TabsTrigger>
            </TabsList>

            {/* Sentiment Tab */}
            <TabsContent value="sentiment" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Sentiment Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Positive', value: result.analysis.sentiment_positive, color: 'hsl(var(--chart-4))' },
                            { name: 'Neutral', value: result.analysis.sentiment_neutral, color: 'hsl(var(--chart-3))' },
                            { name: 'Negative', value: result.analysis.sentiment_negative, color: 'hsl(var(--chart-5))' },
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {[
                            { name: 'Positive', value: result.analysis.sentiment_positive, color: 'hsl(var(--chart-4))' },
                            { name: 'Neutral', value: result.analysis.sentiment_neutral, color: 'hsl(var(--chart-3))' },
                            { name: 'Negative', value: result.analysis.sentiment_negative, color: 'hsl(var(--chart-5))' },
                          ].map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Sentiment Scores</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-6">
                    <SentimentBar label="Positive" value={result.analysis.sentiment_positive} color="bg-success" />
                    <SentimentBar label="Neutral" value={result.analysis.sentiment_neutral} color="bg-accent" />
                    <SentimentBar label="Negative" value={result.analysis.sentiment_negative} color="bg-destructive" />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Complaints Tab */}
            <TabsContent value="complaints" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-warning" /> Common Complaints
                  </CardTitle>
                  <CardDescription>Repeated issues identified across negative reviews</CardDescription>
                </CardHeader>
                <CardContent>
                  {result.analysis.common_complaints.length > 0 ? (
                    <div className="space-y-3">
                      {result.analysis.common_complaints.map((complaint, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-warning/5 border border-warning/10">
                          <div className="w-6 h-6 rounded-full bg-warning/20 flex items-center justify-center shrink-0 text-xs font-semibold text-warning">
                            {i + 1}
                          </div>
                          <p className="text-sm">{complaint}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No recurring complaints detected in the reviews.
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Fake Review Tab */}
            <TabsContent value="fake" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Shield className="w-5 h-5 text-primary" /> Fake Review Detection
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-4">
                      <div className="text-5xl font-bold text-gradient-blue">
                        {result.analysis.fake_review_percentage}%
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">Potentially fake reviews detected</p>
                    </div>
                    <Progress
                      value={result.analysis.fake_review_percentage}
                      className={`mt-4 ${
                        result.analysis.fake_review_percentage > 30 ? '[&>div]:bg-destructive' :
                        result.analysis.fake_review_percentage > 15 ? '[&>div]:bg-warning' :
                        '[&>div]:bg-success'
                      }`}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Detection Flags</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {Object.entries(result.analysis.fake_review_flags).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground capitalize">
                          {key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}
                        </span>
                        <Badge variant={value === true ? 'destructive' : value === false ? 'outline' : 'secondary'} className="text-xs">
                          {String(value)}
                        </Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Topics Tab */}
            <TabsContent value="topics" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Topic Analysis</CardTitle>
                    <CardDescription>Key topics mentioned in reviews</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={result.analysis.topics} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <YAxis dataKey="topic" type="category" stroke="hsl(var(--muted-foreground))" fontSize={11} width={100} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                          }}
                        />
                        <Bar dataKey="weight" radius={[0, 8, 8, 0]}>
                          {result.analysis.topics.map((topic, i) => (
                            <Cell
                              key={`topic-${i}`}
                              fill={
                                topic.sentiment === 'positive' ? 'hsl(var(--chart-4))' :
                                topic.sentiment === 'negative' ? 'hsl(var(--chart-5))' :
                                'hsl(var(--chart-3))'
                              }
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Sentiment by Topic</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <RadarChart data={result.analysis.topics}>
                        <PolarGrid stroke="hsl(var(--border))" />
                        <PolarAngleAxis dataKey="topic" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                        <PolarRadiusAxis stroke="hsl(var(--muted-foreground))" fontSize={10} />
                        <Radar name="Mentions" dataKey="weight" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                          }}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}

function SentimentBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold">{value.toFixed(1)}%</span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all duration-500`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function Brain({ className }: { className?: string }) {
  return <Sparkles className={className} />;
}
