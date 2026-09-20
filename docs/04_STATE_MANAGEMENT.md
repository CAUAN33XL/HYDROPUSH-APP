# 04 - Gerenciamento de Estado (State Management)

Como não utilizamos bancos de dados como SQLite, todo o estado do usuário é persistido utilizando a API `Preferences` do Capacitor, que mapeia para o `LocalStorage` em ambientes Web e o SharedPreferences no Android.

## O `StorageService.ts`

Localizado em `src/core/services/StorageService.ts`, este Singleton é o maestro dos dados locais.

### Fluxo de Dados:
1. **Cache em Memória:** Para leituras síncronas rápidas (ex: renderização do gráfico no dashboard), o StorageService mantém um `Map` em memória.
2. **Debounce nas Escritas:** Ações repetidas (como clicar várias vezes no botão de '+200ml') não inundam o disco rígido. Há um debounce de `180ms` antes da chamada real de escrita assíncrona.
3. **Fallback e Recovery:** O sistema faz backup crítico de flags importantes (ex: `user_settings`) na memória para se recuperar de corrupções no JSON.

## Sincronização PWA vs Thin Client

Sendo um Thin Client ou PWA, a API `Preferences` do Capacitor cai perfeitamente como uma luva para ambientes baseados na Web, mantendo a regra de que o app funciona primariamente *Offline* (ou retém os dados independentemente do recarregamento).
