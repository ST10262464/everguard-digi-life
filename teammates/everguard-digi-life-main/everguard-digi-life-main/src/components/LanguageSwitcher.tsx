import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Globe } from "lucide-react";

const southAfricanLanguages = [
  { code: 'en', name: 'English', flag: '🇿🇦', nativeName: 'English' },
  { code: 'af', name: 'Afrikaans', flag: '🇿🇦', nativeName: 'Afrikaans' },
  { code: 'zu', name: 'Zulu', flag: '🇿🇦', nativeName: 'IsiZulu' },
  { code: 'xh', name: 'Xhosa', flag: '🇿🇦', nativeName: 'IsiXhosa' },
  { code: 'nso', name: 'Northern Sotho', flag: '🇿🇦', nativeName: 'Sesotho sa Leboa' },
  { code: 'tn', name: 'Tswana', flag: '🇿🇦', nativeName: 'Setswana' },
  { code: 'ss', name: 'Swati', flag: '🇿🇦', nativeName: 'SiSwati' },
  { code: 've', name: 'Venda', flag: '🇿🇦', nativeName: 'Tshivenḓa' },
  { code: 'ts', name: 'Tsonga', flag: '🇿🇦', nativeName: 'Xitsonga' },
  { code: 'nr', name: 'Ndebele', flag: '🇿🇦', nativeName: 'IsiNdebele' }
];

export const LanguageSwitcher = () => {
  const { i18n, t } = useTranslation();

  const changeLanguage = (languageCode: string) => {
    i18n.changeLanguage(languageCode);
  };

  const currentLanguage = southAfricanLanguages.find(lang => lang.code === i18n.language) || southAfricanLanguages[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <Globe className="w-4 h-4" />
          {currentLanguage.flag} {currentLanguage.nativeName}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="max-h-80 overflow-y-auto">
        {southAfricanLanguages.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => changeLanguage(language.code)}
            className="flex items-center gap-2"
          >
            <span>{language.flag}</span>
            <div className="flex flex-col">
              <span className="font-medium">{language.nativeName}</span>
              <span className="text-xs text-muted-foreground">{language.name}</span>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
