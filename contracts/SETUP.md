# 🐵 BetMonkey Token Setup Guide

Guía completa para crear y deployar el token de BetMonkey en Solana.

## 📋 Prerequisitos

- Bun instalado
- Conexión a internet
- ~2-3 SOL en devnet (gratis del faucet)

## 🚀 Pasos para Deploy

### 1. Configurar Variables de Entorno

```bash
cp .env.example .env
```

Edita `.env` y ajusta los valores si quieres:
- `TOKEN_NAME`: Nombre del token (default: BetMonkey)
- `TOKEN_SYMBOL`: Símbolo (default: BMONKEY)
- `TOTAL_SUPPLY`: Supply total (default: 1,000,000,000)
- `BUY_PERCENTAGE`: % de ganancias del casino para comprar (default: 60%)

### 2. Instalar Dependencias

```bash
bun install
```

### 3. Obtener SOL de Devnet

```bash
bun run get-devnet-sol
```

Esto te dará 2 SOL gratis en devnet. Puedes correrlo múltiples veces si necesitas más.

### 4. Crear el Token

```bash
bun run create-token
```

Esto:
- ✅ Crea el token mint
- ✅ Crea tu token account
- ✅ Mintea el supply total
- ✅ Guarda toda la info en `.token-info.json`

**¡Guarda el mint address!** Lo necesitarás para el siguiente paso.

### 5. Crear Pool de Liquidez

```bash
bun run create-pool
```

Este comando te dará instrucciones para crear el pool. Opciones:

**Opción A: Raydium UI (Más fácil)**
1. Ve a https://raydium.io/
2. Cambia a devnet en tu wallet
3. Crea un pool SOL/BMONKEY
4. Agrega liquidez inicial (ej: 5 SOL + equivalente en BMONKEY)

**Opción B: Orca UI**
1. Ve a https://www.orca.so/
2. Similar proceso a Raydium

### 6. Iniciar el AI Agent

```bash
bun run start-agent
```

El agent:
- 👀 Monitorea las ganancias del casino
- 💰 Usa el 60% (configurable) para comprar BMONKEY
- 📈 Crea presión de compra automáticamente
- 🔄 Se ejecuta cada 5 minutos (configurable)

## 📁 Estructura de Archivos

```
contracts/
├── token/
│   ├── wallet.ts              # Manejo de wallet
│   ├── get-devnet-sol.ts      # Obtener SOL gratis
│   ├── create-token.ts        # Crear token
│   └── create-pool.ts         # Info para crear pool
├── ai-agent/
│   ├── index.ts               # Agent principal
│   └── trader.ts              # Lógica de trading (Jupiter)
├── config/
│   └── network.ts             # Configuración de red
├── .env                       # Tu configuración
├── .token-info.json          # Info del token (se genera automáticamente)
└── .wallet.json              # Tu wallet (¡NO SUBIR A GIT!)
```

## 🔐 Seguridad

**IMPORTANTE:** Los siguientes archivos NUNCA deben subirse a git:
- `.env`
- `.wallet.json`
- `.token-info.json`

Ya están en `.gitignore` pero verifica antes de hacer commit.

## 🔗 Integración con el Casino

Para conectar el AI agent con tu casino, edita `ai-agent/index.ts`:

```typescript
async function checkCasinoProfits(): Promise<number> {
  // Reemplaza esto con una llamada a tu backend
  const response = await fetch('http://localhost:3000/api/casino/profits');
  const data = await response.json();

  return data.newProfits; // SOL ganados desde última verificación
}
```

## 📊 Monitoreo

El agent muestra:
- ✅ Ganancias detectadas
- ✅ Cantidad a usar para comprar
- ✅ Transacciones ejecutadas
- ✅ Links a Solscan para ver on-chain

## 🎯 Próximos Pasos (Mainnet)

Cuando estés listo para mainnet:

1. Cambia `.env`: `SOLANA_NETWORK=mainnet-beta`
2. Obtén SOL real (~5-10 SOL para empezar)
3. Sigue los mismos pasos
4. **¡Backupea tu wallet!**

## ❓ Troubleshooting

**"No liquidity pool exists"**
- Necesitas crear el pool primero (paso 5)

**"Insufficient balance"**
- Obtén más SOL: `bun run get-devnet-sol`

**"Failed to get quote from Jupiter"**
- El pool no existe o no tiene liquidez
- Jupiter puede tardar un poco en detectar pools nuevos

## 🔧 Configuración Avanzada

### Cambiar el % de compra
```bash
# En .env
BUY_PERCENTAGE=70  # Usar 70% en vez de 60%
```

### Cambiar frecuencia de chequeo
```bash
# En .env
CHECK_INTERVAL=600  # Chequear cada 10 minutos
```

### Cambiar monto mínimo
```bash
# En .env
MIN_BUY_AMOUNT=0.5  # Comprar solo si hay al menos 0.5 SOL
```

## 📞 Soporte

Si algo no funciona:
1. Verifica que estés en devnet
2. Verifica tu balance de SOL
3. Revisa los logs del agent
4. Chequea que el pool existe en el DEX

---

🎉 **¡Listo para hacer moon al token de BetMonkey!** 🚀
