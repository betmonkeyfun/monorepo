# 🎰 Cómo Jugar a la Ruleta

## Configuración Inicial

1. **Setup del servidor** (solo primera vez):
```bash
npm run setup
```

Esto automáticamente:
- Genera las claves del facilitador
- Configura el archivo `.env`
- Instala dependencias
- Fondea las wallets en devnet
- Construye el proyecto

2. **Iniciar servicios**:
```bash
npm start
```

Esto inicia los 3 servicios con PM2:
- Facilitator (puerto 3001)
- Generic Server (puerto 3000)
- Casino Server (puerto 3003)

## Métodos para Jugar

### 1. Script Automatizado (Recomendado)

#### A. Apuestas Simples (Red/Black/Even/Odd/Low/High)

**Jugar un solo juego:**
```bash
npm run play:red      # Apuesta al rojo
npm run play:black    # Apuesta al negro (¡SÍ se puede jugar al negro!)
```

**Jugar múltiples juegos:**
```bash
npm run play:auto     # Juega 5 veces al rojo

# O con parámetros personalizados:
node play-game.mjs [tipo] [cantidad]

# Ejemplos:
node play-game.mjs red 10      # 10 juegos al rojo
node play-game.mjs black 5     # 5 juegos al negro
node play-game.mjs even 3      # 3 juegos a números pares
node play-game.mjs odd 7       # 7 juegos a números impares
node play-game.mjs low 5       # 5 juegos a números bajos (1-18)
node play-game.mjs high 5      # 5 juegos a números altos (19-36)
```

**Costo:** 0.001 SOL por juego

#### B. Apuestas a Números Específicos (incluido el VERDE/0)

**Jugar al verde (0):**
```bash
npm run play:green    # Apuesta al 0 (verde) - ¡SÍ se puede jugar al verde!
npm run play:zero     # Igual que play:green
```

**Jugar a cualquier número (0-36):**
```bash
node play-number.mjs [número] [cantidad]

# Ejemplos:
node play-number.mjs 0 5       # 5 juegos al 0 (verde) 🟢
node play-number.mjs 17 10     # 10 juegos al número 17
node play-number.mjs 23 3      # 3 juegos al número 23
```

**Costo:** 0.01 SOL por juego
**Payout:** 35:1 (si apuestas 0.01 SOL y ganas, recibes 0.35 SOL)

**Salida del script:**
```
🎰 BetMonkey Roulette
═══════════════════════

Player: 6T4v2F5hhA9kiUNJS9Lrx5KJToJ6iygrrxcLv9sAd2S1
Bet Type: RED
Games to play: 5
Bet amount: 0.001 SOL per game

💰 Initial balance: 0.007 SOL

🎲 Game 1/5 - Betting on RED
──────────────────────────────────────────────────
   Result: 11
   💔 LOST
   Profit: -0.001 SOL

...

═══════════════════════════════════════
📊 SESSION SUMMARY
═══════════════════════════════════════
Total games: 5
Wins: 2 (40.0%)
Losses: 3 (60.0%)
Total profit: +0.001 SOL

💰 Final balance: 0.008 SOL
═══════════════════════════════════════
```

### 2. Script Interactivo

**Jugar de forma interactiva:**
```bash
bash play-roulette.sh
```

Este script te permite:
- Elegir tipo de apuesta en cada jugada
- Ver estadísticas en tiempo real
- Consultar balance
- Auto-play con apuestas aleatorias

## Consultar Balance

```bash
# Consultar balance de un jugador
curl http://localhost:3003/wallet/balance/[WALLET_ADDRESS]

# Ejemplo con el player por defecto:
curl http://localhost:3003/wallet/balance/6T4v2F5hhA9kiUNJS9Lrx5KJToJ6iygrrxcLv9sAd2S1
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "walletAddress": "6T4v2F5hhA9kiUNJS9Lrx5KJToJ6iygrrxcLv9sAd2S1",
    "username": "player_6T4v2F5h",
    "balance": "0.012000000",
    "lockedBalance": "0.000000000",
    "availableBalance": "0.012000000"
  }
}
```

## Consultar Estadísticas

```bash
# Ver estadísticas del jugador
curl http://localhost:3003/roulette/stats/[WALLET_ADDRESS]
```

## Tipos de Apuestas Disponibles

### Apuestas Simples (0.001 SOL)

| Tipo | Paga | Probabilidad | Descripción |
|------|------|--------------|-------------|
| `red` | 1:1 | 48.6% | Números rojos |
| `black` | 1:1 | 48.6% | Números negros ✅ |
| `even` | 1:1 | 48.6% | Números pares |
| `odd` | 1:1 | 48.6% | Números impares |
| `low` | 1:1 | 48.6% | Números 1-18 |
| `high` | 1:1 | 48.6% | Números 19-36 |

### Apuestas a Números (0.01 SOL)

| Tipo | Paga | Probabilidad | Descripción |
|------|------|--------------|-------------|
| `0` (verde) | 35:1 | 2.7% | El cero verde 🟢 ✅ |
| `1-36` | 35:1 | 2.7% | Cualquier número específico |

**Nota:** La ruleta es europea, tiene solo un 0 (verde), no tiene 00.

## Gestión de Servicios

```bash
# Ver logs en tiempo real
npm run logs

# Detener servicios
npm stop

# Reiniciar servicios
npm restart

# Estado de los servicios
npx pm2 status
```

## Fondos

### Cómo Funciona

1. **Depósito automático**: Cada vez que juegas, se hace un depósito de 0.001 SOL a tu wallet interna del casino
2. **Juego**: Se descuenta la apuesta de tu balance interno
3. **Resultado**:
   - Si ganas: se suman las ganancias a tu balance
   - Si pierdes: ya se descontó la apuesta

### Transferir Fondos al Jugador

Si necesitas más fondos en la wallet del jugador (en Solana, no la interna):

```bash
# Transferir desde el facilitador al jugador
solana transfer --keypair ./keys/facilitator-keypair.json \
  6T4v2F5hhA9kiUNJS9Lrx5KJToJ6iygrrxcLv9sAd2S1 \
  0.1 \
  --url devnet \
  --allow-unfunded-recipient
```

## Troubleshooting

### "Airdrop failed (rate limit reached)"
El devnet de Solana tiene límite de airdrops. Usa la transferencia manual arriba.

### "Insufficient funds"
Verifica el balance con:
```bash
solana balance ./keys/player-keypair.json --url devnet
```

### Servicios no responden
Reinicia los servicios:
```bash
npm restart
```

## Información de Red

- **Red**: Solana Devnet
- **RPC**: https://api.devnet.solana.com
- **Protocolo**: x402 (HTTP 402 Payment Required)
- **Monto por juego**: 0.001 SOL (1,000,000 lamports)
