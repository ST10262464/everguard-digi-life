import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Button,
  useTheme,
  Avatar,
} from '@mui/material';
import {
  AccountBalance,
  Security,
  LocalHospital,
  SmartToy,
  Assignment,
  Info,
} from '@mui/icons-material';
import { Link } from 'react-router-dom';

const getFeatureCards = (t) => [
  {
    title: t('home.features.financialSupport.title'),
    description: t('home.features.financialSupport.description'),
    icon: <AccountBalance sx={{ fontSize: 40 }} />,
    link: '/finance',
    color: '#4CAF50',
  },
  {
    title: t('home.features.gbvSupport.title'),
    description: t('home.features.gbvSupport.description'),
    icon: <Security sx={{ fontSize: 40 }} />,
    link: '/gbv-support',
    color: '#F44336',
  },
  {
    title: t('home.features.sanitaryAid.title'),
    description: t('home.features.sanitaryAid.description'),
    icon: <LocalHospital sx={{ fontSize: 40 }} />,
    link: '/sanitary-aid',
    color: '#2196F3',
  },
  {
    title: t('home.features.aiAssistant.title'),
    description: t('home.features.aiAssistant.description'),
    icon: <SmartToy sx={{ fontSize: 40 }} />,
    link: '/ai-assistant',
    color: '#9C27B0',
  },
  {
    title: t('home.features.submitRequests.title'),
    description: t('home.features.submitRequests.description'),
    icon: <Assignment sx={{ fontSize: 40 }} />,
    link: '/requests',
    color: '#FF9800',
  },
  {
    title: t('home.features.aboutUs.title'),
    description: t('home.features.aboutUs.description'),
    icon: <Info sx={{ fontSize: 40 }} />,
    link: '/about',
    color: '#607D8B',
  },
];

const HomePage = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const featureCards = getFeatureCards(t);

  return (
    <Container maxWidth="lg">
      {/* Hero Section */}
      <Box
        sx={{
          textAlign: 'center',
          py: { xs: 4, md: 8 },
          mb: 4,
        }}
      >
        <Avatar 
          src="/logo-full.png" 
          alt="GirliesHub Logo" 
          sx={{ 
            width: { xs: 80, md: 120 }, 
            height: { xs: 80, md: 120 }, 
            mx: 'auto', 
            mb: 3,
            boxShadow: 3
          }} 
        />
        <Typography
          variant="h2"
          component="h1"
          gutterBottom
          sx={{
            fontWeight: 'bold',
            color: 'primary.main',
            fontSize: { xs: '2.5rem', md: '3.5rem' },
          }}
        >
          {t('home.title')}
        </Typography>
        <Typography
          variant="h5"
          component="h2"
          gutterBottom
          sx={{
            color: 'text.secondary',
            mb: 2,
            fontSize: { xs: '1.2rem', md: '1.5rem' },
          }}
        >
          {t('home.subtitle')}
        </Typography>
        <Typography
          variant="h6"
          sx={{
            color: 'text.primary',
            fontStyle: 'italic',
            maxWidth: 600,
            mx: 'auto',
            fontSize: { xs: '1rem', md: '1.25rem' },
          }}
        >
          &ldquo;{t('home.tagline')}&rdquo;
        </Typography>
      </Box>

      {/* Features Grid */}
      <Grid container spacing={3} sx={{ mb: 6 }}>
        {featureCards.map((feature, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: theme.shadows[8],
                },
              }}
            >
              <CardContent sx={{ flexGrow: 1, textAlign: 'center', p: 3 }}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    mb: 2,
                    color: feature.color,
                  }}
                >
                  {feature.icon}
                </Box>
                <Typography
                  variant="h6"
                  component="h3"
                  gutterBottom
                  sx={{ fontWeight: 'bold' }}
                >
                  {feature.title}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 3, lineHeight: 1.6 }}
                >
                  {feature.description}
                </Typography>
                <Button
                  component={Link}
                  to={feature.link}
                  variant="contained"
                  sx={{
                    backgroundColor: feature.color,
                    '&:hover': {
                      backgroundColor: feature.color,
                      filter: 'brightness(0.9)',
                    },
                  }}
                >
                  {t('home.learnMore')}
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Call to Action */}
      <Box
        sx={{
          textAlign: 'center',
          py: 4,
          px: 3,
          backgroundColor: 'primary.main',
          color: 'white',
          borderRadius: 2,
          mb: 4,
        }}
      >
        <Typography variant="h5" component="h3" gutterBottom sx={{ fontWeight: 'bold' }}>
          {t('home.cta.title')}
        </Typography>
        <Typography variant="body1" sx={{ mb: 3, opacity: 0.9 }}>
          {t('home.cta.description')}
        </Typography>
        <Button
          component={Link}
          to="/requests"
          variant="contained"
          size="large"
          sx={{
            backgroundColor: 'white',
            color: 'primary.main',
            '&:hover': {
              backgroundColor: 'grey.100',
            },
          }}
        >
          {t('home.cta.button')}
        </Button>
      </Box>
    </Container>
  );
};

export default HomePage;
