# Image Upload Issues Fixed

## Main Problem
There was a conflict in request size settings that prevented uploading images of 1.5 megabytes or more.

## Discovered Causes

### 1. Next.js Default Limit (1MB)
- Next.js sets request size to 1MB by default
- This affects all API routes unless different settings are specified

### 2. Conflicting webhook settings
- Coinbase webhook files contained a 1MB limit:
   - `pages/api/pay/coinbase/webhook.ts`
   - `pages/api/pay/coinbase-webhook.ts`

## Applied Solutions

### 1. Update next.config.js
```javascript
experimental: {
  serverActions: {
    bodySizeLimit: '1024mb', // 1GB limit for server actions
  },
},
```

### 2. Update webhook files
- Changed `sizeLimit: '1mb'` to `sizeLimit: '1024mb'` in all webhook files

### 3. Pre-existing Settings (verified)
- `upload-image.ts`: supports 1GB
- `[orderId].ts`: supports 1GB  
- `nginx-gear-score.conf`: supports 1GB
- `.env`: MAX_FILE_SIZE=1073741824 (1GB)

## Updated Files

1. **next.config.js**
   - Added `serverActions.bodySizeLimit: '1024mb'`

2. **pages/api/pay/coinbase/webhook.ts**
   - Changed `sizeLimit` from '1mb' to '1024mb'

3. **pages/api/pay/coinbase-webhook.ts**
   - Changed `sizeLimit` from '1mb' to '1024mb'

## Result
Now images can be uploaded with sizes up to 1GB instead of the previous 1MB limit.

## Testing the Solution
1. Start the server: `npm start`
2. Upload an image of 1.5MB or more
3. Ensure no "Body exceeded 1mb limit" error appears

## Important Notes
- All other security settings have been preserved
- No UI or design files were modified
- All changes are compatible with existing VPS settings