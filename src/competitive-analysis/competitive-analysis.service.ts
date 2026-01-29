import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AnalyzeCompetitorsDto, AnalysisDepth } from './dto/analyze-competitors.dto';
import { AnalysisStatus } from '@prisma/client';
import axios from 'axios';

interface Competitor {
  name: string;
  website?: string;
  address?: string;
  phone?: string;
  rating?: number;
  reviewCount?: number;
  placeId?: string;
  distance?: number; // in km
  seoScore?: number;
  domainAuthority?: number;
  backlinks?: number;
  keywords?: string[];
}

interface SEOInsights {
  averageDomainAuthority: number;
  averageBacklinks: number;
  topKeywords: string[];
  gapOpportunities: string[];
  marketSaturation: 'LOW' | 'MEDIUM' | 'HIGH';
}

interface Recommendation {
  category: 'SEO' | 'CONTENT' | 'LOCAL' | 'TECHNICAL' | 'SOCIAL';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  description: string;
  actionItems: string[];
  estimatedImpact: string;
}

@Injectable()
export class CompetitiveAnalysisService {
  private readonly logger = new Logger(CompetitiveAnalysisService.name);

  constructor(private readonly prisma: PrismaService) {}

  async analyzeCompetitors(accountId: string, dto: AnalyzeCompetitorsDto) {
    const startTime = Date.now();

    // Create initial analysis record
    const analysis = await this.prisma.competitiveAnalysis.create({
      data: {
        accountId,
        businessNiche: dto.businessNiche,
        businessName: dto.businessName,
        location: dto.location,
        latitude: dto.latitude,
        longitude: dto.longitude,
        radiusKm: dto.radiusKm || 10,
        depth: dto.depth || AnalysisDepth.STANDARD,
        status: AnalysisStatus.PROCESSING,
        competitors: [],
        totalFound: 0,
      },
    });

    try {
      // Step 1: Find competitors
      const competitors = await this.findCompetitors(dto);

      // Step 2: Analyze SEO (if STANDARD or DEEP)
      let seoInsights: SEOInsights | null = null;
      if (dto.depth !== AnalysisDepth.QUICK) {
        seoInsights = await this.analyzeSEO(competitors, dto.businessNiche);
      }

      // Step 3: Generate recommendations (if DEEP)
      let recommendations: Recommendation[] | null = null;
      if (dto.depth === AnalysisDepth.DEEP) {
        recommendations = await this.generateRecommendations(
          competitors,
          seoInsights,
          dto,
        );
      }

      // Step 4: Analyze rankings
      const rankings = await this.analyzeRankings(dto.businessNiche, dto.location);

      const processingTime = Date.now() - startTime;

      // Update analysis with results
      const completed = await this.prisma.competitiveAnalysis.update({
        where: { id: analysis.id },
        data: {
          status: AnalysisStatus.COMPLETED,
          competitors: competitors as any,
          totalFound: competitors.length,
          seoInsights: seoInsights as any,
          rankings: rankings as any,
          recommendations: recommendations as any,
          processingTimeMs: processingTime,
        },
      });

      this.logger.log(
        `Analysis completed in ${processingTime}ms - found ${competitors.length} competitors`,
      );

      return completed;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(`Analysis failed: ${errorMessage}`, errorStack);

      await this.prisma.competitiveAnalysis.update({
        where: { id: analysis.id },
        data: {
          status: AnalysisStatus.FAILED,
          errorMessage,
          processingTimeMs: Date.now() - startTime,
        },
      });

      throw error;
    }
  }

  private async findCompetitors(dto: AnalyzeCompetitorsDto): Promise<Competitor[]> {
    const competitors: Competitor[] = [];

    // Use Google Places API if we have location data
    if (dto.location || (dto.latitude && dto.longitude)) {
      const placesCompetitors = await this.findCompetitorsViaMaps(dto);
      competitors.push(...placesCompetitors);
    }

    // Also do a web search for online competitors
    const webCompetitors = await this.findCompetitorsViaWebSearch(dto);
    competitors.push(...webCompetitors);

    // Remove duplicates based on website domain
    const uniqueCompetitors = this.deduplicateCompetitors(competitors);

    // Limit to maxCompetitors
    const limit = dto.maxCompetitors || 10;
    return uniqueCompetitors.slice(0, limit);
  }

  private async findCompetitorsViaMaps(
    dto: AnalyzeCompetitorsDto,
  ): Promise<Competitor[]> {
    // This would integrate with Google Places API
    // For now, return mock data structure
    this.logger.log(`Finding local competitors for ${dto.businessNiche}`);

    const googleApiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!googleApiKey) {
      this.logger.warn('Google Maps API key not configured - skipping local search');
      return [];
    }

    try {
      // Construct search query
      let location: string;
      if (dto.latitude && dto.longitude) {
        location = `${dto.latitude},${dto.longitude}`;
      } else {
        // Geocode the location string first
        const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(dto.location!)}&key=${googleApiKey}`;
        const geocodeRes = await axios.get(geocodeUrl);

        if (geocodeRes.data.results.length === 0) {
          this.logger.warn(`Could not geocode location: ${dto.location}`);
          return [];
        }

        const { lat, lng } = geocodeRes.data.results[0].geometry.location;
        location = `${lat},${lng}`;
      }

      // Search for nearby places
      const radius = (dto.radiusKm || 10) * 1000; // Convert to meters
      const placesUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${location}&radius=${radius}&keyword=${encodeURIComponent(dto.businessNiche)}&key=${googleApiKey}`;

      const placesRes = await axios.get(placesUrl);

      const competitors: Competitor[] = placesRes.data.results.map(
        (place: any) => ({
          name: place.name,
          address: place.vicinity,
          rating: place.rating,
          reviewCount: place.user_ratings_total,
          placeId: place.place_id,
          // Calculate distance if we have coordinates
          distance: dto.latitude && dto.longitude
            ? this.calculateDistance(
                dto.latitude,
                dto.longitude,
                place.geometry.location.lat,
                place.geometry.location.lng,
              )
            : undefined,
        }),
      );

      this.logger.log(`Found ${competitors.length} local competitors via Google Maps`);
      return competitors;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Google Maps API error: ${errorMessage}`);
      return [];
    }
  }

  private async findCompetitorsViaWebSearch(
    dto: AnalyzeCompetitorsDto,
  ): Promise<Competitor[]> {
    this.logger.log(`Finding online competitors for ${dto.businessNiche}`);

    // This would integrate with Google Custom Search API or SerpAPI
    // For now, return empty array - can be extended with actual API integration
    const serpApiKey = process.env.SERP_API_KEY;
    if (!serpApiKey) {
      this.logger.warn('SERP API key not configured - skipping web search');
      return [];
    }

    try {
      const query = dto.location
        ? `${dto.businessNiche} ${dto.location}`
        : dto.businessNiche;

      const serpUrl = `https://serpapi.com/search.json?q=${encodeURIComponent(query)}&api_key=${serpApiKey}&num=10`;

      const serpRes = await axios.get(serpUrl);

      const competitors: Competitor[] = (serpRes.data.organic_results || []).map(
        (result: any) => ({
          name: result.title,
          website: result.link,
          keywords: [dto.businessNiche],
        }),
      );

      this.logger.log(`Found ${competitors.length} competitors via web search`);
      return competitors;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Web search error: ${errorMessage}`);
      return [];
    }
  }

  private deduplicateCompetitors(competitors: Competitor[]): Competitor[] {
    const seen = new Set<string>();
    const unique: Competitor[] = [];

    for (const competitor of competitors) {
      const key = competitor.website
        ? new URL(competitor.website).hostname
        : competitor.name.toLowerCase().trim();

      if (!seen.has(key)) {
        seen.add(key);
        unique.push(competitor);
      }
    }

    return unique;
  }

  private async analyzeSEO(
    competitors: Competitor[],
    niche: string,
  ): Promise<SEOInsights> {
    this.logger.log('Analyzing SEO metrics for competitors');

    // This would integrate with SEO APIs like Moz, Ahrefs, or SEMrush
    // For now, return mock insights
    const competitorsWithWebsites = competitors.filter((c) => c.website);

    // Calculate average metrics (would be real data from API)
    const averageDomainAuthority = 45; // Mock value
    const averageBacklinks = 1250; // Mock value

    // Extract common keywords
    const allKeywords = competitors.flatMap((c) => c.keywords || []);
    const keywordFrequency = new Map<string, number>();

    for (const keyword of allKeywords) {
      keywordFrequency.set(keyword, (keywordFrequency.get(keyword) || 0) + 1);
    }

    const topKeywords = Array.from(keywordFrequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([keyword]) => keyword);

    // Identify gap opportunities
    const gapOpportunities = [
      `${niche} near me`,
      `best ${niche}`,
      `${niche} reviews`,
      `affordable ${niche}`,
      `top rated ${niche}`,
    ];

    // Determine market saturation
    const saturation =
      competitorsWithWebsites.length > 20
        ? 'HIGH'
        : competitorsWithWebsites.length > 10
          ? 'MEDIUM'
          : 'LOW';

    return {
      averageDomainAuthority,
      averageBacklinks,
      topKeywords,
      gapOpportunities,
      marketSaturation: saturation as 'LOW' | 'MEDIUM' | 'HIGH',
    };
  }

  private async analyzeRankings(niche: string, location?: string) {
    this.logger.log('Analyzing search rankings');

    // This would check actual Google rankings for key terms
    // For now, return mock data
    return {
      keywordRankings: [
        { keyword: niche, position: null, url: null },
        { keyword: `${niche} ${location || ''}`.trim(), position: null, url: null },
        { keyword: `best ${niche}`, position: null, url: null },
      ],
      localPackRanking: null,
      lastChecked: new Date().toISOString(),
    };
  }

  private async generateRecommendations(
    competitors: Competitor[],
    seoInsights: SEOInsights | null,
    dto: AnalyzeCompetitorsDto,
  ): Promise<Recommendation[]> {
    this.logger.log('Generating AI-powered recommendations');

    const recommendations: Recommendation[] = [];

    // Local SEO recommendations
    if (dto.location) {
      recommendations.push({
        category: 'LOCAL',
        priority: 'HIGH',
        title: 'Optimize Google Business Profile',
        description:
          'Claim and optimize your Google Business Profile to appear in local search results and Google Maps.',
        actionItems: [
          'Claim your Google Business Profile listing',
          'Add high-quality photos (at least 10)',
          'Collect and respond to customer reviews',
          'Post weekly updates about your business',
          'Add all relevant business categories',
        ],
        estimatedImpact: 'Can improve local visibility by 50-80% within 3 months',
      });
    }

    // Content recommendations based on gap analysis
    if (seoInsights?.gapOpportunities.length) {
      recommendations.push({
        category: 'CONTENT',
        priority: 'HIGH',
        title: 'Target Untapped Keywords',
        description: `Create content targeting keywords with low competition: ${seoInsights.gapOpportunities.slice(0, 3).join(', ')}`,
        actionItems: [
          `Write blog posts about "${seoInsights.gapOpportunities[0]}"`,
          'Create FAQ pages answering common customer questions',
          'Add location-specific landing pages',
          'Optimize existing pages for long-tail keywords',
        ],
        estimatedImpact: 'Can increase organic traffic by 30-50% within 6 months',
      });
    }

    // Backlink recommendations
    if (seoInsights && seoInsights.averageBacklinks > 100) {
      recommendations.push({
        category: 'SEO',
        priority: 'MEDIUM',
        title: 'Build High-Quality Backlinks',
        description: `Competitors average ${seoInsights.averageBacklinks} backlinks. Focus on earning quality backlinks to improve domain authority.`,
        actionItems: [
          'Get listed in local business directories',
          'Partner with complementary local businesses',
          'Create shareable content (guides, infographics)',
          'Reach out to local news sites and blogs',
        ],
        estimatedImpact: 'Can improve search rankings by 10-20 positions within 6-12 months',
      });
    }

    // Technical SEO
    recommendations.push({
      category: 'TECHNICAL',
      priority: 'HIGH',
      title: 'Optimize Website Technical SEO',
      description:
        'Ensure your website is technically optimized for search engines and provides excellent user experience.',
      actionItems: [
        'Improve page load speed (target <3 seconds)',
        'Make website mobile-responsive',
        'Add schema markup for rich snippets',
        'Fix broken links and 404 errors',
        'Implement HTTPS security',
      ],
      estimatedImpact: 'Can improve search rankings by 5-15 positions',
    });

    // Social recommendations
    recommendations.push({
      category: 'SOCIAL',
      priority: 'MEDIUM',
      title: 'Strengthen Social Media Presence',
      description:
        'Active social media profiles can improve brand visibility and drive traffic to your website.',
      actionItems: [
        'Post consistently (at least 3x per week)',
        'Engage with followers and respond to comments',
        'Share customer testimonials and success stories',
        'Use local hashtags to increase visibility',
        'Run local promotions and contests',
      ],
      estimatedImpact: 'Can increase brand awareness by 40-60% within 3 months',
    });

    return recommendations;
  }

  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    // Haversine formula to calculate distance between two points
    const R = 6371; // Earth's radius in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) *
        Math.cos(this.deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return Math.round(distance * 10) / 10; // Round to 1 decimal place
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  async listAnalyses(accountId: string, limit = 20, offset = 0) {
    const analyses = await this.prisma.competitiveAnalysis.findMany({
      where: { accountId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      select: {
        id: true,
        businessNiche: true,
        businessName: true,
        location: true,
        status: true,
        totalFound: true,
        depth: true,
        createdAt: true,
        processingTimeMs: true,
      },
    });

    const total = await this.prisma.competitiveAnalysis.count({
      where: { accountId },
    });

    return { items: analyses, total, limit, offset };
  }

  async getAnalysis(accountId: string, analysisId: string) {
    const analysis = await this.prisma.competitiveAnalysis.findFirst({
      where: {
        id: analysisId,
        accountId,
      },
    });

    if (!analysis) {
      throw new Error(`Analysis ${analysisId} not found`);
    }

    return analysis;
  }

  async deleteAnalysis(accountId: string, analysisId: string) {
    await this.prisma.competitiveAnalysis.delete({
      where: {
        id: analysisId,
        accountId,
      },
    });

    return { success: true };
  }
}
