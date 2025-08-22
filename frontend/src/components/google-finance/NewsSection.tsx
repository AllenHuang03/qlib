/**
 * News Section Component
 * Google Finance style news integration
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardMedia,
  Grid,
  Chip,
  useTheme,
  alpha
} from '@mui/material';
import {
  Schedule,
  Article,
  TrendingUp
} from '@mui/icons-material';
import { navigationController } from '../../services/NavigationController';

interface NewsArticle {
  title: string;
  source: string;
  time: string;
  snippet: string;
  image: string;
  category: 'earnings' | 'market' | 'analysis' | 'general';
  sentiment: 'positive' | 'negative' | 'neutral';
}

interface NewsSectionProps {
  stock: string;
}

const NewsSection: React.FC<NewsSectionProps> = ({ stock }) => {
  const theme = useTheme();
  const [news, setNews] = useState<NewsArticle[]>([
    {
      title: "Commonwealth Bank reports strong quarterly earnings, beats expectations",
      source: "Australian Financial Review",
      time: "2 hours ago",
      snippet: "CBA delivered a cash earnings result of $2.6 billion for the December quarter, surpassing analyst expectations and demonstrating resilience in challenging market conditions.",
      image: "/api/placeholder/300/200",
      category: 'earnings',
      sentiment: 'positive'
    },
    {
      title: "Australian banking sector outlook remains positive despite headwinds",
      source: "Reuters",
      time: "4 hours ago", 
      snippet: "Major Australian banks including CBA continue to show strong fundamentals with robust capital positions and steady dividend yields attracting investors.",
      image: "/api/placeholder/300/200",
      category: 'market',
      sentiment: 'positive'
    },
    {
      title: "CBA announces new digital banking initiatives and AI integration",
      source: "Bloomberg",
      time: "6 hours ago",
      snippet: "The bank unveiled a comprehensive digital transformation strategy including AI-powered customer service and enhanced mobile banking features.",
      image: "/api/placeholder/300/200",
      category: 'general',
      sentiment: 'neutral'
    },
    {
      title: "Interest rate environment creates opportunities for major banks",
      source: "The Sydney Morning Herald",
      time: "8 hours ago",
      snippet: "Analysis suggests that the current interest rate environment may benefit established banks like CBA through improved net interest margins.",
      image: "/api/placeholder/300/200",
      category: 'analysis',
      sentiment: 'positive'
    },
    {
      title: "Banking regulation changes may impact major Australian lenders",
      source: "Financial Times",
      time: "1 day ago",
      snippet: "Proposed regulatory changes by APRA could affect how major banks including Commonwealth Bank structure their operations and capital requirements.",
      image: "/api/placeholder/300/200",
      category: 'market',
      sentiment: 'neutral'
    },
    {
      title: "CBA's mortgage book shows resilience amid housing market shifts",
      source: "The Australian",
      time: "1 day ago",
      snippet: "Despite fluctuations in the property market, Commonwealth Bank's mortgage portfolio continues to demonstrate strong performance metrics.",
      image: "/api/placeholder/300/200",
      category: 'analysis',
      sentiment: 'positive'
    }
  ]);

  const getCategoryColor = (category: NewsArticle['category']) => {
    switch (category) {
      case 'earnings': return theme.palette.success.main;
      case 'market': return theme.palette.primary.main;
      case 'analysis': return theme.palette.warning.main;
      default: return theme.palette.info.main;
    }
  };

  const getSentimentIcon = (sentiment: NewsArticle['sentiment']) => {
    switch (sentiment) {
      case 'positive': return '📈';
      case 'negative': return '📉';
      default: return '📊';
    }
  };

  const NewsCard: React.FC<{ article: NewsArticle; featured?: boolean }> = ({ 
    article, 
    featured = false 
  }) => (
    <Card
      elevation={0}
      onClick={() => navigationController.navigate('gf.news-article', { 
        article: article,
        featured: featured 
      })}
      sx={{
        cursor: 'pointer',
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 2,
        height: '100%',
        transition: 'all 0.2s ease',
        '&:hover': {
          backgroundColor: alpha(theme.palette.action.hover, 0.3),
          transform: 'translateY(-2px)',
          boxShadow: theme.shadows[4]
        }
      }}
    >
      {featured && (
        <CardMedia
          component="div"
          sx={{
            height: 200,
            backgroundColor: alpha(theme.palette.primary.main, 0.1),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative'
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              top: 12,
              right: 12,
              backgroundColor: alpha(theme.palette.background.paper, 0.9),
              borderRadius: 1,
              px: 1,
              py: 0.5
            }}
          >
            <Typography variant="caption" fontWeight={600}>
              FEATURED
            </Typography>
          </Box>
          
          <Article sx={{ fontSize: 48, color: 'text.secondary' }} />
        </CardMedia>
      )}
      
      <CardContent sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
          <Chip
            label={article.category.toUpperCase()}
            size="small"
            sx={{
              backgroundColor: alpha(getCategoryColor(article.category), 0.1),
              color: getCategoryColor(article.category),
              fontWeight: 600,
              fontSize: '10px',
              height: 20
            }}
          />
          
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {getSentimentIcon(article.sentiment)}
          </Typography>
        </Box>

        <Typography
          variant={featured ? "h6" : "subtitle2"}
          sx={{
            fontWeight: 600,
            color: 'text.primary',
            mb: 1,
            lineHeight: 1.4,
            fontSize: featured ? '18px' : '14px',
            display: '-webkit-box',
            WebkitLineClamp: featured ? 3 : 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}
        >
          {article.title}
        </Typography>
        
        {featured && (
          <Typography
            variant="body2"
            sx={{
              color: 'text.secondary',
              mb: 2,
              lineHeight: 1.5,
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}
          >
            {article.snippet}
          </Typography>
        )}

        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mt: 'auto'
          }}
        >
          <Typography
            variant="caption"
            sx={{
              color: 'primary.main',
              fontWeight: 500,
              fontSize: '12px'
            }}
          >
            {article.source}
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Schedule sx={{ fontSize: 12, color: 'text.secondary' }} />
            <Typography
              variant="caption"
              sx={{
                color: 'text.secondary',
                fontSize: '11px'
              }}
            >
              {article.time}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ mb: 4 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 3
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Article 
            sx={{ 
              color: 'primary.main',
              fontSize: 20
            }} 
          />
          <Typography
            variant="h6"
            sx={{
              fontWeight: 500,
              color: 'text.primary',
              fontSize: '18px'
            }}
          >
            Top news
          </Typography>
        </Box>

        <Chip
          icon={<TrendingUp />}
          label="Live Updates"
          size="small"
          color="success"
          variant="outlined"
          sx={{ fontWeight: 500 }}
        />
      </Box>

      <Grid container spacing={3}>
        {/* Featured Article */}
        <Grid item xs={12} md={8}>
          <NewsCard article={news[0]} featured />
        </Grid>

        {/* Side Articles */}
        <Grid item xs={12} md={4}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, height: '100%' }}>
            {news.slice(1, 3).map((article, index) => (
              <Box key={index} sx={{ flex: 1 }}>
                <NewsCard article={article} />
              </Box>
            ))}
          </Box>
        </Grid>

        {/* Additional Articles */}
        {news.slice(3).map((article, index) => (
          <Grid item xs={12} sm={6} md={4} key={index + 3}>
            <NewsCard article={article} />
          </Grid>
        ))}
      </Grid>

      {/* News Summary */}
      <Box
        sx={{
          mt: 3,
          p: 2,
          backgroundColor: alpha(theme.palette.success.main, 0.05),
          borderRadius: 2,
          border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`
        }}
      >
        <Typography
          variant="subtitle2"
          sx={{
            color: 'success.main',
            fontWeight: 600,
            mb: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 0.5
          }}
        >
          📊 News Sentiment Analysis
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Positive
            </Typography>
            <Typography variant="body2" color="success.main" fontWeight={600}>
              {news.filter(n => n.sentiment === 'positive').length} articles
            </Typography>
          </Box>
          
          <Box>
            <Typography variant="caption" color="text.secondary">
              Neutral
            </Typography>
            <Typography variant="body2" color="info.main" fontWeight={600}>
              {news.filter(n => n.sentiment === 'neutral').length} articles
            </Typography>
          </Box>
          
          <Box>
            <Typography variant="caption" color="text.secondary">
              Coverage
            </Typography>
            <Typography variant="body2" color="primary.main" fontWeight={600}>
              {news.length} total articles
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default NewsSection;