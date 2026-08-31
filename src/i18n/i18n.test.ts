import { describe, expect, it } from 'vitest';
import { setLocale, t, translateError } from './locale';

describe('i18n', () => {
  it('defaults catalogs to Brazilian Portuguese and interpolates', () => {
    setLocale('pt-BR');
    expect(t('createTable')).toBe('Criar mesa');
    expect(t('roundTitle', { n: 3 })).toBe('Rodada 3');
    expect(t('cardOf', { rank: 'A', suit: t('suitSpades') })).toBe('A de espadas');
  });

  it('switches to English', () => {
    setLocale('en');
    expect(t('createTable')).toBe('Create a table');
    expect(t('roundTitle', { n: 3 })).toBe('Round 3');
    setLocale('pt-BR');
  });

  it('translates known server error codes', () => {
    setLocale('pt-BR');
    expect(translateError({ code: 'ROOM_NOT_FOUND' })).toBe('Nenhuma mesa usa esse código.');
    expect(translateError({ code: 'NOT_YOUR_TURN' })).toBe('Não é a sua vez.');
  });
});
