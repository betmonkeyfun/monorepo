# 🚀 Quick Start - BetMonkey Casino

¿Quieres jugar a la ruleta con Solana? Solo necesitas 2 comandos:

## 1. Setup (Solo una vez)

```bash
npm run setup
```

Esto configura **TODO automáticamente**:
- ✅ Facilitador con keypair y fondos
- ✅ Servidor de casino
- ✅ Jugador con keypair y fondos (0.5 SOL en devnet)
- ✅ Builds del proyecto
- ✅ Base de datos

**Tiempo estimado:** ~30 segundos

## 2. Jugar

```bash
npm run play:black    # Apuesta al negro
```

¡Eso es todo! 🎰

---

## Más Opciones de Juego

### Apuestas Simples (0.001 SOL, paga 1:1)

```bash
npm run play:red      # Rojo
npm run play:black    # Negro
npm run play:auto     # 5 juegos automáticos al rojo
```

### Apostar al Verde/0 (0.01 SOL, paga 35:1)

```bash
npm run play:green    # Apuesta al 0 (verde)
npm run play:zero     # Igual
```

### Apuestas Personalizadas

```bash
# Apuestas simples
node play-game.mjs black 10    # 10 juegos al negro
node play-game.mjs red 5       # 5 juegos al rojo
node play-game.mjs even 3      # 3 juegos a pares

# Números específicos (incluido el verde/0)
node play-number.mjs 0 5       # 5 juegos al verde (0)
node play-number.mjs 17 10     # 10 juegos al número 17
node play-number.mjs 23 3      # 3 juegos al número 23
```

---

## Comandos de Servicios

```bash
npm start     # Iniciar servicios (facilitador, casino, server)
npm stop      # Detener servicios
npm restart   # Reiniciar servicios
npm run logs  # Ver logs en tiempo real
```

---

## Comandos de Consulta

```bash
# Ver balance del jugador
curl http://localhost:3003/wallet/balance/$(solana-keygen pubkey ./keys/player-keypair.json)

# Ver estadísticas
curl http://localhost:3003/roulette/stats/$(solana-keygen pubkey ./keys/player-keypair.json)
```

---

## ¿Problemas?

### "Insufficient SOL balance"
Tu jugador se quedó sin SOL en la blockchain. Recarga con:

```bash
npm run setup:player
```

Esto te dará 0.5 SOL adicional desde el facilitador.

### "Services not running"
Inicia los servicios:

```bash
npm start
```

### "Setup failed"
Asegúrate de tener instalado:
- Node.js (v18+)
- Solana CLI
- npm

---

## Flujo Completo de Ejemplo

```bash
# 1. Setup inicial (solo una vez)
npm run setup

# 2. Los servicios se inician automáticamente, pero si no:
npm start

# 3. Juega lo que quieras
npm run play:black     # Juego simple
npm run play:green     # Al verde (0)
npm run play:auto      # 5 juegos automáticos

# 4. Ver estadísticas
curl http://localhost:3003/roulette/stats/$(solana-keygen pubkey ./keys/player-keypair.json) | jq

# 5. Si necesitas más fondos:
npm run setup:player
```

---

## Información Técnica

- **Red**: Solana Devnet
- **Protocolo**: x402 (HTTP 402 Payment Required)
- **Apuesta mínima**: 0.001 SOL (simple) / 0.01 SOL (número)
- **Ruleta**: Europea (0-36, sin 00)
- **Fondos iniciales**: 0.5 SOL (renovable con `npm run setup:player`)

---

## Documentación Completa

- `PLAYING.md` - Guía completa de cómo jugar
- `README.md` - Documentación técnica del protocolo
- `SETUP.md` - Detalles del setup manual

---

**¡Disfruta jugando!** 🎰🚀

Para más información, consulta la [documentación completa](./PLAYING.md).
