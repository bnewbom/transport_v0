import { ko, type TranslationDictionary } from './ko';

type AnyRecord = { [key: string]: string | AnyRecord };

function getValueByPath(dict: AnyRecord, key: string): string | undefined {
  return key.split('.').reduce<string | AnyRecord | undefined>((acc, segment) => {
    if (!acc || typeof acc === 'string') return undefined;
    return acc[segment];
  }, dict) as string | undefined;
}

export function t(key: string, fallback?: string): string {
  const value = getValueByPath(ko as unknown as AnyRecord, key);
  if (typeof value === 'string') return value;
  return fallback ?? key;
}

export type I18nSchema = TranslationDictionary;
