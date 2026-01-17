# Gestor TV - Frontend

Sistema de exibição de imóveis para TVs.

## 🚀 Produção

### Build para produção
```bash
npm run build:prod
```

### Preview do build
```bash
npm run preview
```

## 🔒 Segurança

- ✅ Meta tags para bloquear indexação em mecanismos de busca
- ✅ Arquivo robots.txt configurado
- ✅ Headers de segurança (CSP, X-Frame-Options, etc)
- ✅ Console.logs removidos em produção
- ✅ Sourcemaps desabilitados
- ✅ Otimização e minificação com Terser

## 📦 Deploy

O projeto está otimizado para deploy em:
- Netlify
- Vercel
- Qualquer serviço de hosting estático

### Variáveis de ambiente necessárias:
- `VITE_WS_URL`: URL do WebSocket
- `VITE_API_URL`: URL da API

## 🛡️ Proteção contra indexação

O projeto está configurado para **NÃO** ser indexado por:
- Google
- Bing
- Yahoo
- DuckDuckGo
- Baidu
- Yandex
- Outros crawlers

Através de:
1. Meta tags no HTML
2. Arquivo robots.txt
3. Header X-Robots-Tag
