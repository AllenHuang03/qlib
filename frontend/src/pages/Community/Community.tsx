import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Avatar,
  Chip,
  Button,
  IconButton,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  alpha,
  useTheme,
} from '@mui/material';
import {
  TrendingUp,
  Star,
  People,
  ContentCopy,
  Favorite,
  FavoriteBorder,
  ChatBubbleOutline,
  Share,
  EmojiEvents,
  Timeline,
  AutoAwesome,
} from '@mui/icons-material';

interface User {
  id: string;
  name: string;
  avatar: string;
  location: string;
  joinedDate: string;
  totalReturn: number;
  monthlyReturn: number;
  followers: number;
  following: number;
  aiModelsUsed: number;
  winRate: number;
}

interface Post {
  id: string;
  user: User;
  timestamp: string;
  type: 'win' | 'strategy' | 'tip';
  content: string;
  symbol?: string;
  profit?: number;
  likes: number;
  comments: number;
  liked: boolean;
}

interface TopPerformer extends User {
  rank: number;
  badge: string;
}

const Community: React.FC = () => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());

  const topPerformers: TopPerformer[] = [
    {
      id: '1',
      name: 'Sarah Chen',
      avatar: 'SC',
      location: 'San Francisco, CA',
      joinedDate: 'Jan 2024',
      totalReturn: 34.7,
      monthlyReturn: 12.4,
      followers: 2340,
      following: 89,
      aiModelsUsed: 3,
      winRate: 89,
      rank: 1,
      badge: '🏆 Top Performer',
    },
    {
      id: '2',
      name: 'Mike Rodriguez',
      avatar: 'MR',
      location: 'Austin, TX',
      joinedDate: 'Feb 2024',
      totalReturn: 28.9,
      monthlyReturn: 9.7,
      followers: 1840,
      following: 156,
      aiModelsUsed: 2,
      winRate: 84,
      rank: 2,
      badge: '🥈 Rising Star',
    },
    {
      id: '3',
      name: 'Jennifer Park',
      avatar: 'JP',
      location: 'Seattle, WA',
      joinedDate: 'Dec 2023',
      totalReturn: 31.2,
      monthlyReturn: 8.9,
      followers: 1650,
      following: 203,
      aiModelsUsed: 4,
      winRate: 91,
      rank: 3,
      badge: '🥉 Consistent Winner',
    },
  ];

  const communityFeed: Post[] = [
    {
      id: '1',
      user: topPerformers[0],
      timestamp: '2 hours ago',
      type: 'win',
      content: 'Just hit my biggest win yet! AI Stock Picker #1 found AAPL at the perfect moment. The AI explanation feature helped me understand why it was such a good pick.',
      symbol: 'AAPL',
      profit: 2340,
      likes: 89,
      comments: 23,
      liked: false,
    },
    {
      id: '2',
      user: topPerformers[1],
      timestamp: '5 hours ago',
      type: 'strategy',
      content: 'Pro tip: I combine the Conservative Growth AI with Value Hunter AI for more stable returns. Been working great for 3 months now!',
      likes: 156,
      comments: 45,
      liked: false,
    },
    {
      id: '3',
      user: topPerformers[2],
      timestamp: '1 day ago',
      type: 'win',
      content: 'Paper trading helped me gain confidence before investing real money. Now my portfolio is up 31%! Thanks to this amazing community.',
      profit: 1890,
      likes: 203,
      comments: 67,
      liked: true,
    },
    {
      id: '4',
      user: {
        ...topPerformers[0],
        name: 'Alex Thompson',
        avatar: 'AT',
        location: 'Denver, CO',
      },
      timestamp: '2 days ago',
      type: 'tip',
      content: 'Remember to always check the AI explanation before following any recommendation. The confidence score really matters!',
      likes: 91,
      comments: 18,
      liked: false,
    },
  ];

  const recentActivity = [
    { user: 'Sarah Chen', action: 'made $450 with AI Pick #2', time: '5 min ago' },
    { user: 'Mike Rodriguez', action: 'started following your strategy', time: '12 min ago' },
    { user: 'Jennifer Park', action: 'shared a new trading tip', time: '25 min ago' },
    { user: 'Alex Thompson', action: 'copied your AI model setup', time: '1 hour ago' },
    { user: 'Lisa Wang', action: 'made $230 with MSFT pick', time: '2 hours ago' },
  ];

  const handleLike = (postId: string) => {
    const newLikedPosts = new Set(likedPosts);
    if (newLikedPosts.has(postId)) {
      newLikedPosts.delete(postId);
    } else {
      newLikedPosts.add(postId);
    }
    setLikedPosts(newLikedPosts);
  };

  const handleCopyStrategy = (userId: string, userName: string) => {
    console.log(`Copying ${userName}'s strategy`);
    // Show confirmation modal
  };

  const renderPost = (post: Post) => (
    <Card key={post.id} sx={{ mb: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar sx={{ bgcolor: '#4CAF50', mr: 2 }}>
            {post.user.avatar}
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="subtitle1" fontWeight={600}>
                {post.user.name}
              </Typography>
              {post.user.rank <= 3 && (
                <Chip
                  label={topPerformers.find(p => p.id === post.user.id)?.badge || ''}
                  size="small"
                  sx={{ bgcolor: alpha('#FFD700', 0.1), color: '#FF9800' }}
                />
              )}
            </Box>
            <Typography variant="body2" color="text.secondary">
              {post.user.location} • {post.timestamp}
            </Typography>
          </Box>
          <Button
            variant="outlined"
            size="small"
            startIcon={<ContentCopy />}
            onClick={() => handleCopyStrategy(post.user.id, post.user.name)}
          >
            Copy Strategy
          </Button>
        </Box>

        <Typography variant="body1" sx={{ mb: 2 }}>
          {post.content}
        </Typography>

        {post.profit && (
          <Card sx={{ mb: 2, bgcolor: alpha('#4CAF50', 0.05) }}>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <TrendingUp sx={{ color: '#4CAF50', mr: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    Profit from {post.symbol}
                  </Typography>
                </Box>
                <Typography variant="h6" fontWeight={600} sx={{ color: '#4CAF50' }}>
                  +${post.profit.toLocaleString()}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        )}

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button
            variant="text"
            size="small"
            startIcon={
              likedPosts.has(post.id) || post.liked ? (
                <Favorite sx={{ color: '#F44336' }} />
              ) : (
                <FavoriteBorder />
              )
            }
            onClick={() => handleLike(post.id)}
            sx={{ color: likedPosts.has(post.id) || post.liked ? '#F44336' : 'text.secondary' }}
          >
            {post.likes + (likedPosts.has(post.id) ? (post.liked ? 0 : 1) : (post.liked ? -1 : 0))}
          </Button>
          <Button
            variant="text"
            size="small"
            startIcon={<ChatBubbleOutline />}
            sx={{ color: 'text.secondary' }}
          >
            {post.comments}
          </Button>
          <Button
            variant="text"
            size="small"
            startIcon={<Share />}
            sx={{ color: 'text.secondary' }}
          >
            Share
          </Button>
        </Box>
      </CardContent>
    </Card>
  );

  const tabContent = () => {
    switch (activeTab) {
      case 0:
        return (
          <Box>
            {communityFeed.map(renderPost)}
          </Box>
        );
      case 1:
        return (
          <Box>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
              🏆 Top Performers This Month
            </Typography>
            {topPerformers.map((performer) => (
              <Card key={performer.id} sx={{ mb: 2 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography
                        variant="h4"
                        sx={{
                          color: performer.rank === 1 ? '#FFD700' : performer.rank === 2 ? '#C0C0C0' : '#CD7F32',
                          fontWeight: 700,
                          mr: 2,
                        }}
                      >
                        #{performer.rank}
                      </Typography>
                      <Avatar sx={{ bgcolor: '#4CAF50', mr: 2, width: 56, height: 56 }}>
                        {performer.avatar}
                      </Avatar>
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <Typography variant="h6" fontWeight={600}>
                            {performer.name}
                          </Typography>
                          <Chip
                            label={performer.badge}
                            size="small"
                            sx={{ bgcolor: alpha('#FFD700', 0.1), color: '#FF9800' }}
                          />
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          {performer.location} • {performer.followers.toLocaleString()} followers
                        </Typography>
                      </Box>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="h5" fontWeight={700} sx={{ color: '#4CAF50' }}>
                        +{performer.monthlyReturn}%
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        This month
                      </Typography>
                    </Box>
                  </Box>

                  <Grid container spacing={3} sx={{ mt: 2 }}>
                    <Grid item xs={6} md={3}>
                      <Typography variant="body2" color="text.secondary">
                        Total Return
                      </Typography>
                      <Typography variant="h6" fontWeight={600}>
                        +{performer.totalReturn}%
                      </Typography>
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <Typography variant="body2" color="text.secondary">
                        Win Rate
                      </Typography>
                      <Typography variant="h6" fontWeight={600}>
                        {performer.winRate}%
                      </Typography>
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <Typography variant="body2" color="text.secondary">
                        AI Models
                      </Typography>
                      <Typography variant="h6" fontWeight={600}>
                        {performer.aiModelsUsed}
                      </Typography>
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <Button
                        variant="contained"
                        size="small"
                        onClick={() => handleCopyStrategy(performer.id, performer.name)}
                        sx={{ bgcolor: '#4CAF50' }}
                      >
                        Follow
                      </Button>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            ))}
          </Box>
        );
      case 2:
        return (
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                📈 Live Activity Feed
              </Typography>
              <List>
                {recentActivity.map((activity, index) => (
                  <React.Fragment key={index}>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: alpha('#4CAF50', 0.1), color: '#4CAF50', width: 32, height: 32 }}>
                          <AutoAwesome fontSize="small" />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Typography variant="body2">
                            <strong>{activity.user}</strong> {activity.action}
                          </Typography>
                        }
                        secondary={activity.time}
                      />
                    </ListItem>
                    {index < recentActivity.length - 1 && <Divider variant="inset" component="li" />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        );
      default:
        return null;
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" sx={{ mb: 1 }}>
          Community
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Connect with successful investors • Share strategies • Learn together
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card sx={{ mb: 3 }}>
            <Tabs
              value={activeTab}
              onChange={(_, newValue) => setActiveTab(newValue)}
              sx={{ borderBottom: 1, borderColor: 'divider' }}
            >
              <Tab
                label="Community Feed"
                icon={<People />}
                iconPosition="start"
                sx={{ textTransform: 'none', fontWeight: 600 }}
              />
              <Tab
                label="Top Performers"
                icon={<EmojiEvents />}
                iconPosition="start"
                sx={{ textTransform: 'none', fontWeight: 600 }}
              />
              <Tab
                label="Live Activity"
                icon={<Timeline />}
                iconPosition="start"
                sx={{ textTransform: 'none', fontWeight: 600 }}
              />
            </Tabs>
          </Card>

          {tabContent()}
        </Grid>

        <Grid item xs={12} md={4}>
          {/* Community Stats */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                💪 Community Power
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="h4" fontWeight={700} sx={{ color: '#4CAF50' }}>
                    15.2K
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active Members
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="h4" fontWeight={700} sx={{ color: '#2196F3' }}>
                    $2.4M
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Profits Shared
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="h4" fontWeight={700} sx={{ color: '#FF9800' }}>
                    89%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Success Rate
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="h4" fontWeight={700} sx={{ color: '#9C27B0' }}>
                    1.8K
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Strategies Shared
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Join Community CTA */}
          <Card sx={{ bgcolor: 'linear-gradient(135deg, #4CAF50 0%, #2196F3 100%)' }}>
            <CardContent sx={{ textAlign: 'center', color: 'white' }}>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>
                🚀 Ready to Join the Winners?
              </Typography>
              <Typography variant="body2" sx={{ mb: 3, opacity: 0.9 }}>
                Share your wins, copy successful strategies, and grow with the community
              </Typography>
              <Button
                variant="contained"
                sx={{
                  bgcolor: 'white',
                  color: '#4CAF50',
                  fontWeight: 600,
                  '&:hover': { bgcolor: alpha('#ffffff', 0.9) },
                }}
              >
                Share Your First Win
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Community;