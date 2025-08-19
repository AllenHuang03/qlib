/**
 * Demo Market Data Card
 * Showcases the enhanced market data features in the existing dashboard
 */

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Button,
  Grid,
  IconButton,
  Tooltip,
  useTheme,
  LinearProgress,
} from "@mui/material";
import {
  Speed,
  ShowChart,
  TrendingUp,
  TrendingDown,
  VolumeUp,
  AutoAwesome,
  OpenInNew,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { marketAPI } from "../../services/api";

interface DemoQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
}

const DemoMarketDataCard: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  const [demoQuotes, setDemoQuotes] = useState<DemoQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Demo symbols for different asset classes
  const demoSymbols = ["CBA.AX", "BHP.AX", "BTC.AX", "GOLD"];

  useEffect(() => {
    const loadDemoData = async () => {
      try {
        setLoading(true);
        const mockQuotes: DemoQuote[] = demoSymbols.map((symbol) => {
          const basePrice = getBasePrice(symbol);
          const change = (Math.random() - 0.5) * basePrice * 0.05; // ±5% change
          return {
            symbol,
            price: basePrice + change,
            change,
            changePercent: (change / basePrice) * 100,
            volume: Math.floor(Math.random() * 1000000) + 100000,
          };
        });

        setDemoQuotes(mockQuotes);
        setLastUpdate(new Date());
      } catch (error) {
        console.error("Error loading demo data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadDemoData();

    // Update demo data every 5 seconds
    const interval = setInterval(loadDemoData, 5000);
    return () => clearInterval(interval);
  }, []);

  const getBasePrice = (symbol: string): number => {
    const basePrices = {
      "CBA.AX": 110.5,
      "BHP.AX": 45.2,
      "BTC.AX": 45000.0,
      GOLD: 1950.0,
    };
    return basePrices[symbol as keyof typeof basePrices] || 100;
  };

  const getAssetClassIcon = (symbol: string) => {
    if (symbol.includes("BTC")) return "₿";
    if (symbol === "GOLD") return "🥇";
    return "📈";
  };

  const getAssetClassName = (symbol: string) => {
    if (symbol.includes("BTC")) return "Crypto";
    if (symbol === "GOLD") return "Commodity";
    return "Equity";
  };

  return (
    <Card
      sx={{
        height: "100%",
        background: `linear-gradient(135deg, ${theme.palette.primary.main}15 0%, ${theme.palette.secondary.main}15 100%)`,
        border: `1px solid ${theme.palette.primary.main}30`,
        position: "relative",
        overflow: "visible",
      }}
    >
      <CardContent>
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 2,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <ShowChart color="primary" />
            <Typography variant="h6" sx={{ fontWeight: "bold" }}>
              Enhanced Market Data
            </Typography>
            <Chip
              icon={<Speed />}
              label="LIVE"
              size="small"
              color="success"
              sx={{ animation: "pulse 2s infinite" }}
            />
          </Box>

          <Tooltip title="Open Live Trading Dashboard">
            <IconButton
              onClick={() => navigate("/live-trading")}
              sx={{
                backgroundColor: theme.palette.primary.main,
                color: "white",
                "&:hover": {
                  backgroundColor: theme.palette.primary.dark,
                },
              }}
            >
              <OpenInNew />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Features Overview */}
        <Grid container spacing={1} sx={{ mb: 2 }}>
          <Grid item xs={6}>
            <Box
              sx={{
                textAlign: "center",
                p: 1,
                borderRadius: 1,
                backgroundColor: theme.palette.success.main + "20",
                border: `1px solid ${theme.palette.success.main}30`,
              }}
            >
              <Typography variant="caption" color="text.secondary">
                Multi-Asset
              </Typography>
              <Typography
                variant="h6"
                sx={{ fontWeight: "bold", color: theme.palette.success.main }}
              >
                5 Classes
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6}>
            <Box
              sx={{
                textAlign: "center",
                p: 1,
                borderRadius: 1,
                backgroundColor: theme.palette.warning.main + "20",
                border: `1px solid ${theme.palette.warning.main}30`,
              }}
            >
              <Typography variant="caption" color="text.secondary">
                Latency
              </Typography>
              <Typography
                variant="h6"
                sx={{ fontWeight: "bold", color: theme.palette.warning.main }}
              >
                {"<50ms"}
              </Typography>
            </Box>
          </Grid>
        </Grid>

        {/* Live Quotes Demo */}
        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: "bold" }}>
          Live Market Data
        </Typography>

        {loading ? (
          <LinearProgress sx={{ mb: 2 }} />
        ) : (
          <Box sx={{ mb: 2 }}>
            {demoQuotes.map((quote) => (
              <Box
                key={quote.symbol}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  py: 0.5,
                  px: 1,
                  mb: 0.5,
                  borderRadius: 1,
                  backgroundColor: theme.palette.background.paper,
                  border: `1px solid ${theme.palette.divider}`,
                  "&:hover": {
                    backgroundColor: theme.palette.action.hover,
                  },
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Typography sx={{ fontSize: "16px" }}>
                    {getAssetClassIcon(quote.symbol)}
                  </Typography>
                  <Box>
                    <Typography
                      variant="subtitle2"
                      sx={{ fontWeight: "bold", fontFamily: "monospace" }}
                    >
                      {quote.symbol}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {getAssetClassName(quote.symbol)}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ textAlign: "right" }}>
                  <Typography
                    variant="subtitle2"
                    sx={{ fontWeight: "bold", fontFamily: "monospace" }}
                  >
                    ${quote.price.toFixed(quote.symbol.includes("BTC") ? 0 : 2)}
                  </Typography>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 0.5,
                      justifyContent: "flex-end",
                    }}
                  >
                    {quote.changePercent >= 0 ? (
                      <TrendingUp
                        fontSize="small"
                        sx={{ color: theme.palette.success.main }}
                      />
                    ) : (
                      <TrendingDown
                        fontSize="small"
                        sx={{ color: theme.palette.error.main }}
                      />
                    )}
                    <Typography
                      variant="caption"
                      sx={{
                        color:
                          quote.changePercent >= 0
                            ? theme.palette.success.main
                            : theme.palette.error.main,
                        fontFamily: "monospace",
                        fontWeight: "bold",
                      }}
                    >
                      {quote.changePercent.toFixed(2)}%
                    </Typography>
                  </Box>
                </Box>
              </Box>
            ))}
          </Box>
        )}

        {/* Key Features */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: "bold" }}>
            Professional Features
          </Typography>
          <Grid container spacing={1}>
            <Grid item xs={6}>
              <Chip
                icon={<AutoAwesome />}
                label="AI Signals"
                size="small"
                variant="outlined"
                sx={{ width: "100%" }}
              />
            </Grid>
            <Grid item xs={6}>
              <Chip
                icon={<ShowChart />}
                label="Technical Analysis"
                size="small"
                variant="outlined"
                sx={{ width: "100%" }}
              />
            </Grid>
            <Grid item xs={6}>
              <Chip
                icon={<VolumeUp />}
                label="Volume Analysis"
                size="small"
                variant="outlined"
                sx={{ width: "100%" }}
              />
            </Grid>
            <Grid item xs={6}>
              <Chip
                icon={<Speed />}
                label="Real-time Data"
                size="small"
                variant="outlined"
                sx={{ width: "100%" }}
              />
            </Grid>
          </Grid>
        </Box>

        {/* Action Button */}
        <Button
          variant="contained"
          fullWidth
          onClick={() => navigate("/live-trading")}
          sx={{
            background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.secondary.main} 90%)`,
            fontWeight: "bold",
            "&:hover": {
              background: `linear-gradient(45deg, ${theme.palette.primary.dark} 30%, ${theme.palette.secondary.dark} 90%)`,
            },
          }}
        >
          Experience Live Trading Pro
        </Button>

        {/* Last Update */}
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: "block", textAlign: "center", mt: 1 }}
        >
          Last updated: {lastUpdate.toLocaleTimeString()}
        </Typography>
      </CardContent>

      {/* Pulse animation styles */}
      <style>
        {`
          @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.7; }
            100% { opacity: 1; }
          }
        `}
      </style>
    </Card>
  );
};

export default DemoMarketDataCard;
