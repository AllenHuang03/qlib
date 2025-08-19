import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Badge,
  Avatar,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  Rating
} from '@mui/material';
import {
  ContactSupport,
  Assignment,
  Person,
  Schedule,
  TrendingUp,
  Warning,
  CheckCircle,
  Error,
  PriorityHigh,
  Email,
  Phone,
  Chat,
  ExpandMore,
  Visibility,
  Reply,
  Forward,
  Star,
  History,
  Search,
  FilterList,
  Assessment,
  Speed,
  ThumbUp,
  ThumbDown,
  TrendingUp as Escalate,
  Close,
  Refresh
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { StaffUser, SupportTicket, TicketResponse } from '../../types/staff';

interface SupportStaffDashboardProps {
  user: StaffUser;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`support-tabpanel-${index}`}
      aria-labelledby={`support-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

const SupportStaffDashboard: React.FC<SupportStaffDashboardProps> = ({ user }) => {
  const [tabValue, setTabValue] = useState(0);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [ticketDialogOpen, setTicketDialogOpen] = useState(false);
  const [responseText, setResponseText] = useState('');
  const [supportStats, setSupportStats] = useState<any>({});
  const [knowledgeBase, setKnowledgeBase] = useState<any[]>([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');

  useEffect(() => {
    // Mock support tickets data
    setTickets([
      {
        id: 'ticket_001',
        customerId: 'cust_001',
        customerName: 'Emma Wilson',
        customerEmail: 'newcustomer@test.com',
        subject: 'Unable to complete KYC verification',
        description: 'I uploaded my documents but the verification process seems stuck. It has been 3 days since submission.',
        category: 'account',
        priority: 'high',
        status: 'open',
        assignedTo: user.id,
        createdDate: '2024-08-19T09:30:00Z',
        lastUpdate: '2024-08-19T09:30:00Z',
        responses: [
          {
            id: 'resp_001',
            ticketId: 'ticket_001',
            authorId: 'cust_001',
            authorName: 'Emma Wilson',
            authorType: 'customer',
            message: 'I uploaded my documents but the verification process seems stuck. It has been 3 days since submission.',
            timestamp: '2024-08-19T09:30:00Z',
            isInternal: false
          }
        ],
        escalationLevel: 0,
        resolutionTime: undefined,
        customerSatisfaction: undefined
      },
      {
        id: 'ticket_002',
        customerId: 'cust_002',
        customerName: 'David Chen',
        customerEmail: 'verified@test.com',
        subject: 'Portfolio performance calculation seems incorrect',
        description: 'The returns shown in my dashboard do not match my manual calculations. Could you please verify?',
        category: 'trading',
        priority: 'medium',
        status: 'in_progress',
        assignedTo: user.id,
        createdDate: '2024-08-18T14:20:00Z',
        lastUpdate: '2024-08-19T10:15:00Z',
        responses: [
          {
            id: 'resp_002',
            ticketId: 'ticket_002',
            authorId: 'cust_002',
            authorName: 'David Chen',
            authorType: 'customer',
            message: 'The returns shown in my dashboard do not match my manual calculations. Could you please verify?',
            timestamp: '2024-08-18T14:20:00Z',
            isInternal: false
          },
          {
            id: 'resp_003',
            ticketId: 'ticket_002',
            authorId: user.id,
            authorName: user.name,
            authorType: 'staff',
            message: 'Thank you for reaching out. I am reviewing your portfolio calculations and will get back to you within 24 hours with a detailed explanation.',
            timestamp: '2024-08-19T10:15:00Z',
            isInternal: false
          }
        ],
        escalationLevel: 0,
        resolutionTime: undefined,
        customerSatisfaction: undefined
      },
      {
        id: 'ticket_003',
        customerId: 'cust_003',
        customerName: 'Sarah Martinez',
        customerEmail: 'premium@test.com',
        subject: 'API access request for institutional trading',
        description: 'I need API access to integrate our institutional trading system with Qlib. Please provide documentation and access credentials.',
        category: 'technical',
        priority: 'urgent',
        status: 'waiting_customer',
        assignedTo: user.id,
        createdDate: '2024-08-17T11:45:00Z',
        lastUpdate: '2024-08-18T16:30:00Z',
        responses: [
          {
            id: 'resp_004',
            ticketId: 'ticket_003',
            authorId: 'cust_003',
            authorName: 'Sarah Martinez',
            authorType: 'customer',
            message: 'I need API access to integrate our institutional trading system with Qlib. Please provide documentation and access credentials.',
            timestamp: '2024-08-17T11:45:00Z',
            isInternal: false
          },
          {
            id: 'resp_005',
            ticketId: 'ticket_003',
            authorId: user.id,
            authorName: user.name,
            authorType: 'staff',
            message: 'I have escalated your API access request to our technical team. Please provide your institutional verification documents and the specific API endpoints you need access to.',
            timestamp: '2024-08-18T16:30:00Z',
            isInternal: false
          }
        ],
        escalationLevel: 1,
        resolutionTime: undefined,
        customerSatisfaction: undefined
      },
      {
        id: 'ticket_004',
        customerId: 'cust_004',
        customerName: 'James Thompson',
        customerEmail: 'james.t@email.com',
        subject: 'Billing inquiry for premium subscription',
        description: 'I was charged for premium features but I cannot access them. Please investigate.',
        category: 'billing',
        priority: 'medium',
        status: 'resolved',
        assignedTo: user.id,
        createdDate: '2024-08-16T08:15:00Z',
        lastUpdate: '2024-08-17T14:20:00Z',
        responses: [
          {
            id: 'resp_006',
            ticketId: 'ticket_004',
            authorId: 'cust_004',
            authorName: 'James Thompson',
            authorType: 'customer',
            message: 'I was charged for premium features but I cannot access them. Please investigate.',
            timestamp: '2024-08-16T08:15:00Z',
            isInternal: false
          },
          {
            id: 'resp_007',
            ticketId: 'ticket_004',
            authorId: user.id,
            authorName: user.name,
            authorType: 'staff',
            message: 'I found the issue - there was a synchronization delay between billing and access systems. Your premium features have been activated. Please try logging out and back in.',
            timestamp: '2024-08-17T14:20:00Z',
            isInternal: false
          }
        ],
        escalationLevel: 0,
        resolutionTime: 30.5,
        customerSatisfaction: 5
      }
    ]);

    // Mock support statistics
    setSupportStats({
      totalTickets: 47,
      openTickets: 12,
      inProgressTickets: 8,
      resolvedToday: 15,
      avgResponseTime: 2.5,
      avgResolutionTime: 18.7,
      customerSatisfaction: 4.6,
      escalatedTickets: 3,
      ticketsByCategory: [
        { category: 'Account', count: 15 },
        { category: 'Trading', count: 12 },
        { category: 'Technical', count: 10 },
        { category: 'Billing', count: 6 },
        { category: 'General', count: 4 }
      ],
      responseTimeData: [
        { hour: '09:00', avgTime: 1.2 },
        { hour: '11:00', avgTime: 2.1 },
        { hour: '13:00', avgTime: 3.2 },
        { hour: '15:00', avgTime: 2.8 },
        { hour: '17:00', avgTime: 1.9 }
      ]
    });

    // Mock knowledge base
    setKnowledgeBase([
      {
        id: 'kb_001',
        title: 'KYC Verification Process',
        category: 'Account',
        views: 1245,
        lastUpdated: '2024-08-15',
        content: 'Step-by-step guide for customer KYC verification...'
      },
      {
        id: 'kb_002',
        title: 'Portfolio Performance Calculations',
        category: 'Trading',
        views: 892,
        lastUpdated: '2024-08-12',
        content: 'Explanation of how portfolio returns are calculated...'
      },
      {
        id: 'kb_003',
        title: 'API Integration Guide',
        category: 'Technical',
        views: 567,
        lastUpdated: '2024-08-10',
        content: 'Complete guide for API integration and authentication...'
      },
      {
        id: 'kb_004',
        title: 'Billing and Subscription FAQ',
        category: 'Billing',
        views: 432,
        lastUpdated: '2024-08-08',
        content: 'Frequently asked questions about billing and subscriptions...'
      }
    ]);
  }, [user.id]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleViewTicket = (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    setTicketDialogOpen(true);
    setResponseText('');
  };

  const handleSendResponse = () => {
    if (selectedTicket && responseText.trim()) {
      const newResponse: TicketResponse = {
        id: `resp_${Date.now()}`,
        ticketId: selectedTicket.id,
        authorId: user.id,
        authorName: user.name,
        authorType: 'staff',
        message: responseText,
        timestamp: new Date().toISOString(),
        isInternal: false
      };

      // Update ticket with new response
      const updatedTickets = tickets.map(ticket =>
        ticket.id === selectedTicket.id
          ? {
              ...ticket,
              responses: [...ticket.responses, newResponse],
              lastUpdate: new Date().toISOString(),
              status: 'in_progress' as const
            }
          : ticket
      );
      setTickets(updatedTickets);
      setSelectedTicket({
        ...selectedTicket,
        responses: [...selectedTicket.responses, newResponse],
        lastUpdate: new Date().toISOString(),
        status: 'in_progress'
      });
      setResponseText('');
    }
  };

  const handleUpdateTicketStatus = (ticketId: string, newStatus: SupportTicket['status']) => {
    const updatedTickets = tickets.map(ticket =>
      ticket.id === ticketId
        ? {
            ...ticket,
            status: newStatus,
            lastUpdate: new Date().toISOString(),
            resolutionTime: newStatus === 'resolved' ? 
              (Date.now() - new Date(ticket.createdDate).getTime()) / (1000 * 60 * 60) : 
              ticket.resolutionTime
          }
        : ticket
    );
    setTickets(updatedTickets);
    
    if (selectedTicket?.id === ticketId) {
      setSelectedTicket({
        ...selectedTicket,
        status: newStatus,
        lastUpdate: new Date().toISOString()
      });
    }
  };

  const handleEscalateTicket = (ticketId: string) => {
    const updatedTickets = tickets.map(ticket =>
      ticket.id === ticketId
        ? {
            ...ticket,
            escalationLevel: ticket.escalationLevel + 1,
            priority: 'urgent' as const,
            lastUpdate: new Date().toISOString()
          }
        : ticket
    );
    setTickets(updatedTickets);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'default';
      default: return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'error';
      case 'in_progress': return 'warning';
      case 'waiting_customer': return 'info';
      case 'resolved': return 'success';
      case 'closed': return 'default';
      default: return 'default';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'account': return <Person />;
      case 'trading': return <TrendingUp />;
      case 'technical': return <Assignment />;
      case 'billing': return <Assessment />;
      case 'general': return <ContactSupport />;
      default: return <ContactSupport />;
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    const statusMatch = filterStatus === 'all' || ticket.status === filterStatus;
    const priorityMatch = filterPriority === 'all' || ticket.priority === filterPriority;
    return statusMatch && priorityMatch;
  });

  const categoryData = supportStats.ticketsByCategory?.map((item: any) => ({
    name: item.category,
    value: item.count,
    color: ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff88'][supportStats.ticketsByCategory.indexOf(item)]
  })) || [];

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Customer Support Center
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Customer assistance, ticket management, and support analytics
        </Typography>
      </Box>

      {/* Support Statistics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Badge badgeContent={supportStats.openTickets} color="error">
                <Assignment sx={{ fontSize: 32, color: 'primary.main', mb: 1 }} />
              </Badge>
              <Typography variant="h4" color="primary">
                {supportStats.totalTickets}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Tickets
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Speed sx={{ fontSize: 32, color: 'success.main', mb: 1 }} />
              <Typography variant="h4" color="success.main">
                {supportStats.avgResponseTime}h
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Avg Response Time
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                <Rating value={supportStats.customerSatisfaction} readOnly precision={0.1} />
              </Box>
              <Typography variant="h4" color="warning.main">
                {supportStats.customerSatisfaction}/5
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Customer Satisfaction
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <CheckCircle sx={{ fontSize: 32, color: 'info.main', mb: 1 }} />
              <Typography variant="h4" color="info.main">
                {supportStats.resolvedToday}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Resolved Today
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Content Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab 
              label={
                <Badge badgeContent={supportStats.openTickets + supportStats.inProgressTickets} color="warning">
                  Active Tickets
                </Badge>
              } 
            />
            <Tab label="Knowledge Base" />
            <Tab label="Analytics" />
            <Tab label="Customer History" />
          </Tabs>
        </Box>

        {/* Active Tickets Tab */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Support Ticket Queue</Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={filterStatus}
                    label="Status"
                    onChange={(e) => setFilterStatus(e.target.value)}
                  >
                    <MenuItem value="all">All</MenuItem>
                    <MenuItem value="open">Open</MenuItem>
                    <MenuItem value="in_progress">In Progress</MenuItem>
                    <MenuItem value="waiting_customer">Waiting Customer</MenuItem>
                    <MenuItem value="resolved">Resolved</MenuItem>
                  </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Priority</InputLabel>
                  <Select
                    value={filterPriority}
                    label="Priority"
                    onChange={(e) => setFilterPriority(e.target.value)}
                  >
                    <MenuItem value="all">All</MenuItem>
                    <MenuItem value="urgent">Urgent</MenuItem>
                    <MenuItem value="high">High</MenuItem>
                    <MenuItem value="medium">Medium</MenuItem>
                    <MenuItem value="low">Low</MenuItem>
                  </Select>
                </FormControl>
                <IconButton>
                  <Refresh />
                </IconButton>
              </Box>
            </Box>

            {supportStats.escalatedTickets > 0 && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  <Warning sx={{ mr: 1, verticalAlign: 'middle' }} />
                  {supportStats.escalatedTickets} tickets have been escalated and require priority attention
                </Typography>
              </Alert>
            )}
          </Box>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Customer</TableCell>
                  <TableCell>Subject</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Priority</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell>Last Update</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredTickets.map((ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                          {ticket.customerName.charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2">
                            {ticket.customerName}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {ticket.customerEmail}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="subtitle2" sx={{ maxWidth: 200 }}>
                        {ticket.subject}
                      </Typography>
                      {ticket.escalationLevel > 0 && (
                        <Chip 
                          label={`ESCALATED (L${ticket.escalationLevel})`}
                          color="error"
                          size="small"
                          sx={{ mt: 0.5 }}
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {getCategoryIcon(ticket.category)}
                        <Typography variant="body2" sx={{ ml: 1 }}>
                          {ticket.category.charAt(0).toUpperCase() + ticket.category.slice(1)}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={ticket.priority.toUpperCase()}
                        color={getPriorityColor(ticket.priority) as any}
                        size="small"
                        icon={ticket.priority === 'urgent' ? <PriorityHigh /> : undefined}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={ticket.status.replace('_', ' ').toUpperCase()}
                        color={getStatusColor(ticket.status) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(ticket.createdDate).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(ticket.lastUpdate).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <IconButton 
                        size="small" 
                        color="primary"
                        onClick={() => handleViewTicket(ticket)}
                      >
                        <Visibility />
                      </IconButton>
                      {ticket.status !== 'resolved' && ticket.status !== 'closed' && (
                        <IconButton 
                          size="small" 
                          color="warning"
                          onClick={() => handleEscalateTicket(ticket.id)}
                        >
                          <Escalate />
                        </IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Knowledge Base Tab */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Knowledge Base & FAQs
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Quick access to common solutions and documentation
            </Typography>
            <Button variant="contained" sx={{ mr: 2 }}>
              Create New Article
            </Button>
            <Button variant="outlined">
              Manage Categories
            </Button>
          </Box>

          <Grid container spacing={3}>
            {knowledgeBase.map((article) => (
              <Grid item xs={12} md={6} key={article.id}>
                <Card variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                      <Typography variant="h6">
                        {article.title}
                      </Typography>
                      <Chip 
                        label={article.category}
                        variant="outlined"
                        size="small"
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {article.content}
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="caption" color="text.secondary">
                        {article.views} views • Updated {article.lastUpdated}
                      </Typography>
                      <Button size="small" variant="outlined">
                        View Article
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        {/* Analytics Tab */}
        <TabPanel value={tabValue} index={2}>
          <Grid container spacing={3}>
            <Grid item xs={12} lg={8}>
              <Typography variant="h6" gutterBottom>
                Response Time Trends
              </Typography>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={supportStats.responseTimeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${value} hours`, 'Response Time']} />
                  <Line 
                    type="monotone" 
                    dataKey="avgTime" 
                    stroke="#2196f3" 
                    strokeWidth={3} 
                    name="Average Response Time" 
                  />
                </LineChart>
              </ResponsiveContainer>
            </Grid>

            <Grid item xs={12} lg={4}>
              <Typography variant="h6" gutterBottom>
                Tickets by Category
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Grid>
          </Grid>

          <Grid container spacing={3} sx={{ mt: 2 }}>
            <Grid item xs={12} md={4}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Performance Metrics
                  </Typography>
                  <List>
                    <ListItem>
                      <ListItemIcon>
                        <Speed color="success" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Avg Response Time"
                        secondary={`${supportStats.avgResponseTime} hours (Target: 4h)`}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <CheckCircle color="success" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Avg Resolution Time"
                        secondary={`${supportStats.avgResolutionTime} hours (Target: 24h)`}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <ThumbUp color="success" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Customer Satisfaction"
                        secondary={`${supportStats.customerSatisfaction}/5.0 (Target: 4.5)`}
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={8}>
              <Typography variant="h6" gutterBottom>
                Support Team Performance
              </Typography>
              <Alert severity="success" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  <strong>Excellent Performance:</strong> All metrics exceeding target thresholds
                </Typography>
              </Alert>
              <Alert severity="info">
                <Typography variant="body2">
                  <strong>Improvement Opportunity:</strong> Consider implementing automated responses for common account questions
                </Typography>
              </Alert>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Customer History Tab */}
        <TabPanel value={tabValue} index={3}>
          <Typography variant="h6" gutterBottom>
            Customer Interaction History
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            View comprehensive interaction history and customer journey analytics
          </Typography>
          
          <TextField
            fullWidth
            placeholder="Search by customer name or email..."
            variant="outlined"
            sx={{ mb: 3 }}
            InputProps={{
              startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
            }}
          />

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>
                Recent Customer Interactions
              </Typography>
              <List>
                <ListItem>
                  <ListItemIcon>
                    <Email color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Email Response Sent"
                    secondary={
                      <>
                        <Typography variant="body2" color="text.secondary">
                          Emma Wilson - KYC verification assistance
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          2 hours ago
                        </Typography>
                      </>
                    }
                  />
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemIcon>
                    <CheckCircle color="success" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Ticket Resolved"
                    secondary={
                      <>
                        <Typography variant="body2" color="text.secondary">
                          James Thompson - Billing inquiry resolved
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Yesterday
                        </Typography>
                      </>
                    }
                  />
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemIcon>
                    <Escalate color="warning" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Ticket Escalated"
                    secondary={
                      <>
                        <Typography variant="body2" color="text.secondary">
                          Sarah Martinez - API access request escalated to technical team
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          2 days ago
                        </Typography>
                      </>
                    }
                  />
                </ListItem>
              </List>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>
                Customer Satisfaction Feedback
              </Typography>
              <List>
                <ListItem>
                  <ListItemIcon>
                    <Star sx={{ color: 'gold' }} />
                  </ListItemIcon>
                  <ListItemText 
                    primary={<Rating value={5} readOnly size="small" />}
                    secondary="James Thompson - 'Quick resolution of billing issue. Very satisfied with the service.'"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Star sx={{ color: 'gold' }} />
                  </ListItemIcon>
                  <ListItemText 
                    primary={<Rating value={4} readOnly size="small" />}
                    secondary="Maria Garcia - 'Good support but took a bit longer than expected.'"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Star sx={{ color: 'gold' }} />
                  </ListItemIcon>
                  <ListItemText 
                    primary={<Rating value={5} readOnly size="small" />}
                    secondary="Robert Kim - 'Excellent technical support for API integration.'"
                  />
                </ListItem>
              </List>
            </Grid>
          </Grid>
        </TabPanel>
      </Card>

      {/* Ticket Detail Dialog */}
      <Dialog 
        open={ticketDialogOpen} 
        onClose={() => setTicketDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              Ticket #{selectedTicket?.id} - {selectedTicket?.subject}
            </Typography>
            <Box>
              <Chip 
                label={selectedTicket?.priority.toUpperCase()}
                color={getPriorityColor(selectedTicket?.priority || '') as any}
                size="small"
                sx={{ mr: 1 }}
              />
              <Chip 
                label={selectedTicket?.status.replace('_', ' ').toUpperCase()}
                color={getStatusColor(selectedTicket?.status || '') as any}
                size="small"
              />
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedTicket && (
            <Box>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Customer:</Typography>
                  <Typography variant="body2">{selectedTicket.customerName}</Typography>
                  <Typography variant="body2" color="text.secondary">{selectedTicket.customerEmail}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Created:</Typography>
                  <Typography variant="body2">{new Date(selectedTicket.createdDate).toLocaleString()}</Typography>
                  <Typography variant="subtitle2" sx={{ mt: 1 }}>Category:</Typography>
                  <Typography variant="body2">{selectedTicket.category}</Typography>
                </Grid>
              </Grid>

              <Typography variant="subtitle1" gutterBottom>
                Conversation History
              </Typography>
              <Box sx={{ maxHeight: 400, overflowY: 'auto', mb: 3 }}>
                {selectedTicket.responses.map((response, index) => (
                  <Card key={response.id} variant="outlined" sx={{ mb: 2 }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar sx={{ mr: 1, width: 24, height: 24 }}>
                            {response.authorName.charAt(0)}
                          </Avatar>
                          <Typography variant="subtitle2">{response.authorName}</Typography>
                          <Chip 
                            label={response.authorType}
                            size="small"
                            variant="outlined"
                            sx={{ ml: 1 }}
                          />
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(response.timestamp).toLocaleString()}
                        </Typography>
                      </Box>
                      <Typography variant="body2">
                        {response.message}
                      </Typography>
                    </CardContent>
                  </Card>
                ))}
              </Box>

              <Typography variant="subtitle1" gutterBottom>
                Send Response
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={4}
                placeholder="Type your response..."
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                sx={{ mb: 2 }}
              />

              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <Button
                  variant="contained"
                  onClick={handleSendResponse}
                  disabled={!responseText.trim()}
                >
                  Send Response
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => handleUpdateTicketStatus(selectedTicket.id, 'waiting_customer')}
                  disabled={selectedTicket.status === 'waiting_customer'}
                >
                  Mark Waiting Customer
                </Button>
                <Button
                  variant="outlined"
                  color="success"
                  onClick={() => handleUpdateTicketStatus(selectedTicket.id, 'resolved')}
                  disabled={selectedTicket.status === 'resolved'}
                >
                  Resolve Ticket
                </Button>
                <Button
                  variant="outlined"
                  color="warning"
                  onClick={() => handleEscalateTicket(selectedTicket.id)}
                >
                  Escalate
                </Button>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTicketDialogOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SupportStaffDashboard;