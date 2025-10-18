import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FormControl,
  Select,
  MenuItem,
  Box,
  Typography,
} from '@mui/material';
import { Language as LanguageIcon } from '@mui/icons-material';

const LanguageSelector = () => {
  const { i18n, t } = useTranslation();
  const [open, setOpen] = useState(false);

  const languages = [
    { code: 'en', name: t('language.languages.en') },
    { code: 'af', name: t('language.languages.af') },
    { code: 'zu', name: t('language.languages.zu') },
    { code: 'xh', name: t('language.languages.xh') },
    { code: 'st', name: t('language.languages.st') },
    { code: 'tn', name: t('language.languages.tn') },
    { code: 'ss', name: t('language.languages.ss') },
    { code: 've', name: t('language.languages.ve') },
    { code: 'ts', name: t('language.languages.ts') },
    { code: 'nr', name: t('language.languages.nr') },
    { code: 'nso', name: t('language.languages.nso') },
  ];

  const handleLanguageChange = (event) => {
    const selectedLanguage = event.target.value;
    i18n.changeLanguage(selectedLanguage);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleOpen = () => {
    setOpen(true);
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 120 }}>
      <LanguageIcon sx={{ mr: 1, color: 'inherit' }} />
      <FormControl size="small" variant="outlined">
        <Select
          value={i18n.language}
          onChange={handleLanguageChange}
          open={open}
          onClose={handleClose}
          onOpen={handleOpen}
          sx={{
            color: 'inherit',
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: 'rgba(255, 255, 255, 0.3)',
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: 'rgba(255, 255, 255, 0.5)',
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: 'rgba(255, 255, 255, 0.7)',
            },
            '& .MuiSelect-icon': {
              color: 'inherit',
            },
          }}
          MenuProps={{
            PaperProps: {
              sx: {
                maxHeight: 300,
                '& .MuiMenuItem-root': {
                  fontSize: '0.875rem',
                },
              },
            },
          }}
        >
          {languages.map((language) => (
            <MenuItem key={language.code} value={language.code}>
              <Typography variant="body2">
                {language.name}
              </Typography>
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
};

export default LanguageSelector;
