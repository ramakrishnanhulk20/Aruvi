# Deployment Addresses

## MockUSDC System (xUSD)
```
MockUSDC (xUSD):     0xC392ceE2b731A6a719BAd5205B9Cb44F346F012a
Wrapper (cUSDC):     0xbA89Abc56387D3bA5864E6A0a0a5e7cd9d872845
PaymentGateway:      0xEcC6317E60C3115A782D577d02322eDc3c27119a
ProductRegistry:     0x9523Bb7B1f1e3E773fc575Bc86f9b874C70B4D1D
RefundManager:       0xe637B2B335F6Ab8A108d8d1Bc39916589703dC4E
```

**How to use:**
```bash
cp frontend/.env.xusd frontend/.env.local
cd frontend && npm run dev
```

**Get tokens:** Use faucet on /tokens page

---

## Official USDC System (Circle)
```
Official USDC:       0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238
Wrapper (cUSDC):     0x5f8D47C188478fDf89a9aff7275b86553fc126fe
PaymentGateway:      0x5B263646881afd742c157D8Efc307ac39E65662e
ProductRegistry:     0x0AA169680b5AAe296Fc8634C28B2a86ddb99f300
RefundManager:       0xe2045ff92802F273506Be69b314b29ED9f0dF63e
```

**How to use:**
```bash
cp frontend/.env.usdc frontend/.env.local
cd frontend && npm run dev
```

**Get tokens:** https://faucet.circle.com/

---

## Switching Between Systems

**To use MockUSDC (xUSD):**
```powershell
cd frontend
Copy-Item .env.xusd .env.local -Force
npm run dev
```

**To use Official USDC:**
```powershell
cd frontend
Copy-Item .env.usdc .env.local -Force
npm run dev
```

**Current system:** Check `frontend/.env.local` to see which system is active

---

## Verification Status

**MockUSDC System:** ✅ All verified on Etherscan
**USDC System:** ⏳ Needs verification (run verification script below)

**Verify USDC contracts:**
```bash
cd contracts
npx hardhat verify --network sepolia 0x5f8D47C188478fDf89a9aff7275b86553fc126fe "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238" "Confidential USDC" "cUSDC" ""
npx hardhat verify --network sepolia 0x5B263646881afd742c157D8Efc307ac39E65662e
npx hardhat verify --network sepolia 0x0AA169680b5AAe296Fc8634C28B2a86ddb99f300
npx hardhat verify --network sepolia 0xe2045ff92802F273506Be69b314b29ED9f0dF63e "0x5B263646881afd742c157D8Efc307ac39E65662e"
```
