import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Avatar,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Info,
  AccountBalance,
  Security,
  LocalHospital,
  SmartToy,
  Group,
  Favorite,
  EmojiEvents,
  TrendingUp,
  Shield,
  HealthAndSafety,
} from '@mui/icons-material';

const AboutPage = () => {
  const { t } = useTranslation();
  const getFeatures = () => [
    {
      icon: <AccountBalance sx={{ fontSize: 40 }} />,
      title: t('about.features.financialEmpowerment.title'),
      description: t('about.features.financialEmpowerment.description'),
      color: '#4CAF50',
    },
    {
      icon: <Security sx={{ fontSize: 40 }} />,
      title: t('about.features.gbvSupport.title'),
      description: t('about.features.gbvSupport.description'),
      color: '#F44336',
    },
    {
      icon: <LocalHospital sx={{ fontSize: 40 }} />,
      title: t('about.features.sanitaryAid.title'),
      description: t('about.features.sanitaryAid.description'),
      color: '#2196F3',
    },
  ];
  
  const features = getFeatures();

  const getStats = () => [
    { number: '2,500+', label: t('about.stats.womenEmpowered'), icon: <Group /> },
    { number: '150+', label: t('about.stats.seminarsCompleted'), icon: <EmojiEvents /> },
    { number: '50+', label: t('about.stats.shelterLocations'), icon: <Shield /> },
    { number: '100+', label: t('about.stats.donationBins'), icon: <HealthAndSafety /> },
  ];
  
  const stats = getStats();

  const getValues = () => [
    {
      title: t('about.valuesList.empowerment.title'),
      description: t('about.valuesList.empowerment.description'),
    },
    {
      title: t('about.valuesList.safety.title'),
      description: t('about.valuesList.safety.description'),
    },
    {
      title: t('about.valuesList.dignity.title'),
      description: t('about.valuesList.dignity.description'),
    },
    {
      title: t('about.valuesList.community.title'),
      description: t('about.valuesList.community.description'),
    },
  ];
  
  const values = getValues();

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Info sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
            {t('about.title')}
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 700, mx: 'auto', lineHeight: 1.6 }}>
            {t('about.subtitle')}
          </Typography>
        </Box>

        {/* Mission Statement */}
        <Card sx={{ mb: 6, background: 'linear-gradient(135deg, #E91E63 0%, #AD1457 100%)' }}>
          <CardContent sx={{ p: 4, color: 'white', textAlign: 'center' }}>
            <Favorite sx={{ fontSize: 48, mb: 2, opacity: 0.9 }} />
            <Typography variant="h4" component="h2" gutterBottom sx={{ fontWeight: 'bold' }}>
              {t('about.mission')}
            </Typography>
            <Typography variant="h6" sx={{ lineHeight: 1.6, opacity: 0.95, maxWidth: 800, mx: 'auto' }}>
              &ldquo;{t('about.missionText')}&rdquo;
            </Typography>
          </CardContent>
        </Card>

        {/* Core Features */}
        <Box sx={{ mb: 6 }}>
          <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 'bold', mb: 4, textAlign: 'center' }}>
            {t('about.coreServices')}
          </Typography>
          <Grid container spacing={4}>
            {features.map((feature, index) => (
              <Grid item xs={12} md={4} key={index}>
                <Card
                  sx={{
                    height: '100%',
                    textAlign: 'center',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 4,
                    },
                  }}
                >
                  <CardContent sx={{ p: 4 }}>
                    <Box sx={{ color: feature.color, mb: 2 }}>
                      {feature.icon}
                    </Box>
                    <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 'bold' }}>
                      {feature.title}
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                      {feature.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Statistics */}
        <Card sx={{ mb: 6 }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 'bold', textAlign: 'center', mb: 4 }}>
              {t('about.impact')}
            </Typography>
            <Grid container spacing={4}>
              {stats.map((stat, index) => (
                <Grid item xs={6} sm={3} key={index}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Avatar
                      sx={{
                        bgcolor: 'primary.main',
                        width: 56,
                        height: 56,
                        mx: 'auto',
                        mb: 2,
                      }}
                    >
                      {stat.icon}
                    </Avatar>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main', mb: 1 }}>
                      {stat.number}
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      {stat.label}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>

        {/* Values */}
        <Box sx={{ mb: 6 }}>
          <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 'bold', mb: 4, textAlign: 'center' }}>
            {t('about.values')}
          </Typography>
          <Grid container spacing={3}>
            {values.map((value, index) => (
              <Grid item xs={12} sm={6} key={index}>
                <Card sx={{ height: '100%' }}>
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                      {value.title}
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                      {value.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Technology & Future */}
        <Card>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <SmartToy sx={{ fontSize: 32, color: 'primary.main', mr: 2 }} />
              <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold' }}>
                {t('about.technologyInnovation')}
              </Typography>
            </Box>
            
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3, lineHeight: 1.6 }}>
              {t('about.techDescription')}
            </Typography>

            <Grid container spacing={4}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                  {t('about.currentFeatures')}
                </Typography>
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <TrendingUp color="success" />
                    </ListItemIcon>
                    <ListItemText primary={t('about.currentFeaturesList.responsiveInterface')} />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <TrendingUp color="success" />
                    </ListItemIcon>
                    <ListItemText primary={t('about.currentFeaturesList.requestSystem')} />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <TrendingUp color="success" />
                    </ListItemIcon>
                    <ListItemText primary={t('about.currentFeaturesList.resourceMapping')} />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <TrendingUp color="success" />
                    </ListItemIcon>
                    <ListItemText primary={t('about.currentFeaturesList.aiInterface')} />
                  </ListItem>
                </List>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                  {t('about.futureDevelopment')}
                </Typography>
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <SmartToy color="primary" />
                    </ListItemIcon>
                    <ListItemText primary={t('about.futureFeaturesList.aiSupport')} />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <SmartToy color="primary" />
                    </ListItemIcon>
                    <ListItemText primary={t('about.futureFeaturesList.blockchain')} />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <SmartToy color="primary" />
                    </ListItemIcon>
                    <ListItemText primary={t('about.futureFeaturesList.database')} />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <SmartToy color="primary" />
                    </ListItemIcon>
                    <ListItemText primary={t('about.futureFeaturesList.metamask')} />
                  </ListItem>
                </List>
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', fontStyle: 'italic' }}>
              {t('about.demoNote')}
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
};

export default AboutPage;
